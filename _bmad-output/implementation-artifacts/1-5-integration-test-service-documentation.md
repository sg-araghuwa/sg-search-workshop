---
baseline_commit: f5aa6a915e249077244c8e6b66f823d08afe6d43
---

# Story 1.5: Integration Test & Service Documentation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer participant**,
I want updated integration tests and service README,
So that I can verify search parity and follow accurate MongoDB setup instructions.

## Acceptance Criteria

1. **Given** `MONGODB_URI` is set in the environment  
   **When** I run `npm test` in `sg-search-service`  
   **Then** `test/search-validation.test.js` spawns `server.js` with `MONGODB_URI` inherited and all tests pass

2. **Given** `MONGODB_URI` is unset  
   **When** I run `npm test`  
   **Then** tests are skipped or document the prerequisite without false failures

3. **Given** `sg-search-service/README.md`  
   **When** I read setup instructions  
   **Then** they describe Atlas connection, `.env` configuration, and `npm start` (connect → auto-seed → listen) — not runtime CSV loading or manual seed commands

4. **Given** `sg-search-service/README.md`  
   **When** I inspect the test matrix table  
   **Then** expected counts are unchanged from the CSV baseline

5. **Given** `sg-search-service/README.md`  
   **When** I read troubleshooting guidance  
   **Then** it covers missing `MONGODB_URI`, Atlas connectivity, and auto-seed failures

6. **Given** `sg-search-service/README.md`  
   **When** I look for model documentation  
   **Then** it references the `User` model location (`models/User.js`)

7. **Given** no files under `sg-search/` were modified  
   **When** I run the lab with MongoDB backend  
   **Then** the frontend works without changes (NFR-3)

## Tasks / Subtasks

- [x] Update integration test for MongoDB prerequisite (AC: #1, #2)
  - [x] At top of `test/search-validation.test.js`, load `.env` via `require('dotenv').config({ path: path.join(ROOT, '.env') })` so `npm test` picks up facilitator `.env` when present
  - [x] Resolve `MONGODB_URI` from `process.env.MONGODB_URI?.trim()` after dotenv load
  - [x] If empty: log skip message with setup instructions, `process.exit(0)` — no false failure
  - [x] If set: spawn `server.js` with explicit `env: { ...process.env, MONGODB_URI, PORT: String(PORT) }`
  - [x] Keep existing assertions unchanged (John search, 51-char validation, lastName=Smith)
  - [x] Optionally tighten `firstName=John` assertion to `assert.strictEqual(ok.body.count, 3)` for README matrix parity (recommended, not required if flaky on shared cluster)
- [x] Rewrite README for MongoDB workflow (AC: #3–#6)
  - [x] Replace CSV-era "Scope" / Story 1.1–1.4 sections with MongoDB Atlas setup flow
  - [x] Add prerequisites: Node 18+, facilitator `MONGODB_URI`, copy `.env.example` → `.env`
  - [x] Document startup sequence: connect → auto-seed from `users.csv` → listen; expected console output
  - [x] Reference `models/User.js` for schema location
  - [x] Add `npm test` section with `MONGODB_URI` prerequisite
  - [x] Add troubleshooting table: missing URI, Atlas unreachable/IP allowlist, auto-seed failure
  - [x] **Preserve** test matrix table counts exactly (1, 3, 2, 3, 400, 0)
  - [x] **Preserve** CORS, health, and curl/PowerShell examples (still valid)
  - [x] Remove all references to in-memory `users` array, runtime CSV loading, `Loaded 12 users from users.csv`
- [x] Validation gate (AC: all)
  - [x] With valid `.env`: `npm test` passes
  - [x] Without `MONGODB_URI` (rename `.env` temporarily): `npm test` skips cleanly (exit 0)
  - [x] `npm start` + `.\verify-lab.ps1` from repo root still pass (regression)
  - [x] Confirm zero files under `sg-search/` modified

### Review Findings

- [x] [Review][Defer] Strict `count === 3` may flake on polluted shared Atlas cluster [search-validation.test.js:62] — deferred, spec allows optional tighten with shared-cluster caveat
- [x] [Review][Defer] `waitReady()` 5s cap may fail on slow Atlas connect+seed [search-validation.test.js:48-53] — deferred, pre-existing timeout pattern
- [x] [Review][Defer] Startup failures on stderr not surfaced in test error message [search-validation.test.js:37-53] — deferred, pre-existing spawn pattern
- [x] [Review][Defer] Non-empty collection with extra users can skew matrix/integration counts [README.md:43-44] — deferred, workshop single-seed assumption

## Dev Notes

### Epic Context

Epic 1 migrates `sg-search-service` from CSV in-memory search to MongoDB Atlas. **Stories 1.1–1.4 are complete** — MongoDB connection, auto-seed, and live search are implemented. **Story 1.5 closes Epic 1** by aligning the integration test and service README with the new persistence model. Lab guide and root scripts are **Epic 2** (stories 2.1–2.2).

| Story | Scope | Status |
|-------|-------|--------|
| 1.1 | mongoose/dotenv deps, `.env.example`, dotenv wiring | done |
| 1.2 | `models/User.js` schema + model | done |
| 1.3 | `lib/db.js`, `lib/seed.js`, async startup, remove CSV runtime loading | done |
| 1.4 | MongoDB-backed `/api/search` with preserved API contract | done |
| **1.5** | **Integration test + README updates** | **this story** |

### Current Codebase State (READ BEFORE EDITING)

**`sg-search-service/test/search-validation.test.js`** — 70-line integration test, CSV-era spawn pattern:

```javascript
// Lines 26-30: spawns server with spread process.env + PORT override
const child = spawn(process.execPath, ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
```

**Problems today:**
- No explicit `MONGODB_URI` pass-through — relies on child `dotenv.config()` in `server.js` OR parent env
- When neither `.env` nor env var exists, server exits before `listening` → test throws `server did not start` → **false failure** (violates AC #2)
- `npm test` without MongoDB config exits code 1 — unacceptable for CI/docs-only runs

**Assertions to preserve (do not change test cases):**
- `GET /api/search?firstName=John` → HTTP 200, `count >= 1` (optionally tighten to `=== 3`)
- `GET /api/search?firstName=<51 a's>&lastName=Smith` → HTTP 400, error matches `/firstName must not exceed 50 characters/`
- `GET /api/search?lastName=Smith` → HTTP 200

**`sg-search-service/README.md`** — 103 lines, **still CSV-era documentation:**

| Section | Current (wrong) | Required (MongoDB) |
|---------|-----------------|-------------------|
| Scope Story 1.2 | "parsed into in-memory `users` array" | Auto-seed to Atlas via `lib/seed.js` |
| Startup log | `Loaded 12 users from users.csv` | `Connected to MongoDB — 12 users in users collection` |
| Story 1.4 | "filters the in-memory `users` array" | Queries MongoDB via `User.find()` |
| Setup | `npm install` + `npm start` only | Add `.env` copy from `.env.example`, paste `MONGODB_URI` |
| Model | Not mentioned | Reference `models/User.js` |
| Troubleshooting | CSV missing/malformed only | + missing URI, Atlas connectivity, auto-seed |
| Test matrix | Correct counts (keep as-is) | Unchanged |

**`sg-search-service/server.js`** — MongoDB-complete (Story 1.4). **Do not modify** unless test reveals a bug.

**`sg-search-service/.env.example`** — already correct:

```
MONGODB_URI=
```

Quote guidance for `#` and `=` in URI values is present — reference in README.

### Cross-Story Boundaries

**In scope for Story 1.5:**

| File | Change |
|------|--------|
| `test/search-validation.test.js` | MongoDB URI prerequisite, explicit env passthrough, graceful skip |
| `README.md` | MongoDB setup, troubleshooting, model reference; preserve test matrix |

**Out of scope (do NOT modify):**

| File | Owner | Reason |
|------|-------|--------|
| `server.js` | Stories 1.3–1.4 | Search + startup complete |
| `models/User.js`, `lib/db.js`, `lib/seed.js` | Stories 1.2–1.3 | Complete |
| `setup-lab.ps1`, `verify-lab.ps1` | Story 2.2 | Facilitator scripts |
| `LAB-03-Search-App-Guide.md` | Story 2.1 | Lab guide |
| `sg-search/` | Frozen (NFR-3) | Zero frontend diffs |
| `package.json` | No new deps | dotenv already a dependency; test can require it |

### Technical Requirements

#### Target integration test pattern

```javascript
require('dotenv').config({ path: path.join(ROOT, '.env') });

const MONGODB_URI = process.env.MONGODB_URI?.trim();
if (!MONGODB_URI) {
  console.log(
    'search-validation: skipped — MONGODB_URI not set.\n' +
    '  Copy .env.example to .env and paste the facilitator Atlas URI, then re-run npm test.'
  );
  process.exit(0);
}

const child = spawn(process.execPath, ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, MONGODB_URI, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
```

**Non-negotiable rules:**
- Skip exits **0** — not a test failure when URI absent (PRD §8 decision #4)
- Explicit `MONGODB_URI` in spawn `env` — do not rely solely on child's dotenv for test contract
- Test port stays **3099** — avoids conflict with dev server on 3001
- Wait for `listening` in stdout before HTTP requests (existing pattern)
- Kill child in `finally` block (existing pattern)
- **No** new test framework (Jest/Mocha), **no** MongoDB mocks

#### README content requirements (FR-9)

**Required sections (replace or add):**

1. **MongoDB Atlas setup**
   - Copy `sg-search-service/.env.example` → `.env`
   - Paste facilitator-provided `MONGODB_URI` (quote if URI contains `#` or `=`)
   - `npm install` then `npm start`

2. **Startup behavior**
   - Sequence: `dotenv` → validate URI → `connectDB()` → `syncIndexes()` (warn-only) → `seedFromCsv()` → `app.listen()`
   - Expected success log: `Connected to MongoDB — 12 users in users collection`
   - `users.csv` is **seed input only** — not read at search request time

3. **User model**
   - Schema at `models/User.js`: `firstName`, `lastName`, `email`, `department`, `city`
   - Search uses `User.find()` with `.select('firstName lastName email department city -_id').lean()`

4. **Integration test**
   - `npm test` requires `MONGODB_URI` in `.env` or environment
   - Describes skip behavior when URI absent

5. **Troubleshooting table** (minimum rows):

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Startup failed: MONGODB_URI is required` | Missing/empty `.env` | Copy `.env.example` → `.env`, paste URI |
| `Startup failed:` + connection error | Invalid URI or Atlas unreachable | Verify URI; check Atlas IP allowlist with facilitator |
| `Startup failed:` + CSV/seed error | Missing/malformed `users.csv` | Restore `users.csv` from repo |
| `npm test` prints "skipped" | No `MONGODB_URI` | Configure `.env` before running tests |
| Search returns 0 unexpectedly | Auto-seed didn't run | Restart with `npm start`; check startup logs |

6. **Test matrix** — keep existing table verbatim:

| Query | Expected `count` |
|-------|------------------|
| `?firstName=John&lastName=Smith` | 1 |
| `?firstName=John` | 3 |
| `?lastName=Smith` | 2 |
| `?firstName=john` | 3 (case-insensitive) |
| (no params) | HTTP **400** |
| `?firstName=Nobody` | 0 |

### Architecture Compliance

- **Test update only** — existing `search-validation.test.js`; no new test framework [Source: architecture § Testing Framework]
- **MONGODB_URI passthrough** — explicit in spawn env [Source: architecture § Implementation Sequence step 6]
- **Skip when unset** — PRD resolved decision #4 [Source: prd §8]
- **README is service doc only** — lab guide/scripts are Epic 2 [Source: epics.md FR-10–FR-12]
- **Test matrix unchanged** — SM-1 parity gate [Source: architecture § Enforcement Guidelines]
- **No `sg-search/` changes** — NFR-3 frozen frontend

### Library & Framework Requirements

| Package | Version | Role in This Story |
|---------|---------|---------------------|
| `dotenv` | `^17.4.2` | Load `.env` in test file for URI resolution |
| Node `child_process` | built-in | Existing spawn pattern — unchanged |
| Node `assert` | built-in | Existing assertions — unchanged |
| No new deps | — | Do not add Jest, mongodb-memory-server, or sinon |

### File Structure Requirements

**Files to MODIFY:**

| File | Change |
|------|--------|
| `sg-search-service/test/search-validation.test.js` | dotenv load, URI check/skip, explicit MONGODB_URI in spawn env |
| `sg-search-service/README.md` | Full MongoDB workflow rewrite; preserve test matrix + API examples |

**Files to NOT modify:**

| File | Reason |
|------|--------|
| `sg-search-service/server.js` | Complete — Stories 1.3–1.4 |
| `sg-search-service/package.json` | No script or dep changes needed |
| `sg-search-service/.env.example` | Already correct (Story 1.1) |
| `verify-lab.ps1`, `setup-lab.ps1`, `LAB-03-Search-App-Guide.md` | Epic 2 |
| `sg-search/**` | Frozen |

### Testing Requirements

**Primary gate — integration test with Atlas URI:**

```powershell
cd sg-search-service
# Ensure .env has valid MONGODB_URI
npm test
# Expect: search-validation: all checks passed
```

**Skip behavior gate:**

```powershell
# Temporarily rename .env
Rename-Item .env .env.bak
$env:MONGODB_URI = $null
npm test
# Expect: search-validation: skipped — MONGODB_URI not set... (exit 0)
Rename-Item .env.bak .env
```

**Regression gates (must still pass):**

```powershell
cd sg-search-service
npm start
# Expect: Connected to MongoDB — 12 users in users collection

# Separate terminal, repo root:
.\verify-lab.ps1
# Expect: all smoke checks green
```

**README verification (manual):**
- Grep README for "in-memory" or "runtime CSV" — should find **none**
- Grep README for `models/User.js`, `MONGODB_URI`, `auto-seed` — should find matches
- Test matrix counts match table above exactly

### Anti-Patterns (Forbidden in This Story)

- Adding Jest/Mocha or MongoDB mock layer
- Changing integration test assertions to different endpoints or error strings
- Modifying `verify-lab.ps1` or lab guide (Epic 2 scope)
- Changing test matrix expected counts in README
- Documenting manual `npm run seed` — auto-seed only
- Documenting runtime CSV loading for search
- Failing `npm test` with exit 1 when `MONGODB_URI` is simply unset
- Modifying `server.js`, `lib/*`, or `models/*` unless fixing a discovered bug
- Touching any file under `sg-search/`

### Previous Story Intelligence

#### Story 1.4 (MongoDB-Backed Search)

- Live `User.find()` search implemented; README matrix counts verified manually
- `verify-lab.ps1` passes when backend running with Atlas URI
- Story 1.4 completion notes claim `npm test` passed — likely with `.env` present (child dotenv), but test lacks explicit skip/passthrough contract
- Review deferred items (CORS, health DB ping, rate limiting) — **do not address in 1.5**

#### Story 1.3 (Atlas Connection, Auto-Seed & Startup Lifecycle)

- Startup log format: `Connected to MongoDB — N users in users collection`
- Fail-fast: `Startup failed: MONGODB_URI is required` when URI missing
- `users.csv` read only in `lib/seed.js`

#### Story 1.1 (Foundation)

- `.env.example` with `MONGODB_URI=` and quoting guidance
- `dotenv.config()` first line of `server.js`
- `search-validation.test.js` explicitly deferred to Story 1.5

**Key handoff from 1.4 → 1.5:** Search works; documentation and test prerequisite handling are the remaining Epic 1 gaps.

### Git Intelligence

Recent commits (`f5aa6a9`, `36dd8bb`) are CSV-era workshop UI updates. Stories 1.1–1.4 MongoDB work exists locally (may be uncommitted). The integration test and README still reflect CSV assumptions — this story brings them in line with implemented runtime behavior.

### Latest Tech Information

**Node.js child_process spawn env (Node 18+):**
- Child `env` object **replaces** default environment unless `...process.env` is spread first
- Explicit `MONGODB_URI` in spawn env ensures test contract even if `.env` parsing order changes

**dotenv 17.4.2 in test file:**
- `require('dotenv').config({ path })` loads facilitator `.env` when `npm test` runs without shell-exported URI
- Safe to call in test only — `server.js` still calls its own `dotenv.config()` in child

**No framework changes:**
- Architecture and PRD explicitly forbid new test suites for MVP
- Integration test remains a single self-contained `node test/search-validation.test.js` script

### Project Structure Notes

- Only two files change — minimal diff aligned with SM-C1 and story scope
- README rewrite should reorganize sections for clarity but keep existing curl/PowerShell examples where still accurate
- CORS section (Story 1.5 in old README referred to CORS as "Story 1.5") — relabel as general lab requirement, not a numbered story milestone

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Testing Framework]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Implementation Sequence step 6]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md#FR-9]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md#§8 Resolved Decisions #4]
- [Source: _bmad-output/implementation-artifacts/1-4-mongodb-backed-search-with-preserved-api-contract.md]
- [Source: sg-search-service/test/search-validation.test.js — current test to update]
- [Source: sg-search-service/README.md — CSV-era docs to rewrite]
- [Source: sg-search-service/.env.example — template to reference in README]
- [Source: sg-search-service/server.js — startup log strings for README accuracy]
- [Source: verify-lab.ps1 — regression smoke test (do not modify)]

## Dev Agent Record

### Agent Model Used

Composer (Cursor AI)

### Debug Log References

- PS 5.1 `Invoke-WebRequest` returns empty error body stream for HTTP 400; API returns correct JSON (confirmed via `curl.exe` and `Invoke-RestMethod`). Pre-existing `verify-lab.ps1` no-params check limitation documented in Story 1.4.

### Implementation Plan

1. Add dotenv load + `MONGODB_URI` prerequisite/skip at top of integration test
2. Pass explicit `MONGODB_URI` in spawn env; tighten `firstName=John` count assertion to 3
3. Rewrite README for MongoDB Atlas workflow while preserving test matrix and API examples

### Completion Notes List

- Updated `search-validation.test.js`: dotenv load, graceful skip (exit 0) when `MONGODB_URI` unset, explicit URI passthrough in spawn env, tightened John count assertion to 3
- Rewrote `README.md`: MongoDB Atlas setup, startup sequence, `models/User.js` reference, integration test section, troubleshooting table; removed all CSV-era/in-memory references; preserved test matrix counts and CORS/health/curl examples
- Validation: `npm test` passes with `.env`; skips cleanly without URI; `git status sg-search/` clean; `verify-lab.ps1` health + search checks pass (no-params check fails on PS 5.1 only — pre-existing script limitation, API correct)

### File List

- sg-search-service/test/search-validation.test.js (modified)
- sg-search-service/README.md (modified)

## Change Log

- 2026-06-05: Code review complete — all ACs satisfied; 4 items deferred (shared-cluster flake, startup timeout, stderr surfacing, non-empty collection docs)
- 2026-06-05: Story 1.5 — integration test MongoDB prerequisite/skip; README MongoDB workflow rewrite (Epic 1 close-out)
