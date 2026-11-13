# Travel Together — hackathon submission

Needs Node.js 24 LTS, Git and an empty PostgreSQL database (local or Neon). Original sources: [frontend](https://github.com/hydro-7/2FA-MATCHER-FE) and [backend](https://github.com/Ajaybalajiprasad/2FA-MATCHER-BE).
```sh
git clone https://github.com/hydro-7/2FA-MATCHER-SUBMISSION.git
cd 2FA-MATCHER-SUBMISSION/BE
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
node -e "require('node:fs').copyFileSync('.env.example', '.env')"
```

Edit `.env` in `BE`: set `DATABASE_URL` and replace `AUTH_SECRET` with the output of `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep other defaults; for Neon behind a restricted network, use `DATABASE_TRANSPORT=websocket`.
Run `pnpm dev` here; wait for `Server running on http://localhost:8000`. Tables and demo data are created automatically. Leave this terminal open. [Backend guide](BE/README.md).

In another terminal, from the cloned repo root, run the commands below and open [http://localhost:5173](http://localhost:5173). [Frontend guide and demo login](FE/README.md).
```sh
cd FE
npm install
npm run dev
```
