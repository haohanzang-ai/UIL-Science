# Firebase Setup

Firebase is not configured in this repository. The public study app therefore stores student profile and progress locally in the browser.

To enable centralized progress:

1. Create a Firebase project owned by the team.
2. Enable Anonymous Authentication for students.
3. Enable Google Authentication for the private dashboard.
4. Deploy `firestore.rules`.
5. Store Firebase web configuration in a repository-local public config file only if it contains no secrets.
6. Keep all privileged reads and aggregate generation server-authorized. Do not trust frontend email checks.

Only `haohanzang@gmail.com` is allowed to read dashboard aggregate documents in the provided rules.
