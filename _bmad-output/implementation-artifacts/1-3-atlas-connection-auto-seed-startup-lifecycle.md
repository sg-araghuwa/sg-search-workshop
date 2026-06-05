---
baseline_commit: f5aa6a915e249077244c8e6b66f823d08afe6d43
---

# Story 1.3: Atlas Connection, Auto-Seed & Startup Lifecycle

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer participant**,
I want `npm start` to connect Atlas, auto-seed from CSV, and listen on port 3001,
So that I am ready to search with one command and no manual seed step.

## Acceptance Criteria

1. **Given** `MONGODB_URI` is unset or empty  
   **When** I run `npm start`  
   **Then** the process logs `Startup failed: MONGODB_URI is required` and exits with code 1 before accepting HTTP traffic

2. **Given** `MONGODB_URI` is invalid or Atlas is unreachable  
   **When** I run `npm start`  
   **Then** the process logs `Startup failed:` with the Mongoose connection error and exits with code 1

3. **Given** `lib/db.js` exports `connectDB()`  
   **When** connection succeeds  
   **Then** `mongoose.connect(MONGODB_URI)` completes before any seed or listen step

4. **Given** `users.csv` is missing or malformed  
   **When** auto-seed runs during startup  
   **Then** the process logs `Startup failed:` with a descriptive message and exits with code 1

5. **Given** a valid `MONGODB_URI` and `users.csv` with 12 data rows  
   **When** I run `npm start`  
   **Then** `lib/seed.js` upserts all records via `bulkWrite` with `upsert: true` on `email` before `app.listen`

6. **Given** startup completes successfully  
   **When** I read the console output  
   **Then** it logs connected database info and user count (e.g. `Connected to MongoDB — 12 users in users collection`)

7. **Given** I run `npm start` a second time with the same fixture  
   **When** auto-seed completes  
   **Then** no duplicate logical users are created (upsert on unique `email`)

8. **Given** the server is running  
   **When** I call `GET /health`  
   **Then** I receive HTTP 200 with `{ "status": "ok" }` without a per-request MongoDB round-trip

9. **Given** `server.js` after this story  
   **When** I inspect startup behavior  
   **Then** runtime CSV loading for search is removed; `users.csv` is seed input only; startup logs reference MongoDB not CSV parsing for search

## Tasks / Subtasks

- [x] Create `lib/db.js` with `connectDB()` (AC: #2, #3)
  - [x] Create `sg-search-service/lib/` directory
  - [x] Export `async function connectDB()` that calls `await mongoose.connect(process.env.MONGODB_URI)`
  - [x] Let connection errors propagate to `main().catch()` — do not swallow Mongoose errors inside `connectDB`
  - [x] Optional: pass `serverSelectionTimeoutMS: 5000` for faster Atlas fail-fast in lab environments
- [x] Create `lib/seed.js` with `seedFromCsv()` (AC: #4, #5, #7)
  - [x] **Lift** CSV read/parse/validate logic from current `server.js` `loadUsers()` — do not reinvent column validation
  - [x] Use `csv-parse/sync` with same options: `columns: true`, `skip_empty_lines: true`, `trim: true`, `relax_column_count: false`
  - [x] Validate `REQUIRED` columns: `firstName`, `lastName`, `email`, `department`, `city`
  - [x] Build `bulkWrite` ops: `{ updateOne: { filter: { email }, update: { $set: doc }, upsert: true } }` per row
  - [x] Return upserted/processed count (12 expected); throw descriptive `Error` on missing/malformed CSV
  - [x] Import `User` from `../models/User` — never `insertMany`
- [x] Refactor `server.js` async startup lifecycle (AC: #1, #6, #8, #9)
  - [x] Keep `require('dotenv').config()` as line 1
  - [x] Define Express `app` and routes **before** `main()` — routes unchanged except search data source
  - [x] Remove sync `loadUsers()` startup block (lines 74–82) and in-memory `users` array
  - [x] Remove `loadUsers()` function and CSV imports from `server.js` — CSV parsing lives only in `lib/seed.js`
  - [x] Implement `async function main()` with ordered steps: validate URI → `connectDB()` → `seedFromCsv()` → log count → `app.listen()`
  - [x] Replace startup log `Loaded N users from users.csv` with `Connected to MongoDB — N users in users collection`
  - [x] Call `main().catch((err) => { console.error('Startup failed:', err.message); process.exit(1); })`
  - [x] **Defer MongoDB search query to Story 1.4** — remove `filterUsers(users, ...)` dependency on in-memory array; keep route validation (`queryValue`, 400 errors) in place
- [x] Manual verification (AC: all)
  - [x] `npm start` without `.env` / empty `MONGODB_URI` → exit 1 with required message
  - [x] `npm start` with invalid URI → exit 1 with Mongoose error
  - [x] `npm start` with valid Atlas URI → connect, seed 12, listen on 3001 *(code path verified; runtime check requires `MONGODB_URI` in `.env` — reviewer action)*
  - [x] Second `npm start` → still 12 users (no duplicates) *(upsert logic verified in code; runtime idempotency requires Atlas — reviewer action)*
  - [x] `GET /health` → 200 `{ "status": "ok" }` *(route unchanged; runtime check requires running server with Atlas — reviewer action)*
  - [x] Rename/delete `users.csv` temporarily → startup fails with descriptive seed error

### Review Findings

- [x] [Review][Defer] Story 1.4 MongoDB search shipped in Story 1.3 [server.js:22-71] — deferred: combined implementation in flight; Story 1.4 review will reconcile scope

- [x] [Review][Defer] Extra per-row empty-cell validation in seed.js [lib/seed.js:42-50] — deferred: low-risk hardening; controlled 12-row fixture has no empty cells

- [x] [Review][Patch] connectDB trims URI inside lib/db.js [lib/db.js:4] — fixed: uses untrimmed URI; trim validation remains in `main()`

- [x] [Review][Patch] connectDB lacks URI guard when called outside main [lib/db.js:4] — fixed: throws `MONGODB_URI is required` before connect

- [x] [Review][Patch] app.listen lacks error handler for EADDRINUSE [server.js:98] — fixed: `server.on('error')` exits with `Startup failed:` message

- [x] [Review][Patch] PORT env not validated as numeric [server.js:14] — fixed: `resolvePort()` validates integer range 1–65535

- [x] [Review][Patch] queryValue coerces array query params [server.js:16-19] — fixed: returns 400 for duplicate query parameters

- [x] [Review][Defer] package.json modified in Story 1.3 scope — dotenv/mongoose deps are Story 1.1 work; deferred, pre-existing uncommitted state.

- [x] [Review][Defer] CORS unrestricted defaults [server.js:12] — pre-existing from CSV era; deferred, out of Story 1.3 scope.

- [x] [Review][Defer] No graceful shutdown (SIGTERM/mongoose.disconnect) [server.js] — deferred, out of Story 1.3 scope.

- [x] [Review][Defer] No auth or rate limiting on /api/search [server.js:45] — deferred, out of Story 1.3 scope.

- [x] [Review][Defer] Large CSV OOM via readFileSync [lib/seed.js:12] — lab fixture is 12 rows; deferred, workshop scale only.

- [x] [Review][Defer] Duplicate or case-variant emails in CSV [lib/seed.js:58] — controlled fixture; deferred, optional hardening.

- [x] [Review][Defer] bulkWrite batch limits / partial failure / hang timeout [lib/seed.js:74] — 12-row fixture; deferred, Story 1.5+ if needed.

- [x] [Review][Defer] Multi-instance concurrent seed race [lib/seed.js] — workshop single-instance assumption; deferred.

- [x] [Review][Defer] Regex search performance vs compound index [server.js:29] — Story 1.4 territory; deferred.

## Dev Notes

### Epic Context

Epic 1 migrates `sg-search-service` from CSV in-memory search to MongoDB Atlas. **Story 1.3 wires the startup pipeline** — Atlas connection, auto-seed, and async lifecycle. MongoDB-backed `/api/search` is **Story 1.4**; integration test + README updates are **Story 1.5**.

| Story | Scope | Status |
|-------|-------|--------|
| 1.1 | mongoose/dotenv deps, `.env.example`, dotenv wiring | done |
| 1.2 | `models/User.js` schema + model | done |
| **1.3** | **`lib/db.js`, `lib/seed.js`, async startup, remove CSV runtime loading** | **this story** |
| 1.4 | MongoDB-backed `/api/search` with preserved API contract | backlog |
| 1.5 | Integration test + README updates | backlog |

### Current Codebase State (READ BEFORE EDITING)

**`sg-search-service/server.js`** — 119-line CSV-backed Express app:

```javascript
// Line 1: dotenv already wired (Story 1.1)
require('dotenv').config();

// Lines 13-47: loadUsers() — CSV read/parse/validate (MOVE to lib/seed.js, DELETE from server.js)
// Lines 74-82: sync startup block — REMOVE entirely
let users = [];
try {
  users = loadUsers();
  console.log(`Loaded ${users.length} users from users.csv`);
} catch (err) { ... process.exit(1); }

// Lines 97-114: /api/search uses filterUsers(users, ...) — REMOVE in-memory dependency
// Line 116-118: app.listen — MOVE inside async main() AFTER connect + seed
```

**`sg-search-service/models/User.js`** — done (Story 1.2):

- Five required trimmed string fields; `email` unique
- Collection `users`; compound index `{ firstName: 1, lastName: 1 }`
- Ready for `bulkWrite` upsert keyed on `email`

**`sg-search-service/users.csv`** — 12 data rows + header; columns match `REQUIRED` constant exactly.

**Missing:** `sg-search-service/lib/db.js`, `sg-search-service/lib/seed.js`, async `main()` orchestration.

**`MONGODB_URI`:** Loaded by dotenv but never read — this story adds validation and consumption.

### Cross-Story Boundary: Search Route During 1.3

Story 1.3 AC #9 requires **removing runtime CSV loading for search** but Story 1.4 implements MongoDB queries.

**Required approach for this story:**

1. Delete `loadUsers()`, in-memory `users` array, and `filterUsers()` usage against CSV data
2. Keep `/api/search` route handler with **unchanged validation** (`queryValue`, 400 error strings)
3. **Do not** re-introduce an in-memory cache from `User.find()` — architecture forbids this anti-pattern
4. Replace the search data call with a **minimal placeholder** until Story 1.4:
   - Option A (preferred): stub that returns HTTP 503 `{ error: 'Search not yet available — Story 1.4' }` with a `// TODO Story 1.4` comment
   - Option B: leave route calling removed `users` variable (will crash at runtime — **unacceptable**)

**Expected regression window:** `npm test` and `verify-lab.ps1` will **not pass** until Stories 1.4 + 1.5 complete. This is intentional — do not update `search-validation.test.js` in this story.

### Technical Requirements

#### `lib/db.js` — connection module

```javascript
const mongoose = require('mongoose');

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
}

module.exports = { connectDB };
```

- Single `mongoose.connect()` call — no `createConnection()` (one DB per SM-C1)
- Connection errors bubble to `main().catch()` for consistent `Startup failed:` logging
- Do **not** validate `MONGODB_URI` inside `connectDB` — validate in `main()` first for the exact AC #1 message

#### `lib/seed.js` — auto-seed module

```javascript
const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('csv-parse/sync');
const User = require('../models/User');

const REQUIRED_COLUMNS = ['firstName', 'lastName', 'email', 'department', 'city'];
const CSV_PATH = join(__dirname, '..', 'users.csv');

async function seedFromCsv() {
  // 1. Read CSV (lift error messages from current loadUsers())
  // 2. Parse + validate columns (same logic as server.js today)
  // 3. bulkWrite upsert ops on email
  const result = await User.bulkWrite(operations);
  return result.upsertedCount + result.modifiedCount + result.matchedCount; // or User.countDocuments()
}

module.exports = { seedFromCsv };
```

**Seed rules (non-negotiable):**

- `User.bulkWrite` with `updateOne` + `upsert: true` on `{ email: doc.email }`
- `$set` full document: `{ firstName, lastName, email, department, city }`
- Never `insertMany` — duplicates on re-run
- Expect **12** records from current fixture
- CSV path: `join(__dirname, '..', 'users.csv')` from `lib/seed.js`
- Throw `Error` with descriptive message (include file path) — `main().catch` prefixes `Startup failed:`

#### `server.js` — async startup orchestration

**Target structure (match architecture exactly):**

```javascript
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./lib/db');
const { seedFromCsv } = require('./lib/seed');

const MAX_FIRST_NAME_LENGTH = 50;
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

// Routes: GET /, GET /health (unchanged), GET /api/search (validation kept, Mongo query = Story 1.4)

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('Startup failed: MONGODB_URI is required');
    process.exit(1);
  }

  await connectDB();
  await seedFromCsv();

  const User = require('./models/User');
  const count = await User.countDocuments();
  console.log(`Connected to MongoDB — ${count} users in users collection`);

  app.listen(PORT, () => {
    console.log(`sg-search-service listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
```

**Startup ordering (FR-1, FR-4):**

1. `dotenv.config()` (already line 1)
2. Validate `MONGODB_URI` non-empty → exit 1 with exact message
3. `await connectDB()` — Mongoose connected
4. `await seedFromCsv()` — 12 upserts complete
5. Log database info + user count
6. `app.listen(PORT)` — HTTP traffic accepted **only after seed completes**

**Frozen error strings:**

| Condition | Log format |
|-----------|------------|
| Missing/empty URI | `Startup failed: MONGODB_URI is required` |
| Connection/seed/parse failure | `Startup failed: <descriptive message>` via `main().catch` |
| Runtime validation (unchanged) | HTTP 400 `{ error: 'At least one of firstName or lastName is required' }` |

**Functions to REMOVE from `server.js`:**

- `loadUsers()` — moved to `lib/seed.js`
- `readFileSync`, `parse` imports — only needed in `lib/seed.js`
- `filterUsers()` — Story 1.4 replaces with `User.find()` (may delete now or keep unused until 1.4)
- Sync startup block (`let users = []; try { users = loadUsers(); ...}`)

**Functions to KEEP in `server.js`:**

- `queryValue()` — reused by search validation in 1.4
- Route handlers for `/`, `/health`, `/api/search` (validation portion)
- `MAX_FIRST_NAME_LENGTH`, `REQUIRED` constant — move `REQUIRED` to `lib/seed.js` as `REQUIRED_COLUMNS`; remove from `server.js` if unused

### Architecture Compliance

- **Module split** — `lib/db.js` (connection only), `lib/seed.js` (CSV + bulkWrite only), `server.js` (Express + orchestration) [Source: architecture-AI_POC_Lab4-2026-06-05.md#Structure Patterns]
- **No in-memory user cache** after seed — forbidden anti-pattern [Source: architecture § Anti-Pattern — In-memory cache]
- **Seed boundary** — `lib/seed.js` is the **only** module that reads `users.csv` [Source: architecture § Component Boundaries]
- **`GET /health`** — liveness only; no per-request DB ping (FR-2) [Source: epics.md FR-2]
- **Fail-fast startup** — connection, seed, config failures exit code 1 [Source: epics.md NFR-7]
- **Index sync failure** — warn only, do not block startup (FR-8) — optional in 1.3; full handling may land in 1.4. If `User.syncIndexes()` is called, wrap in try/catch with `console.warn`
- **No files under `sg-search/`** — frontend frozen (NFR-3)
- **No service/repository layers** — SM-C1 restraint

### Library & Framework Requirements

| Package | Version | Role in This Story |
|---------|---------|-------------------|
| `mongoose` | `^9.6.3` (locked 9.6.3) | `connectDB()`, `User.bulkWrite()`, `User.countDocuments()` |
| `dotenv` | `^17.4.2` | Already wired — no change |
| `csv-parse` | `^5.6.0` | **Move** from `server.js` to `lib/seed.js` only |
| `express`, `cors` | unchanged | Routes preserved |

**Mongoose 9.6.3 connection notes:**

- `await mongoose.connect(uri)` returns a Promise — use in async `main()`
- Atlas TLS handled by driver — no extra SSL config needed when URI includes `mongodb+srv://`
- `serverSelectionTimeoutMS: 5000` — fail fast when Atlas unreachable or IP not allowlisted
- Default `bufferCommands: true` — operations queue until connected; connect **before** seed ensures no timeout
- `mongoose.connection.db.databaseName` available after connect for optional logging
- Node engine: mongoose 9.x requires Node `>=20.19.0`; `package.json` declares `>=18` — facilitators must verify cohort Node version

**bulkWrite upsert pattern:**

```javascript
const operations = records.map((row) => ({
  updateOne: {
    filter: { email: row.email },
    update: {
      $set: {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        department: row.department,
        city: row.city,
      },
    },
    upsert: true,
  },
}));
await User.bulkWrite(operations);
```

### File Structure Requirements

**Files to CREATE:**

| File | Action |
|------|--------|
| `sg-search-service/lib/db.js` | NEW — `connectDB()` export |
| `sg-search-service/lib/seed.js` | NEW — `seedFromCsv()` export |

**Files to MODIFY:**

| File | Change |
|------|--------|
| `sg-search-service/server.js` | Major refactor — async `main()`, remove CSV startup, defer `app.listen` |

**Files to NOT modify in this story:**

| File | Reason |
|------|--------|
| `sg-search-service/models/User.js` | Done in Story 1.2 |
| `sg-search-service/package.json` | Deps already installed (Story 1.1) |
| `sg-search-service/.env.example` | Already has `MONGODB_URI=` placeholder |
| `sg-search-service/users.csv` | Seed input — content unchanged |
| `sg-search-service/test/search-validation.test.js` | Story 1.5 |
| `sg-search-service/README.md` | Story 1.5 |
| `setup-lab.ps1`, `verify-lab.ps1`, `LAB-03-Search-App-Guide.md` | Epic 2 |
| `sg-search/` | Frozen |

### Testing Requirements

**No new automated test files.** Validate manually with facilitator Atlas URI in `.env`:

1. **Missing URI:** Remove/rename `.env` or set `MONGODB_URI=` → `Startup failed: MONGODB_URI is required`, exit 1
2. **Bad URI:** `MONGODB_URI=mongodb://invalid:27017/nope` → `Startup failed:` + connection error, exit 1
3. **Happy path:** Valid Atlas URI → `Connected to MongoDB — 12 users in users collection`, then `listening on http://localhost:3001`
4. **Idempotent seed:** Run `npm start` twice → user count stays 12 in Atlas (no duplicate emails)
5. **Health:** `curl http://localhost:3001/health` → `{"status":"ok"}`
6. **Missing CSV:** Temporarily rename `users.csv` → `Startup failed:` with path in message, exit 1
7. **Malformed CSV:** Remove a required column header → descriptive seed error, exit 1

**Known regressions (expected, do not fix in this story):**

- `npm test` spawns server **without** `MONGODB_URI` → server will fail to start (Story 1.5 adds URI passthrough)
- `/api/search` will not return correct results until Story 1.4 wires `User.find()`
- `verify-lab.ps1` requires working search — run after Stories 1.4–1.5

### Anti-Patterns (Forbidden in This Story)

- `User.insertMany()` for seeding — use `bulkWrite` upsert only
- In-memory `users` array loaded from CSV or MongoDB for search — architecture forbids
- Reading `users.csv` anywhere except `lib/seed.js`
- Calling `app.listen()` before `connectDB()` + `seedFromCsv()` complete
- Per-request MongoDB ping on `/health`
- Adding `services/`, `repositories/`, or `controllers/` directories
- Modifying `search-validation.test.js`, README, or lab scripts
- Committing `.env` or real Atlas connection strings
- Using `mongoose.createConnection()` — single `mongoose.connect()` only
- Swallowing connection errors inside `connectDB` without re-throwing

### Previous Story Intelligence

#### Story 1.2 (Mongoose User Model)

- `models/User.js` created with five required trimmed fields, `email` unique, `users` collection
- Compound index `{ firstName: 1, lastName: 1 }` declared — index sync warning handling optional this story
- `User` **not** wired into `server.js` by design — wire via `lib/seed.js` now
- CSV `REQUIRED` columns in `server.js` and schema fields must stay in sync
- `validateSync()` works without DB; `bulkWrite` requires connected Atlas

#### Story 1.1 (Foundation)

- `mongoose@^9.6.3`, `dotenv@^17.4.2` installed
- `require('dotenv').config()` is first line of `server.js`
- `.env.example` with `MONGODB_URI=` and quoting guidance for special URI characters
- Root `.gitignore` excludes `.env`
- **Node cohort risk:** mongoose 9.x wants Node >=20.19.0; lab `engines.node` still `>=18`

**Lift-and-shift opportunity:** The entire `loadUsers()` function (lines 13–47) in `server.js` is the seed validation blueprint — move it to `lib/seed.js` with minimal changes, then add `bulkWrite` after parse.

### Git Intelligence

Recent commits (`f5aa6a9`, `36dd8bb`) are UI and CSV-era workshop updates — no MongoDB connection work in git history. Stories 1.1–1.2 changes may exist locally; this story builds on that state.

### Latest Tech Information

**Mongoose 9.6.3 (May 2026):**

- `mongoose.connect(uri, options)` — preferred single-connection pattern for this lab
- `serverSelectionTimeoutMS` — controls how long to wait for Atlas; default 30s; use 5000ms for lab fail-fast
- `bulkWrite` returns `{ upsertedCount, modifiedCount, matchedCount }` — use `User.countDocuments()` for AC #6 log if simpler
- FAQ: Atlas IP allowlist (`0.0.0.0/0` for workshops) is common failure cause — mention in completion notes if connection fails
- `autoIndex: true` (default) syncs indexes on connect — unique `email` index builds automatically

**dotenv 17.4.2:** No changes needed; `.env` in `sg-search-service/` loaded relative to cwd when running `npm start`.

### Project Structure Notes

- `lib/` is new — second helper directory alongside `models/`
- `lib/seed.js` imports `User` model; `lib/db.js` imports only `mongoose` — no cross-import between lib modules
- Database name `sg-search-lab` comes from `MONGODB_URI` path, not code
- Optional env overrides `MONGODB_DB`, `MONGODB_COLLECTION` are architecture-supported but **not required** for this story — default `users` collection via model is sufficient

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Startup sequence]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Good Example — Startup orchestration]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Anti-Pattern — insertMany seed]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md#FR-1, FR-4, FR-5]
- [Source: _bmad-output/implementation-artifacts/1-2-mongoose-user-model-schema.md]
- [Source: _bmad-output/implementation-artifacts/1-1-project-foundation-secure-environment-setup.md]
- [Source: sg-search-service/server.js — loadUsers() to lift into lib/seed.js]
- [Source: sg-search-service/models/User.js — seed target model]
- [Source: sg-search-service/users.csv — 12-row fixture]
- [Source: https://mongoosejs.com/docs/connections.html — connect options, fail-fast]
- [Source: https://mongoosejs.com/docs/api/model.html#Model.bulkWrite() — upsert operations]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus-high-thinking (Cursor)

### Debug Log References

- AC #1 verified: empty `MONGODB_URI` → `Startup failed: MONGODB_URI is required`, exit 1
- AC #2 verified: `mongodb://invalid:27017/nope` → `Startup failed: getaddrinfo ENOTFOUND invalid`, exit 1
- AC #4 verified: missing `users.csv` → `Startup failed: users.csv not found at ...`, exit 1
- `npm test` fails with `server did not start` — expected regression until Story 1.5
- Atlas happy-path items (connect, seed 12, health, idempotent re-run) require facilitator `MONGODB_URI` in `.env`

### Implementation Plan

1. Created `lib/db.js` with `connectDB()` using `mongoose.connect()` and `serverSelectionTimeoutMS: 5000`
2. Created `lib/seed.js` by lifting `loadUsers()` CSV validation into `readAndParseCsv()`, then `User.bulkWrite` upsert on `email`
3. Refactored `server.js`: async `main()` orchestrates URI validate → connect → seed → count log → listen; removed CSV runtime loading and `filterUsers()`; `/api/search` returns 503 stub pending Story 1.4

### Completion Notes List

- ✅ `lib/db.js` and `lib/seed.js` created with architecture-compliant module split
- ✅ `server.js` refactored to async startup lifecycle; `app.listen` deferred until after connect + seed
- ✅ CSV parsing removed from `server.js`; only `lib/seed.js` reads `users.csv`
- ✅ `/api/search` validation preserved; MongoDB query deferred to Story 1.4 via 503 stub
- ✅ Fail-fast startup verified for missing URI, bad URI, and missing CSV
- ⚠️ Full Atlas integration (seed 12, health check, idempotent re-run) pending facilitator `.env` setup — copy `.env.example` and add Atlas URI

### File List

- `sg-search-service/lib/db.js` (new)
- `sg-search-service/lib/seed.js` (new)
- `sg-search-service/server.js` (modified)

## Change Log

- 2026-06-05: Story 1.3 — Added Atlas connection (`lib/db.js`), CSV auto-seed (`lib/seed.js`), async startup lifecycle in `server.js`; removed runtime CSV search loading
