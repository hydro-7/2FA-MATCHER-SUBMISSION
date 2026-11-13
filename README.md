<a id="readme-top"></a>

[![Node][node-shield]][node-url]
[![React][react-shield]][react-url]
[![Express][express-shield]][express-url]
[![TypeScript][ts-shield]][ts-url]
[![PostgreSQL][pg-shield]][pg-url]

<br />
<div align="center">
  <h3 align="center">Travel Together</h3>

  <p align="center">
    Turn solo plans into a shared adventure: match with like-minded travellers, get approved into a group, then shortlist stays and split the cost.
    <br />
    <a href="https://github.com/Ajaybalajiprasad/2FA-MATCHER-BE"><strong>Backend repo »</strong></a>
    ·
    <a href="https://github.com/hydro-7/2FA-MATCHER-FE"><strong>Frontend repo »</strong></a>
  </p>
</div>

> **Two repositories, clone both.** Travel Together is split into a [backend](https://github.com/Ajaybalajiprasad/2FA-MATCHER-BE) (`Ajaybalajiprasad/2FA-MATCHER-BE`) and a [frontend](https://github.com/hydro-7/2FA-MATCHER-FE) (`hydro-7/2FA-MATCHER-FE`). You need both running to use the app. See [Getting Started](#getting-started) for the commands.

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About The Project

[![Travel Together home screen][screenshot-home]][screenshot-home]

A hackathon submission for **Problem 3: Group Travel Matcher**. A traveller describes a trip (destination, dates, budget and interests). The API checks it against every open group, ranks the fits, and explains each result. The traveller asks to join, the owner approves, and the group plans the trip together.

* **Explainable matching:** six eligibility rules, a weighted ranking, and near-miss suggestions
* **Gated membership:** join requests with owner approval
* **Shared planning:** itinerary, map, hotel comparison, equal cost split, mock booking, friends and group chat

| Discover | Group workspace |
| :---: | :---: |
| [![Discover][screenshot-discover]][screenshot-discover] | [![Workspace][screenshot-workspace]][screenshot-workspace] |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Architecture

[![Architecture built around trust][architecture-diagram]][architecture-diagram]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

Clone both repositories, as in the steps below. This repo is the combined submission snapshot, with the backend under `BE/` and the frontend under `FE/`.

You need Node.js 24 LTS, Git and an empty PostgreSQL database (local or [Neon](https://neon.tech)).

1. Clone and install the backend
   ```sh
   git clone https://github.com/Ajaybalajiprasad/2FA-MATCHER-BE.git
   cd 2FA-MATCHER-BE
   npm install -g pnpm@11.25.0
   pnpm install --frozen-lockfile
   node -e "require('node:fs').copyFileSync('.env.example', '.env')"
   ```
2. Edit `.env`: set `DATABASE_URL`, and set `AUTH_SECRET` to the output of `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. For Neon on a restricted network, also set `DATABASE_TRANSPORT=websocket`.
3. Start the backend and wait for `Server running on http://localhost:8000`. Tables and demo data are created automatically.
   ```sh
   pnpm dev
   ```
4. In a second terminal, clone and start the frontend
   ```sh
   git clone https://github.com/hydro-7/2FA-MATCHER-FE.git
   cd 2FA-MATCHER-FE
   npm install
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173)

Each repo has its own short guide: [backend](BE/README.md) and [frontend](FE/README.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

1. Sign in with `t-001@demo.travel` / `demo1234`.
2. Open **Groups**, pick a destination such as Kyoto, set dates between 1 and 20 April 2027, and review the ranked groups.
3. Send a join request, then approve it as the group owner in a private browser window, under **Requests**.
4. In the workspace, shortlist hotels, compare the per-member cost, and book the stay. Bookings are demo confirmations with no payments.

API docs are at [http://localhost:8000/api-docs](http://localhost:8000/api-docs) while the backend runs.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the code layout, checks and pull request steps.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

The backend declares the ISC license in `BE/package.json`. This repository has no top-level `LICENSE` file. Image credits are in `BE/hackathon-problem-3-group-travel-matcher/images/ATTRIBUTIONS.md`, `FE/public/cities/CREDITS.txt` and `FE/public/hero/CREDITS.txt`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[node-shield]: https://img.shields.io/badge/Node.js-24_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[node-url]: https://nodejs.org
[react-shield]: https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-url]: https://react.dev
[express-shield]: https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white
[express-url]: https://expressjs.com
[ts-shield]: https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[ts-url]: https://www.typescriptlang.org
[pg-shield]: https://img.shields.io/badge/PostgreSQL-Drizzle-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[pg-url]: https://orm.drizzle.team
[architecture-diagram]: docs/images/architecture.png
[screenshot-home]: docs/images/home.png
[screenshot-discover]: docs/images/discover.png
[screenshot-workspace]: docs/images/workspace.png
