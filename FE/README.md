# Travel Together [frontend]

React app for travel groups, shared stays, cost splits, friends, maps and chat. Bookings are demo confirmations, without payments.

Needs Node.js 24 LTS and Git. Start the [backend](../BE/README.md) first. Already cloned? From the repo root, run `cd FE` and skip the first two commands below.
```sh
git clone https://github.com/hydro-7/2FA-MATCHER-SUBMISSION.git
cd 2FA-MATCHER-SUBMISSION/FE
npm install
npm run dev
```

- Open [http://localhost:5173](http://localhost:5173), then choose **Sign up** or **Sign in**. Leave both server terminals open.
- No frontend `.env` is needed: Vite forwards `/api` and `/images` to `http://localhost:8000`.
- For another backend address, copy `.env.example` to `.env`, change `VITE_BACKEND_ORIGIN`, then restart `npm run dev`.
- Demo login: `t-001@demo.travel` / `demo1234` (unless the backend's `DEMO_PASSWORD` was changed).
- Use a private browser window for a second traveller so the two logins stay separate.
- Checks: `npm test`. Build: `npm run build`. Use `npm run dev` for the connected local demo.

Code flow: `src/screens` → `src/services` → `src/lib/http.js` → backend; `src/store` holds UI state. Maps and remote photos need internet.
