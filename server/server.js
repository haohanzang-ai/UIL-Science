/* ============================================================
   UIL Science Team Platform — API server
   Serves the static frontend (project root) + REST API at /api.
   All data comes from SQLite. No fake data is generated.
   ============================================================ */
const path = require('path');
const express = require('express');
const { db, integrityBadge } = require('./db');
const { grade, scoreLoss, guessingThreshold } = require('./scoring');

const app = express();
app.use(express.json({ limit: '2mb' }));

// ---- tiny identity middleware (replace with real auth in production) ----
// Frontend sends x-student-id; role can be elevated via x-role for the prototype.
app.use('/api', (req, res, next) => {
  req.studentId = parseInt(req.header('x-student-id') || '', 10) || null;
  req.role = req.header('x-role') || 'student';
  next();
});
function requireCoach(req, res, next) {
  if (req.role === 'coach' || req.role === 'admin') return next();
  return res.status(403).json({ error: 'Coach or admin role required.' });
}

function parseChoices(q){ try { q.choices = JSON.parse(q.choices || '[]'); } catch { q.choices = []; } return q; }
function withBadge(q){ q.integrity = integrityBadge(q); return q; }

/* ============================ IDENTITY ============================ */
app.get('/api/me', (req, res) => {
  if (!req.studentId) return res.json(null);
  const s = db.prepare('SELECT * FROM students WHERE id=?').get(req.studentId) || null;
  res.json(s);
});
app.post('/api/students', (req, res) => {
  const { name, email = null, role = 'student', team_id = null } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const info = db.prepare('INSERT INTO students (name,email,role,team_id) VALUES (?,?,?,?)')
    .run(name.trim(), email, role, team_id);
  res.json(db.prepare('SELECT * FROM students WHERE id=?').get(info.lastInsertRowid));
});

/* ============================ QUESTIONS / ADMIN (Feature 1 & 4) ============================ */

// Coach/admin: list all questions with integrity badges + filters.
app.get('/api/questions', requireCoach, (req, res) => {
  const { subject, badge, q } = req.query;
  let rows = db.prepare('SELECT * FROM questions ORDER BY updated_at DESC').all();
  rows = rows.map(parseChoices).map(withBadge);
  if (subject) rows = rows.filter(r => r.subject === subject);
  if (badge)   rows = rows.filter(r => r.integrity === badge);
  if (q)       rows = rows.filter(r => (r.stem || '').toLowerCase().includes(String(q).toLowerCase()));
  res.json(rows);
});

// Admin review queue = everything not yet approved and not rejected.
app.get('/api/admin/queue', requireCoach, (req, res) => {
  const rows = db.prepare(
    `SELECT * FROM questions WHERE approved_for_practice=0 AND rejected=0
     ORDER BY (answer_key_match_status='mismatch') DESC, flagged DESC, created_at ASC`
  ).all().map(parseChoices).map(withBadge);
  res.json(rows);
});

// Integrity summary counts (for dashboards). Counts only — no invented stats.
app.get('/api/admin/integrity-summary', requireCoach, (req, res) => {
  const all = db.prepare('SELECT * FROM questions').all().map(withBadge);
  const summary = { total: all.length, approved: 0, review: 0, issue: 0, unprocessed: 0 };
  all.forEach(q => { summary[q.integrity]++; });
  res.json(summary);
});

app.get('/api/questions/:id', requireCoach, (req, res) => {
  const q = db.prepare('SELECT * FROM questions WHERE id=?').get(req.params.id);
  if (!q) return res.status(404).json({ error: 'not found' });
  res.json(withBadge(parseChoices(q)));
});

// Edit any reviewable field.
const EDITABLE = ['subject','topic','subtopic','difficulty','textbook_chapter','stem','correct_answer','explanation','coach_notes','answer_key_match_status'];
app.patch('/api/questions/:id', requireCoach, (req, res) => {
  const q = db.prepare('SELECT * FROM questions WHERE id=?').get(req.params.id);
  if (!q) return res.status(404).json({ error: 'not found' });
  const body = req.body || {};
  const sets = [], vals = [];
  EDITABLE.forEach(f => { if (f in body) { sets.push(`${f}=?`); vals.push(body[f]); } });
  if ('choices' in body) { sets.push('choices=?'); vals.push(JSON.stringify(body.choices || [])); }
  if ('explanation' in body) { sets.push('explanation_linked=?'); vals.push(body.explanation ? 1 : 0); }
  sets.push("updated_at=datetime('now')");
  vals.push(req.params.id);
  db.prepare(`UPDATE questions SET ${sets.join(',')} WHERE id=?`).run(...vals);
  res.json(withBadge(parseChoices(db.prepare('SELECT * FROM questions WHERE id=?').get(req.params.id))));
});

function reviewerName(req) {
  if (req.studentId) { const s = db.prepare('SELECT name FROM students WHERE id=?').get(req.studentId); if (s) return s.name; }
  return req.role;
}

// Approve for student practice.
app.post('/api/questions/:id/approve', requireCoach, (req, res) => {
  const q = db.prepare('SELECT * FROM questions WHERE id=?').get(req.params.id);
  if (!q) return res.status(404).json({ error: 'not found' });
  db.prepare(`UPDATE questions SET approved_for_practice=1, coach_reviewed=1, rejected=0, flagged=0,
              last_reviewed_by=?, last_reviewed_at=datetime('now'), updated_at=datetime('now') WHERE id=?`)
    .run(reviewerName(req), req.params.id);
  res.json(withBadge(parseChoices(db.prepare('SELECT * FROM questions WHERE id=?').get(req.params.id))));
});

// Reject (removes from practice).
app.post('/api/questions/:id/reject', requireCoach, (req, res) => {
  db.prepare(`UPDATE questions SET rejected=1, approved_for_practice=0, coach_reviewed=1,
              last_reviewed_by=?, last_reviewed_at=datetime('now'), updated_at=datetime('now') WHERE id=?`)
    .run(reviewerName(req), req.params.id);
  res.json({ ok: true });
});

// Flag an issue.
app.post('/api/questions/:id/flag', requireCoach, (req, res) => {
  const note = (req.body && req.body.note) || null;
  db.prepare(`UPDATE questions SET flagged=1, approved_for_practice=0,
              coach_notes=COALESCE(?, coach_notes), last_reviewed_by=?, last_reviewed_at=datetime('now'),
              updated_at=datetime('now') WHERE id=?`)
    .run(note, reviewerName(req), req.params.id);
  res.json({ ok: true });
});

/* ============================ PRACTICE (students see approved only) ============================ */

// Build a practice set from APPROVED questions only.
app.get('/api/practice/questions', (req, res) => {
  const { subject, limit } = req.query;
  let sql = 'SELECT * FROM questions WHERE approved_for_practice=1';
  const args = [];
  if (subject) { sql += ' AND subject=?'; args.push(subject); }
  sql += ' ORDER BY RANDOM()';
  if (limit) { sql += ' LIMIT ?'; args.push(parseInt(limit, 10)); }
  const rows = db.prepare(sql).all(...args).map(parseChoices)
    // never leak the answer key / coach-only fields to the practice client
    .map(q => ({ id: q.id, subject: q.subject, topic: q.topic, difficulty: q.difficulty, stem: q.stem, choices: q.choices }));
  res.json(rows);
});

// Submit a real attempt → server grades from the real answer key.
app.post('/api/practice/submit', (req, res) => {
  const { student_id, mode = 'full', subject = null, answers = [] } = req.body || {};
  const sid = student_id || req.studentId;
  if (!sid) return res.status(400).json({ error: 'student_id required (create a student first via POST /api/students)' });
  if (!Array.isArray(answers) || !answers.length) return res.status(400).json({ error: 'answers[] required' });

  const tx = db.transaction(() => {
    const sess = db.prepare('INSERT INTO sessions (student_id,mode,subject,submitted_at) VALUES (?,?,?,datetime(\'now\'))')
      .run(sid, mode, subject);
    const sessionId = sess.lastInsertRowid;
    const ins = db.prepare('INSERT INTO attempt_answers (session_id,question_id,selected,confidence,is_correct,points) VALUES (?,?,?,?,?,?)');
    answers.forEach(a => {
      const q = db.prepare('SELECT correct_answer FROM questions WHERE id=?').get(a.question_id);
      if (!q) return;
      const g = grade(a.selected, q.correct_answer);
      ins.run(sessionId, a.question_id, a.selected ?? null, a.confidence ?? null, g.is_correct, g.points);
    });
    return sessionId;
  });
  const sessionId = tx();
  res.json({ session_id: sessionId });
});

app.get('/api/practice/sessions', (req, res) => {
  const sid = req.query.student_id || req.studentId;
  if (!sid) return res.json([]);
  const rows = db.prepare(`
    SELECT s.id, s.mode, s.subject, s.submitted_at,
           COUNT(a.id) AS questions,
           COALESCE(SUM(a.points),0) AS score
    FROM sessions s LEFT JOIN attempt_answers a ON a.session_id=s.id
    WHERE s.student_id=? AND s.submitted_at IS NOT NULL
    GROUP BY s.id ORDER BY s.submitted_at DESC`).all(sid);
  res.json(rows);
});

/* ============================ ANALYTICS (Feature 2 & 3) ============================ */

function answersForSession(sessionId) {
  return db.prepare(`
    SELECT a.selected, a.confidence, a.is_correct, a.points, a.question_id,
           q.subject, q.topic, q.difficulty, q.stem
    FROM attempt_answers a JOIN questions q ON q.id=a.question_id
    WHERE a.session_id=?`).all(sessionId);
}

app.get('/api/analytics/score-loss/:sessionId', (req, res) => {
  const sess = db.prepare('SELECT * FROM sessions WHERE id=?').get(req.params.sessionId);
  if (!sess) return res.status(404).json({ error: 'session not found' });
  res.json({ session: sess, ...scoreLoss(answersForSession(req.params.sessionId)) });
});

app.get('/api/analytics/guessing/:studentId', (req, res) => {
  const rows = db.prepare(`
    SELECT a.selected, a.confidence, a.is_correct, a.points
    FROM attempt_answers a JOIN sessions s ON s.id=a.session_id
    WHERE s.student_id=? AND s.submitted_at IS NOT NULL`).all(req.params.studentId);
  res.json(guessingThreshold(rows));
});

// Per-subject accuracy for a student (real attempts only).
app.get('/api/analytics/subjects/:studentId', (req, res) => {
  const rows = db.prepare(`
    SELECT q.subject AS subject,
           SUM(CASE WHEN a.selected IS NOT NULL AND a.selected <> '' THEN 1 ELSE 0 END) AS attempted,
           SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct,
           COUNT(a.id) AS seen
    FROM attempt_answers a
    JOIN sessions s ON s.id=a.session_id
    JOIN questions q ON q.id=a.question_id
    WHERE s.student_id=? AND s.submitted_at IS NOT NULL
    GROUP BY q.subject`).all(req.params.studentId);
  res.json(rows.map(r => ({
    subject: r.subject,
    attempted: r.attempted, correct: r.correct, seen: r.seen,
    accuracy: r.attempted > 0 ? Math.round((r.correct / r.attempted) * 1000) / 10 : null
  })));
});

// Lightweight overview: counts of real tests + average/last real score.
app.get('/api/analytics/overview/:studentId', (req, res) => {
  const sessions = db.prepare(`
    SELECT s.id, s.submitted_at, COALESCE(SUM(a.points),0) AS score, COUNT(a.id) AS questions
    FROM sessions s LEFT JOIN attempt_answers a ON a.session_id=s.id
    WHERE s.student_id=? AND s.submitted_at IS NOT NULL
    GROUP BY s.id ORDER BY s.submitted_at DESC`).all(req.params.studentId);
  if (!sessions.length) return res.json({ empty: true, tests: 0 });
  const avg = Math.round(sessions.reduce((s, r) => s + r.score, 0) / sessions.length);
  res.json({ empty: false, tests: sessions.length, lastScore: sessions[0].score, avgScore: avg, last: sessions[0] });
});

/* ============================ STATIC FRONTEND ============================ */
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`UIL Science platform running → http://localhost:${PORT}`));
