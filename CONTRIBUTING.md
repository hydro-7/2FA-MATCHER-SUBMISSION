# Contributing to Travel Together

Thanks for taking the time to contribute. This guide covers how to run the project, how the code is organised, and how to send a change.

## Before you start

The final demo feature set is recorded in [`BE/DEMO_FREEZE.md`](BE/DEMO_FREEZE.md) and [`FE/DEMO_FREEZE.md`](FE/DEMO_FREEZE.md). It was frozen on 14 November 2026, and further work before the demo is limited to essential bug fixes. If you are unsure whether a change fits, open an issue first.

Bookings are demo confirmations. There are no payments or external reservations, and contributions should not add them.

## Set up

You need Node.js 24 LTS, Git, and an empty PostgreSQL database (local or [Neon](https://neon.tech)). The app is two repositories, the [backend](https://github.com/Ajaybalajiprasad/2FA-MATCHER-BE) and the [frontend](https://github.com/hydro-7/2FA-MATCHER-FE). Clone both and follow the steps in the [README](README.md#getting-started), or see the short guides in [`BE/README.md`](BE/README.md) and [`FE/README.md`](FE/README.md).

The backend applies migrations and loads the demo data on start. The app is at [http://localhost:5173](http://localhost:5173), and the demo login is `t-001@demo.travel` / `demo1234`.

## How the code is organised

**Backend (`BE/src`)** follows one direction of flow: `routes` → `controllers` → `services` → `repositories` → database.

| Folder | Responsibility |
| --- | --- |
| `routes/` | URL wiring, plus the auth and validation middleware for each route |
| `validators/` | Zod schemas for request bodies and params |
| `controllers/` | Read the request, call a service, and shape the response |
| `services/` | Business logic, such as matching, join requests and booking |
| `utils/` | Pure rule code: `matchRules`, `ranking`, `matchFilters`, `costCalculator`, `dateUtils` |
| `repositories/` | Drizzle queries, one repository per area |
| `db/schema/` | Drizzle table definitions |
| `docs/` | OpenAPI definitions served at `/api-docs` |
| `config/businessRules.ts` | Match thresholds, group size limits and ranking weights |

**Frontend (`FE/src`)** flows `screens` → `services` → `lib/http.js` → backend. `store/` holds UI state (Zustand), `components/` holds shared UI, and `config/` holds routes and endpoints.

## Making a change

1. Fork the repository and create a branch, for example `git checkout -b fix/approval-seat-check`.
2. Make your change, keeping to the layering above. Put rule logic in `utils/` and queries in `repositories/`. Services may open a transaction and pass it to repositories, but should not write queries themselves.
3. Add or update tests alongside the change (see below).
4. If you change an endpoint, update its OpenAPI definition in `BE/src/docs/paths/` so `/api-docs` stays accurate.
5. If you change the database schema, run `pnpm db:generate` from `BE/` and commit the generated files in `BE/drizzle/`. Do not edit existing migrations.
6. Run the checks below, commit, push your branch and open a pull request.

## Checks

Run these before you open a pull request.

```sh
# from BE/
pnpm typecheck
pnpm test          # runs against an isolated in-memory database, no setup needed

# from FE/
npm test
npm run build
```

Backend tests live in `BE/src/__tests__/` for API-level behaviour and in `BE/src/utils/__tests__/` for the pure rule code. Frontend tests live in `FE/src/lib/__tests__/`.

## Commit messages and pull requests

* Write short commit messages in the imperative, with an optional prefix such as `docs:` or `fix:`, for example `fix: re-check seats when approving a join request`.
* Keep each pull request focused on one change, and describe what changed and why.
* Include the steps you used to check it, and screenshots for visible UI changes.

## Reporting bugs and requesting features

Open an issue on the [repository](https://github.com/hydro-7/2FA-MATCHER-SUBMISSION/issues). For a bug, include what you did, what you expected, what happened, and whether you used a local PostgreSQL or Neon. Please do not include real credentials, connection strings or `AUTH_SECRET` values.

## Original sources

This repository combines two projects. Their original repositories are the [frontend](https://github.com/hydro-7/2FA-MATCHER-FE) and the [backend](https://github.com/Ajaybalajiprasad/2FA-MATCHER-BE).
