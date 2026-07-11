# Security Review

## Added Controls

- Student MVP uses display name only and generates an internal local UID.
- Student display name is trimmed, length-limited, and rendered with escaping/text APIs.
- No student list is exposed in the public MVP.
- Firebase rules deny all unspecified reads and writes.
- Dashboard aggregate reads are restricted to the verified Google account `haohanzang@gmail.com`.
- Importer path guard rejects parent traversal and repository escapes.
- Published content validators fail closed on unresolved citations, duplicate IDs, incomplete exams, and `needs-review` publication.

## Remaining Security Work

- Firebase project and deployment are not configured.
- Server-side aggregate generation for dashboard data is not implemented.
- Existing Express prototype role headers remain legacy/demo code and must not be treated as production authorization.
