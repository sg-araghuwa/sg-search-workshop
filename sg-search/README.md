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
npx --yes serve -l 3000 -s .
```

Port **3000** is required (lab PRD). The backend runs separately:

```powershell
cd ..\sg-search-service
npm start
```

Backend URL: [http://localhost:3001](http://localhost:3001)

## Okta configuration (Story 1.1)

Before Epic 2 sign-in, configure local Okta settings from the committed template.

1. Copy the template to a gitignored local file:

   ```powershell
   Copy-Item config.example.js config.js
   ```

2. Edit `config.js` with your Okta SPA values (`issuer`, `clientId`, `redirectUri`).

3. Register **both** redirect URIs in Okta Admin Console:
   - `http://localhost:3000/login/callback`
   - `http://127.0.0.1:3000/login/callback`

4. Align backend `.env` in `sg-search-service` — see [Okta Authentication Setup](../LAB-03-Search-App-Guide.md#okta-authentication-setup) in the main lab guide.

| File | Purpose |
|------|---------|
| `config.example.js` | Committed Okta config template (placeholders only) |
| `config.js` | Your local issuer, client ID, redirect URI (**gitignored**) |

**Epic 2 (not yet implemented):** `auth.js`, sign-in UI, and Bearer token on search requests.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Search UI shell (auth sections added in Epic 2) |
| `styles.css` | Glassmorphism styling |
| `app.js` | Search form, fetch, XSS-safe results rendering |
| `config.example.js` | Okta config template |

## Visual check (Story 2.1)

At viewport width **1280px** or wider:

- Centered column, max width **800px**
- Glass cards with `backdrop-filter: blur(20px)`
- Base typography **17px**, system font stack
- Card radius **12px**; control radius **8px**

## Tests

```powershell
npm test
```

Runs a lightweight Node check of HTML/CSS contract (no browser required).
