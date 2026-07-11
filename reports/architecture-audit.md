# Architecture Audit

## Original Failure Causes

- The deployed GitHub Pages frontend depended on same-origin API calls even though the Express backend is not served from GitHub Pages.
- Student identity and practice startup paths previously depended on backend availability and could stall without useful recovery states.
- Prototype coach/admin role handling trusted client-controlled headers and local storage.
- The repository has no validated source corpus, so any real question/explanation publication must remain blocked.

## Implemented MVP Architecture

- `study.html` is the public GitHub Pages entrypoint.
- Students enter only a display name.
- A random local UID is generated and stored in browser local storage.
- Progress, bookmarks, and review queues remain local-only until Firebase is configured.
- `data/processed/published-questions.json` and `data/processed/published-exams.json` are the static published-content interfaces.
- Publication validators require `published: true` records to be `verificationStatus: verified`.
- The importer reads only repository-local `data/source-pdfs/` and writes only repository-local review/report outputs.

## Known Legacy Surface

- Existing Express/admin/team pages remain in the repository for prototype/backend work.
- Existing server role headers are not production authorization and are documented in `reports/security-review.md`.
