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

## Layout

```
server.js              Express app: static assets + JSON API + SPA fallback
server/data.js         Mock PMS dataset (3 properties), alert lifecycle, sync + training state
server/assistant.js    Deterministic "AI" reply engine (numbers grounded in the active dataset)
public/index.html      Shell markup, view sections, drawer/chat/overlay scaffolding
public/app.js          Client: fetch, render, state, events, keyboard + aria behaviour
src/input.css          Tailwind entry (@tailwind base/components/utilities + custom layers)
tools/validate.js      Static contract check (DOM ids, icon keys, declared functions)
tools/smoke.js         Headless-Chrome end-to-end smoke run over CDP
tools/shot.js          Screenshot capture (desktop, drawer, revenue, ledger, mobile)
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
# headless Chrome on port 9222, then:
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
