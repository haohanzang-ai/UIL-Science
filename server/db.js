/* ============================================================
   Database layer — libSQL (@libsql/client)
   - If TURSO_DATABASE_URL is set → uses Turso (persistent, hosted).
   - Otherwise → falls back to a local SQLite file (ephemeral on
     free hosts, fine for local dev). No fake data is seeded.
   Set these env vars in Render to enable persistence:
     TURSO_DATABASE_URL   (e.g. libsql://your-db.turso.io)
     TURSO_AUTH_TOKEN     (the database token)
   ============================================================ */
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

const remoteUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let url;
if (remoteUrl) {
  url = remoteUrl;
} else {
  const dir = path.join(__dirname, 'data');
  fs.mkdirSync(dir, { recursive: true });
  url = 'file:' + path.join(dir, 'uil.db').replace(/\\/g, '/');
}

const db = createClient(authToken ? { url, authToken } : { url });

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  school TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  team_id INTEGER REFERENCES teams(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT,
  year INTEGER,
  question_number INTEGER,
  scan_crop_url TEXT,
  subject TEXT,
  topic TEXT,
  subtopic TEXT,
  difficulty TEXT,
  textbook_chapter TEXT,
  stem TEXT,
  choices TEXT,
  correct_answer TEXT,
  explanation TEXT,
  ocr_extracted INTEGER DEFAULT 0,
  answer_key_matched INTEGER DEFAULT 0,
  explanation_linked INTEGER DEFAULT 0,
  ai_topic_tagged INTEGER DEFAULT 0,
  coach_reviewed INTEGER DEFAULT 0,
  approved_for_practice INTEGER DEFAULT 0,
  flagged INTEGER DEFAULT 0,
  rejected INTEGER DEFAULT 0,
  extraction_confidence REAL,
  topic_tag_confidence REAL,
  answer_key_match_status TEXT DEFAULT 'unmatched',
  last_reviewed_by TEXT,
  last_reviewed_at TEXT,
  coach_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  mode TEXT,
  subject TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  submitted_at TEXT
);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES sessions(id),
  question_id INTEGER REFERENCES questions(id),
  selected TEXT,
  confidence TEXT,
  is_correct INTEGER,
  points INTEGER
);

CREATE INDEX IF NOT EXISTS idx_q_approved ON questions(approved_for_practice);
CREATE INDEX IF NOT EXISTS idx_q_subject  ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_aa_session ON attempt_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_s_student  ON sessions(student_id);
`;

async function init() {
  await db.executeMultiple(SCHEMA);
  console.log(remoteUrl ? 'DB: connected to Turso (persistent).' : 'DB: using local file (ephemeral on free hosts).');
}

/* ---- small async query helpers (return plain objects) ---- */
function toPlain(rs) {
  return rs.rows.map(row => {
    const o = {};
    rs.columns.forEach(c => { o[c] = row[c]; });
    return o;
  });
}
async function all(sql, args = []) { return toPlain(await db.execute({ sql, args })); }
async function get(sql, args = []) { const r = await all(sql, args); return r[0] || null; }
async function run(sql, args = []) {
  const r = await db.execute({ sql, args });
  return { lastInsertRowid: r.lastInsertRowid != null ? Number(r.lastInsertRowid) : null, rowsAffected: r.rowsAffected };
}

/* Derive the data-integrity badge (Feature 1) from status fields. */
function integrityBadge(q) {
  if (q.rejected || q.flagged || q.answer_key_match_status === 'mismatch') return 'issue';
  if (q.approved_for_practice) return 'approved';
  if (q.ocr_extracted) return 'review';
  return 'unprocessed';
}

module.exports = { db, init, all, get, run, integrityBadge };
