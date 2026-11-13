# Travel Together: Frontend

React app for travel groups, shared stays, cost splits, friends, maps and chat. Bookings are demo confirmations, without payments.

## Features

* Sign-up, sign-in and a demo-traveller switcher, with the session kept in the browser
* Discover groups by destination, dates, budget and interests, in list or swipe view, with match explanations
* Create a trip, send join requests, and approve or reject them as the owner
* Group workspace: trip progress, itinerary, members, map, hotels with cost split, requests and chat
* Friends, traveller profiles, and a light, dark or system theme

## Tech stack

React 19, React Router 7, Zustand for state, Leaflet and react-leaflet for maps, lucide-react icons, and Vite 8.

## Getting started

Needs Node.js 24 LTS and Git. Start the [backend](https://github.com/Ajaybalajiprasad/2FA-MATCHER-BE) first, so it is running on port 8000.

```sh
git clone https://github.com/hydro-7/2FA-MATCHER-FE.git
cd 2FA-MATCHER-FE
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with `t-001@demo.travel` / `demo1234`. Use a private browser window to sign in as a second traveller, so the two logins stay separate.

### Configuration

No `.env` is needed for the default setup: Vite forwards `/api` and `/images` to `http://localhost:8000`. To change that, copy `.env.example` to `.env` and restart `npm run dev`.

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_BACKEND_ORIGIN` | `http://localhost:8000` | Backend the dev server proxies to |
| `VITE_API_URL` | `/api` | Optional: call the API directly, which needs CORS on the backend |
| `VITE_PORT` | `5173` | Optional dev server port |
| `VITE_MAP_TILE_URL`, `VITE_MAP_TILE_ATTRIBUTION`, `VITE_GEOCODER_URL` | OpenStreetMap and Nominatim | Optional: use another tile or geocoding service |

## Screens

| Route | Screen |
| --- | --- |
| `/` | Home, with the trip search |
| `/discover` | Ranked groups and near misses |
| `/groups/new` | Create a trip |
| `/trips` | My trips and join requests |
| `/groups/:groupId` | Workspace, with map, itinerary, members, hotels and requests tabs |
| `/friends`, `/profile`, `/travellers/:id` | Friends, your profile and other travellers |

Group chat opens from the workspace and refreshes every 4 seconds.

## Project structure

Code flow: `src/screens` → `src/services` → `src/lib/http.js` → backend.

```
src/
  screens/ components/    pages and shared UI
  services/ lib/          API calls, http client, search and itinerary helpers
  store/ hooks/           Zustand stores (session, search, drafts, theme, toast)
  config/ constants/      routes, endpoints, labels and limits
```

Maps use OpenStreetMap tiles, and place lookups use Nominatim at no more than one request per second, so both need internet.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Vite for the connected local demo |
| `npm test` | Run the frontend tests |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build |
