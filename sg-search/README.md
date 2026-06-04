# sg-search — Lab 03 Frontend

Vanilla HTML/CSS/JS search UI for the AI POC Lab. Static assets only; the Express API lives in `sg-search-service` on port **3001**.

## Requirements

- **Node.js 18+** (for `npm start` only; no UI build step)
- Serve over **HTTP** — do **not** open `index.html` via `file://` (fetch to the API will fail in later stories)

## Quick start (PowerShell)

```powershell
cd sg-search
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The start script runs:

```text
npx --yes serve -l 3000 .
```

Port **3000** is required (lab PRD). The backend runs separately:

```powershell
cd ..\sg-search-service
npm start
```

Backend URL: [http://localhost:3001](http://localhost:3001)

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page shell, header, placeholder regions |
| `styles.css` | Glassmorphism design tokens and layout |
| `app.js` | Client logic (Stories 2.2+) |

## Stable element IDs (downstream stories)

- `#search-panel` — search form (Story 2.2)
- `#status-panel` — status microcopy (Story 2.2+)
- `#results-panel` — results table (Story 2.4)

## Visual check (Story 2.1)

At viewport width **1280px** or wider:

- Centered column, max width **800px**
- Glass cards with `backdrop-filter: blur(20px)`
- Base typography **17px**, system font stack
- Card radius **12px**; control radius **8px** (when added)

## Tests

```powershell
npm test
```

Runs a lightweight Node check of HTML/CSS contract (no browser required).
