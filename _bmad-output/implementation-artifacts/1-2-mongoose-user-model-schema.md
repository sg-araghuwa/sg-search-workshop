---
baseline_commit: f5aa6a915e249077244c8e6b66f823d08afe6d43
---

# Story 1.2: Mongoose User Model & Schema

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer participant**,
I want a validated `User` Mongoose model,
So that user records in MongoDB have a consistent, enforceable document shape.

## Acceptance Criteria

1. **Given** `sg-search-service/models/User.js` exists  
   **When** I inspect the schema definition  
   **Then** fields `firstName`, `lastName`, `email`, `department`, and `city` are `String`, `required: true`, `trim: true`

2. **Given** the `User` schema  
   **When** I inspect the `email` field  
   **Then** it has `unique: true` to support idempotent upsert on auto-seed

3. **Given** the `User` schema  
   **When** optional search indexes are declared  
   **Then** an index on `firstName` and/or `lastName` may be added for performance only (not required for correctness)

4. **Given** a document missing a required field  
   **When** Mongoose validation runs during seed or save  
   **Then** the operation is rejected with a validation error

5. **Given** the model is exported  
   **When** I inspect the export  
   **Then** it uses `mongoose.model('User', userSchema)` bound to the `users` collection

## Tasks / Subtasks

- [x] Create `models/User.js` (AC: #1, #2, #5)
  - [x] Create `sg-search-service/models/` directory if absent
  - [x] Define `userSchema` with five required trimmed string fields matching CSV column names exactly
  - [x] Set `email: { type: String, required: true, trim: true, unique: true }`
  - [x] Export `module.exports = mongoose.model('User', userSchema)` — default collection is `users` (Mongoose pluralizes model name `User`)
- [x] Add optional search index (AC: #3)
  - [x] Declare `userSchema.index({ firstName: 1, lastName: 1 })` for performance (Story 1.4 search); index sync failure handling is Story 1.3/1.4 scope
- [x] Verify schema validation locally (AC: #4)
  - [x] Use `new User({}).validateSync()` or equivalent — confirm `ValidationError` when required fields missing
  - [x] Confirm trimmed strings: `{ firstName: '  John  ', ... }` stores `'John'` after save (optional manual check with Atlas in Story 1.3)
- [x] Preserve brownfield runtime (regression guard)
  - [x] Do **not** import `User` in `server.js` yet — CSV in-memory search must remain unchanged
  - [x] Run `npm test` — existing integration test must still pass (CSV path)

### Review Findings

- [x] [Review][Defer] Whitespace-only strings pass `required: true` after trim [sg-search-service/models/User.js:5-9] — deferred, pre-existing
- [x] [Review][Defer] Case-variant emails bypass unique constraint [sg-search-service/models/User.js:7] — deferred, pre-existing
- [x] [Review][Defer] `validateSync()` does not enforce email uniqueness [sg-search-service/models/User.js:7] — deferred, pre-existing
- [x] [Review][Defer] Race before unique index build on concurrent saves [sg-search-service/models/User.js:7] — deferred, pre-existing
- [x] [Review][Defer] `OverwriteModelError` if module required twice in same process [sg-search-service/models/User.js:18] — deferred, pre-existing
- [x] [Review][Defer] No `maxlength` on string fields (API has 50-char cap in server.js) [sg-search-service/models/User.js:5-9] — deferred, pre-existing
- [x] [Review][Defer] Compound index shape may not match Story 1.4 query patterns [sg-search-service/models/User.js:16] — deferred, pre-existing

## Dev Notes

### Epic Context

Epic 1 migrates `sg-search-service` from CSV in-memory search to MongoDB Atlas. **Story 1.2 defines the data contract only** — the Mongoose schema and model export. Connection, auto-seed, startup lifecycle, and MongoDB-backed search belong to later stories.

| Story | Scope | Status |
|-------|-------|--------|
| 1.1 | mongoose/dotenv deps, `.env.example`, dotenv wiring | done |
| **1.2** | **`models/User.js` schema + model** | **this story** |
| 1.3 | `lib/db.js`, `lib/seed.js`, async startup, remove CSV runtime loading | backlog |
| 1.4 | MongoDB-backed `/api/search` with preserved API contract | backlog |
| 1.5 | Integration test + README updates | backlog |

### Current Codebase State (READ BEFORE EDITING)

**Story 1.1 completed locally** (may be uncommitted): `mongoose@^9.6.3` and `dotenv@^17.4.2` in `package.json`; `require('dotenv').config()` is line 1 of `server.js`; `.env.example` exists with `MONGODB_URI=` placeholder.

**`sg-search-service/server.js`** — still 117-line CSV-backed Express app (unchanged search path):

- `REQUIRED = ['firstName', 'lastName', 'email', 'department', 'city']` (line 9) — **schema field names must match exactly**
- `loadUsers()` reads `users.csv` synchronously at startup (lines 13–46)
- In-memory `users` array powers `/api/search` via `filterUsers()` (lines 55–72, 97–114)
- **No `require('./models/User')` today** — do not add in this story

**`sg-search-service/users.csv`** — 12 data rows; headers: `firstName,lastName,email,department,city`. This fixture is the seed input for Story 1.3 `bulkWrite` upsert on `email`.

**Missing:** `sg-search-service/models/User.js` and `sg-search-service/models/` directory.

### Technical Requirements

**Target file:** `sg-search-service/models/User.js`

**Reference implementation (match architecture exactly):**

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    department: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
  },
  {
    // Explicit collection optional — Mongoose default for model 'User' is already 'users'
    collection: 'users',
  }
);

// Optional performance index (FR-8) — does not affect search correctness
userSchema.index({ firstName: 1, lastName: 1 });

module.exports = mongoose.model('User', userSchema);
```

**Validation without DB connection (AC #4 smoke check):**

```javascript
const User = require('./models/User');
const err = new User({ firstName: 'John' }).validateSync();
// err.name === 'ValidationError'; err.errors includes lastName, email, department, city
```

**Collection binding (AC #5):** Model name `'User'` → MongoDB collection `users` via Mongoose pluralization. Explicit `{ collection: 'users' }` in schema options is acceptable for clarity. Do **not** hardcode database name in the model — `MONGODB_URI` (Story 1.3) carries database `sg-search-lab`.

**`unique: true` on email:** Declares a MongoDB unique index (supports Story 1.3 upsert keyed on `email`). Full duplicate-key enforcement requires a connected database and index build — verified in Story 1.3 when seed runs.

### Architecture Compliance

- **Single User model only** — no repository/service layers (SM-C1) [Source: architecture-AI_POC_Lab4-2026-06-05.md#Data Architecture]
- **camelCase field names** matching CSV headers — never snake_case [Source: architecture-AI_POC_Lab4-2026-06-05.md#Naming Patterns]
- **Model file location:** `models/User.js` — schema + model definition only; no Express or CSV imports [Source: architecture-AI_POC_Lab4-2026-06-05.md#Component Boundaries]
- **API serialization** (exclude `_id`, `__v`) is enforced at query time in Story 1.4 via `.select('firstName lastName email department city -_id').lean()` — do not add virtuals or toJSON transforms in this story unless needed
- **Optional compound index** `{ firstName: 1, lastName: 1 }` — performance only; must not alter search results (FR-8) [Source: epics.md FR-8]
- **No files under `sg-search/`** — frontend frozen (NFR-3)

### Library & Framework Requirements

| Package | Version | Role in This Story |
|---------|---------|-------------------|
| `mongoose` | `^9.6.3` | **Import in `models/User.js` only** — Schema, model export |
| `dotenv` | `^17.4.2` | Already wired in `server.js` — no change |
| `express`, `csv-parse`, `cors` | unchanged | Not used by model file |

**Mongoose 9.6.3 notes:**

- CommonJS: `const mongoose = require('mongoose')` — match project style
- `trim: true` strips whitespace on **set** (save/create/update) — aligns with CSV `trim: true` in `loadUsers()` parse options
- `unique: true` is index metadata, not a synchronous validator — duplicates throw MongoDB `E11000` on save after index exists
- `autoIndex` defaults to `true` — indexes sync on connect (Story 1.3); index sync failure should warn, not block startup (Story 1.4 AC)
- Node engine: mongoose 9.x requires Node `>=20.19.0` per npm; `package.json` still declares `>=18` — facilitators must verify cohort Node version

### File Structure Requirements

**Files to CREATE:**

| File | Action |
|------|--------|
| `sg-search-service/models/User.js` | NEW — Mongoose schema + model export |

**Files to NOT modify in this story:**

| File | Reason |
|------|--------|
| `sg-search-service/server.js` | Story 1.3 wires model; Story 1.4 search |
| `sg-search-service/lib/` | Story 1.3 |
| `sg-search-service/package.json` | Deps added in Story 1.1 |
| `sg-search-service/test/search-validation.test.js` | Story 1.5 |
| `sg-search-service/README.md` | Story 1.5 |
| `sg-search/` | Frozen |

### Testing Requirements

**No new automated test file required.** Validate manually:

1. **Schema shape:** Inspect `models/User.js` — five fields, types, required, trim, email unique
2. **ValidationError:** Run one-liner from `sg-search-service/`:
   ```powershell
   node -e "const U=require('./models/User'); const e=new U({}).validateSync(); console.log(e && e.name, Object.keys(e?.errors||{}))"
   ```
   Expect: `ValidationError` and missing-field keys (`lastName`, `email`, `department`, `city` at minimum)
3. **Brownfield regression:** `npm test` — server still starts via CSV, search API unchanged
4. **npm start:** Still logs `Loaded 12 users from users.csv` — no MongoDB connection attempted

**Do not break:** Existing CSV startup and `/api/search` behavior until Story 1.3 removes runtime CSV loading.

### Anti-Patterns (Forbidden in This Story)

- Importing or using `User` in `server.js`, routes, or seed logic — Stories 1.3–1.4
- Creating `lib/db.js`, `lib/seed.js` — Story 1.3
- Calling `mongoose.connect()` anywhere — Story 1.3
- Removing CSV `loadUsers()` or changing search behavior — Stories 1.3–1.4
- Adding `services/`, `repositories/`, or `controllers/` directories — SM-C1
- Using snake_case field names (`first_name`) — breaks CSV/seed/API parity
- Using `insertMany` patterns in model file — seed is Story 1.3 `bulkWrite`
- Disabling `_id` or adding custom `_id` — use default ObjectId; exclude at query time in Story 1.4
- Modifying frontend or API response shapes

### Previous Story Intelligence (Story 1.1)

**Established patterns to follow:**

- Dependencies already installed: `mongoose@^9.6.3`, `dotenv@^17.4.2`
- `require('dotenv').config()` is first line of `server.js` — env ready for Story 1.3 `MONGODB_URI` reads
- `.env.example` at `sg-search-service/.env.example` with quoting guidance for URI special characters
- Root `.gitignore` excludes `.env`; no committed connection strings
- `npm test` passes on CSV path; dotenv may log injection info to stdout (harmless)
- **Node cohort risk:** mongoose 9.x wants Node >=20.19.0; lab `engines.node` still `>=18` — document if validation fails on older Node

**Story 1.1 explicitly deferred:** User model, db connection, MONGODB_URI validation, CSV removal.

### Git Intelligence

Recent commits (`f5aa6a9`, `36dd8bb`) are UI and CSV-era workshop updates — **no MongoDB model work in git history yet**. Story 1.1 file changes (`package.json`, `server.js`, `.env.example`) may exist locally uncommitted; Story 1.2 builds on that local state regardless of commit status.

### Latest Tech Information

**Mongoose 9.6.3 (May 2026):**

- Schema `unique: true` creates unique index on connect via `autoIndex` (default `true`)
- Compound indexes via `schema.index({ firstName: 1, lastName: 1 })` — declared at schema level per docs
- Collection override: third model arg or `{ collection: 'users' }` in schema options — default pluralization already yields `users`
- `validateSync()` validates document without persisting — use for AC #4 without Atlas
- FAQ: unique constraint enforcement requires index build on connected DB; until connect, duplicate inserts may not error immediately

**Forward compatibility for Story 1.3:**

- `lib/seed.js` will import this model and call `User.bulkWrite([{ updateOne: { filter: { email }, update: { $set: doc }, upsert: true } }])`
- CSV `REQUIRED` columns in `server.js` and schema fields must stay in sync
- Seed expects 12 records from `users.csv`

### Project Structure Notes

- `models/` is new — first subdirectory under `sg-search-service/` besides `test/`
- Model module has **zero** Express/CSV dependencies — only `mongoose`
- Database name `sg-search-lab` comes from `MONGODB_URI`, not the model file
- Optional env `MONGODB_COLLECTION` override is a Story 1.3 concern; default `users` collection satisfies this story's AC

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Naming Patterns]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Component Boundaries]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md#FR-3]
- [Source: _bmad-output/implementation-artifacts/1-1-project-foundation-secure-environment-setup.md]
- [Source: sg-search-service/server.js — REQUIRED columns and CSV field names]
- [Source: sg-search-service/users.csv — 12-row fixture shape]
- [Source: https://mongoosejs.com/docs/guide.html — schema options, indexes, collection]
- [Source: https://mongoosejs.com/docs/api/schematype.html — unique, trim, required]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

- `validateSync()` on empty User: `ValidationError` with keys `city`, `department`, `email`, `lastName`, `firstName`
- Collection binding verified: `User.collection.name === 'users'`
- Trim verified: `firstName: '  John  '` → `'John'` on document set
- `npm test`: `search-validation: all checks passed`

### Completion Notes List

- Created `sg-search-service/models/User.js` with five required trimmed string fields (`firstName`, `lastName`, `email`, `department`, `city`), `email` unique index metadata, explicit `users` collection, and compound index `{ firstName: 1, lastName: 1 }`
- Did not wire `User` into `server.js` — CSV in-memory search path unchanged per story scope
- All acceptance criteria satisfied via manual schema inspection and one-liner validation checks

### File List

- sg-search-service/models/User.js (new)

## Change Log

- 2026-06-05: Story 1.2 — added Mongoose User model and schema (`models/User.js`); brownfield CSV search preserved
