---
baseline_commit: f5aa6a915e249077244c8e6b66f823d08afe6d43
---

# Story 2.1: Lab Guide MongoDB Workflow

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **lab facilitator**,
I want the timed lab guide updated for MongoDB setup,
So that participants complete the backend phase within the 05–15 minute window without CSV parsing steps.

## Acceptance Criteria

1. **Given** `LAB-03-Search-App-Guide.md`  
   **When** I read the architecture diagram  
   **Then** it shows `sg-search-service` → MongoDB Atlas instead of runtime `users.csv` loading

2. **Given** the lab guide prerequisites section  
   **When** I review requirements  
   **Then** they include facilitator-provided Atlas connection string and `.env` file — not local MongoDB install or Docker

3. **Given** the backend phase (05–15 min block)  
   **When** I follow the steps  
   **Then** they cover `.env` setup, Mongoose `User` model awareness, and `npm start` — not CSV parsing in `server.js` and not a separate seed command

4. **Given** the troubleshooting table  
   **When** I review entries  
   **Then** it includes missing `MONGODB_URI`, Atlas connectivity / IP allowlist, and auto-seed failure (missing/malformed `users.csv`)

5. **Given** the facilitator timing cheatsheet  
   **When** I review the backend phase  
   **Then** it reflects MongoDB setup instead of CSV authoring/loading

6. **Given** the lab guide  
   **When** I search for CSV runtime loading instructions  
   **Then** no steps tell participants to implement CSV parsing in `server.js` for search

## Tasks / Subtasks

- [x] Update guide header, intro, and stack description (AC: #5, #6)
  - [x] Change stack line from "CSV-backed API" to MongoDB Atlas
  - [x] Update intro paragraph: Atlas persistence, auto-seed, unchanged API contract
  - [x] Update "What you are building" backend bullet — query MongoDB, not load CSV at runtime
- [x] Rewrite architecture diagram and repository layout (AC: #1)
  - [x] Diagram: `sg-search-service` → MongoDB Atlas (not `reads users.csv`)
  - [x] Layout tree: add `models/User.js`, `lib/db.js`, `lib/seed.js`, `.env.example`; note `users.csv` as seed input only
- [x] Update prerequisites and timing cheatsheet (AC: #2, #5)
  - [x] Add facilitator-provided `MONGODB_URI` and `.env` copy step to prerequisites table
  - [x] Backend phase row (05–15): `.env`, User model, `npm start` — remove CSV authoring / `server.js` CSV parsing goals
  - [x] Explicitly state: no local MongoDB install, no Docker
- [x] Replace Step 1 (CSV authoring) with seed-fixture awareness (AC: #3, #6)
  - [x] Reframe `users.csv` as auto-seed input (12-row fixture), not runtime search data source
  - [x] Remove "create CSV manually so API loads it" narrative and PowerShell CSV creation as primary backend task
  - [x] Keep brief row-count verification optional (fixture sanity check only)
- [x] Rewrite Step 2 backend section for MongoDB workflow (AC: #3, #6)
  - [x] Remove greenfield `package.json` + full CSV `server.js` implementation blocks
  - [x] Add `.env` setup: copy `.env.example` → `.env`, paste facilitator URI (quote guidance)
  - [x] Add `models/User.js` awareness section (schema fields, unique email, seed/search role)
  - [x] Document `npm start` startup sequence and expected logs (`Connected to MongoDB — 12 users...`)
  - [x] Update smoke tests to expect MongoDB-backed responses (same counts)
  - [x] Cross-reference `sg-search-service/README.md` for API matrix and troubleshooting depth
- [x] Update Quick Start / VS Code debug sections (AC: #3)
  - [x] Note `setup-lab.ps1` checks deps + `users.csv` seed file (MongoDB `.env` validation is Story 2.2 — describe target behavior in guide prose without modifying script)
  - [x] Search API debug: requires `MONGODB_URI` (via `.env` in `sg-search-service/` or `envFile` in launch config example)
  - [x] Update embedded `launch.json` example `Search API` env block or add `envFile` note
- [x] Update troubleshooting table (AC: #4)
  - [x] Add rows: missing `MONGODB_URI`, Atlas connection/IP allowlist, auto-seed failure
  - [x] Remove or replace CSV-era rows: `Loaded 0 users`, runtime CSV parse errors as primary causes
  - [x] Preserve CORS, port conflict, `file://`, verify-lab failures (still valid)
- [x] Update verification and wrap-up sections (AC: #6)
  - [x] Step 4: prerequisite note — backend must complete MongoDB connect + auto-seed before `verify-lab.ps1`
  - [x] "What you accomplished" — MongoDB-backed store, Mongoose model, auto-seed (not CSV runtime loading)
  - [x] Remove "swap CSV for a real database" as future step — MongoDB is now the database
- [x] Validation gate (AC: all)
  - [x] Grep guide for forbidden phrases: `loadUsers`, `csv-parse`, `Loaded .* users from users.csv`, `reads users.csv` (runtime context)
  - [x] Grep guide for required phrases: `MONGODB_URI`, `MongoDB Atlas`, `models/User.js`, `auto-seed`, `Connected to MongoDB`
  - [x] Confirm timing table backend row matches MongoDB setup
  - [x] Confirm verification matrix counts unchanged (1, 3, 2, 3, 0, 400)
  - [x] Confirm zero files modified except `LAB-03-Search-App-Guide.md`

### Review Findings

- [x] [Review][Patch] Auto-seed wrongly described as "if collection is empty" [LAB-03-Search-App-Guide.md:37,185,259]
- [x] [Review][Patch] syncIndexes step omits warn-only / non-fatal behavior [LAB-03-Search-App-Guide.md:258]
- [x] [Review][Defer] setup-lab.ps1 terminal output lacks `.env` creation reminder [setup-lab.ps1:107-132] — deferred, Story 2.2 scope
- [x] [Review][Defer] verify-lab.ps1 CORS header check claimed but not implemented [LAB-03-Search-App-Guide.md:669] — deferred, pre-existing
- [x] [Review][Defer] Shared Atlas cluster may log >12 users via countDocuments() [LAB-03-Search-App-Guide.md:659,265] — deferred, workshop infra

## Dev Notes

### Epic Context

Epic 2 aligns facilitator-facing lab artifacts with the MongoDB backend completed in Epic 1. **Story 2.1 updates the primary timed lab guide**; script changes are **Story 2.2**.

| Story | Scope | Status |
|-------|-------|--------|
| **2.1** | **`LAB-03-Search-App-Guide.md` MongoDB workflow** | **this story** |
| 2.2 | `setup-lab.ps1` + `verify-lab.ps1` MongoDB readiness | backlog |

Epic 1 delivered a working MongoDB backend. Participants no longer implement CSV parsing — they configure Atlas access and run `npm start`.

### Current Lab Guide State (READ BEFORE EDITING)

**`LAB-03-Search-App-Guide.md`** — 890 lines, **fully CSV-era**. Key sections requiring replacement:

| Section | Lines (approx) | Current (wrong) | Required (MongoDB) |
|---------|----------------|-----------------|---------------------|
| Stack tagline | 5 | `CSV-backed API` | `MongoDB Atlas API` |
| Intro | 7 | "mock data in CSV" | Atlas persistence + auto-seed |
| Timing cheatsheet | 16 | Backend: `users.csv`, `server.js` CSV | Backend: `.env`, User model, `npm start` |
| Architecture diagram | 28–34 | `reads users.csv` | `MongoDB Atlas` |
| Backend bullet | 36 | Loads CSV at startup | Connects Atlas, auto-seeds, queries MongoDB |
| Prerequisites | 39–48 | No Atlas / `.env` | Facilitator `MONGODB_URI`, `.env` file |
| Repo layout | 52–66 | Missing `models/`, `lib/`, `.env.example` | Full MongoDB module tree |
| Step 1 | 171–216 | Manual CSV authoring as core task | Seed fixture awareness only |
| Step 2.1–2.2 | 219–366 | Create `package.json` + 100-line CSV `server.js` | `.env` + model awareness + `npm start` |
| Step 2.3 startup log | 377 | `Loaded 12 users from users.csv` | `Connected to MongoDB — 12 users in users collection` |
| VS Code Search API | 91, 127–134 | "CSV load" debug purpose | MongoDB startup; needs `MONGODB_URI` |
| Troubleshooting | 863–873 | CSV missing/malformed primary | + MongoDB URI, Atlas, auto-seed rows |
| Accomplishments | 877–885 | "CSV-backed user store" | MongoDB + Mongoose + auto-seed |

**Sections to preserve largely unchanged:**
- Lab timeline block structure (00–05, 05–15, 15–25, 25–30) — **timing preserved per NFR-2**
- Step 3 frontend (HTML/CSS/JS) — **NFR-3 zero frontend diffs**
- Step 4 verification matrix counts — **SM-1 parity gate**
- Step 5 Git workflow
- CORS / `file://` / port troubleshooting (still valid)

### Cross-Story Boundaries

**In scope for Story 2.1:**

| File | Change |
|------|--------|
| `LAB-03-Search-App-Guide.md` | Full MongoDB workflow rewrite per ACs |

**Out of scope (do NOT modify):**

| File | Owner | Reason |
|------|-------|--------|
| `setup-lab.ps1` | Story 2.2 | Script MongoDB checks not yet implemented |
| `verify-lab.ps1` | Story 2.2 | Troubleshooting hint updates deferred |
| `sg-search-service/README.md` | Story 1.5 (done) | Reference as authoritative service doc |
| `sg-search-service/server.js`, `lib/*`, `models/*` | Epic 1 (done) | Runtime complete |
| `sg-search/**` | Frozen (NFR-3) | Zero frontend diffs |
| `.vscode/launch.json` | Optional | Guide may update embedded example only; actual file change not required unless facilitator debug broken |

**Alignment note:** Guide prose may describe the **target** `setup-lab.ps1` behavior (`.env` + `MONGODB_URI` check) that Story 2.2 will implement. Do not edit the script in this story.

### Technical Requirements

#### Target architecture diagram (AC #1)

```
┌─────────────────┐     fetch (CORS)      ┌──────────────────────┐     Mongoose      ┌─────────────────┐
│  sg-search/     │ ────────────────────► │  sg-search-service/  │ ────────────────► │  MongoDB Atlas  │
│  port 3000      │   GET /api/search     │  port 3001           │   users coll.   │  (shared cluster) │
│  (npx serve)    │                       │  auto-seed from CSV  │                   │                 │
└─────────────────┘                       └──────────────────────┘                   └─────────────────┘
                                          users.csv = seed input only (startup)
```

#### Target timing cheatsheet backend row (AC #5)

| Minutes | Phase | Goal |
|---------|-------|------|
| **05–15** | Backend | `.env` + `MONGODB_URI`, review `models/User.js`, `npm start`, smoke test API |

#### Target backend phase steps (AC #3)

1. **Configure environment**
   ```powershell
   cd sg-search-service
   Copy-Item .env.example .env
   # Paste facilitator MONGODB_URI into .env (quote if URI contains # or =)
   ```

2. **Understand the User model** — open `models/User.js`:
   - Fields: `firstName`, `lastName`, `email`, `department`, `city` (required, trimmed)
   - `email` unique → idempotent auto-seed upsert
   - Search queries this model; API returns five fields only (no `_id`/`__v`)

3. **Start the API**
   ```powershell
   npm install   # if not already done via setup-lab.ps1
   npm start
   ```
   Expected output:
   ```
   Connected to MongoDB — 12 users in users collection
   sg-search-service listening on http://localhost:3001
   ```

4. **Smoke test** (unchanged counts):
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:3001/health"
   Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/search?firstName=John&lastName=Smith"
   # Expect: status ok, count 1
   ```

**Forbidden in backend phase:**
- Implementing `loadUsers()` or `csv-parse` in `server.js` for search
- Manual seed commands (`npm run seed`, `mongoimport`, etc.)
- Instructions to install local MongoDB or Docker
- Full greenfield `server.js` paste from CSV era (lines 257–366 of current guide)

#### Target prerequisites table additions (AC #2)

| Requirement | Notes |
|-------------|--------|
| **Facilitator Atlas URI** | Shared `MONGODB_URI` distributed securely before lab |
| **`sg-search-service/.env`** | Copy from `.env.example`; never commit real credentials |
| **Network access** | Atlas IP allowlist configured by facilitator (no local DB install) |

#### Target troubleshooting rows (AC #4)

Add or replace with these minimum rows:

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Startup failed: MONGODB_URI is required` | Missing/empty `.env` | Copy `.env.example` → `.env`, paste facilitator URI |
| `Startup failed:` + connection error | Invalid URI or Atlas unreachable | Verify URI; ask facilitator about IP allowlist / VPN |
| `Startup failed:` + seed/CSV error | Missing/malformed `users.csv` | Restore fixture from repo; check column headers |
| Search `count` mismatch after MongoDB migration | Auto-seed didn't run or wrong fixture | Restart `npm start`; confirm `Connected to MongoDB — 12 users` in logs |
| VS Code Search API debug exits immediately | Debug env lacks `MONGODB_URI` | Ensure `sg-search-service/.env` exists or add `envFile` to launch config |

Keep existing rows for CORS, `EADDRINUSE`, `file://`, `verify-lab.ps1` all FAIL.

#### Verification matrix — unchanged (SM-1)

| Query | Expected `count` |
|-------|------------------|
| `firstName=John` + `lastName=Smith` | **1** |
| `firstName=John` | **3** |
| `lastName=Smith` | **2** |
| `firstName=john` | **3** |
| `firstName=Nobody` | **0** |
| *(no params)* | **HTTP 400** |

#### Grep validation commands

```powershell
# From repo root — forbidden phrases (runtime CSV context)
Select-String -Path LAB-03-Search-App-Guide.md -Pattern 'loadUsers|csv-parse/sync|Loaded \d+ users from users\.csv|reads users\.csv' 

# Required MongoDB workflow signals
Select-String -Path LAB-03-Search-App-Guide.md -Pattern 'MONGODB_URI|MongoDB Atlas|models/User\.js|auto-seed|Connected to MongoDB'
```

### Architecture Compliance

- **Single file change** at repo root — `LAB-03-Search-App-Guide.md` per architecture project tree `(MOD)` annotation [Source: architecture § Project Structure]
- **Lab time preserved** — same 30-min blocks; backend phase ≤ 5 min median for `.env` + `npm start` [Source: NFR-2 / SM-2]
- **No frontend guide changes** beyond incidental wording — Step 3 content preserved [Source: NFR-3]
- **No CSV runtime loading instructions** — aligns with FR-5, FR-10, SM-4 [Source: epics.md FR Coverage]
- **Reference README for service depth** — avoid duplicating full troubleshooting/API matrix; link or cross-reference `sg-search-service/README.md` [Source: Story 1.5 completion]
- **users.csv retained as seed input** — guide must not imply deletion of fixture [Source: architecture § Data Boundaries]

### Library & Framework Requirements

This is a **documentation-only story** — no npm dependencies change.

| Technology | Role in Guide |
|------------|---------------|
| MongoDB Atlas | Managed persistence; shared facilitator cluster |
| Mongoose 9.6.3 | ODM — `User` model at `models/User.js` |
| dotenv 17.4.2 | Loads `MONGODB_URI` from `.env` at startup |
| `users.csv` | Auto-seed input via `lib/seed.js` — not search runtime |
| Express 4.x | Unchanged — same routes and ports |

### File Structure Requirements

**Files to MODIFY:**

| File | Change |
|------|--------|
| `LAB-03-Search-App-Guide.md` | MongoDB workflow rewrite per section map above |

**Files to READ for accuracy (do not modify):**

| File | Use |
|------|-----|
| `sg-search-service/README.md` | Startup logs, troubleshooting, test matrix — mirror in guide |
| `sg-search-service/.env.example` | Exact placeholder and quoting guidance |
| `sg-search-service/models/User.js` | Schema field names for guide |
| `sg-search-service/server.js` | Startup sequence order for guide accuracy |
| `sg-search-service/lib/seed.js` | Auto-seed behavior description |
| `setup-lab.ps1` | Current behavior vs target (describe target in guide only) |
| `verify-lab.ps1` | Unchanged test cases — guide verification section stays compatible |

### Testing Requirements

**Primary gate — documentation grep (no server required):**

```powershell
# Forbidden runtime CSV instructions absent
$forbidden = Select-String -Path LAB-03-Search-App-Guide.md -Pattern 'function loadUsers|parse\(raw|Loaded \$\{users\.length\} users from users\.csv'
if ($forbidden) { throw "CSV runtime instructions still present" }

# Required MongoDB signals present
$required = @('MONGODB_URI', 'MongoDB Atlas', 'models/User.js', 'auto-seed', 'Connected to MongoDB')
foreach ($r in $required) {
  if (-not (Select-String -Path LAB-03-Search-App-Guide.md -Pattern $r)) { throw "Missing: $r" }
}
```

**Regression gate — live lab still works (manual, with `.env`):**

```powershell
cd sg-search-service
npm start
# Expect: Connected to MongoDB — 12 users in users collection

# Repo root (separate terminal):
.\verify-lab.ps1
# Expect: all API checks pass (script unchanged in 2.1)
```

**Cross-artifact consistency check:**
- Guide verification matrix counts match `sg-search-service/README.md` table
- Guide startup log strings match actual `server.js` / `lib/seed.js` output
- Guide does not contradict README MongoDB setup steps

### Anti-Patterns (Forbidden in This Story)

- Modifying `setup-lab.ps1` or `verify-lab.ps1` (Story 2.2)
- Modifying any file under `sg-search-service/` or `sg-search/`
- Leaving Step 2 `server.js` CSV implementation block in place
- Instructing participants to parse CSV in `server.js` for search
- Documenting manual seed commands
- Requiring local MongoDB install or Docker
- Changing verification matrix expected counts
- Removing frontend lab sections (Step 3)
- Committing facilitator connection strings in the guide
- Duplicating entire README into the guide — cross-reference instead

### Previous Story Intelligence

#### Story 1.5 (Integration Test & Service Documentation) — done

- `sg-search-service/README.md` is the **authoritative service doc** for MongoDB setup, startup sequence, troubleshooting, and test matrix
- Story 1.5 explicitly deferred lab guide to Epic 2: *"Lab guide/scripts are Epic 2 (stories 2.1–2.2)"*
- README startup sequence: dotenv → validate URI → connectDB → syncIndexes (warn) → seedFromCsv → listen
- Expected log: `Connected to MongoDB — 12 users in users collection`
- `npm test` skip behavior when `MONGODB_URI` unset — mention in guide optional advanced section only

#### Story 1.4 (MongoDB-Backed Search) — done

- Search uses `User.find()` with `$regex` exact match — guide should not teach in-memory `filterUsers()`
- API contract frozen — verification matrix in guide must stay identical
- `verify-lab.ps1` passes against MongoDB backend when running

#### Story 1.3 (Atlas Connection, Auto-Seed) — done

- `users.csv` read only in `lib/seed.js` at startup
- Fail-fast: `Startup failed: MONGODB_URI is required`
- No HTTP traffic until seed completes

**Key handoff Epic 1 → Story 2.1:** Runtime is MongoDB-complete; lab guide is the primary facilitator artifact still describing CSV workflow.

### Git Intelligence

Recent commits (`f5aa6a9`, `36dd8bb`) are workshop UI/index updates. Epic 1 MongoDB implementation exists in working tree. `LAB-03-Search-App-Guide.md` at `f5aa6a9` baseline is unchanged CSV-era — this story brings the guide in line with implemented backend behavior without touching code.

### Latest Tech Information

**MongoDB Atlas workshop pattern (2026):**
- Shared free-tier cluster with facilitator-managed IP allowlist remains standard for timed labs
- Connection string via `MONGODB_URI` in `.env` — never in source or committed docs
- Auto-seed at startup eliminates separate `mongoimport` or manual seed steps (PRD §8 decision)

**VS Code Node debug with dotenv:**
- `server.js` calls `require('dotenv').config()` — F5 from `sg-search-service/` cwd loads `.env` automatically when present
- Guide should note: create `.env` before using **Search API** debug configuration
- Optional launch.json enhancement: `"envFile": "${workspaceFolder}/sg-search-service/.env"` — document in guide embedded example only unless team wants actual `.vscode/launch.json` update (out of scope unless broken)

**Lab guide rewrite strategy:**
- Replace CSV **implementation tutorial** with MongoDB **configuration walkthrough** suitable for brownfield repo
- Preserve 30-minute pacing — backend block is shorter (config + start), freeing time for frontend or verification
- Facilitator timing cheatsheet is the table at lines 13–18 plus backend phase descriptions throughout

### Project Structure Notes

- Single markdown file at repo root — no new directories
- Guide length may shrink (removing ~150 lines of CSV `server.js` tutorial)
- Keep facilitator-facing tone and PowerShell examples consistent with existing guide style
- `setup-lab.ps1` description in guide should note current script still CSV-era until Story 2.2 — OR describe intended MongoDB checks as "setup script will verify .env" with footnote that 2.2 delivers script changes. **Prefer:** describe target MongoDB workflow in guide; add brief note that `setup-lab.ps1` MongoDB validation ships in the next epic story if script not yet updated.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/epics.md#FR-10]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Lab artifact consistency]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Project Structure — LAB-03-Search-App-Guide.md (MOD)]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md#UJ-3]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md#FR-10]
- [Source: _bmad-output/implementation-artifacts/1-5-integration-test-service-documentation.md — README authoritative; lab guide deferred]
- [Source: LAB-03-Search-App-Guide.md — CSV-era file to rewrite]
- [Source: sg-search-service/README.md — mirror startup/troubleshooting accuracy]
- [Source: sg-search-service/.env.example — prerequisite template]
- [Source: sg-search-service/models/User.js — schema reference for guide]
- [Source: sg-search-service/server.js — startup log strings]

## Dev Agent Record

### Agent Model Used

Composer (Cursor AI)

### Debug Log References

None — documentation-only story; validation via grep gates.

### Completion Notes List

- Rewrote `LAB-03-Search-App-Guide.md` from CSV-era to MongoDB Atlas workflow (single file change).
- Removed ~150 lines of greenfield `server.js` / `csv-parse` tutorial; replaced with `.env`, `models/User.js` awareness, and `npm start` configuration walkthrough.
- Updated architecture diagram, prerequisites, timing cheatsheet, VS Code debug (`envFile`), troubleshooting, and wrap-up sections.
- Grep validation: zero forbidden runtime-CSV phrases; all required MongoDB signals present.
- Verification matrix counts preserved: 1, 3, 2, 3, 0, HTTP 400.

### File List

- `LAB-03-Search-App-Guide.md` (modified)

## Change Log

- 2026-06-05: Story 2.1 created — comprehensive lab guide MongoDB workflow context for dev agent
- 2026-06-05: Story 2.1 implemented — lab guide updated for MongoDB Atlas workflow; status → review
