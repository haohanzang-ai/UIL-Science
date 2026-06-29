# UIL Science Team Study Platform

A private study platform for a school UIL Science team — a Quizlet-style prep
environment for the Biology / Chemistry / Physics contest, with a real-data
backend, coach approval workflow, and per-student analytics.

## What's here

**Frontend (static pages, shared design system)**
- `index.html` — entry (redirects to the dashboard)
- `dashboard.html` — dashboard-first home (real data, empty states)
- `practice.html` — low-clutter study mode (approved questions, real attempts)
- `review.html` — "Why Did I Lose Points?" panel (real submitted answers)
- `insights.html` — Personal Guessing Threshold (EV = 8p − 2, break-even 25%)
- `admin-review.html` — coach approval workflow + data-integrity badges
- `team.html` — team dashboard *(not yet wired to live data)*
- `competitor-guide.html` — rules, scoring, and meet-day briefing
- `assets/uil.css`, `assets/uil.js`, `assets/api.js` — shared system + API client

**Backend (`/server`, Express + SQLite)**
- Real schema for questions (with data-integrity status), students, sessions,
  and attempt answers; UIL +6/0/−2 scoring and analytics computed from real data.
- See `server/README.md` for setup and the full API, and
  `server/import-format.md` for loading real questions.

## Run locally

```bash
cd server
npm install
npm start
# open http://localhost:3000
```

The database starts **empty** — pages show empty states until you import real
questions and students take real attempts. No placeholder stats are invented.

## Status / next steps

- Identity is a prototype header (`x-student-id` / `x-role`) — replace with real
  team login before deployment.
- `team.html` and the leaderboard still use sample data pending real wiring.
- OCR / AI extraction are integration points feeding the importer / `PATCH` API.
