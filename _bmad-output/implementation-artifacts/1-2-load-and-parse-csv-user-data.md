---
baseline_commit: NO_VCS
---

# Story 1.2: Load and Parse CSV User Data

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want the service to load `users.csv` into memory at startup,
so that search requests can filter records without a database.

## Acceptance Criteria

1. **Given** a valid `users.csv` exists in the service directory  
   **When** the server starts  
   **Then** all rows are parsed into an in-memory array of user objects

2. **And** parsing uses string-split or `csv-parse` with minimal boilerplate (NFR3)

3. **And** a missing or malformed CSV produces a clear startup error in the console

4. **And** no database or ORM is introduced (NFR8)

## Tasks / Subtasks

- [x] Implement CSV load at startup before `app.listen` (AC: #1)
  - [x] Read `users.csv` from `__dirname` (same folder as `server.js`)
  - [x] Parse header + data rows into objects with keys: `firstName`, `lastName`, `email`, `department`, `city`
  - [x] Store result in a module-level `users` array (or `getUsers()` accessor) for Story 1.4
  - [x] Log success: e.g. `Loaded 12 users from users.csv`
- [x] Fail fast on missing/malformed CSV (AC: #3)
  - [x] Missing file → clear error + `process.exit(1)` (do not listen on port)
  - [x] Wrong/missing headers → clear error + exit
  - [x] Data row with wrong column count → clear error + exit
  - [x] Header-only file (0 data rows) → clear error + exit
- [x] Keep parser minimal (AC: #2, NFR3)
  - [x] Prefer `csv-parse/sync` with `columns: true` **or** simple `split`/`trim` — no ORM, no DB drivers
  - [x] If adding `csv-parse`, single dependency only; no extra middleware
- [x] Preserve Story 1.1 behavior (regression guard)
  - [x] `npm start` still binds port 3001 (or `PORT` env)
  - [x] Existing `GET /` smoke route still works
  - [x] No auth, CORS, `/health`, or `/api/search` yet
- [x] Update `README.md` scope note for Story 1.2 (AC: #1)
- [x] Manual verify in PowerShell (see Testing Requirements)

### Review Findings

- [x] [Review][Defer] `app.listen` lacks error callback (EADDRINUSE, EACCES) [sg-search-service/server.js:62] — deferred, pre-existing from Story 1.1; CSV load succeeds before bind; port conflict still throws unhandled `error` event
- [x] [Review][Defer] UTF-8 BOM not stripped before parse [sg-search-service/server.js:12] — deferred, pre-existing; Excel-exported CSV may fail header check with misleading "missing column" message
- [x] [Review][Defer] README hardcodes "12 users" example [sg-search-service/README.md:25] — deferred, pre-existing pattern; count drifts if `users.csv` row count changes
- [x] [Review][Defer] `loadUsers()` runs at module load (side effects on `require`) [sg-search-service/server.js:46] — deferred, pre-existing; acceptable for lab monolith; extract if Epic 3 adds unit tests

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` describes a **superseded Task Manager** (React, Zustand, localStorage). **Do not follow it.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Story 1.2 AC) |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | CSV-only storage, parsing options |
| `1-1-initialize-express-search-service.md` | Established scaffold and file layout |
| `idea.md` | Verification matrix (John/Smith counts) — data already in `users.csv` |

### Current Codebase State (READ BEFORE EDITING)

**`server.js` today** — Express scaffold only; no file I/O:

```1:12:sg-search-service/server.js
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.type('text').send('sg-search-service is running. API routes coming in later stories.');
});

app.listen(PORT, () => {
  console.log(`sg-search-service listening on http://localhost:${PORT}`);
});
```

**`users.csv` today** — 12 data rows; headers match PRD; no commas inside field values:

```1:13:sg-search-service/users.csv
firstName,lastName,email,department,city
John,Smith,john.smith@example.com,Engineering,Seattle
John,Doe,john.doe@example.com,Marketing,Portland
...
```

**What this story changes:** Add startup CSV load + in-memory `users` array.  
**What must be preserved:** Port 3001 default, `GET /`, CommonJS, flat `sg-search-service/` layout, existing CSV content and headers.

### Target User Object Shape

Each parsed record must be a plain object (not a class instance):

```javascript
{
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
  department: 'Engineering',
  city: 'Seattle'
}
```

- Keys must match CSV headers **exactly** (case-sensitive): `firstName`, `lastName`, `email`, `department`, `city`
- Story 1.4 search will filter this array; do not rename keys

### Recommended Implementation Pattern

**Startup order (mandatory):**

1. `loadUsers()` — sync read + parse (throws or returns error message)
2. On failure: `console.error(...)` then `process.exit(1)`
3. On success: assign to `let users = [...]` and log count
4. `app.listen(...)` — only after users are loaded

**Option A — `csv-parse/sync` (recommended for lab robustness)**

Handles quoted commas later; aligns with PRD §6.1 and `idea.md` (“handle quoted fields if possible”).

```javascript
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

  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: false,
  });

  if (records.length === 0) {
    throw new Error('users.csv has no data rows (header only or empty file)');
  }

  const headers = Object.keys(records[0]);
  for (const col of REQUIRED) {
    if (!headers.includes(col)) {
      throw new Error(`users.csv missing required column "${col}". Found: ${headers.join(', ')}`);
    }
  }

  return records;
}
```

Add to `package.json`:

```json
"csv-parse": "^5.6.0"
```

**Option B — string-split (acceptable, zero new deps)**

Valid for current fixture (no embedded commas). Keep validation explicit:

- Split lines on `\n`, filter empty lines
- Row 0 = headers; split on `,` and `trim()` each cell
- Verify header names match `REQUIRED` in order or as a set
- Each data row must have exactly 5 fields
- Build objects by header index

If using Option B, document in a one-line comment that quoted commas require Option A.

### Error Messages (Console — AC #3)

Use actionable, single-line messages. Examples:

| Condition | Example message |
|-----------|-----------------|
| File missing | `Startup failed: users.csv not found at <path>` |
| No data rows | `Startup failed: users.csv has no data rows` |
| Bad header | `Startup failed: users.csv missing required column "firstName"` |
| Bad row | `Startup failed: users.csv line 5: expected 5 columns, got 4` |

Always prefix with `Startup failed:` so facilitators can grep logs during lab.

### Expose Data for Story 1.4

Story 1.4 will filter `users` in `/api/search`. Minimum contract:

```javascript
let users = [];

try {
  users = loadUsers();
  console.log(`Loaded ${users.length} users from users.csv`);
} catch (err) {
  console.error(`Startup failed: ${err.message}`);
  process.exit(1);
}

// Later: app.get('/api/search', ...) uses `users`
```

Optional: `module.exports = { getUsers: () => users }` only if you split into `loadUsers.js` — not required for this story.

### Architecture Compliance (Search App)

| Decision | Value |
|----------|-------|
| Storage | CSV file only, in-memory after load (NFR8) |
| Load timing | Once at startup (no hot-reload, no watcher) |
| DB / ORM | **Forbidden** |
| Auth | None (NFR7) |
| Complexity | One parser approach; no validation framework (Zod, etc.) |

### Library / Framework Requirements

| Package | Story 1.2 | Notes |
|---------|-----------|-------|
| `express` | Keep ^4.21.x | Already installed |
| `csv-parse` | Optional ^5.x | Use `/sync` subpath only if chosen |
| `cors` | **Do not add** | Story 1.5 |
| Database drivers | **Do not add** | NFR8 |

### File Structure Requirements

```text
sg-search-service/
├── package.json      # UPDATE if csv-parse added
├── server.js         # UPDATE — loadUsers + users array + fail-fast
├── users.csv         # NO content change required (already valid)
└── README.md         # UPDATE — document startup load + error behavior
```

- Keep flat layout (no `src/` unless team mandates)
- Do not move `users.csv` path — must stay beside `server.js` for `join(__dirname, 'users.csv')`

### Testing Requirements (Manual)

```powershell
cd sg-search-service
npm install
npm start
# Expect console:
#   Loaded 12 users from users.csv
#   sg-search-service listening on http://localhost:3001
```

**Negative tests (rename or break file, then restore):**

| Test | Expected |
|------|----------|
| Rename `users.csv` temporarily | Process exits 1; clear "not found" error; no server listening |
| Empty `users.csv` | Exit 1; "no data rows" or equivalent |
| Truncate one data row to 4 columns | Exit 1; line/column error |

**Regression:**

```powershell
curl http://127.0.0.1:3001/
# Still returns scaffold text
```

**Data sanity (for Story 1.4 prep):** After load, `users.length` must be **12**. Spot-check: three records with `firstName === 'John'`, two with `lastName === 'Smith'` (matches `idea.md` matrix).

### Previous Story Intelligence (1.1)

| Learning | Action for 1.2 |
|----------|----------------|
| Scaffold at repo root `sg-search-service/` | Continue same path |
| 12 rows with John/Smith duplicates | Do not shrink dataset; parser must load all 12 |
| CommonJS + Express 4.x | Keep `require`, no ESM |
| Deferred: unquoted CSV commas | **This story** — prefer `csv-parse` or validate split carefully |
| Deferred: `app.listen` error callback | Still optional; not required here |
| Deferred: PORT validation | Unchanged; keep `process.env.PORT \|\| 3001` |
| No git repo yet | `baseline_commit: NO_VCS` |

### Latest Technical Information

- **`csv-parse` v5.x** — CommonJS sync API: `const { parse } = require('csv-parse/sync')`; `columns: true` maps first row to object keys ([csv.js.org/parse](https://csv.js.org/parse/options/columns/)).
- **Node 18+** — `fs.readFileSync` with `'utf8'` is sufficient; no `fs.promises` required for sync startup load.
- **Express** — No change to Express version; loading data is independent of HTTP stack.

### Out of Scope (Do Not Implement)

- `GET /health` (Story 1.3)
- `GET /api/search` and filter logic (Story 1.4)
- `app.use(cors())` (Story 1.5)
- Reloading CSV on request or file watch
- Writing/editing CSV via API
- Unit test files (Epic 3 / optional)

### Anti-Patterns (Will Fail Review)

- Listening on port before CSV load succeeds
- Silently starting with `users = []` when file is missing
- Introducing SQLite, MongoDB, Prisma, or JSON DB fallback
- Loading CSV on every HTTP request (performance + complexity)
- Implementing search/filter in this story
- Following `architecture.md` React/task-manager structure
- Changing CSV header names away from PRD fields

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.2]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md — §3.1, §6.1]
- [Source: _bmad-output/implementation-artifacts/1-1-initialize-express-search-service.md — scaffold baseline]
- [Source: sg-search-service/server.js, users.csv — files to update]
- [Source: idea.md — verification matrix (John/Smith row counts)]
- [Source: csv-parse columns option](https://csv.js.org/parse/options/columns/)

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Used `csv-parse/sync` with `columns: true`, `relax_column_count: false` for fail-fast on bad rows
- Startup order: `loadUsers()` → assign `users` → `app.listen()` only after success

### Completion Notes List

- Added `loadUsers()` in `server.js`: reads `users.csv` via `join(__dirname, 'users.csv')`, validates required columns, stores module-level `users` array for Story 1.4
- Fail-fast: `Startup failed:` prefix + `process.exit(1)` on missing file, header-only, parse errors (wrong column count)
- Added `csv-parse@^5.6.0` as sole new dependency; no DB/ORM/CORS
- Manual verification: 12 users loaded; John=3, Smith=2; GET `/` regression on PORT 3099; negative tests exit 1 with clear messages

### File List

- sg-search-service/server.js (modified)
- sg-search-service/package.json (modified)
- sg-search-service/package-lock.json (modified)
- sg-search-service/README.md (modified)

### Change Log

- 2026-06-04: Story 1.2 — CSV startup load with csv-parse, fail-fast errors, README scope update

## Story Completion Status

- **Status:** done
- **Completion note:** Code review passed (2026-06-04); all ACs satisfied; deferrals logged; manual tests passed
- **Next story after done:** `1-3-implement-health-check-endpoint`
