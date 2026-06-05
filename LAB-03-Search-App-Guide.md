# LAB-03: Search App — Hands-On Guide

**Duration:** 30 minutes  
**Audience:** Senior developers and architects building a minimal full-stack search experience  
**Stack:** Node.js + Express (MongoDB Atlas API) · Vanilla HTML/CSS/JS (glassmorphism UI)

You will stand up a read-only user directory search: user data persisted in **MongoDB Atlas** (auto-seeded from a CSV fixture at startup), a REST API on port **3001** with an unchanged search contract, and a static frontend on port **3000**. By the end you will have verified search behavior, committed your work, and optionally pushed to GitHub.

---

## Lab Timeline (PRD)

| Minutes | Phase | Goal |
|---------|-------|------|
| **00–05** | Setup | Repo layout, Node check, `setup-lab.ps1`, optional VS Code debug |
| **05–15** | Backend | `.env` + `MONGODB_URI`, review `models/User.js`, `npm start`, smoke test API |
| **15–25** | Frontend | `index.html`, `styles.css`, `app.js`, browser search |
| **25–30** | Wrap-up + Git | `verify-lab.ps1`, manual checks, `git init` / commit / GitHub |

Stay on pace—each section is sized for the block above. If you finish early, run the verification matrix twice; repetition catches port and CORS mistakes fast.

---

## Overview & Prerequisites

### What you are building

```
┌─────────────────┐     fetch (CORS)      ┌──────────────────────┐     Mongoose      ┌─────────────────┐
│  sg-search/     │ ────────────────────► │  sg-search-service/  │ ────────────────► │  MongoDB Atlas  │
│  port 3000      │   GET /api/search     │  port 3001           │   users coll.   │  (shared cluster) │
│  (npx serve)    │                       │  auto-seed from CSV  │                   │                 │
└─────────────────┘                       └──────────────────────┘                   └─────────────────┘
                                          users.csv = seed input only (startup)
```

- **Backend** (`sg-search-service/`): Connects to MongoDB Atlas, idempotently upserts the `users` collection from `users.csv` at every startup, queries the Mongoose `User` model, and exposes `GET /health` and `GET /api/search?firstName=&lastName=` with case-insensitive exact match.
- **Frontend** (`sg-search/`): Form-driven search, XSS-safe rendering, status microcopy aligned with the PRD.

### Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Windows** with **PowerShell** | All commands below assume PowerShell from the workshop repo root |
| **Node.js 20.19.0+** | `node -v` should show v20.19.0 or higher (Mongoose 9.x requirement) |
| **npm** | Bundled with Node |
| **Git** | For the final commit step |
| **GitHub CLI (`gh`)** | Optional; manual `git remote` fallback provided |
| **VS Code** | Optional; use `.vscode/launch.json` for one-click debug |
| **Facilitator Atlas URI** | Shared `MONGODB_URI` distributed securely before lab |
| **`sg-search-service/.env`** | Copy from `.env.example`; never commit real credentials |
| **Network access** | Atlas IP allowlist configured by facilitator — no local MongoDB install or Docker |

### Repository layout (after lab)

```
sg-search-workshop/
├── setup-lab.ps1          # Installs backend deps, checks .env/MONGODB_URI and users.csv seed fixture
├── verify-lab.ps1         # API smoke tests (run with backend up)
├── .vscode/launch.json    # Debug API, frontend, or compound
├── sg-search-service/
│   ├── package.json
│   ├── server.js
│   ├── .env.example       # Template for MONGODB_URI (copy to .env)
│   ├── models/User.js     # Mongoose schema for search + auto-seed
│   ├── lib/db.js          # Atlas connection
│   ├── lib/seed.js        # Auto-seed from users.csv at startup
│   └── users.csv          # Seed fixture only (not read at search time)
└── sg-search/
    ├── package.json
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## Quick Start: Automated Setup (00–05)

From the repository root (the folder containing `setup-lab.ps1` and this guide):

```powershell
# If you are not already at repo root, navigate to your clone:
# Set-Location -Path "C:\path\to\sg-search-workshop"

.\setup-lab.ps1
```

`setup-lab.ps1` verifies Node.js (warns if below 20.19.0), runs `npm install` in `sg-search-service`, confirms the `users.csv` seed fixture exists, and checks that `sg-search-service/.env` contains a non-empty `MONGODB_URI`. If `.env` is missing or empty, it prints facilitator instructions — create `.env` in Step 2 before `npm start`. It prints the two-terminal run instructions. The frontend uses `npx serve` and does not require a separate `npm install`.

### Debugging with VS Code

Open the workshop folder in VS Code or Cursor. Press **Ctrl+Shift+D** to open **Run and Debug**, pick a configuration from the dropdown, and press **F5**.

**Prerequisites:** Node.js 20.19.0+ on your PATH. No extra extensions required — the built-in JavaScript debugger handles Node and Chrome.

| Configuration | Purpose | Port |
|---------------|---------|------|
| **Search API** | Debug `sg-search-service/server.js` (MongoDB connect, auto-seed, `/api/search`, CORS) | 3001 |
| **Search Frontend (serve)** | Start static server via `npx serve -l 3000 -s .` in `sg-search` | 3000 |
| **Search Frontend (Chrome)** | Open Chrome with debugger attached to `app.js` | 3000 (page) |
| **Search App (API + Frontend)** | Compound — starts API + serve together | 3001 + 3000 |

#### Recommended lab flows

**Quick start (one click):** Select **Search App (API + Frontend)** → F5 → open `http://localhost:3000` in your browser → search for `John`.

**Backend breakpoints:** Run **Search API** only → set a breakpoint on the `/api/search` handler in `server.js` → trigger a search from the browser or:

```powershell
curl "http://127.0.0.1:3001/api/search?firstName=John"
```

**Frontend breakpoints:** Start **Search Frontend (serve)** (or the compound config) first, then run **Search Frontend (Chrome)** → set a breakpoint in `runSearch()` inside `app.js` → click **Search** in the Chrome window that opens.

> **Note:** The compound config does **not** include Chrome — serve must be listening before Chrome debug starts. Run serve (or compound) first, then Chrome.

#### Troubleshooting debug launches

| Issue | Fix |
|-------|-----|
| `npx` not found on Windows | Ensure Node.js is on PATH; try `"runtimeExecutable": "npx.cmd"` in the serve config |
| Port already in use | Stop other terminals or use `$env:PORT=3002` for the API config env block |
| Chrome config fails to connect | Confirm serve is running on port 3000 before launching Chrome |
| Search API debug exits immediately | Missing `MONGODB_URI` — create `sg-search-service/.env` before F5 (see Step 2) |

#### Full `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Search API",
      "cwd": "${workspaceFolder}/sg-search-service",
      "program": "${workspaceFolder}/sg-search-service/server.js",
      "console": "integratedTerminal",
      "envFile": "${workspaceFolder}/sg-search-service/.env",
      "env": {
        "PORT": "3001"
      },
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Search Frontend (serve)",
      "cwd": "${workspaceFolder}/sg-search",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["serve", "-l", "3000", "-s", "."],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Search Frontend (Chrome)",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/sg-search"
    }
  ],
  "compounds": [
    {
      "name": "Search App (API + Frontend)",
      "configurations": ["Search API", "Search Frontend (serve)"]
    }
  ]
}
```

### Manual folder creation (if starting from empty)

```powershell
New-Item -ItemType Directory -Force -Path sg-search-service, sg-search
```

---

## Step 1: Seed Fixture — `users.csv` (05 min, overlaps Setup)

The workshop repo includes `sg-search-service\users.csv` as a **12-row seed fixture**. The API does **not** read this file at search time — `lib/seed.js` upserts each row into MongoDB Atlas at startup (matched by unique `email`), keeping the fixture in sync without a separate seed command.

**Why review it?** Knowing the column shape prevents confusion when auto-seed fails or verification counts look wrong.

**Columns (required):**

| Column | Purpose |
|--------|---------|
| `firstName` | Given name; matched case-insensitively by `/api/search` |
| `lastName` | Family name; same matching rules |
| `email` | Unique key for idempotent auto-seed upsert |
| `department` | Org unit for display in the results table |
| `city` | Location for display in the results table |

**Rows:** 12 data rows (header + 12 = 13 lines total). The fixture includes duplicate first and last names (e.g. three `John` rows, two `Smith` rows) so the verification matrix in Step 4 is meaningful.

Open `sg-search-service\users.csv` in your editor and confirm it matches the workshop fixture. If the file is missing or corrupted, restore it from the repo — do not recreate it as your primary backend task.

**Optional sanity check** — confirm row count (expect **12** users):

```powershell
(Import-Csv sg-search-service\users.csv).Count
```

> **Tip:** If auto-seed fails with a missing-column error, re-save as UTF-8 CSV or restore the fixture from the repo.

---

## Step 2: Backend — `sg-search-service` (05–15)

The backend is already implemented in the workshop repo. Your job in this phase is **configuration and awareness** — not building CSV parsing in `server.js`.

### 2.1 Configure environment (`.env`)

```powershell
cd sg-search-service
Copy-Item .env.example .env
```

Open `.env` and paste the facilitator-provided Atlas connection string:

```
MONGODB_URI=mongodb+srv://...
```

Quote the value if it contains `#` or `=` characters (see comments in `.env.example`). Never commit `.env` to Git.

### 2.2 Understand the User model

Open `models/User.js` and note:

| Field | Role |
|-------|------|
| `firstName`, `lastName`, `email`, `department`, `city` | Required, trimmed strings |
| `email` | Unique — enables idempotent auto-seed upsert |
| Collection | `users` |

Search queries this model via Mongoose; API responses return the five fields only (no `_id` or `__v`). See `sg-search-service/README.md` for the full API matrix and troubleshooting depth.

### 2.3 Install dependencies and start the API

```powershell
npm install   # if not already done via setup-lab.ps1
npm start
```

**Terminal 1** — keep this running for the rest of the lab.

**Startup sequence** (before HTTP listens):

1. Load `.env` via `dotenv`
2. Validate `MONGODB_URI` (fail-fast if missing)
3. Connect to MongoDB Atlas (`lib/db.js`)
4. Sync indexes on the `User` model (warn-only on failure — `Index sync warning:` is non-fatal; startup continues)
5. Upsert fixture rows from `users.csv` into the `users` collection (`lib/seed.js`)
6. Bind port and listen

Expected output:

```
Connected to MongoDB — 12 users in users collection
sg-search-service listening on http://localhost:3001
```

If startup fails, the process logs `Startup failed:` and exits — fix `.env`, Atlas connectivity, or the seed fixture before continuing.

### 2.4 Backend smoke test (PowerShell)

Leave the server running; open a **second** PowerShell window:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3001/health"
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/search?firstName=John&lastName=Smith"
```

You should see `status: ok` and `count: 1` for John Smith. Counts match the verification matrix in Step 4 — same API contract as before, now backed by MongoDB.

---

## Step 3: Frontend — `sg-search` (15–25)

### 3.1 `package.json`

Create `sg-search\package.json`:

```json
{
  "name": "sg-search",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "npx serve -l 3000 -s ."
  }
}
```

### 3.2 `index.html`

Create `sg-search\index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Search App Lab</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="page">
    <section class="glass-card">
      <header class="header">
        <h1>Search App Lab</h1>
        <p class="subtitle">Enter a first or last name to search the user directory. Backend runs on port 3001; this UI on port 3000.</p>
      </header>

      <form id="search-form" class="search-form" autocomplete="off">
        <div class="field">
          <label for="firstName">First Name</label>
          <input type="text" id="firstName" name="firstName" placeholder="e.g. John">
        </div>
        <div class="field">
          <label for="lastName">Last Name</label>
          <input type="text" id="lastName" name="lastName" placeholder="e.g. Smith">
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary">Search</button>
          <button type="button" id="clear-btn" class="btn btn-secondary">Clear</button>
        </div>
      </form>

      <p id="status" class="status" role="status" aria-live="polite">Enter a name to begin searching.</p>

      <div id="results-container" class="results-container" hidden>
        <table class="results-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>City</th>
            </tr>
          </thead>
          <tbody id="results-body"></tbody>
        </table>
      </div>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>
```

### 3.3 `styles.css` (glassmorphism)

Create `sg-search\styles.css` — `#f5f5f7` gradient, rgba card, `blur(20px)`, `#0071e3` accent, `max-width: 800px`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 17px;
  line-height: 1.5;
  color: #1d1d1f;
  background: linear-gradient(180deg, #f5f5f7 0%, #ffffff 100%);
}

.page {
  display: flex;
  justify-content: center;
  padding: 48px 24px;
}

.glass-card {
  width: 100%;
  max-width: 800px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

.header {
  margin-bottom: 32px;
}

.header h1 {
  margin: 0 0 8px;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0;
  color: #424245;
}

.search-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-weight: 500;
  font-size: 0.95rem;
}

.field input {
  padding: 12px 14px;
  font-size: 17px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.field input:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.25);
}

.actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  font-size: 17px;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-primary {
  background: #0071e3;
  color: #ffffff;
}

.btn-primary:hover {
  background: #0077ed;
}

.btn-secondary {
  background: transparent;
  color: #1d1d1f;
  border: 1px solid #d2d2d7;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.04);
}

.status {
  margin: 0 0 24px;
  min-height: 1.5em;
  color: #424245;
}

.results-container {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  padding: 12px 8px;
  text-align: left;
}

.results-table thead th {
  font-weight: 600;
  border-bottom: 1px solid #d2d2d7;
}

.results-table tbody tr {
  border-bottom: 1px solid #e8e8ed;
}

.results-table tbody tr:last-child {
  border-bottom: none;
}

@media (max-width: 640px) {
  .search-form {
    grid-template-columns: 1fr;
  }
}
```

### 3.4 `app.js` (fetch, XSS escape, microcopy)

Create `sg-search\app.js` — API base `http://localhost:3001`, messages: *"Enter a name to begin searching."*, *"Searching database..."*, *"Found {n} results."*, error on failure:

```javascript
const API_BASE = 'http://localhost:3001';

const form = document.getElementById('search-form');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const clearBtn = document.getElementById('clear-btn');
const statusEl = document.getElementById('status');
const resultsContainer = document.getElementById('results-container');
const resultsBody = document.getElementById('results-body');

const EMPTY_MESSAGE = 'Enter a name to begin searching.';
const LOADING_MESSAGE = 'Searching database...';
const ERROR_MESSAGE = 'Search failed. Please check the backend connection.';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setStatus(message) {
  statusEl.textContent = message;
}

function clearResults() {
  resultsBody.innerHTML = '';
  resultsContainer.hidden = true;
}

function resetUi() {
  firstNameInput.value = '';
  lastNameInput.value = '';
  setStatus(EMPTY_MESSAGE);
  clearResults();
}

function renderResults(results) {
  resultsBody.innerHTML = '';

  if (results.length === 0) {
    resultsContainer.hidden = true;
    return;
  }

  for (const user of results) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(user.firstName)}</td>
      <td>${escapeHtml(user.lastName)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.department)}</td>
      <td>${escapeHtml(user.city)}</td>
    `;
    resultsBody.appendChild(row);
  }

  resultsContainer.hidden = false;
}

async function runSearch() {
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();

  if (!firstName && !lastName) {
    setStatus('Enter at least a first or last name.');
    clearResults();
    return;
  }

  const params = new URLSearchParams();
  if (firstName) params.set('firstName', firstName);
  if (lastName) params.set('lastName', lastName);

  setStatus(LOADING_MESSAGE);

  try {
    const response = await fetch(`${API_BASE}/api/search?${params.toString()}`);

    if (!response.ok) {
      setStatus(ERROR_MESSAGE);
      clearResults();
      return;
    }

    const data = await response.json();
    setStatus(`Found ${data.count} results.`);
    renderResults(data.results);
  } catch {
    setStatus(ERROR_MESSAGE);
    clearResults();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  runSearch();
});

[firstNameInput, lastNameInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runSearch();
    }
  });
});

clearBtn.addEventListener('click', resetUi);
```

### 3.5 Start the UI

**Terminal 2** (keep Terminal 1 API running):

```powershell
cd sg-search
npm start
```

Open **http://127.0.0.1:3000** in your browser. Search **John** + **Smith** — status should read **Found 1 results.** with one table row.

> **Do not** open `index.html` via `file://`. Browsers block cross-origin `fetch` to `localhost:3001` from the `file` protocol. Always use `npm start` (`npx serve`).

---

## Step 4: Verification (25–28)

**Prerequisite:** Backend must complete MongoDB connect and auto-seed before running verification. Confirm you see `Connected to MongoDB — 12 users in users collection` in Terminal 1.

### Automated: `verify-lab.ps1`

With the backend running on port 3001, from the repo root:

```powershell
.\verify-lab.ps1
```

The script exercises health, two search cases, and HTTP 400 with no params. All API checks should **PASS**. (Browser CORS is validated when the frontend runs on port 3000 — not inside this script.)

### Verification matrix (API contract)

These counts are fixed by the 12-user seed fixture (loaded into MongoDB at startup). Use them to validate your implementation.

| Query | Expected `count` | Notes |
|-------|------------------|--------|
| `firstName=John` **and** `lastName=Smith` | **1** | John Smith only |
| `firstName=John` | **3** | Smith, Doe, Williams |
| `lastName=Smith` | **2** | John Smith, Jane Smith |
| `firstName=john` | **3** | Case-insensitive (same as `John`) |
| `firstName=Nobody` | **0** | Valid 200 with empty `results` |
| *(no params)* | **HTTP 400** | Body: `At least one of firstName or lastName is required` |

**PowerShell one-liners:**

```powershell
# John + Smith → 1
(Invoke-RestMethod "http://127.0.0.1:3001/api/search?firstName=John&lastName=Smith").count

# John → 3
(Invoke-RestMethod "http://127.0.0.1:3001/api/search?firstName=John").count

# Smith → 2
(Invoke-RestMethod "http://127.0.0.1:3001/api/search?lastName=Smith").count

# john (lowercase) → 3
(Invoke-RestMethod "http://127.0.0.1:3001/api/search?firstName=john").count

# Nobody → 0
(Invoke-RestMethod "http://127.0.0.1:3001/api/search?firstName=Nobody").count

# No params → 400
try { Invoke-WebRequest "http://127.0.0.1:3001/api/search" -UseBasicParsing } catch { $_.Exception.Response.StatusCode.value__ }
```

### Manual UI checklist

- [ ] Initial status: **Enter a name to begin searching.**
- [ ] Submit shows **Searching database...** briefly
- [ ] Successful search: **Found {n} results.**
- [ ] Backend stopped: **Search failed. Please check the backend connection.**
- [ ] Clear resets form and empty state message

---

## Step 5: GitHub Commit (25–30)

Commit lab deliverables from the repository root. Skip `git init` if this folder is already a Git repository.

```powershell
# From repository root (folder containing setup-lab.ps1)
git status

# First-time setup only:
# git init
# git branch -M main

git add .gitignore sg-search-service sg-search setup-lab.ps1 verify-lab.ps1 LAB-03-Search-App-Guide.md .vscode
git status
git commit -m "feat: complete LAB-03 Search App (API + glass UI)"
```

> **Scope note:** Step 5 covers the facilitator Git workflow (Story 3.5). The guide keeps commit steps here so learners finish in one document; scripts and VS Code configs are included in the commit above.

### Push to GitHub with `gh` (recommended)

```powershell
gh repo create sg-search-workshop --private --source=. --remote=origin --push
```

Adjust visibility (`--public`) and repo name as your org requires.

### Manual remote fallback (no `gh`)

Create an empty repository on GitHub, then:

```powershell
git remote add origin https://github.com/YOUR_ORG/sg-search-workshop.git
git branch -M main
git push -u origin main
```

If the remote already exists, use `git remote set-url origin <url>` instead of `add`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Startup failed: MONGODB_URI is required` | Missing or empty `.env` | Copy `.env.example` → `.env`, paste facilitator URI |
| `Startup failed:` + connection error | Invalid URI or Atlas unreachable | Verify URI; ask facilitator about IP allowlist / VPN |
| `Startup failed:` + seed/CSV error | Missing or malformed `users.csv` | Restore fixture from repo; check column headers |
| Search `count` mismatch | Auto-seed didn't run or wrong fixture | Restart `npm start`; confirm `Connected to MongoDB — 12 users in users collection` in logs |
| VS Code Search API debug exits immediately | Debug env lacks `MONGODB_URI` | Ensure `sg-search-service/.env` exists or use `envFile` in launch config |
| Browser: *failed to fetch* / CORS error | API missing CORS middleware | Ensure `app.use(cors())` appears **before** routes in `server.js` |
| `EADDRINUSE` on 3001 | Port in use | `$env:PORT=3002; npm start` in `sg-search-service`; update `API_BASE` in `app.js` to match |
| UI works from disk but not search | Opened via `file://` | Run `cd sg-search; npm start` and use **http://127.0.0.1:3000** |
| `verify-lab.ps1` all FAIL | Backend not running | Start `npm start` in `sg-search-service` first (MongoDB must be connected) |
| `Invoke-WebRequest` 400 test fails | Using wrong host | Prefer `127.0.0.1:3001` consistently with the lab scripts |

---

## What you accomplished

- MongoDB Atlas-backed user store with Mongoose `User` model and auto-seed from CSV fixture  
- REST search API with health check and input guards (unchanged contract)  
- Accessible, XSS-safe frontend with glassmorphism styling  
- Scripted setup and verification for repeatable workshops  
- Optional VS Code compound debug and GitHub-ready commit  

**Next:** Extend with partial match, pagination, or additional filters—the API and frontend boundaries you built here stay the same.

---

*LAB-03 · Search App Workshop · Safe-Guard Products POC*
