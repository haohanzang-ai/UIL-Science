/* ============================================================
   UIL Science Team Platform — API server (libSQL/Turso)
   Serves the static frontend (project root) + REST API at /api.
   All data comes from the database. No fake data is generated.
   ============================================================ */
const path = require('path');
const express = require('express');
const { db, init, all, get, run, integrityBadge } = require('./db');
const { grade, scoreLoss, guessingThreshold } = require('./scoring');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://haohanzang-ai.github.io,http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-student-id,x-role');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '2mb' }));

// ---- tiny identity middleware (replace with real auth in production) ----
app.use('/api', (req, res, next) => {
  req.studentId = parseInt(req.header('x-student-id') || '', 10) || null;
  req.role = req.header('x-role') || 'student';
  next();
});
function requireCoach(req, res, next) {
  if (req.role === 'coach' || req.role === 'admin') return next();
  return res.status(403).json({ error: 'Coach or admin role required.' });
}
// wrap async handlers so errors become clean 500s
const wrap = fn => (req, res) => Promise.resolve(fn(req, res)).catch(err => {
  console.error(err);
  res.status(500).json({ error: err.message || 'server error' });
});

function parseChoices(q) { try { q.choices = JSON.parse(q.choices || '[]'); } catch { q.choices = []; } return q; }
function withBadge(q) { q.integrity = integrityBadge(q); return q; }
async function reviewerName(req) {
  if (req.studentId) { const s = await get('SELECT name FROM students WHERE id=?', [req.studentId]); if (s) return s.name; }
  return req.role;
}

/* ============================ IDENTITY ============================ */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'uil-science', db: 'initialized' });
});
app.get('/api/me', wrap(async (req, res) => {
  if (!req.studentId) return res.json(null);
  res.json(await get('SELECT * FROM students WHERE id=?', [req.studentId]));
}));
app.post('/api/students', wrap(async (req, res) => {
  const { name, email = null, role = 'student', team_id = null } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const r = await run('INSERT INTO students (name,email,role,team_id) VALUES (?,?,?,?)', [name.trim(), email, role, team_id]);
  res.json(await get('SELECT * FROM students WHERE id=?', [r.lastInsertRowid]));
}));

/* ============================ QUESTIONS / ADMIN (Feature 1 & 4) ============================ */
app.get('/api/questions', requireCoach, wrap(async (req, res) => {
  const { subject, badge, q } = req.query;
  let rows = (await all('SELECT * FROM questions ORDER BY updated_at DESC')).map(parseChoices).map(withBadge);
  if (subject) rows = rows.filter(r => r.subject === subject);
  if (badge)   rows = rows.filter(r => r.integrity === badge);
  if (q)       rows = rows.filter(r => (r.stem || '').toLowerCase().includes(String(q).toLowerCase()));
  res.json(rows);
}));

app.get('/api/admin/queue', requireCoach, wrap(async (req, res) => {
  const rows = (await all(
    `SELECT * FROM questions WHERE approved_for_practice=0 AND rejected=0
     ORDER BY (answer_key_match_status='mismatch') DESC, flagged DESC, created_at ASC`
  )).map(parseChoices).map(withBadge);
  res.json(rows);
}));

app.get('/api/admin/integrity-summary', requireCoach, wrap(async (req, res) => {
  const allq = (await all('SELECT * FROM questions')).map(withBadge);
  const summary = { total: allq.length, approved: 0, review: 0, issue: 0, unprocessed: 0 };
  allq.forEach(q => { summary[q.integrity]++; });
  res.json(summary);
}));

app.get('/api/questions/:id', requireCoach, wrap(async (req, res) => {
  const q = await get('SELECT * FROM questions WHERE id=?', [req.params.id]);
  if (!q) return res.status(404).json({ error: 'not found' });
  res.json(withBadge(parseChoices(q)));
}));

const EDITABLE = ['subject','topic','subtopic','difficulty','textbook_chapter','stem','correct_answer','explanation','coach_notes','answer_key_match_status'];
app.patch('/api/questions/:id', requireCoach, wrap(async (req, res) => {
  const q = await get('SELECT * FROM questions WHERE id=?', [req.params.id]);
  if (!q) return res.status(404).json({ error: 'not found' });
  const body = req.body || {};
  const sets = [], vals = [];
  EDITABLE.forEach(f => { if (f in body) { sets.push(`${f}=?`); vals.push(body[f]); } });
  if ('choices' in body) { sets.push('choices=?'); vals.push(JSON.stringify(body.choices || [])); }
  if ('explanation' in body) { sets.push('explanation_linked=?'); vals.push(body.explanation ? 1 : 0); }
  sets.push("updated_at=datetime('now')");
  vals.push(req.params.id);
  await run(`UPDATE questions SET ${sets.join(',')} WHERE id=?`, vals);
  res.json(withBadge(parseChoices(await get('SELECT * FROM questions WHERE id=?', [req.params.id]))));
}));

app.post('/api/questions/:id/approve', requireCoach, wrap(async (req, res) => {
  const q = await get('SELECT * FROM questions WHERE id=?', [req.params.id]);
  if (!q) return res.status(404).json({ error: 'not found' });
  await run(`UPDATE questions SET approved_for_practice=1, coach_reviewed=1, rejected=0, flagged=0,
             last_reviewed_by=?, last_reviewed_at=datetime('now'), updated_at=datetime('now') WHERE id=?`,
    [await reviewerName(req), req.params.id]);
  res.json(withBadge(parseChoices(await get('SELECT * FROM questions WHERE id=?', [req.params.id]))));
}));

app.post('/api/questions/:id/reject', requireCoach, wrap(async (req, res) => {
  await run(`UPDATE questions SET rejected=1, approved_for_practice=0, coach_reviewed=1,
             last_reviewed_by=?, last_reviewed_at=datetime('now'), updated_at=datetime('now') WHERE id=?`,
    [await reviewerName(req), req.params.id]);
  res.json({ ok: true });
}));

app.post('/api/questions/:id/flag', requireCoach, wrap(async (req, res) => {
  const note = (req.body && req.body.note) || null;
  await run(`UPDATE questions SET flagged=1, approved_for_practice=0,
             coach_notes=COALESCE(?, coach_notes), last_reviewed_by=?, last_reviewed_at=datetime('now'),
             updated_at=datetime('now') WHERE id=?`,
    [note, await reviewerName(req), req.params.id]);
  res.json({ ok: true });
}));

/* ============================ PRACTICE (approved only) ============================ */
app.get('/api/practice/questions', wrap(async (req, res) => {
  const { subject, limit } = req.query;
  let sql = 'SELECT * FROM questions WHERE approved_for_practice=1';
  const args = [];
  if (subject) { sql += ' AND subject=?'; args.push(subject); }
  sql += ' ORDER BY RANDOM()';
  if (limit) { sql += ' LIMIT ?'; args.push(parseInt(limit, 10)); }
  const rows = (await all(sql, args)).map(parseChoices)
    .map(q => ({ id: q.id, subject: q.subject, topic: q.topic, difficulty: q.difficulty, stem: q.stem, choices: q.choices }));
  res.json(rows);
}));

app.post('/api/practice/submit', wrap(async (req, res) => {
  const { student_id, mode = 'full', subject = null, answers = [] } = req.body || {};
  const sid = student_id || req.studentId;
  if (!sid) return res.status(400).json({ error: 'student_id required (create a student first via POST /api/students)' });
  if (!Array.isArray(answers) || !answers.length) return res.status(400).json({ error: 'answers[] required' });

  const tx = await db.transaction('write');
  try {
    const sres = await tx.execute({ sql: "INSERT INTO sessions (student_id,mode,subject,submitted_at) VALUES (?,?,?,datetime('now'))", args: [sid, mode, subject] });
    const sessionId = Number(sres.lastInsertRowid);
    for (const a of answers) {
      const qr = await tx.execute({ sql: 'SELECT correct_answer FROM questions WHERE id=?', args: [a.question_id] });
      const q = qr.rows[0];
      if (!q) continue;
      const g = grade(a.selected, q.correct_answer);
      await tx.execute({
        sql: 'INSERT INTO attempt_answers (session_id,question_id,selected,confidence,is_correct,points) VALUES (?,?,?,?,?,?)',
        args: [sessionId, a.question_id, a.selected ?? null, a.confidence ?? null, g.is_correct, g.points]
      });
    }
    await tx.commit();
    res.json({ session_id: sessionId });
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}));

app.get('/api/practice/sessions', wrap(async (req, res) => {
  const sid = req.query.student_id || req.studentId;
  if (!sid) return res.json([]);
  res.json(await all(`
    SELECT s.id, s.mode, s.subject, s.submitted_at,
           COUNT(a.id) AS questions, COALESCE(SUM(a.points),0) AS score
    FROM sessions s LEFT JOIN attempt_answers a ON a.session_id=s.id
    WHERE s.student_id=? AND s.submitted_at IS NOT NULL
    GROUP BY s.id ORDER BY s.submitted_at DESC`, [sid]));
}));

/* ============================ ANALYTICS (Feature 2 & 3) ============================ */
async function answersForSession(sessionId) {
  return all(`
    SELECT a.selected, a.confidence, a.is_correct, a.points, a.question_id,
           q.subject, q.topic, q.difficulty, q.stem
    FROM attempt_answers a JOIN questions q ON q.id=a.question_id
    WHERE a.session_id=?`, [sessionId]);
}

app.get('/api/analytics/score-loss/:sessionId', wrap(async (req, res) => {
  const sess = await get('SELECT * FROM sessions WHERE id=?', [req.params.sessionId]);
  if (!sess) return res.status(404).json({ error: 'session not found' });
  res.json({ session: sess, ...scoreLoss(await answersForSession(req.params.sessionId)) });
}));

app.get('/api/analytics/guessing/:studentId', wrap(async (req, res) => {
  const rows = await all(`
    SELECT a.selected, a.confidence, a.is_correct, a.points
    FROM attempt_answers a JOIN sessions s ON s.id=a.session_id
    WHERE s.student_id=? AND s.submitted_at IS NOT NULL`, [req.params.studentId]);
  res.json(guessingThreshold(rows));
}));

app.get('/api/analytics/subjects/:studentId', wrap(async (req, res) => {
  const rows = await all(`
    SELECT q.subject AS subject,
           SUM(CASE WHEN a.selected IS NOT NULL AND a.selected <> '' THEN 1 ELSE 0 END) AS attempted,
           SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct,
           COUNT(a.id) AS seen
    FROM attempt_answers a
    JOIN sessions s ON s.id=a.session_id
    JOIN questions q ON q.id=a.question_id
    WHERE s.student_id=? AND s.submitted_at IS NOT NULL
    GROUP BY q.subject`, [req.params.studentId]);
  res.json(rows.map(r => ({
    subject: r.subject, attempted: r.attempted, correct: r.correct, seen: r.seen,
    accuracy: r.attempted > 0 ? Math.round((r.correct / r.attempted) * 1000) / 10 : null
  })));
}));

app.get('/api/analytics/overview/:studentId', wrap(async (req, res) => {
  const sessions = await all(`
    SELECT s.id, s.submitted_at, COALESCE(SUM(a.points),0) AS score, COUNT(a.id) AS questions
    FROM sessions s LEFT JOIN attempt_answers a ON a.session_id=s.id
    WHERE s.student_id=? AND s.submitted_at IS NOT NULL
    GROUP BY s.id ORDER BY s.submitted_at DESC`, [req.params.studentId]);
  if (!sessions.length) return res.json({ empty: true, tests: 0 });
  const avg = Math.round(sessions.reduce((s, r) => s + r.score, 0) / sessions.length);
  res.json({ empty: false, tests: sessions.length, lastScore: sessions[0].score, avgScore: avg, last: sessions[0] });
}));

/* ============================ TEAM ============================ */
function subjectWhere(subject, args) {
  if (!subject || subject === 'overall') return '';
  args.push(subject);
  return ' AND q.subject=?';
}

app.get('/api/team/summary', requireCoach, wrap(async (req, res) => {
  const students = await get(`SELECT COUNT(*) AS count FROM students WHERE role='student'`);
  const sessions = await get(`
    SELECT COUNT(*) AS count
    FROM sessions
    WHERE submitted_at IS NOT NULL
  `);
  const questions = await get('SELECT COUNT(*) AS count FROM questions');
  const integrity = await get(`
    SELECT
      SUM(CASE WHEN flagged=1 OR rejected=1 OR answer_key_match_status='mismatch' THEN 1 ELSE 0 END) AS issues,
      SUM(CASE WHEN approved_for_practice=0 AND rejected=0 THEN 1 ELSE 0 END) AS pending
    FROM questions
  `);
  const top = await all(`
    SELECT st.id, st.name, COALESCE(SUM(a.points),0) AS score
    FROM students st
    JOIN sessions s ON s.student_id=st.id AND s.submitted_at IS NOT NULL
    JOIN attempt_answers a ON a.session_id=s.id
    WHERE st.role='student'
    GROUP BY st.id, st.name
    ORDER BY score DESC, st.name ASC
    LIMIT 3
  `);
  const active = await get(`
    SELECT COUNT(DISTINCT student_id) AS count
    FROM sessions
    WHERE submitted_at IS NOT NULL
  `);

  res.json({
    empty: !students.count,
    students: students.count || 0,
    activeStudents: active.count || 0,
    sessions: sessions.count || 0,
    questions: questions.count || 0,
    topThreeScore: top.reduce((sum, row) => sum + Number(row.score || 0), 0),
    integrityIssues: integrity.issues || 0,
    reviewPending: integrity.pending || 0
  });
}));

app.get('/api/team/leaderboard', requireCoach, wrap(async (req, res) => {
  const args = [];
  const where = subjectWhere(req.query.subject, args);
  const rows = await all(`
    SELECT
      st.id,
      st.name,
      COALESCE(SUM(a.points),0) AS score,
      SUM(CASE WHEN a.selected IS NOT NULL AND a.selected <> '' THEN 1 ELSE 0 END) AS attempted,
      SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct,
      COUNT(a.id) AS seen
    FROM students st
    JOIN sessions s ON s.student_id=st.id AND s.submitted_at IS NOT NULL
    JOIN attempt_answers a ON a.session_id=s.id
    JOIN questions q ON q.id=a.question_id
    WHERE st.role='student'${where}
    GROUP BY st.id, st.name
    ORDER BY score DESC, correct DESC, st.name ASC
    LIMIT 25
  `, args);
  res.json(rows.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    name: row.name,
    score: row.score || 0,
    attempted: row.attempted || 0,
    correct: row.correct || 0,
    seen: row.seen || 0,
    accuracy: row.attempted > 0 ? Math.round((row.correct / row.attempted) * 1000) / 10 : null
  })));
}));

app.get('/api/team/subjects', requireCoach, wrap(async (req, res) => {
  const rows = await all(`
    SELECT
      q.subject,
      COALESCE(SUM(a.points),0) AS score,
      SUM(CASE WHEN a.selected IS NOT NULL AND a.selected <> '' THEN 1 ELSE 0 END) AS attempted,
      SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct,
      COUNT(a.id) AS seen
    FROM attempt_answers a
    JOIN sessions s ON s.id=a.session_id AND s.submitted_at IS NOT NULL
    JOIN questions q ON q.id=a.question_id
    WHERE q.subject IS NOT NULL AND q.subject <> ''
    GROUP BY q.subject
    ORDER BY q.subject
  `);
  res.json(rows.map(row => ({
    subject: row.subject,
    score: row.score || 0,
    attempted: row.attempted || 0,
    correct: row.correct || 0,
    seen: row.seen || 0,
    accuracy: row.attempted > 0 ? Math.round((row.correct / row.attempted) * 1000) / 10 : null
  })));
}));

/* ============================ STATIC FRONTEND ============================ */
app.use('/server', (req, res) => res.status(404).send('Not found'));
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

const PORT = process.env.PORT || 3000;
init()
  .then(() => app.listen(PORT, () => console.log(`UIL Science platform running → http://localhost:${PORT}`)))
  .catch(err => { console.error('Failed to initialize database:', err); process.exit(1); });
