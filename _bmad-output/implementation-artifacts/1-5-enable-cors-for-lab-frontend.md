---
baseline_commit: NO_VCS
---

# Story 1.5: Enable CORS for Lab Frontend

Status: review

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want CORS configured for the frontend origin,
so that browser fetch calls from port 3000 succeed during the lab.

## Acceptance Criteria

1. **Given** the Express app is running on port 3001  
   **When** a browser on `http://localhost:3000` calls `/api/search` or `/health`  
   **Then** the response includes appropriate CORS headers and the request succeeds (FR4)

2. **And** `cors` middleware is applied in `server.js` (troubleshooting requirement)

3. **And** the service remains localhost-only with no cloud deployment (NFR10)

## Tasks / Subtasks

- [x] Add `cors` dependency to `sg-search-service` (AC: #2)
  - [x] `npm install cors` and record `^2.8.x` (or current 2.x) in `package.json`
  - [x] No other new middleware or frameworks (NFR3)
- [x] Wire CORS in `server.js` before route handlers (AC: #1, #2)
  - [x] `const cors = require('cors');`
  - [x] `app.use(cors());` immediately after `const app = express()` (matches PRD troubleshooting table)
  - [x] Do not remove or reorder CSV startup load / `users` array logic from Story 1.2
- [x] Verify CORS headers with Origin `http://localhost:3000` (AC: #1)
  - [x] Test against existing `GET /` until Stories 1.3–1.4 land; retest `/health` and `/api/search` when those routes exist
  - [x] Confirm `Access-Control-Allow-Origin` is present on successful responses
- [x] Update `README.md` scope for Story 1.5 (AC: #2, NFR10)
  - [x] Document `app.use(cors())` and that frontend must be served on port 3000 over HTTP (not `file://`)

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` describes a **superseded Task Manager** (React, Zustand, localStorage). **Do not follow it.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Story 1.5 AC, FR4) |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | FR-3 CORS, troubleshooting `app.use(cors())` |
| `1-2-load-and-parse-csv-user-data.md` | Current `server.js` baseline and “do not add cors yet” |
| `idea.md` | Port 3000/3001, `npx serve`, CORS troubleshooting |

### Sprint Context (User-Selected Story 1.5)

Stories **1-3** (`/health`) and **1-4** (`/api/search`) may still be **backlog** when this story runs. That is OK:

- CORS is **global middleware** — it applies to all current and future routes.
- Validate now with `GET /` + `Origin: http://localhost:3000`.
- After 1.3/1.4 ship, re-run the same Origin tests on `/health` and `/api/search` (no CORS code change expected if middleware is already global).

### Current Codebase State (READ BEFORE EDITING)

**`server.js` today** — CSV loaded at startup; smoke route only; **no CORS, no `/health`, no `/api/search`:**

```55:64:sg-search-service/server.js
const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.type('text').send('sg-search-service is running. API routes coming in later stories.');
});

app.listen(PORT, () => {
  console.log(`sg-search-service listening on http://localhost:${PORT}`);
});
```

**`package.json` today** — `express`, `csv-parse` only; **no `cors`:**

```12:15:sg-search-service/package.json
  "dependencies": {
    "csv-parse": "^5.6.0",
    "express": "^4.21.0"
  }
```

**What this story changes:** Add `cors` package + `app.use(cors())` in `server.js`; update README.  
**What must be preserved:** Startup CSV load + fail-fast, `users` array, port 3001 default, `GET /`, CommonJS, flat layout, no auth (NFR7).

### Recommended Implementation

**Middleware order (mandatory):**

1. `const app = express();`
2. `app.use(cors());` — **before** any `app.get(...)` routes
3. Existing routes (`/`, later `/health`, `/api/search`)
4. `app.listen(...)` unchanged

```javascript
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
// ... routes unchanged ...
```

**Why `app.use(cors())` without options?**

- PRD §2.2 troubleshooting explicitly says: *Ensure `app.use(cors())` is in `server.js`.*
- Epics additional requirements repeat the same fix for lab facilitators.
- Default `cors()` sets `Access-Control-Allow-Origin: *` and handles OPTIONS preflight — sufficient for localhost lab (NFR10, NFR7).

**Optional stricter origin (not required if using default):**

```javascript
app.use(cors({ origin: 'http://localhost:3000' }));
```

Use only if facilitators want origin pinning; **do not** block `curl` without Origin (lab scripts may omit Origin). Default `cors()` is the documented lab fix.

### Architecture Compliance (Search App)

| Decision | Value |
|----------|-------|
| Frontend origin | `http://localhost:3000` (NFR5) |
| Backend port | 3001 default (`process.env.PORT \|\| 3001`) |
| Auth | None — do not add credentials/CORS auth complexity (NFR7) |
| Deployment | Localhost only — no CDN, no cloud CORS config (NFR10) |
| Complexity | One dependency, one `app.use` line (NFR3) |

### Library / Framework Requirements

| Package | Story 1.5 | Notes |
|---------|-----------|-------|
| `cors` | **Add** `^2.8.5` (2.x) | Official Express middleware ([expressjs.com/resources/middleware/cors.html](https://expressjs.com/en/resources/middleware/cors.html)) |
| `express` | Keep ^4.21.x | No version bump required |
| `csv-parse` | Keep ^5.6.x | Unchanged |
| UI frameworks / auth | **Do not add** | NFR9 (frontend), NFR7 |

### File Structure Requirements

```text
sg-search-service/
├── package.json      # UPDATE — add cors dependency
├── package-lock.json # UPDATE — npm install
├── server.js         # UPDATE — require cors + app.use(cors())
└── README.md         # UPDATE — Story 1.5 scope + CORS note
```

- Do not split into `middleware/cors.js` unless team standard requires it (violates NFR3 for this lab).
- Do not configure CORS only on individual routes unless global middleware fails review.

### Testing Requirements (Manual — PowerShell)

**Install and start:**

```powershell
cd sg-search-service
npm install
npm start
```

**CORS header check (works before Stories 1.3–1.4):**

```powershell
curl.exe -H "Origin: http://localhost:3000" -i http://127.0.0.1:3001/
```

Expect response headers including `Access-Control-Allow-Origin` (value `*` with default `cors()`).

**Preflight (optional sanity):**

```powershell
curl.exe -X OPTIONS -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -i http://127.0.0.1:3001/
```

Expect `204` or `200` with CORS allow headers (handled by `cors` package).

**After Stories 1.3–1.4 (regression):**

```powershell
curl.exe -H "Origin: http://localhost:3000" -i http://127.0.0.1:3001/health
curl.exe -H "Origin: http://localhost:3000" -i "http://127.0.0.1:3001/api/search?firstName=john"
```

**End-to-end (Epic 2 prep):** With backend on 3001 and frontend served via `npx serve -l 3000` in `sg-search` (future), browser DevTools Network tab must show successful cross-origin GETs without CORS errors.

**Regression guards:**

| Check | Expected |
|-------|----------|
| `npm start` | Still prints `Loaded 12 users from users.csv` then listening on 3001 |
| Missing `users.csv` | Still exits 1 before listen (Story 1.2) |
| `GET /` without Origin | Still returns 200 smoke text |

### Previous Story Intelligence

**Story 1.2 (done) — build on this baseline:**

| Learning | Action for 1.5 |
|----------|----------------|
| `loadUsers()` before `app.listen` | Do not move CORS setup into listen callback |
| Module-level `users` for 1.4 | Do not touch filter/search logic here |
| Explicit deferral: `app.use(cors())` | **This story** — only scope |
| `csv-parse/sync` + fail-fast | Unchanged |
| CommonJS `require` | `const cors = require('cors');` |
| No git repo | `baseline_commit: NO_VCS` |

**Stories 1.3–1.4 (may be backlog):**

- Do **not** implement `/health` or `/api/search` in this story.
- Place CORS so those routes automatically inherit headers when added later.

**Story 1.1 deferrals (still optional):**

- `app.listen` error callback — not required for 1.5
- PORT validation — unchanged

### Latest Technical Information

- **`cors` v2.8.x** — Install: `npm install cors`. Default options equivalent to `{ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', preflightContinue: false, optionsSuccessStatus: 204 }` per [npm cors](https://www.npmjs.com/package/cors) and [Express CORS middleware docs](https://expressjs.com/en/resources/middleware/cors.html).
- **Browser fetch from Epic 2** — Simple GET requests from `http://localhost:3000` to `http://localhost:3001` trigger CORS; global `app.use(cors())` covers them without per-route config.
- **`file://` frontend** — CORS middleware on the API does **not** fix `file://` fetch failures; frontend must use `npx serve` on port 3000 (document in README, Epic 3 guide).

### Epic 2 Integration Notes (Read-Only for This Story)

| Frontend | Backend | CORS role |
|----------|---------|-----------|
| `sg-search` on port 3000 (HTTP) | `sg-search-service` on 3001 | This story unblocks Story 2.3 `fetch('http://localhost:3001/api/search?...')` |

Microcopy and glassmorphism are Epic 2 — do not create `sg-search` in this story.

### Out of Scope (Do Not Implement)

- `GET /health` (Story 1.3)
- `GET /api/search` filtering (Story 1.4)
- `sg-search` frontend package (Epic 2)
- `setup-lab.ps1` / `verify-lab.ps1` (Epic 3 — verify script will consume CORS later)
- Cloud deployment, API Gateway, or reverse-proxy CORS
- `credentials: true`, cookies, or JWT (NFR7)
- Replacing `cors` with hand-rolled headers (harder to maintain; conflicts with PRD troubleshooting text)

### Anti-Patterns (Will Fail Review)

- Adding CORS **after** route definitions only (misses middleware order convention)
- CORS on a single route but not globally (breaks when 1.3/1.4 add routes)
- Removing or weakening Story 1.2 startup validation to “fix” CORS tests
- Using `origin: false` or omitting middleware while claiming CORS works
- Adding `helmet`, rate limiting, or auth “while we're here” (NFR3)
- Following `architecture.md` React/task-manager stack
- Documenting cloud CORS or production allowlists (NFR10)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.5, FR4]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md — FR-3, §2.2 troubleshooting]
- [Source: _bmad-output/implementation-artifacts/1-2-load-and-parse-csv-user-data.md — deferred CORS, server baseline]
- [Source: sg-search-service/server.js, package.json — files to update]
- [Source: expressjs.com CORS middleware](https://expressjs.com/en/resources/middleware/cors.html)
- [Source: npm cors package](https://www.npmjs.com/package/cors)

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- PowerShell `&&` not supported; used `Set-Location` + `npm install` separately.
- `/health` route already present from Story 1.3 work; CORS verified on `/` and `/health` (not `/api/search` — Story 1.4).

### Implementation Plan

1. `npm install cors@^2.8.5` — added `cors@^2.8.6` to dependencies.
2. `server.js`: `require('cors')` + `app.use(cors())` immediately after `express()` app creation, before routes.
3. README: Story 1.5 scope, port 3000 HTTP requirement, CORS curl examples.
4. Manual verification via `curl.exe` with `Origin: http://localhost:3000`.

### Completion Notes List

- Added `cors` (^2.8.6) and global `app.use(cors())` in `server.js` before all routes; preserved CSV startup and existing routes.
- Verified `Access-Control-Allow-Origin: *` on `GET /` and `GET /health` with lab Origin header; OPTIONS preflight returns 204 with CORS headers.
- Verified `GET /` without Origin still returns 200 smoke text.
- README documents Story 1.5, `app.use(cors())`, localhost-only scope, and `file://` vs HTTP on port 3000.
- `/api/search` not tested (route not implemented); global middleware will apply when Story 1.4 lands.

### File List

- sg-search-service/package.json
- sg-search-service/package-lock.json
- sg-search-service/server.js
- sg-search-service/README.md

### Change Log

- 2026-06-04: Story 1.5 — enable CORS for lab frontend (`cors` package, global middleware, README).

## Story Completion Status

- **Status:** review
- **Completion note:** CORS enabled globally; manual curl verification passed for `/` and `/health`.
- **Depends on:** Story 1.2 (CSV in memory); Stories 1.3–1.4 not required to merge CORS but required for full AC browser tests on `/health` and `/api/search`
- **Unblocks:** Epic 2 Story 2.3 (async fetch from port 3000); Epic 3 `verify-lab.ps1` CORS checks
