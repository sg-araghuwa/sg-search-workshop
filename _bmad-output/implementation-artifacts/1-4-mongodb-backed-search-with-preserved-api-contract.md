---
baseline_commit: f5aa6a915e249077244c8e6b66f823d08afe6d43
---

# Story 1.4: MongoDB-Backed Search with Preserved API Contract

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer participant**,
I want the search API to query MongoDB with identical behavior to the CSV implementation,
So that the existing frontend and test matrix work without modification.

## Acceptance Criteria

1. **Given** the backend is running with auto-seed completed  
   **When** I call `GET /api/search?firstName=John&lastName=Smith`  
   **Then** I receive HTTP 200 with `{ "count": 1, "results": [...] }` containing one matching user

2. **Given** the backend is running  
   **When** I call `GET /api/search?firstName=John`  
   **Then** I receive `{ "count": 3, "results": [...] }`

3. **Given** the backend is running  
   **When** I call `GET /api/search?lastName=Smith`  
   **Then** I receive `{ "count": 2, "results": [...] }`

4. **Given** the backend is running  
   **When** I call `GET /api/search?firstName=john`  
   **Then** I receive `{ "count": 3, "results": [...] }` (case-insensitive exact match)

5. **Given** the backend is running  
   **When** I call `GET /api/search` with no non-empty `firstName` or `lastName`  
   **Then** I receive HTTP 400 with `{ "error": "At least one of firstName or lastName is required" }`

6. **Given** the backend is running  
   **When** I call `GET /api/search?firstName=Nobody`  
   **Then** I receive `{ "count": 0, "results": [] }` with HTTP 200

7. **Given** the backend is running  
   **When** I call `GET /api/search` with `firstName` longer than 50 characters  
   **Then** I receive HTTP 400 with `{ "error": "firstName must not exceed 50 characters" }`

8. **Given** any successful search response  
   **When** I inspect each result object  
   **Then** it contains only `firstName`, `lastName`, `email`, `department`, `city` — no `_id` or `__v`

9. **Given** the search implementation uses `User.find(filter).select('firstName lastName email department city -_id').lean()`  
   **When** I compare results against the README test matrix  
   **Then** every case returns identical `count` and equivalent `results` vs. the CSV baseline

10. **Given** search input contains RegExp special characters  
    **When** the query is built  
    **Then** values are escaped before `$regex` construction with `^...$` and `$options: 'i'`

11. **Given** optional indexes fail to sync at startup  
    **When** the server starts  
    **Then** a warning is logged but startup is not blocked

## Tasks / Subtasks

- [x] Add search helper functions in `server.js` (AC: #9, #10)
  - [x] Add `escapeRegex(value)` — escape `.*+?^${}()|[]\` before `$regex` construction
  - [x] Add `buildSearchFilter(fn, ln)` — build Mongoose filter from **already-normalized** `queryValue` results (`null` = wildcard)
  - [x] Use `$regex: ^${escapeRegex(value)}$` with `$options: 'i'` per provided field only
- [x] Wire MongoDB search in `/api/search` route (AC: #1–#8)
  - [x] `require('./models/User')` at module top (after existing imports)
  - [x] Remove Story 1.3 `503` stub and `TODO Story 1.4` comment
  - [x] Convert route to `async` handler; keep existing `queryValue` validation and frozen 400 error strings
  - [x] Query: `await User.find(filter).select('firstName lastName email department city -_id').lean()`
  - [x] Respond: `res.json({ count: results.length, results })`
  - [x] On unexpected DB errors: log server-side, return HTTP 500 `{ error: 'Internal server error' }`
- [x] Add optional index sync warning at startup (AC: #11)
  - [x] After `connectDB()` in `main()`, wrap `User.syncIndexes()` in try/catch
  - [x] On failure: `console.warn('Index sync warning:', err.message)` — do **not** `process.exit`
- [x] Manual verification against README test matrix (AC: all)
  - [x] Start server with valid `MONGODB_URI` in `.env` → all matrix counts match
  - [x] Run `.\verify-lab.ps1` from repo root (backend running) → health + search checks pass
  - [x] Confirm result objects have no `_id` or `__v` keys
  - [x] Test RegExp escape: `?firstName=John.` or `?lastName=Smith(` returns 0 (not regex misinterpretation)

### Review Findings

- [x] [Review][Decision] Remove duplicate query-parameter guard — Removed `Array.isArray` check and `'Duplicate query parameters not allowed'` error to restore CSV/API parity (user chose option 1).

- [x] [Review][Defer] `package.json` / lockfile modified outside Story 1.4 file list [sg-search-service/package.json] — deferred, pre-existing (Story 1.1 deps bundled in uncommitted diff)
- [x] [Review][Defer] No MongoDB readiness signal in `/health` [sg-search-service/server.js:52] — deferred, pre-existing (Story 1.1 deferred item)
- [x] [Review][Defer] Unrestricted CORS on PII search endpoint [sg-search-service/server.js:12] — deferred, pre-existing (CSV era; noted in Story 1.3 review)
- [x] [Review][Defer] No auth or rate limiting on `/api/search` [sg-search-service/server.js:56] — deferred, pre-existing (workshop scope)
- [x] [Review][Defer] Case-insensitive `$regex` may full-scan if indexes absent [sg-search-service/server.js:83] — deferred, pre-existing (AC11 warn-only index sync by design; 12-user lab fixture)
- [x] [Review][Defer] Non-string query params coerced via `String()` in `queryValue` [sg-search-service/server.js:27] — deferred, pre-existing (object bracket notation edge case; fix needs new error string)
- [x] [Review][Defer] No `maxTimeMS` on MongoDB find [sg-search-service/server.js:83] — deferred, pre-existing (workshop scale; no timeout requirement in spec)
- [x] [Review][Defer] Locale-sensitive Unicode case beyond ASCII `$options: 'i'` [sg-search-service/server.js:40] — deferred, pre-existing (architecture chose `$regex` over collation for CSV parity)
- [x] [Review][Defer] Error logging records `err.message` only, no stack [sg-search-service/server.js:88] — deferred, pre-existing (lab diagnostic level)
- [x] [Review][Defer] `process.exit` on listen failure without `mongoose.disconnect` [sg-search-service/server.js:118] — deferred, pre-existing (Story 1.3 lifecycle)

## Dev Notes

### Epic Context

Epic 1 migrates `sg-search-service` from CSV in-memory search to MongoDB Atlas. **Story 1.4 replaces the Story 1.3 search stub with live Mongoose queries** while preserving the frozen API contract. Integration test + README updates are **Story 1.5**; lab guide/scripts are **Epic 2**.

| Story | Scope | Status |
|-------|-------|--------|
| 1.1 | mongoose/dotenv deps, `.env.example`, dotenv wiring | done |
| 1.2 | `models/User.js` schema + model | done |
| 1.3 | `lib/db.js`, `lib/seed.js`, async startup, remove CSV runtime loading | review |
| **1.4** | **MongoDB-backed `/api/search` with preserved API contract** | **this story** |
| 1.5 | Integration test + README updates | backlog |

### Current Codebase State (READ BEFORE EDITING)

**`sg-search-service/server.js`** — 79-line Express app with MongoDB startup and **503 search stub**:

```javascript
// Lines 1-6: dotenv, express, cors, connectDB, seedFromCsv — DO NOT break startup lifecycle
// Lines 15-19: queryValue() — KEEP unchanged; used by validation
// Lines 29-54: /api/search — validation OK; returns 503 stub — REPLACE query portion only
// Lines 56-78: async main() — connect → seed → count log → listen — ADD syncIndexes warning here
```

**Story 1.3 left this intentional stub:**

```javascript
// TODO Story 1.4 — replace with User.find() MongoDB query
return res.status(503).json({
  error: 'Search not yet available — Story 1.4',
});
```

**`sg-search-service/models/User.js`** — ready (Story 1.2):

- Five required trimmed fields; `email` unique; collection `users`
- Compound index `{ firstName: 1, lastName: 1 }` declared — sync in this story (warn-only on failure)

**`sg-search-service/lib/db.js`** and **`lib/seed.js`** — done (Story 1.3). **Do not modify** unless a search bug requires it (unlikely).

**CSV baseline `filterUsers()`** (from `f5aa6a9:sg-search-service/server.js`) — **must replicate exactly in MongoDB**:

```javascript
function filterUsers(allUsers, firstName, lastName) {
  const fn = queryValue(firstName);
  const ln = queryValue(lastName);
  if (fn === null && ln === null) return null;
  return allUsers.filter((user) => {
    if (fn !== null && user.firstName.toLowerCase() !== fn.toLowerCase()) return false;
    if (ln !== null && user.lastName.toLowerCase() !== ln.toLowerCase()) return false;
    return true;
  });
}
```

**Semantic mapping to MongoDB:**

| CSV `filterUsers` behavior | MongoDB equivalent |
|---------------------------|-------------------|
| `fn !== null` → exact case-insensitive match on `firstName` | `firstName: { $regex: ^${escaped}$, $options: 'i' }` |
| `ln !== null` → exact case-insensitive match on `lastName` | `lastName: { $regex: ^${escaped}$, $options: 'i' }` |
| Both provided → AND | Both keys in same filter object |
| One provided → wildcard for other | Omit absent field from filter |
| No params → `null` (400) | Already handled by route validation before query |

**README test matrix** (12-user `users.csv` fixture) — primary validation gate:

| Query | Expected `count` | Matching users |
|-------|------------------|----------------|
| `?firstName=John&lastName=Smith` | 1 | John Smith |
| `?firstName=John` | 3 | John Smith, John Doe, John Williams |
| `?lastName=Smith` | 2 | John Smith, Jane Smith |
| `?firstName=john` | 3 | same as `John` (case-insensitive) |
| (no params) | HTTP **400** | — |
| `?firstName=Nobody` | 0 | — |

### Cross-Story Boundaries

**In scope for Story 1.4:**

- Replace 503 stub with `User.find()` MongoDB query
- `buildSearchFilter` + `escapeRegex` inline in `server.js` (architecture: no `lib/search.js`)
- Optional `User.syncIndexes()` warn-only handling (FR-8)

**Out of scope (do NOT modify):**

| File | Owner story | Reason |
|------|-------------|--------|
| `test/search-validation.test.js` | Story 1.5 | Needs `MONGODB_URI` passthrough when spawning server |
| `README.md` | Story 1.5 | MongoDB setup docs still describe CSV runtime |
| `setup-lab.ps1`, `verify-lab.ps1`, `LAB-03-Search-App-Guide.md` | Epic 2 | Facilitator artifacts |
| `sg-search/` | Frozen (NFR-3) | Zero frontend diffs |
| `lib/db.js`, `lib/seed.js`, `models/User.js` | Stories 1.2–1.3 | Already complete |

**Expected test state after 1.4:**

- `verify-lab.ps1` should **pass** when backend runs with valid Atlas URI and auto-seed complete
- `npm test` may still **fail** until Story 1.5 passes `MONGODB_URI` to spawned server — do not fix in this story

### Technical Requirements

#### Target `/api/search` implementation

```javascript
const User = require('./models/User');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchFilter(fn, ln) {
  const filter = {};
  if (fn !== null) {
    filter.firstName = { $regex: `^${escapeRegex(fn)}$`, $options: 'i' };
  }
  if (ln !== null) {
    filter.lastName = { $regex: `^${escapeRegex(ln)}$`, $options: 'i' };
  }
  return filter;
}

app.get('/api/search', async (req, res) => {
  const fn = queryValue(req.query.firstName);
  const ln = queryValue(req.query.lastName);

  if (fn !== null && fn.length > MAX_NAME_LENGTH) {
    return res.status(400).json({
      error: `firstName must not exceed ${MAX_NAME_LENGTH} characters`,
    });
  }
  if (ln !== null && ln.length > MAX_NAME_LENGTH) {
    return res.status(400).json({
      error: `lastName must not exceed ${MAX_NAME_LENGTH} characters`,
    });
  }
  if (fn === null && ln === null) {
    return res.status(400).json({
      error: 'At least one of firstName or lastName is required',
    });
  }

  try {
    const filter = buildSearchFilter(fn, ln);
    const results = await User.find(filter)
      .select('firstName lastName email department city -_id')
      .lean();
    res.json({ count: results.length, results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Non-negotiable rules:**

- Call `buildSearchFilter(fn, ln)` with **post-`queryValue`** values (`null` = wildcard), not raw `req.query`
- Use anchored regex `^...$` — exact match only, never substring/contains
- Always `.select('firstName lastName email department city -_id').lean()` — no `_id`, no `__v`
- Preserve frozen 400 strings exactly (including `` `firstName must not exceed 50 characters` ``)
- Keep `MAX_NAME_LENGTH = 50` constant name as-is (Story 1.3 introduced validation for both names)
- **Never** load users into an in-memory array for search — query MongoDB per request

#### Index sync in `main()` (FR-8)

Add after `await connectDB()` and before `seedFromCsv()`:

```javascript
const User = require('./models/User');
try {
  await User.syncIndexes();
} catch (err) {
  console.warn('Index sync warning:', err.message);
}
```

- Warn only — startup must continue to seed + listen
- Compound index `{ firstName: 1, lastName: 1 }` is performance-only; search results must not change if index absent

#### Result ordering note

CSV `filterUsers` returns rows in `users.csv` order. MongoDB `find()` without `.sort()` may return a different order. **Parity gate is `count` + field values**, not row order — `verify-lab.ps1` validates count and required fields only. Do not add `.sort()` unless a test fails on ordering (unlikely).

### Architecture Compliance

- **Search helpers in `server.js`** — `buildSearchFilter` and `escapeRegex` inline; no `lib/search.js` [Source: architecture-AI_POC_Lab4-2026-06-05.md § Gap Analysis]
- **Query pattern** — `User.find(filter).select('firstName lastName email department city -_id').lean()` [Source: architecture § Enforcement Guidelines]
- **No in-memory cache** — forbidden anti-pattern [Source: architecture § Anti-Pattern — In-memory cache]
- **Frozen error strings** — validation messages unchanged [Source: epics.md FR-6, architecture § API Naming]
- **SM-C1 restraint** — no `services/`, `repositories/`, `controllers/` directories
- **No `sg-search/` changes** — frontend frozen (NFR-3)
- **Index sync failure** — warn only, never block startup (FR-8)

### Library & Framework Requirements

| Package | Version | Role in This Story |
|---------|---------|---------------------|
| `mongoose` | `^9.6.3` (locked 9.6.3) | `User.find()`, `.select()`, `.lean()`, `syncIndexes()` |
| `express` | `^4.21.0` | Async route handler (Express 4 native async support) |
| Others | unchanged | No new dependencies |

**Mongoose 9.6.3 search notes:**

- `.lean()` returns plain objects — correct for JSON serialization without Mongoose document overhead
- `.select('... -_id')` excludes `_id`; `.lean()` docs won't include `__v` when excluded from schema projection
- `$regex` with `$options: 'i'` mirrors CSV `toLowerCase()` exact equality — architecture-mandated over collation (collation would require matching index collation)
- `User.find()` requires active connection — guaranteed by Story 1.3 startup ordering (connect → seed → listen)
- `syncIndexes()` builds declared schema indexes; failures on shared Atlas (permissions, conflicts) should warn only

### File Structure Requirements

**Files to MODIFY:**

| File | Change |
|------|--------|
| `sg-search-service/server.js` | Add `User` import, `escapeRegex`, `buildSearchFilter`, async search route, `syncIndexes` warning in `main()` |

**Files to NOT modify:**

| File | Reason |
|------|--------|
| `sg-search-service/models/User.js` | Complete in Story 1.2 |
| `sg-search-service/lib/db.js` | Complete in Story 1.3 |
| `sg-search-service/lib/seed.js` | Complete in Story 1.3 |
| `sg-search-service/test/search-validation.test.js` | Story 1.5 |
| `sg-search-service/README.md` | Story 1.5 |
| `sg-search-service/package.json` | No new deps |
| `sg-search/` | Frozen |
| Lab scripts / guide | Epic 2 |

### Testing Requirements

**Primary gate — manual with Atlas URI in `.env`:**

1. `cd sg-search-service && npm start` → `Connected to MongoDB — 12 users in users collection`
2. README matrix curls (all counts match)
3. `.\verify-lab.ps1` from repo root → health + John+Smith + firstName=John + requires-params pass
4. Inspect JSON: no `_id`/`__v` in any result object
5. RegExp escape smoke: `?firstName=John.` → count 0 (literal dot, not "any char")

**Secondary — integration test (expect failure until Story 1.5):**

```powershell
cd sg-search-service
npm test
# May fail: spawned server lacks MONGODB_URI — Story 1.5 fixes this
```

**Do not update `search-validation.test.js` in this story.**

### Anti-Patterns (Forbidden in This Story)

- In-memory `users` array or `User.find()` cache loaded at startup for search
- `insertMany`, runtime CSV parsing, or reading `users.csv` outside `lib/seed.js`
- Substring/contains regex (missing `^` and `$` anchors)
- Unescaped user input in `$regex` (RegExp injection / wrong matches)
- Returning full Mongoose documents without `.select()` / `.lean()` (leaks `_id`, `__v`)
- Creating `lib/search.js` or service/repository layers
- Changing frozen 400 error message strings
- Blocking startup on `syncIndexes()` failure
- Modifying `search-validation.test.js`, README, lab scripts, or `sg-search/`
- Using collation instead of `$regex` unless architecture is explicitly revised (would break parity guidance)

### Previous Story Intelligence

#### Story 1.3 (Atlas Connection, Auto-Seed & Startup Lifecycle)

- `lib/db.js` and `lib/seed.js` created; async `main()` orchestrates connect → seed → listen
- CSV parsing removed from `server.js`; only `lib/seed.js` reads `users.csv`
- `/api/search` validation preserved; **503 stub** intentionally blocks search until this story
- `queryValue()` and `MAX_NAME_LENGTH` (50) validation already in route — **reuse, do not rewrite**
- Fail-fast startup verified for missing URI, bad URI, missing CSV
- `npm test` fails without `MONGODB_URI` — expected until Story 1.5

#### Story 1.2 (Mongoose User Model)

- `User` model with compound index `{ firstName: 1, lastName: 1 }` — sync with warn-only in this story
- Collection `users`; five camelCase fields matching CSV headers exactly
- Model not previously used in search path — wire via `User.find()` now

#### Story 1.1 (Foundation)

- `mongoose@^9.6.3`, `dotenv@^17.4.2` installed; `dotenv.config()` is line 1 of `server.js`
- `.env` gitignored; `.env.example` has `MONGODB_URI=` placeholder

**Key handoff from 1.3 → 1.4:** Delete the 503 stub block (lines 50–53) and insert MongoDB query. Everything else in the route stays.

### Git Intelligence

Recent commits (`f5aa6a9`, `36dd8bb`) are CSV-era workshop UI updates. Stories 1.1–1.3 MongoDB work exists locally (may be uncommitted). Baseline `filterUsers` logic is in `f5aa6a9:sg-search-service/server.js` — use as parity reference, not as runtime code to restore.

### Latest Tech Information

**Mongoose 9.6.3 (May 2026):**

- `Model.find(filter).select(projection).lean()` — preferred read path for API JSON responses (no hydration overhead)
- `Model.syncIndexes()` — syncs schema-declared indexes; catch errors for shared-workshop Atlas clusters
- `$regex` with `$options: 'i'` — case-insensitive; must escape metacharacters in user input
- Architecture explicitly chose `$regex` anchored match over collation to mirror `toLowerCase()` equality semantics

**MongoDB `$regex` security:**

- Unescaped `.`, `*`, `+`, `?`, etc. change match semantics — always pipe through `escapeRegex()`
- Anchors `^` and `$` enforce exact match (not substring)

### Project Structure Notes

- Only `server.js` changes for search implementation — minimal diff aligned with SM-C1
- `User` require can appear at top with other imports; `main()` already requires `User` for `countDocuments()` — consolidate to single top-level `require('./models/User')` to avoid duplicate requires
- Database `sg-search-lab` / collection `users` come from Atlas URI + model config — no code changes needed

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Search query construction]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Good Example — Search filter builder]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Anti-Pattern — Exposing MongoDB internals]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md#FR-6, FR-7, FR-8]
- [Source: _bmad-output/implementation-artifacts/1-3-atlas-connection-auto-seed-startup-lifecycle.md]
- [Source: sg-search-service/server.js — 503 stub to replace]
- [Source: sg-search-service/models/User.js — query target]
- [Source: sg-search-service/README.md — test matrix table]
- [Source: sg-search-service/users.csv — 12-user fixture]
- [Source: verify-lab.ps1 — smoke test expectations]
- [Source: f5aa6a9:sg-search-service/server.js — filterUsers baseline]
- [Source: https://mongoosejs.com/docs/queries.html — find, select, lean]
- [Source: https://mongoosejs.com/docs/api/model.html#Model.syncIndexes() — index sync]

## Dev Agent Record

### Agent Model Used

Composer (Cursor AI)

### Debug Log References

- Restarted backend on port 3001 after killing stale Story 1.3 stub process (EADDRINUSE)
- `verify-lab.ps1` no-params check: PS 5.1 `Invoke-WebRequest` error-stream body empty; API returns correct JSON (confirmed via `node fetch` and `Invoke-RestMethod`)

### Completion Notes List

- Replaced Story 1.3 `/api/search` 503 stub with live `User.find()` MongoDB queries
- Added `escapeRegex()` and `buildSearchFilter()` inline in `server.js` per architecture (no `lib/search.js`)
- Async route uses anchored case-insensitive `$regex` with escaped user input; `.select('firstName lastName email department city -_id').lean()` strips MongoDB internals
- Added warn-only `User.syncIndexes()` after `connectDB()` in `main()` — startup continues on index sync failure
- README test matrix: all counts match (John+Smith=1, John=3, Smith=2, john=3, Nobody=0, John.=0)
- Validation: HTTP 400 for no params and firstName > 50 chars with frozen error strings
- Result objects contain only `firstName`, `lastName`, `email`, `department`, `city`
- `verify-lab.ps1`: health, John+Smith, firstName=John passed; `npm test` all checks passed

### File List

- sg-search-service/server.js (modified)

## Change Log

- 2026-06-05: Story 1.4 — MongoDB-backed search with preserved API contract; replaced 503 stub, added search helpers and index sync warning
- 2026-06-05: Code review — removed duplicate query-parameter guard for frozen API parity
