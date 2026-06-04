# LAB-03: Search App — Hands-On Guide

**Duration:** 30 minutes  
**Audience:** Senior developers and architects building a minimal full-stack search experience  
**Stack:** Node.js + Express (CSV-backed API) · Vanilla HTML/CSS/JS (glassmorphism UI)

You will stand up a read-only user directory search: mock data in CSV, a REST API on port **3001**, and a static frontend on port **3000**. By the end you will have verified search behavior, committed your work, and optionally pushed to GitHub.

---

## Lab Timeline (PRD)

| Minutes | Phase | Goal |
|---------|-------|------|
| **00–05** | Setup | Repo layout, Node check, `setup-lab.ps1`, optional VS Code debug |
| **05–15** | Backend | `users.csv`, `package.json`, `server.js`, smoke test API |
| **15–25** | Frontend | `index.html`, `styles.css`, `app.js`, browser search |
| **25–30** | Wrap-up + Git | `verify-lab.ps1`, manual checks, `git init` / commit / GitHub |

Stay on pace—each section is sized for the block above. If you finish early, run the verification matrix twice; repetition catches port and CORS mistakes fast.

---

## Overview & Prerequisites

### What you are building

```
┌─────────────────┐     fetch (CORS)      ┌──────────────────────┐
│  sg-search/     │ ────────────────────► │  sg-search-service/  │
│  port 3000      │   GET /api/search     │  port 3001           │
│  (npx serve)    │                       │  reads users.csv     │
└─────────────────┘                       └──────────────────────┘
```

- **Backend** (`sg-search-service/`): Loads `users.csv` at startup, exposes `GET /health` and `GET /api/search?firstName=&lastName=` with case-insensitive exact match.
- **Frontend** (`sg-search/`): Form-driven search, XSS-safe rendering, status microcopy aligned with the PRD.

### Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Windows** with **PowerShell** | All commands below assume PowerShell from the workshop repo root |
| **Node.js 18+** | `node -v` should show v18 or higher |
| **npm** | Bundled with Node |
| **Git** | For the final commit step |
| **GitHub CLI (`gh`)** | Optional; manual `git remote` fallback provided |
| **VS Code** | Optional; use `.vscode/launch.json` for one-click debug |

### Repository layout (after lab)

```
sg-search-workshop/
├── setup-lab.ps1          # Installs backend deps, checks users.csv
├── verify-lab.ps1         # API smoke tests (run with backend up)
├── .vscode/launch.json    # Debug API, frontend, or compound
├── sg-search-service/
│   ├── package.json
│   ├── server.js
│   └── users.csv
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

`setup-lab.ps1` verifies Node.js, runs `npm install` in `sg-search-service`, confirms `users.csv` exists, and prints the two-terminal run instructions. The frontend uses `npx serve` and does not require a separate `npm install`.

### Debugging with VS Code

Open the workshop folder in VS Code or Cursor. Press **Ctrl+Shift+D** to open **Run and Debug**, pick a configuration from the dropdown, and press **F5**.

**Prerequisites:** Node.js 18+ on your PATH. No extra extensions required — the built-in JavaScript debugger handles Node and Chrome.

| Configuration | Purpose | Port |
|---------------|---------|------|
| **Search API** | Debug `sg-search-service/server.js` (CSV load, `/api/search`, CORS) | 3001 |
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

## Step 1: Mock Data — `users.csv` (05 min, overlaps Setup)

Create the backend data file manually so you understand the shape of each record before the API loads it. Path: `sg-search-service\users.csv`.

**Why manual?** The search API reads plain CSV at startup — no database, no ORM. Knowing the columns now prevents typos (`firstName` vs `FirstName`) that break parsing later.

**Columns (required):**

| Column | Purpose |
|--------|---------|
| `firstName` | Given name; matched case-insensitively by `/api/search` |
| `lastName` | Family name; same matching rules |
| `email` | Contact field returned in results (not searchable in this lab) |
| `department` | Org unit for display in the results table |
| `city` | Location for display in the results table |

**Rows:** 12 data rows (header + 12 = 13 lines total). Include duplicate first and last names (e.g. three `John` rows, two `Smith` rows) so the verification matrix in Step 4 is meaningful.

Copy the sample below into `sg-search-service\users.csv`, or paste via PowerShell:

```powershell
@'
firstName,lastName,email,department,city
John,Smith,john.smith@example.com,Engineering,Seattle
John,Doe,john.doe@example.com,Marketing,Portland
John,Williams,john.williams@example.com,Sales,Denver
Jane,Smith,jane.smith@example.com,HR,Seattle
Alice,Johnson,alice.johnson@example.com,Engineering,Austin
Bob,Johnson,bob.johnson@example.com,Finance,Chicago
Carol,Davis,carol.davis@example.com,Marketing,Portland
David,Miller,david.miller@example.com,Sales,Denver
Emma,Wilson,emma.wilson@example.com,HR,Seattle
Frank,Brown,frank.brown@example.com,Engineering,Austin
Grace,Taylor,grace.taylor@example.com,Finance,Chicago
Henry,Anderson,henry.anderson@example.com,Operations,Boston
'@ | Set-Content -Encoding utf8 sg-search-service\users.csv
```

> **Tip:** If startup fails with a missing-column error after exporting from Excel, re-save as UTF-8 CSV or recreate the file from the block above.

Confirm row count (expect **12** users):

```powershell
(Import-Csv sg-search-service\users.csv).Count
```

---

## Step 2: Backend — `sg-search-service` (05–15)

### 2.1 `package.json`

Create `sg-search-service\package.json`:

```json
{
  "name": "sg-search-service",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "cors": "^2.8.6",
    "csv-parse": "^5.6.0",
    "express": "^4.21.0"
  }
}
```

Install dependencies:

```powershell
cd sg-search-service
npm install
cd ..
```

### 2.2 `server.js`

Create `sg-search-service\server.js` (Express + CORS + csv-parse + health + search):

```javascript
const express = require('express');
const cors = require('cors');
const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('csv-parse/sync');

const REQUIRED = ['firstName', 'lastName', 'email', 'department', 'city'];
const CSV_PATH = join(__dirname, 'users.csv');

function loadUsers() {
  let raw;
  try {
    raw = readFileSync(CSV_PATH, 'utf8');
  } catch (err) {
    throw new Error(`users.csv not found at ${CSV_PATH}: ${err.message}`);
  }

  let records;
  try {
    records = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false,
    });
  } catch (err) {
    throw new Error(`users.csv parse error: ${err.message}`);
  }

  if (records.length === 0) {
    throw new Error('users.csv has no data rows (header only or empty file)');
  }

  const headers = Object.keys(records[0]);
  for (const col of REQUIRED) {
    if (!headers.includes(col)) {
      throw new Error(
        `users.csv missing required column "${col}". Found: ${headers.join(', ')}`
      );
    }
  }

  return records;
}

function queryValue(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function filterUsers(allUsers, firstName, lastName) {
  const fn = queryValue(firstName);
  const ln = queryValue(lastName);

  if (fn === null && ln === null) {
    return null;
  }

  return allUsers.filter((user) => {
    if (fn !== null && user.firstName.toLowerCase() !== fn.toLowerCase()) {
      return false;
    }
    if (ln !== null && user.lastName.toLowerCase() !== ln.toLowerCase()) {
      return false;
    }
    return true;
  });
}

let users = [];

try {
  users = loadUsers();
  console.log(`Loaded ${users.length} users from users.csv`);
} catch (err) {
  console.error(`Startup failed: ${err.message}`);
  process.exit(1);
}

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.type('text').send('sg-search-service is running.');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/search', (req, res) => {
  const results = filterUsers(users, req.query.firstName, req.query.lastName);

  if (results === null) {
    return res.status(400).json({
      error: 'At least one of firstName or lastName is required',
    });
  }

  res.json({ count: results.length, results });
});

app.listen(PORT, () => {
  console.log(`sg-search-service listening on http://localhost:${PORT}`);
});
```

### 2.3 Start the API

**Terminal 1:**

```powershell
cd sg-search-service
npm start
```

Expect: `Loaded 12 users from users.csv` and `listening on http://localhost:3001`.

### 2.4 Backend smoke test (PowerShell)

Leave the server running; open a **second** PowerShell window:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3001/health"
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/search?firstName=John&lastName=Smith"
```

You should see `status: ok` and `count: 1` for John Smith.

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

### Automated: `verify-lab.ps1`

With the backend running on port 3001, from the repo root:

```powershell
.\verify-lab.ps1
```

The script exercises health, search cases, HTTP 400 with no params, and a CORS header check. All steps should **PASS**.

### Verification matrix (API contract)

These counts are fixed by the lab `users.csv`. Use them to validate your implementation.

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
| Browser: *failed to fetch* / CORS error | API missing CORS middleware | Ensure `app.use(cors())` appears **before** routes in `server.js` |
| `EADDRINUSE` on 3001 | Port in use | `$env:PORT=3002; npm start` in `sg-search-service`; update `API_BASE` in `app.js` to match |
| UI works from disk but not search | Opened via `file://` | Run `cd sg-search; npm start` and use **http://127.0.0.1:3000** |
| `verify-lab.ps1` all FAIL | Backend not running | Start `npm start` in `sg-search-service` first |
| `Loaded 0 users` / startup error | Bad or missing CSV | Recreate `users.csv` from Step 1; check column names exactly |
| `count` mismatch | Wrong CSV rows | Match the 12-row sample exactly (verification matrix is data-dependent) |
| `Invoke-WebRequest` 400 test fails | Using wrong host | Prefer `127.0.0.1:3001` consistently with the lab scripts |

---

## What you accomplished

- CSV-backed user store with startup validation  
- REST search API with health check and input guards  
- Accessible, XSS-safe frontend with glassmorphism styling  
- Scripted setup and verification for repeatable workshops  
- Optional VS Code compound debug and GitHub-ready commit  

**Next:** Extend with partial match, pagination, or swap CSV for a real database—the boundaries you built here stay the same.

---

*LAB-03 · Search App Workshop · Safe-Guard Products POC*
