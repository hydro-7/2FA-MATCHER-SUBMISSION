# Working MVP

Milestone: `working-mvp` (13 November 2026).

This is the demo baseline, verified with the backend at commit
`029745a05d9645430fc79b9df76eeefbe221bd8d` in `Ajaybalajiprasad/2FA-MATCHER-BE`.

## Verified flows

- Create and restore traveller profiles.
- Create groups and search for compatible groups.
- Browse cards or lists; swipe to skip or request membership.
- Approve or decline requests and view joined trips and members.
- Search hotels, save and compare options, and display per-person costs.
- Confirm a shared demo booking and restore it after reload.
- Exchange and persist group chat messages.
- Render desktop and mobile views without horizontal overflow.

Backend validation passed: 168 tests across 12 files and TypeScript checking.
Frontend production build and independent browser reviews passed. The user
also verified the creator/request/approval flow with separate browser sessions.

## Run locally

Run `pnpm dev` in the backend repository with its private `.env` configured.
Run `npm ci` and `npm run dev` in this repository. Set the ignored
`.env.local` to:

```dotenv
VITE_BACKEND_ORIGIN=http://localhost:8000
VITE_PORT=5173
```

Open http://localhost:5173. Use a separate private browser window for a second
traveller. The local backend uses the configured Neon database. Keep credentials
outside Git. Booking confirmation is a demo record, not a paid hotel reservation.

Use the `working-mvp` tag as the reference point for subsequent changes.
