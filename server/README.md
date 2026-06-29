# UIL Science Platform — backend (Express + SQLite)

Real-data backend for Features 1–4. It serves the frontend **and** the API from
one origin, so there are no CORS issues — just run it and open the site.

## Run

```bash
cd server
npm install        # installs express + better-sqlite3 (first time only)
npm start          # → http://localhost:3000
```

Open **http://localhost:3000** (not the file:// path) so the pages can call the API.

The database (`server/data/uil.db`) is created automatically and **starts empty** —
no fake data. `npm run reset-db` wipes it.

## Load your real questions

```bash
node import.js path/to/your-questions.json   # see import-format.md
```

Imported questions land in **Admin Review** and are invisible to students until a
coach approves them.

## How the 4 features map to the API

**Feature 1 — Data Integrity Badge**
- Every question row carries the status flags (`ocr_extracted`, `answer_key_matched`,
  `explanation_linked`, `ai_topic_tagged`, `coach_reviewed`, `approved_for_practice`)
  plus `extraction_confidence`, `answer_key_match_status`, `topic_tag_confidence`,
  `last_reviewed_by`, `last_reviewed_at`.
- The badge is derived server-side: red **Issue Found** (rejected/flagged/mismatch),
  green **Approved**, yellow **Needs Review**, gray **Not Processed**.
- `GET /api/questions` (coach) returns all with badges; `GET /api/practice/questions`
  returns **only `approved_for_practice=1`** and strips the answer key.

**Feature 2 — "Why Did I Lose Points?"** — `GET /api/analytics/score-loss/:sessionId`
computes possible/actual score, gained/lost, blanks, risky guesses, wrong-confident,
hardest/easiest missed, and the subject/topic causing the most loss — and generates
the insight sentences from the real numbers (`scoring.js`, never hardcoded).

**Feature 3 — Personal Guessing Threshold** — `GET /api/analytics/guessing/:studentId`
returns accuracy + average point impact per confidence level and EV-based advice
(EV = 8p − 2, break-even at p > 25%) from that student's real attempts only.

**Feature 4 — Coach Approval Workflow** — questions enter via import/OCR with
`approved_for_practice=0`. Admin Review (`admin-review.html`) lists the queue, shows
the scan crop + integrity detail, and supports edit (`PATCH /api/questions/:id`),
`approve`, `reject`, `flag`, and coach notes. Nothing reaches students unapproved.

## Full API

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| GET  | `/api/me` | any | current student (or null) |
| POST | `/api/students` | any | create student/coach record |
| GET  | `/api/questions[?subject&badge&q]` | coach | all questions + badges |
| GET  | `/api/admin/queue` | coach | unapproved, unrejected queue |
| GET  | `/api/admin/integrity-summary` | coach | badge counts |
| GET  | `/api/questions/:id` | coach | one question (full) |
| PATCH| `/api/questions/:id` | coach | edit fields |
| POST | `/api/questions/:id/approve` \| `/reject` \| `/flag` | coach | workflow |
| GET  | `/api/practice/questions[?subject&limit]` | student | approved only, no key |
| POST | `/api/practice/submit` | student | grade + store attempt |
| GET  | `/api/practice/sessions` | student | past sessions |
| GET  | `/api/analytics/score-loss/:sessionId` | any | Feature 2 |
| GET  | `/api/analytics/guessing/:studentId` | any | Feature 3 |
| GET  | `/api/analytics/subjects/:studentId` | any | subject accuracy |
| GET  | `/api/analytics/overview/:studentId` | any | tests/avg/last score |

## Quick end-to-end check

1. `npm start`, open http://localhost:3000 → dashboard shows "Welcome / get started" empty states (no fake data). ✅
2. Import `import-template.json` (after putting real text in it) → it appears in Admin Review as **Needs Review**. ✅
3. Approve it → it now appears in Practice. ✅
4. Take the practice test → Review shows a real "Why did I lose points?" panel; My Insights shows your guessing threshold. ✅

## Integration points (not faked)

- **OCR / AI tagging (workflow steps 1–7):** this server ingests already-extracted
  questions (importer or `PATCH`). Point your OCR/AI job's output at the same JSON
  shape or call the API. The status flags + confidences record what really ran.
- **Auth:** identity is a prototype header (`x-student-id`, `x-role`). Replace with
  your team login before deploying. Also restrict static serving so `/server/*`
  source isn't exposed (serve only the page files in production).
