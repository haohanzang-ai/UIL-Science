# Deploy guide — UIL Science platform

Two parts: (1) upload the code to GitHub via the website, (2) host it live.

---

## Part 1 — Upload to GitHub (web, no terminal)

1. Go to **https://github.com/haohanzang-ai/UIL-Science** and sign in.
2. Click **Add file → Upload files** (or, on the empty repo, the
   *"uploading an existing file"* link).
3. In your file explorer, open `C:\Users\lingw\Claude\Projects\UIL Science`.
4. Select and drag in **everything EXCEPT the `.zip` file**:
   - Files: `index.html`, `dashboard.html`, `practice.html`, `review.html`,
     `insights.html`, `admin-review.html`, `team.html`, `competitor-guide.html`,
     `README.md`, `.gitignore`, and the `*-README*.md` / `DEPLOY.md` docs.
   - Folders: **`assets`** and **`server`** (drag the folders themselves — GitHub
     keeps the structure).
   - ❌ Do **not** upload `UIL Science-*.zip` or any `node_modules` folder.
5. Scroll down, write a commit message like `Add UIL Science platform`, and click
   **Commit changes**.
6. Confirm the repo now shows `assets/`, `server/`, and the HTML files.

> Tip: if a drag misses the `assets/` or `server/` folder, repeat **Add file →
> Upload files** and drag just that folder. You can commit in multiple batches.

> Note: the web uploader doesn't honor `.gitignore`. The `.gitignore` still
> matters later (if you clone and use git), so upload it too — just skip the zip.

---

## Part 2 — Host it live (Render — free Node host)

The app is a Node server (`/server`) that also serves the web pages, so one
service runs everything.

1. Create an account at **https://render.com** and click **New → Web Service**.
2. Connect your GitHub and pick the **UIL-Science** repo.
3. Configure:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance type:** Free
4. Click **Create Web Service**. Render installs dependencies and starts it.
   When it's live you'll get a URL like `https://uil-science.onrender.com`.
5. Open that URL → the dashboard loads with empty states (no data yet).

### Make the database persistent (important)

The free tier's disk is **ephemeral** — the SQLite file resets on every deploy
or restart, so student attempts and approved questions would be lost. Pick one:

- **Render Persistent Disk** (paid): add a disk mounted at `/server/data` so
  `uil.db` survives restarts. Simplest if you stay on Render.
- **Turso / libSQL** (free hosted SQLite): keep your code almost as-is and point
  it at a hosted SQLite database — best free option for persistence.
- **Postgres** (Render/Neon/Supabase free): most scalable; needs swapping the DB
  layer in `server/db.js` from `better-sqlite3` to a Postgres client.

Tell me which you prefer and I'll adapt `server/db.js` accordingly.

### Before real students use it
- Replace the prototype identity headers (`x-student-id` / `x-role`) with real
  team login.
- Restrict static serving so `/server/*` source isn't publicly served.
- Import your real, approved questions (`server/import-format.md`).
