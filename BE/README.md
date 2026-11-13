# Group Travel Matcher — backend

Express, TypeScript and PostgreSQL API for matching travellers, approving members, booking stays, friends and chat.

Needs Node.js 24 LTS, Git and an empty PostgreSQL database (local or Neon). Start this before the frontend. Already cloned? From the repo root, run `cd BE` and skip the first two commands below.
```sh
git clone https://github.com/hydro-7/2FA-MATCHER-SUBMISSION.git
cd 2FA-MATCHER-SUBMISSION/BE
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
node -e "require('node:fs').copyFileSync('.env.example', '.env')"
```

- Edit `.env`: set `DATABASE_URL` to your database URL. For `AUTH_SECRET`, paste the output of `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep the other defaults.
- For Neon on a network that blocks PostgreSQL, set `DATABASE_TRANSPORT=websocket`; local PostgreSQL uses `tcp`.
- Run `pnpm dev` from this folder. It applies migrations and loads the bundled demo data automatically; no manual seed/reset is needed.
- Wait for `Server running on http://localhost:8000` and leave the terminal open. Check [health](http://localhost:8000/health) or [Swagger](http://localhost:8000/api-docs).
- Checks: `pnpm test` and `pnpm typecheck`. Tests use an isolated in-memory database.

Code flow: `src/routes` → `controllers` → `services` → `repositories` → database. Bookings are demo confirmations, without payments.
