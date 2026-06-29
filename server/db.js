/* ============================================================
   Database layer — SQLite via better-sqlite3
   Creates schema on first run. Seeds NOTHING (no fake data).
   ============================================================ */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'uil.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS teams (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  school    TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  email     TEXT,
  role      TEXT NOT NULL DEFAULT 'student',   -- student | coach | admin
  team_id   INTEGER REFERENCES teams(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  -- provenance
  source        TEXT,            -- e.g. "2009 District Invitational"
  year          INTEGER,
  question_number INTEGER,
  scan_crop_url TEXT,            -- image crop of the original scan (Feature 4)
  -- content
  subject       TEXT,            -- biology | chemistry | physics
  topic         TEXT,
  subtopic      TEXT,
  difficulty    TEXT,            -- easy | medium | hard
  textbook_chapter TEXT,
  stem          TEXT,
  choices       TEXT,            -- JSON array of strings
  correct_answer TEXT,           -- letter 'A'..'E' (or value)
  explanation   TEXT,
  -- data-integrity status flags (Feature 1)
  ocr_extracted        INTEGER DEFAULT 0,
  answer_key_matched   INTEGER DEFAULT 0,
  explanation_linked   INTEGER DEFAULT 0,
  ai_topic_tagged      INTEGER DEFAULT 0,
  coach_reviewed       INTEGER DEFAULT 0,
  approved_for_practice INTEGER DEFAULT 0,
  flagged              INTEGER DEFAULT 0,
  rejected             INTEGER DEFAULT 0,
  -- integrity detail
  extraction_confidence  REAL,            -- 0..1
  topic_tag_confidence   REAL,            -- 0..1
  answer_key_match_status TEXT DEFAULT 'unmatched', -- matched | mismatch | unmatched | manual
  last_reviewed_by   TEXT,
  last_reviewed_at   TEXT,
  coach_notes        TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id   INTEGER REFERENCES students(id),
  mode         TEXT,             -- full | subject
  subject      TEXT,             -- null for full
  started_at   TEXT DEFAULT (datetime('now')),
  submitted_at TEXT
);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  question_id  INTEGER REFERENCES questions(id),
  selected     TEXT,             -- null/'' = blank
  confidence   TEXT,             -- guessed | somewhat | confident | null
  is_correct   INTEGER,          -- 0/1, null if blank
  points       INTEGER           -- +6 / 0 / -2
);

CREATE INDEX IF NOT EXISTS idx_q_approved ON questions(approved_for_practice);
CREATE INDEX IF NOT EXISTS idx_q_subject  ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_aa_session ON attempt_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_s_student  ON sessions(student_id);
`);

/* Derive the data-integrity badge (Feature 1) from status fields. */
function integrityBadge(q) {
  if (q.rejected || q.flagged || q.answer_key_match_status === 'mismatch') return 'issue';   // red
  if (q.approved_for_practice) return 'approved';                                            // green
  if (q.ocr_extracted) return 'review';                                                      // yellow
  return 'unprocessed';                                                                      // gray
}

module.exports = { db, integrityBadge };
