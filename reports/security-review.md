# Security Review

## Added Controls

- Student MVP uses display name only and generates an internal local UID.
- Student display name is trimmed, length-limited, and rendered with escaping/text APIs.
- No student list is exposed in the public MVP.
- Firebase rules deny all unspecified reads and writes.
- Dashboard aggregate reads are restricted to the verified Google account `haohanzang@gmail.com`.
- Importer path guard rejects parent traversal and repository escapes.
- Imported question access is open for all parseable uploaded records; troubleshooting metadata is retained for source comparison.
- Backend coach/admin endpoints no longer trust a browser-controlled `x-role` header by default.
- Backend coach/admin endpoints require `ADMIN_TOKEN` through `Authorization: Bearer ...` or `x-admin-token`.
- Demo coach header mode is available only when `ENABLE_DEMO_COACH_AUTH=true` and `NODE_ENV` is not `production`.

## Remaining Security Work

- Firebase project and deployment are not configured.
- Server-side aggregate generation for dashboard data is not implemented.
- GitHub Pages password gating is client-side only and should be treated as a casual privacy gate, not as protection for sensitive data.
- Use a real identity provider before storing centralized student records or personally sensitive analytics.
