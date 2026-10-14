# MathCorner (Scientific Calculator)

A calculator that works like a phone calculator, with a **history** that is saved by a **Node.js + Fastify** backend.

```
mathcorner/
  frontend/   React 18 + Vite (the calculator you see)
  backend/    Node.js + Fastify API (saves history and settings in a JSON file)
```

## What it does

**Calculator**
- Type a full expression with brackets, e.g. `(2+3)×4−6÷3`, and see the live result while typing
- Correct order of operations, phone-style percent (`200+10% = 220`), unary minus (`5×−3`)
- Scientific mode: sin cos tan, sinh cosh tanh (+ inverses with 2nd), ln, log, log₂, 10ˣ, 2ˣ, eˣ, xʸ, ʸ√x, x², x³, √x, ∛x, x⁻¹, x!, |x|, mod, EE, π, e, Rand, Deg/Rad
- Memory keys MC MR M+ M− MS, error messages, keyboard support, copy result, light/dark theme

**History and backend**
- Every finished calculation (after `=`) is saved on the server
- History panel: newest first, **Load more** for older items, **search**, delete one item, **Clear all**
- Click a history row to use its result, click **Edit** to load its expression again
- Theme, Standard/Scientific mode, Deg/Rad and the memory value are saved too
- Every browser gets its own random id, so each person sees only their own history
- If the server is stopped, the calculator keeps working. New calculations are shown as "not saved" until you refresh

## Run it

You need **Node.js 20 or newer** (`node -v`).

```bash
npm run setup     # installs everything (root, backend, frontend) - only the first time
npm run dev       # starts the API (port 3001) and the website (port 5173)
```

Open http://localhost:5173. The website forwards every `/api` request to the backend, so nothing else is needed.

Run them separately if you prefer: `npm run dev:api` and `npm run dev:web`.

```bash
npm test          # runs the 15 backend tests
npm run build     # production build of the frontend (frontend/dist)
```

## API

All routes except `/api/health` need a header `x-client-id` (8 to 64 letters, numbers, `-` or `_`). The website creates it automatically.

| Method | Route | What it does |
| --- | --- | --- |
| GET | `/api/health` | Server check |
| GET | `/api/history?limit=30&offset=0&q=text` | List history, newest first. Returns `{ items, total, limit, offset }` |
| POST | `/api/history` | Save a calculation. Body: `{ expression, tokens, result, mode?, angle? }` |
| DELETE | `/api/history/:id` | Delete one item (204, or 404 if it is not yours) |
| DELETE | `/api/history` | Delete all your history. Returns `{ deleted }` |
| GET | `/api/preferences` | `{ theme, mode, angle, memory }` |
| PUT | `/api/preferences` | Change any of those fields |

Limits: 1000 history items per browser (the oldest are removed), `limit` is 1 to 100.

## Settings for the backend (optional)

The server reads normal environment variables (see `backend/.env.example`):

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | 3001 | API port |
| `HOST` | 0.0.0.0 | Address to listen on |
| `DB_FILE` | `backend/data/db.json` | Where history and settings are saved |
| `CORS_ORIGIN` | (all) | Allowed website addresses, comma separated |
| `LOG_LEVEL` | info | Fastify log level |

Example: `PORT=4000 CORS_ORIGIN=https://mathcorner.vercel.app npm start --prefix backend`

## Deploy

1. **Backend** on a Node host such as Render, Railway or a VPS: root directory `backend`, build `npm install`, start `npm start`. Set `CORS_ORIGIN` to your website address.
   The data is a JSON file, so use a host with a **persistent disk** (set `DB_FILE` to a path on it). On free hosts with a temporary disk the history is lost when the server restarts. For many users, change `backend/src/store.js` to a real database such as PostgreSQL.
2. **Frontend** on Vercel: root directory `frontend`, framework Vite. Add the environment variable `VITE_API_URL` = the address of your backend (for example `https://mathcorner-api.onrender.com`).

## Code map

```
backend/src/
  server.js    starts the server
  app.js       builds the Fastify app (CORS, JSON parser, routes)
  routes.js    all API routes with JSON-schema validation
  store.js     JSON file storage (history + preferences)
backend/test/api.test.js

frontend/src/
  App.jsx                   layout, keyboard, saving history and settings
  api.js                    calls the backend
  hooks/useHistory.js       history list, search, paging, offline fallback
  components/               Display, Keypad, History
  calculator/               engine.js (parser), reducer.js (keys), math.js, keys.js
```
