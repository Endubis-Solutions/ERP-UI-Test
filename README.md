# Mad Vervet Hostels — Executive ERP Console

Dark, executive-grade hospitality dashboard: consolidated financial summary, KPI cards, AI morning
brief, discrepancy alerts with an evidence drawer, revenue intelligence by department, PMS sync
status, AI settings and a floating assistant. Node/Express serves a single-page client that hydrates
from one JSON endpoint, so every number on screen comes from the same payload.

## Run it

```powershell
npm install
npm run build:css      # compile public/css/styles.css from Tailwind
npm start              # http://localhost:3000
```

Use `npm run watch:css` while iterating on markup/classes (Tailwind JIT picks up classes in
`public/index.html` and `public/app.js`).

## Deploy to Netlify

Netlify serves static files only, so the Express server is replaced by one bundled function that
exposes the **same `/api/*` paths**. The client keeps calling relative URLs, so `public/app.js`
needs no environment-specific config.

```powershell
# 1. connect the repo in Netlify → "Add new site" → "Import an existing project"
# 2. Netlify reads netlify.toml: build "npm run build", publish "public",
#    functions "netlify/functions" and Node 20 — no dashboard overrides needed
# 3. deploy (no environment variables required)
```

What `netlify.toml` wires up:

| Setting | Value | Why |
| --- | --- | --- |
| build command | `npm run build` → `build:css` | Tailwind `styles.css` is compiled at deploy time |
| publish | `public` | `index.html`, `app.js`, `css/styles.css` |
| functions | `netlify/functions` | single handler `api.js` |
| rewrite | `/api/*` → `/.netlify/functions/api/:splat` | keeps every client fetch path identical |
| rewrite | `/*` → `/index.html` | SPA fallback |
| headers | `no-cache` for `styles.css`/`app.js`/`index.html`, security headers | assets are not fingerprinted |

The mock dataset is generated in memory, so only the mutable demo state (last sync, sync events,
trained patterns, training log) is snapshotted into **Netlify Blobs** between invocations; without a
Blobs context the function falls back to per-instance memory. Posting/ledger data stays
deterministic and reconciles exactly as it does locally.

Test the serverless path without deploying:

```powershell
npm run test:fn      # drives netlify/functions/api.js with Lambda-style events
npm run preview:fn   # serves public/ + the function on :3100 (the deployed topology)
$env:APP_URL='http://localhost:3100/'; node tools/smoke.js   # same 41 assertions
npx netlify dev      # real Netlify CLI; proxies to server.js (see [dev] in netlify.toml)
```

## Layout

```
server.js              Express app: static assets + JSON API + SPA fallback (local dev)
server/data.js         Mock PMS dataset (3 properties), alert lifecycle, sync + training state
server/assistant.js    Deterministic "AI" reply engine (numbers grounded in the active dataset)
netlify.toml           Netlify build/publish/functions config, /api rewrite, headers
netlify/functions/api.js  Serverless mirror of the Express API (same /api/* routes)
public/index.html      Shell markup, view sections, drawer/chat/overlay scaffolding
public/app.js          Client: fetch, render, state, events, keyboard + aria behaviour
src/input.css          Tailwind entry (@tailwind base/components/utilities + custom layers)
tools/validate.js      Static contract check (DOM ids, icon keys, declared functions)
tools/smoke.js         Headless-Chrome end-to-end smoke run over CDP
tools/shot.js          Screenshot capture (desktop, drawer, revenue, ledger, mobile)
tools/function-test.js Lambda-event harness for the Netlify function
tools/netlify-sim.js   Static + function server that mimics Netlify routing
```

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/locations` | Selectable contexts (`global`, `addis`, `nairobi`) with currency + timezone |
| GET | `/api/dashboard?location=` | Full dashboard payload for one context |
| GET | `/api/ledger?location=` | Raw posting ledger for one context (ties to the dashboard totals) |
| POST | `/api/alerts/:id/expect` | Mark an alert expected (feeds training memory) |
| GET | `/api/training` | Training log entries |
| POST | `/api/training/reset` | Clear trained memory |
| POST | `/api/sync` | Force a PMS sync (returns new `lastSync`; the next `/api/dashboard` payload carries the new event) |
| POST | `/api/assistant/query` | `{ message, location }` → grounded assistant reply |

Seed data lives in `server/data.js`; the client never hard-codes financial figures.

## Interactions to try

- **Location context** (sidebar) — swaps dataset, currency (USD/ETB/KES) and clock timezone.
- **Search** (`⌘K` / `Ctrl+K` / `/`) — jumps to views, departments, alerts and location commands
  ("switch to addis") from the keyboard.
- **Discrepancy alerts** — severity filters, `Investigate` opens the evidence drawer (`Esc` closes,
  focus is restored), `Mark expected` writes training memory and decrements open flags.
- **AI morning brief** — segment links open the matching alert; `Copy` and `Regenerate` act inline.
- **Revenue streams** — subnav or department pills switch the panel in place; sidebar toggles the view.
- **Finance ledger** — sidebar → *Finance Ledger* (or *Raw data* above the revenue panel) shows every posting:
  filter by department, category, source, status or revenue/expense, search, sort, page and export the
  filtered rows as CSV. The page reconciles itself against the departmental totals.
- **Training memory** — "Reset" under AI settings restores the trained state and open-flag count.
- **Assistant** — chat FAB, starter chips, and answers that cite the live numbers for the location.
- **Preferences** — AI toggles persist in `localStorage` (`mv-exec-settings`).
- **Responsive** — below `lg` the sidebar becomes an overlay drawer; the top bar collapses.

## Verification

```powershell
npm run validate                     # static: ids / icons / function contract
npm run test:fn                      # Netlify function: all routes, no deploy needed
npm run preview:fn                   # static + /api function on :3100 (deployed topology)
# headless Chrome on port 9222, then (APP_URL works for both servers):
node tools/smoke.js                  # live end-to-end assertions, fails on console errors
node tools/shot.js                   # writes .shot-*.png for visual review
```

`tools/smoke.js` expects Chrome listening on `--remote-debugging-port=9222`:

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu `
  --remote-debugging-port=9222 --user-data-dir="$env:TEMP\mv-smoke" about:blank
```

## Notes

- All data is mocked PMS/POS/ledger output; there is no database and no external calls.
- `POST /api/sync` and `POST /api/alerts/:id/expect` mutate in-memory state only — restart the server
  to reset the dataset (or `POST /api/training/reset` for training memory alone).
- After changing Tailwind classes in HTML/JS, rerun `npm run build:css` so the compiled stylesheet matches.
