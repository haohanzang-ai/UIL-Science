# UIL Science Team Study Platform

A multi-page "digital study room." It now has a **real backend** (Express +
SQLite) — run the server and open http://localhost:3000 so pages load live data.
See `server/README.md` for setup, the API, and how Features 1–4 are implemented.
All pages share one design system so the look stays consistent.

> **Real data only.** The database starts empty. Dashboard, Practice, Review,
> Insights, and Admin Review all show empty states until you import real questions
> (`server/import-format.md`) and students take real attempts. Nothing is invented.

### Advanced features (real data)
- **Data Integrity Badge** + **Coach Approval Workflow** → `admin-review.html`
  (only `approved_for_practice=1` questions reach students).
- **"Why Did I Lose Points?"** → `review.html` (computed from your submitted answers).
- **Personal Guessing Threshold** → `insights.html` (EV = 8p − 2, break-even 25%).

## Pages

| File | Route idea | Purpose |
|------|-----------|---------|
| `index.html` | `/` | Redirects to the dashboard. |
| `dashboard.html` | `/dashboard` | **Dashboard-first home** — predicted score, subject strengths, next step, flashcards due, last practice, coach assignment, mistake reminder, team progress, weekly goals, badges. Loads with skeleton states, then animates in. |
| `practice.html` | `/practice` | **Low-clutter study mode** — no sidebar; only question, choices, timer, confidence selector, mark-for-review, calculator reminder, progress bar. Keyboard A–E + arrows. Finishing routes to Review. |
| `review.html` | `/review` (Mistake Journal) | **Review mode** — score, correct/wrong/blank, points lost to risky guessing, subject + topic breakdown, hardest/easiest missed, recommended plan, clear next step. |
| `team.html` | `/team` + `#admin` | **Team dashboard** — readiness ring, weekly goals, filterable leaderboard, specialist badges, coach assignments, coach actions, OCR/admin review, coach-notice modal. |
| `competitor-guide.html` | `/competitor-guide` | The rules & strategy briefing (built earlier). |

## Shared design system

- `assets/uil.css` — tokens, app shell, cards, buttons, subject tags, meters,
  rings, badges, leaderboard, notes, empty/error/success/loading states, fully
  responsive (sidebar collapses to a drawer ≤1080px).
- `assets/uil.js` — injects the sidebar + mobile top bar on every page (set
  `<body data-page="…" data-title="…">`), handles the drawer, and exposes
  `UIL.toast()`, `UIL.ring()`, `UIL.fill()`, and a small `UIL.store` helper.
  Study mode opts out with `<body data-chrome="minimal">`.

## Design language

Calm, premium, focused: dark navy surfaces, rounded cards, soft shadows, large
titles + short subtitles, subject color system (Biology = green, Chemistry =
purple, Physics = amber, team/coach = neutral navy), smooth hover, skeleton
loading, toasts for success, dashed empty states, red error boxes.

## "What should I do next?" system

Every page surfaces one primary next action:
Dashboard → Review Mistakes · Practice finish → Review · Review → Create
Flashcards → Try Similar / Retest This Skill.

## Badges

Biology / Chemistry / Physics Specialist, Smart Skipper, Formula Master,
Mistake Fixer, Full Test Finisher, High-ROI Studier.

## Notes & next steps for production

- Numbers/students/questions are **sample data** for demo. Practice questions
  are original samples — no copyrighted past tests are shown.
- Checklist/leaderboard state is client-side; wire to your backend + auth
  (the whole site sits behind team login).
- For a framework build, the sidebar (`uil.js` NAV array) becomes a shared
  layout component and each page a route; tokens move to CSS variables/theme.
- Verified against official UIL rules (June 2026); always re-check the latest
  UIL Science Handbook before a meet.
