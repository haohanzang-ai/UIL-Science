# UIL Science Competitor Guide page

Self-contained, premium app-shell page for the `/competitor-guide` route.
No build step, no dependencies — all CSS and JS are inline, so it works as a
static page or as the body of a component in any framework.

## File

- `competitor-guide.html` — the full page (app sidebar + content + right rail).

## Layout

- **Left sidebar nav** (desktop): Dashboard, Practice, Pattern Explorer,
  Flashcards, Mistake Journal, Study Plans, **Competitor Guide (active)**,
  Team Dashboard, Admin Review — each with an icon. Active page is highlighted.
- **Mobile:** sidebar collapses into a hamburger drawer; a "Jump to section"
  collapsible menu replaces the sticky rail.
- **Hero** with science-themed SVG decoration + 4 action buttons.
- **Coach notice** box near the top.
- **Quick stat cards** (60 questions · 2 hours · +6/0/−2 · team).
- **Right rail (sticky, desktop):** Quick Actions card, Your Readiness meter,
  and a scrollspy "On This Page" section nav.
- **Footer disclaimer**.

## Sections (sticky nav targets)

Quick Facts · Test Structure · Scoring · Materials · Room Rules ·
Advancement · Platform Workflow · Checklists · Great Competitors · Archive Note.

## Subject color system

Biology = green, Chemistry = purple, Physics = amber, Team/coach = neutral navy.

## Interactivity (vanilla JS, no libraries)

- Mobile drawer toggle + scrim.
- Scrollspy highlights the current section in the rail and mobile menu.
- Competitor checklists persist per-device via `localStorage` and drive the
  "Your Readiness" progress meter.

## Wiring into the real site

Update these `href`s to your routes (sidebar + buttons):
`/dashboard`, `/practice`, `/pattern-explorer`, `/flashcards`,
`/mistake-journal`, `/study-plans`, `/competitor-guide`, `/team`, `/admin`.
Quick Actions also use `/practice?mode=subject`. Keep the page behind your
existing login / team-access guard.

For React/Next/Vite: move the `<body>` markup into a `CompetitorGuide`
component, the `<style>` into a CSS module/global sheet, and the `<script>`
logic into a `useEffect`. The sidebar can be promoted to a shared app layout.

## Content / compliance notes

- English only. Does **not** display full copyrighted past tests.
- Rules follow the official UIL Science contest page and Section 952 of the
  UIL Constitution & Contest Rules (reviewed June 2026).
- Scoring shown as **+6 / 0 / −2**; guessing guidance (EV = 8p − 2, positive
  when p > 25%) is labeled a **strategy rule, not a UIL rule**.
- Physics Study Text: 2025–26 *Radioactivity* (Malley); 2026–27
  *Quantum Supremacy* (Kaku). Update yearly.
- Archive note: database currently covers tests **through 2009**.

Always re-verify calculator rules, assigned texts, and scoring against the
**latest UIL Science Handbook** before each meet.
