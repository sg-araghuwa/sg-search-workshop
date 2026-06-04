---
baseline_commit: NO_VCS
---

# Story 1.4: Implement Search API with Filtering Rules

Status: review

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want a `GET /api/search` endpoint with firstName and lastName query parameters,
so that I can retrieve matching users as JSON for the frontend.

## Acceptance Criteria

1. **Given** the server has loaded user records from CSV  
   **When** a client calls `GET /api/search?firstName=john` (case variants included)  
   **Then** the response is JSON `{ count, results[] }` where each result includes `firstName`, `lastName`, `email`, `department`, `city` (FR1)

2. **And** matching is case-insensitive (FR2)

3. **And** only provided query fields are used for filtering; omitted fields act as wildcards (FR2)

4. **And** when both `firstName` and `lastName` are missing or empty, the API returns HTTP 400 with a clear error message (FR2)

5. **And** `results` contains only matching records and `count` equals `results.length`

## Tasks / Subtasks

- [x] Add `GET /api/search` route in `server.js` (AC: #1, #5)
  - [x] Read `firstName` and `lastName` from `req.query`
  - [x] Return `res.json({ count, results })` with `Content-Type: application/json`
  - [x] Each result object includes all five CSV fields (no extra fields required)
- [x] Implement case-insensitive partial-field filter (AC: #2, #3)
  - [x] Treat absent query keys and empty/whitespace-only values as "not provided" (wildcard)
  - [x] Compare using `.toLowerCase()` on both query value and stored field
  - [x] Filter the module-level `users` array from Story 1.2 (do not re-read CSV per request)
- [x] Validate "at least one parameter" rule (AC: #4)
  - [x] If neither `firstName` nor `lastName` is provided with non-empty trimmed value → `400` + JSON error body
  - [x] Use a clear message, e.g. `{ "error": "At least one of firstName or lastName is required" }`
- [x] Preserve existing behavior (regression guard)
  - [x] Startup CSV load, `GET /`, port 3001 default unchanged
  - [x] Do **not** add CORS, `/health`, or auth in this story
- [x] Update `README.md` with search endpoint examples and expected counts (AC: #1–#5)
- [x] Manual verify with PowerShell `curl` matrix (see Testing Requirements)

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` describes a **superseded Task Manager** (React, Zustand, localStorage). **Do not follow it.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Story 1.4 AC, FR1, FR2) |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | Search endpoint contract §3.1 |
| `idea.md` | Verification matrix (John/Smith row counts) |
| `1-2-load-and-parse-csv-user-data.md` | `users` array, field names, fail-fast startup |
| `1-1-initialize-express-search-service.md` | Scaffold conventions |

### Sprint / Dependency Note

| Story | Status (sprint-status.yaml) | Impact on 1.4 |
|-------|----------------------------|-----------------|
| 1.2 CSV load | done | **Required** — `users` array must exist at startup |
| 1.3 `/health` | backlog | Not required to implement search; Epic 3 `verify-lab.ps1` will need it later |
| 1.5 CORS | backlog | Browser fetch from port 3000 **will fail** until 1.5; test 1.4 with `curl` or Postman |

Implement 1.4 even if 1.3 is still backlog; do not block on health or CORS.

### Current Codebase State (READ BEFORE EDITING)

**`server.js` today** — CSV loaded into `users`; only `GET /` exists:

```45:64:sg-search-service/server.js
let users = [];

try {
  users = loadUsers();
  console.log(`Loaded ${users.length} users from users.csv`);
} catch (err) {
  console.error(`Startup failed: ${err.message}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.type('text').send('sg-search-service is running. API routes coming in later stories.');
});

app.listen(PORT, () => {
  console.log(`sg-search-service listening on http://localhost:${PORT}`);
});
```

**What this story changes:** Add `GET /api/search` with filter logic on `users`.  
**What must be preserved:** `loadUsers()` startup order, fail-fast on bad CSV, `GET /`, port default 3001, CommonJS flat layout.

### API Contract (Binding)

| Item | Specification |
|------|----------------|
| Method / path | `GET /api/search` |
| Query params | `firstName`, `lastName` (optional individually, not both empty) |
| Success status | `200` |
| Success body | `{ "count": number, "results": User[] }` |
| User shape | `{ firstName, lastName, email, department, city }` — keys match CSV exactly |
| Error status | `400` when both params missing/empty |
| Error body | JSON with `error` string (no strict schema beyond clarity) |

**Example success:**

```json
{
  "count": 1,
  "results": [
    {
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com",
      "department": "Engineering",
      "city": "Seattle"
    }
  ]
}
```

### Query Parameter Semantics (FR2 — Prevent Common Bugs)

Express `req.query` behavior ([Express req.query](https://expressjs.com/en/5x/api.html#req.query)):

| Request | `req.query.firstName` | `req.query.lastName` | Filter behavior |
|---------|----------------------|----------------------|-----------------|
| `?firstName=John&lastName=Smith` | `"John"` | `"Smith"` | Both must match (case-insensitive) |
| `?firstName=John` | `"John"` | `undefined` | firstName only; lastName wildcard |
| `?lastName=Smith` | `undefined` | `"Smith"` | lastName only; firstName wildcard |
| `?firstName=john` | `"john"` | `undefined` | Same as `John` (case-insensitive) |
| `/api/search` (no query) | `undefined` | `undefined` | **400** |
| `?firstName=&lastName=` | `""` | `""` | **400** (empty = not provided) |
| `?firstName=%20&lastName=Smith` | `" "` (whitespace) | `"Smith"` | Treat whitespace-only firstName as empty → lastName-only search OK |

**Helper pattern (recommended):**

```javascript
function queryValue(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function filterUsers(allUsers, firstName, lastName) {
  const fn = queryValue(firstName);
  const ln = queryValue(lastName);

  if (fn === null && ln === null) {
    return null; // signal 400 to route handler
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
```

- **Exact match** on provided fields (not substring/contains) — lab data uses full names; `John` matches `John`, not `Johnson` unless you add substring logic (out of scope).
- **`count`** must be `results.length` — do not return a count that disagrees with the array.
- Return **copies** or original objects from `users`; do not strip fields or rename keys.

### Verification Matrix (Must Pass — from `idea.md` + `users.csv`)

Fixture has **12** users. After implementation, these curls must match:

| Query | Expected `count` | Notes |
|-------|------------------|-------|
| `?firstName=John&lastName=Smith` | **1** | Exact pair |
| `?firstName=John` | **3** | John Smith, John Doe, John Williams |
| `?lastName=Smith` | **2** | John Smith, Jane Smith |
| `?firstName=john` | **3** | Case-insensitive duplicate of John-only |
| (no params) | **400** | Not 200 with all users |
| `?firstName=Nobody` | **0** | Valid 200 with `count: 0`, `results: []` |

PowerShell examples (escape `&` for curl.exe):

```powershell
cd sg-search-service
npm start

curl "http://127.0.0.1:3001/api/search?firstName=John&lastName=Smith"
curl "http://127.0.0.1:3001/api/search?firstName=John"
curl "http://127.0.0.1:3001/api/search?lastName=Smith"
curl "http://127.0.0.1:3001/api/search?firstName=john"
curl -i "http://127.0.0.1:3001/api/search"
```

### Architecture Compliance (Search App)

| Decision | Value |
|----------|-------|
| Data source | In-memory `users` from startup CSV load (NFR8) |
| Auth | None (NFR7) |
| CORS | **Story 1.5** — do not add in 1.4 |
| Complexity | Single route + small filter helper; no routers/controllers split required (NFR3) |
| Ports | Backend 3001 (NFR5) |

### Library / Framework Requirements

| Package | Story 1.4 | Notes |
|---------|-----------|-------|
| `express` | Keep ^4.21.x | `req.query` built-in; no `express.urlencoded` needed for GET |
| `csv-parse` | Keep (from 1.2) | No change |
| `cors` | **Do not add** | Story 1.5 |
| Validation libs (Zod, Joi) | **Do not add** | NFR3 |

### File Structure Requirements

```text
sg-search-service/
├── server.js         # UPDATE — add GET /api/search + filter helper
├── package.json      # NO new deps expected
├── users.csv         # NO change
└── README.md         # UPDATE — document /api/search + test matrix
```

- Keep filter logic in `server.js` unless file exceeds ~150 lines — lab prefers minimal files.
- Route path must be **`/api/search`** (Epic 2 Story 2.3 fetches this exact path).

### Testing Requirements (Manual)

**Happy path:**

```powershell
$r = Invoke-RestMethod "http://127.0.0.1:3001/api/search?firstName=John"
$r.count  # expect 3
$r.results.Count  # expect 3
$r.results[0].email  # expect non-empty string
```

**400 path:**

```powershell
try { Invoke-WebRequest "http://127.0.0.1:3001/api/search" } catch { $_.Exception.Response.StatusCode.value__ }
# expect 400
```

**Regression:**

```powershell
curl http://127.0.0.1:3001/
# scaffold text still returned
# console still shows "Loaded 12 users from users.csv"
```

### Previous Story Intelligence

**From 1.2 (done):**

| Learning | Action for 1.4 |
|----------|----------------|
| `users` loaded before `app.listen` | Filter `users` only — never `readFileSync` per request |
| Field keys `firstName`, `lastName`, … | Use exact keys in JSON response |
| 12 rows; 3× John, 2× Smith | Verification matrix above is acceptance test |
| `csv-parse` with `columns: true` | Stored values are strings; `.toLowerCase()` safe |
| Fail-fast startup | Unchanged — search route assumes `users.length > 0` |

**From 1.1 (done):**

| Learning | Action for 1.4 |
|----------|----------------|
| CommonJS `require` | Continue same style |
| `process.env.PORT \|\| 3001` | Unchanged |
| No auth middleware | Unchanged |

**Story 1.3 not implemented:** Frontend/lab scripts may call `/health` later; optional smoke test for 1.4 is only `/api/search`.

### Latest Technical Information

- **Express 4.x** — Query string parsing is automatic on GET; missing keys are `undefined`, not `null` ([Express routing guide](https://expressjs.com/en/guide/routing.html)).
- **JSON responses** — Prefer `res.status(400).json({ error: '...' })` and `res.json({ count, results })` for consistent `Content-Type`.
- **Express 5** — Out of scope; remain on 4.x per Story 1.1 decision.
- **Case folding** — Use `String.prototype.toLowerCase()` for ASCII lab names; Unicode edge cases out of scope.

### Out of Scope (Do Not Implement)

- `GET /health` (Story 1.3)
- `app.use(cors())` (Story 1.5)
- Pagination, sorting, fuzzy/substring search
- POST body search, GraphQL, OpenAPI/swagger
- Reloading or mutating `users.csv` at runtime
- Unit test files (Epic 3)
- Returning all users when no params (explicitly forbidden by FR2)

### Anti-Patterns (Will Fail Review)

- Returning HTTP 200 with all 12 users when no query params are sent
- Case-sensitive comparison (`===` without lowercasing)
- Applying filter on `lastName` when only `firstName` was provided (and vice versa)
- `count` not equal to `results.length`
- Omitting fields from result objects (email, department, city required in each hit)
- Adding CORS or health route "while you're here"
- Re-parsing CSV on each search request
- Substring matching that makes `firstName=Jo` match `Johnson` (changes lab matrix)
- Following `architecture.md` React/task-manager patterns

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.4]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md — §3.1 FR-1]
- [Source: idea.md — Expected test results table]
- [Source: _bmad-output/implementation-artifacts/1-2-load-and-parse-csv-user-data.md]
- [Source: sg-search-service/server.js, users.csv]
- [Source: Express req.query](https://expressjs.com/en/4x/api.html#req.query)

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Filter helpers `queryValue` and `filterUsers` kept inline in `server.js` per story file-structure guidance
- Manual verification on PORT 3099: full idea.md matrix passed (counts 1/3/2/3/0, 400 on empty query, GET `/` regression)

### Implementation Plan

- Added `queryValue` / `filterUsers` before route handlers; `GET /api/search` reads `req.query`, returns 400 when both params absent/empty, else `{ count, results }` from in-memory `users`
- Case-insensitive exact match on provided fields only; omitted/whitespace params are wildcards

### Completion Notes List

- Implemented `GET /api/search` with case-insensitive filtering on `firstName` and `lastName` query params
- HTTP 400 when both params missing or empty/whitespace-only, with clear JSON error message
- `count` always equals `results.length`; each result includes all five CSV fields
- README updated with Story 1.4 scope and verification matrix (curl + PowerShell examples)
- Manual tests passed on port 3099: John+Smith=1, John=3, Smith=2, john=3, Nobody=0, no params=400; GET `/` unchanged

### File List

- sg-search-service/server.js (modified)
- sg-search-service/README.md (modified)

### Change Log

- 2026-06-04: Story 1.4 — `GET /api/search` with case-insensitive filter, 400 validation, README test matrix

## Story Completion Status

- **Status:** review
- **Completion note:** All ACs satisfied; manual verification matrix passed
- **Next story after done:** `1-5-enable-cors-for-lab-frontend` (or complete `1-3-implement-health-check-endpoint` if still backlog)
