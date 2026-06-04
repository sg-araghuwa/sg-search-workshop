---
baseline_commit: NO_VCS
---

# Story 1.3: Implement Health Check Endpoint

Status: review

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want a `GET /health` endpoint,
so that I can confirm the API is running before testing search.

## Acceptance Criteria

1. **Given** the server is running  
   **When** a client sends `GET /health`  
   **Then** the response status is **200**

2. **And** the JSON body includes `status: "ok"` (FR3)

## Tasks / Subtasks

- [x] Add `GET /health` route in `server.js` (AC: #1, #2)
  - [x] Return HTTP 200 with JSON `{ "status": "ok" }` (exact key `status`, exact string value `ok`)
  - [x] Use `res.json()` or `res.status(200).json()` — no HTML, no plain text
  - [x] Register route after `const app = express()` and before `app.listen`
- [x] Preserve Story 1.1–1.2 behavior (regression guard)
  - [x] CSV still loads at startup before listen; success log unchanged
  - [x] `GET /` smoke route still works
  - [x] No CORS, no `/api/search`, no auth
- [x] Update `README.md` with Story 1.3 scope and manual test command (AC: #1)
- [x] Manual verify with PowerShell/curl (see Testing Requirements)

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` describes a **superseded Task Manager** (React, Zustand, localStorage). **Do not follow it.** Epics explicitly exclude it.

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Story 1.3, FR3) |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | FR-2 Health Check |
| `1-2-load-and-parse-csv-user-data.md` | Current `server.js` baseline |
| `1-1-initialize-express-search-service.md` | Port, layout, Express 4.x conventions |

### Current Codebase State (READ BEFORE EDITING)

**`server.js` today** — CSV loaded at startup; only `GET /` exists:

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

**What this story changes:** Add `GET /health` returning JSON `{ status: 'ok' }` with HTTP 200.

**What must be preserved:**

- Startup order: `loadUsers()` → assign `users` → `app.listen` only after CSV success
- Module-level `users` array (Story 1.4 will filter it)
- Port `process.env.PORT || 3001`
- `GET /` text smoke route
- No `cors`, no search logic, no extra middleware

### Required Implementation

Add immediately after the existing `GET /` route (order between `/` and `/health` does not matter):

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

**Contract (strict — Epic 3 `verify-lab.ps1` will depend on this):**

| Field | Value |
|-------|-------|
| Method | `GET` |
| Path | `/health` (leading slash, no `/api` prefix) |
| Status | `200` |
| `Content-Type` | `application/json` (Express `res.json` sets this) |
| Body | `{ "status": "ok" }` |

**Do not:**

- Return `{ status: 'OK' }`, `{ healthy: true }`, or plain text `"ok"`
- Add `users.length`, CSV path, or uptime to the payload (NFR3 complexity guard)
- Gate health on CSV content beyond existing startup fail-fast (if server listens, health is OK)
- Add `express.json()` or body parsers for this GET-only route

### CORS Note (Story 1.5 — Not This Story)

Browser `fetch` from `http://localhost:3000` to `/health` may fail with a CORS error until Story 1.5 adds `app.use(cors())`. **That is expected.** Validate this story with **same-origin tools** (curl, `Invoke-WebRequest`, browser address bar on port 3001).

### Architecture Compliance (Search App)

| Decision | Value |
|----------|-------|
| Runtime | Node.js 18+ |
| Framework | Express 4.x (existing) |
| Auth | None (NFR7) |
| Port | 3001 default (NFR5) |
| Health scope | Liveness only — server process up |
| Complexity | Single route handler; no new dependencies |

### Library / Framework Requirements

| Package | Story 1.3 | Notes |
|---------|-----------|-------|
| `express` | Keep ^4.21.x | `res.json()` built-in |
| `csv-parse` | Keep (from 1.2) | Unchanged |
| `cors` | **Do not add** | Story 1.5 |

### File Structure Requirements

```text
sg-search-service/
├── server.js         # UPDATE — add GET /health
└── README.md         # UPDATE — document /health and test command
```

- No new files required
- Do not move routes to a separate `routes/` folder (lab flat layout)

### Testing Requirements (Manual)

**Prerequisites:** Valid `users.csv` present; `npm start` succeeds with `Loaded 12 users from users.csv`.

```powershell
cd sg-search-service
npm install
npm start
```

In a second PowerShell window:

```powershell
# Option A — curl (if available)
curl -s -w "\nHTTP %{http_code}\n" http://127.0.0.1:3001/health

# Option B — Invoke-WebRequest
$r = Invoke-WebRequest -Uri http://127.0.0.1:3001/health -UseBasicParsing
$r.StatusCode   # expect 200
$r.Content       # expect {"status":"ok"} (whitespace may vary)
```

**Pass criteria:**

| Check | Expected |
|-------|----------|
| HTTP status | `200` |
| JSON `status` field | `"ok"` (lowercase) |
| `GET /` regression | Still returns scaffold text |
| Startup log | Still shows loaded user count |

**Negative / out-of-scope for 1.3:**

- Do not test browser CORS from port 3000 (Story 1.5)
- Do not test `/api/search` (Story 1.4)

### Previous Story Intelligence

**From Story 1.1:**

| Learning | Action for 1.3 |
|----------|----------------|
| Flat `sg-search-service/`, CommonJS | Keep `require`, single `server.js` |
| Port 3001 / `PORT` env | Unchanged |
| Deferred: `app.listen` error callback | Still optional |

**From Story 1.2:**

| Learning | Action for 1.3 |
|----------|----------------|
| `users` loaded before `app.listen` | Health does not need to read `users`; server up implies CSV already valid |
| `csv-parse/sync` + fail-fast | Do not reorder startup block |
| `Startup failed:` console prefix | Unchanged for CSV errors |
| 12 users, John/Smith test matrix | Do not modify `users.csv` for health |
| Deferred: UTF-8 BOM strip | Unchanged; not health-related |

### Latest Technical Information

- **Express 4.x** `res.status(200).json(obj)` sets status and serializes JSON; default status for `res.json()` is already 200 — explicit `status(200)` is fine for clarity.
- **Express 5** exists with breaking changes; project stays on **4.x** per Stories 1.1–1.2.
- **Health check pattern:** Liveness endpoint only; no dependency probes required for lab scope.

### Out of Scope (Do Not Implement)

- `GET /api/search` and filter logic (Story 1.4)
- `app.use(cors())` (Story 1.5)
- Authentication, rate limiting, or request logging middleware
- Health sub-routes (`/health/live`, `/health/ready`)
- Automated test files (Epic 3 `verify-lab.ps1` consumes this endpoint later)

### Anti-Patterns (Will Fail Review)

- Implementing search or CORS in this story
- Returning non-JSON or wrong `status` value/casing
- Removing or breaking CSV startup load
- Adding user count or CSV diagnostics to health JSON without AC
- Placing health under `/api/health` (wrong path for FR3 / verify script)
- Following `architecture.md` React/task-manager structure

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.3, FR3]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md — §3.1 FR-2]
- [Source: _bmad-output/implementation-artifacts/1-2-load-and-parse-csv-user-data.md — server baseline]
- [Source: sg-search-service/server.js — file to update]
- [Source: Express 4 API — res.json](https://expressjs.com/en/4x/api.html#res.json)

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Restored `server.js` to Story 1.3 scope after workspace contained premature Story 1.4/1.5 routes (CORS, `/api/search`); story requires health-only delta on 1.2 baseline.

### Implementation Plan

- Add `GET /health` with `res.status(200).json({ status: 'ok' })` after `GET /`.
- Document endpoint and PowerShell/curl test commands in README.
- Manual regression: startup log, `/health` JSON, `/` smoke route.

### Completion Notes List

- Implemented `GET /health` returning HTTP 200 and `{ "status": "ok" }` per FR3 / verify-lab contract.
- Preserved CSV fail-fast startup, module-level `users`, port 3001, and `GET /` text route; no CORS or search routes.
- README updated with Story 1.3 scope and manual test commands.
- Manual verification (2026-06-04): `Loaded 12 users from users.csv`; `Invoke-WebRequest /health` → 200 `{"status":"ok"}`; `GET /` → 200 scaffold text.

### File List

- sg-search-service/server.js (modified)
- sg-search-service/README.md (modified)

### Change Log

- 2026-06-04: Story 1.3 — added `GET /health` liveness endpoint and README documentation.

## Story Completion Status

- **Status:** review
- **Completion note:** Implementation complete; ready for code review.
- **Next story after done:** `1-4-implement-search-api-with-filtering-rules`
