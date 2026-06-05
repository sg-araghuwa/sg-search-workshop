---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: '2026-06-05'
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md"
  - "_bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md"
---

# AI_POC_Lab4 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AI_POC_Lab4, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1: Environment-Based MongoDB Connection — The backend loads `MONGODB_URI` from environment variables (via `.env` in local development). When unset or empty, logs `Startup failed: MONGODB_URI is required` and exits code 1 before `app.listen`. When invalid or Atlas unreachable, logs `Startup failed:` with Mongoose error and exits code 1. On success, console logs connected database name and user count from `users` collection.

FR-2: Health Endpoint (Unchanged Contract) — `GET /health` returns HTTP 200 with JSON `{ "status": "ok" }` when server is running. Health endpoint does not perform a new MongoDB round-trip on every request (liveness only).

FR-3: Mongoose User Schema & Model — A `User` Mongoose model defines document shape: `firstName`, `lastName`, `email`, `department`, `city` (all required strings, trimmed). `email` is unique. Schema file at `models/User.js`. API serialization excludes `_id` and `__v` from search results. `mongoose` in `package.json` dependencies.

FR-4: Automatic Startup Seed from CSV — After `mongoose.connect` succeeds and before `app.listen`, backend reads `sg-search-service/users.csv` and upserts all data rows via `User` model (upsert on `email`). `npm start` alone triggers connect → auto-seed → listen. Console logs number of records upserted (expect 12). Missing `users.csv` causes `Startup failed:` and exit code 1. Re-running does not create duplicates. Auto-seed completes before HTTP traffic accepted.

FR-5: Retire Runtime CSV Loading — `server.js` no longer reads or parses `users.csv` at startup for search. `csv-parse` may remain for auto-seed only. Startup log messages reference MongoDB, not `users.csv`. `users.csv` remains in repo as seed input only.

FR-6: Search Query Semantics (Preserved) — `GET /api/search` accepts optional `firstName` and `lastName` with case-insensitive exact match; empty/missing parameter acts as wildcard. Both provided = AND. Neither provided = HTTP 400 `{ "error": "At least one of firstName or lastName is required" }`. `firstName` > 50 chars = HTTP 400 with existing validation message. Results include all five fields. No matches returns `{ "count": 0, "results": [] }`.

FR-7: Mongoose Query Implementation — Search builds `User.find(...)` equivalent to prior in-memory `filterUsers` logic. Case-insensitive exact match via `$regex` or collation. Both params = AND. Single param = wildcard for other field. Results match CSV implementation for standard test matrix in README.

FR-8: Optional Search Indexes — Indexes on `firstName` and/or `lastName` are performance-only; search results must not change. Index sync failure logs warning but does not block startup.

FR-9: README Updates — `sg-search-service/README.md` documents Atlas connection, shared `.env` setup, automatic startup seeding, and updated troubleshooting. Removes runtime CSV loading instructions. Includes `.env.example` with `MONGODB_URI=` placeholder. Test matrix table unchanged. References `User` model location.

FR-10: Lab Guide Updates — `LAB-03-Search-App-Guide.md` replaces CSV authoring/loading with MongoDB configuration within existing timing blocks. Architecture diagram shows MongoDB Atlas. Prerequisites include Atlas connection string. Backend phase covers `.env`, Mongoose model, `npm start`. Troubleshooting includes missing `MONGODB_URI`, Atlas connectivity/IP allowlist, auto-seed failure.

FR-11: Setup Script Updates — `setup-lab.ps1` validates MongoDB readiness: checks `.env` with non-empty `MONGODB_URI`, verifies Node 18+, runs `npm install`. Does not prompt for manual seed. Confirms `users.csv` exists as seed input only.

FR-12: Verification Script Compatibility — `verify-lab.ps1` continues to pass against MongoDB-backed backend without test case changes. Troubleshooting hints mention MongoDB connection failures. Expected counts and field validation unchanged.

FR-13: Repository Hygiene — `.env` in `.gitignore`. `.env.example` committed with placeholder only. No connection strings in source code, guides, or committed config.

### NonFunctional Requirements

NFR-1 (SM-1): Search Parity — 100% of README/verify-lab test matrix cases return identical `count` and equivalent `results` vs. CSV baseline. Primary architectural validation gate.

NFR-2 (SM-2): Lab Time Preserved — Backend phase (05–15 min block) completable without local DB install. Median setup including `.env` + `npm start` ≤ 5 minutes.

NFR-3 (SM-3): Zero Frontend Diffs — No file changes under `sg-search/` required for a passing lab run. API serialization excludes `_id` and `__v`.

NFR-4 (SM-4): Documentation Completeness — All four artifacts (README, lab guide, setup script, verify script) reference MongoDB workflow; no remaining CSV runtime-loading instructions.

NFR-5 (SM-C1): Architectural Restraint — Single `User` Mongoose model only. No repository/service layers, multiple collections, or migrations frameworks.

NFR-6: Security — Shared Atlas credentials via `.env`. `.gitignore` excludes secrets. No connection strings in source or committed config. CORS unchanged.

NFR-7: Reliability — Fail-fast startup on connection, seed, and config failures. Index sync failure warns but does not block startup. Post-startup connection drops out of scope for v1.

NFR-8: Brownfield Compatibility — Node.js 18+, Express 4.x retained. Ports frozen: frontend 3000, backend 3001. API contract frozen (endpoints, params, status codes, JSON shapes, error messages).

NFR-9: Testing — Existing `search-validation.test.js` updated to pass `MONGODB_URI` from environment when spawning server. No new test framework or mock layer for MVP.

### Additional Requirements

- **Starter Template (Brownfield Extension):** No re-scaffold. First implementation step is `npm install mongoose@^9.6.3 dotenv@^17.4.2` in `sg-search-service`, then create `models/User.js`, `lib/db.js`, `lib/seed.js`, and refactor `server.js` — not a greenfield starter.
- **Module Structure:** `models/User.js` (schema + model), `lib/db.js` (`connectDB()`), `lib/seed.js` (`seedFromCsv()` bulkWrite upsert), `server.js` (Express + async `main()` orchestration). No `services/`, `repositories/`, or `controllers/` directories.
- **Startup Sequence:** `dotenv.config()` → validate `MONGODB_URI` → `await connectDB()` → `await seedFromCsv()` → log user count → `app.listen(PORT)`. HTTP must not accept traffic until seed completes.
- **Database Configuration:** MongoDB Atlas; database `sg-search-lab` (override via `MONGODB_DB`); collection `users` (override via `MONGODB_COLLECTION`).
- **Search Query Pattern:** `User.find(filter).select('firstName lastName email department city -_id').lean()`. Case-insensitive exact match via `$regex: ^${escapedValue}$` with `$options: 'i'`. RegExp special characters must be escaped.
- **Seed Strategy:** `csv-parse/sync` → validate required columns → `User.bulkWrite` with `updateOne` + `upsert: true` on `email`. Never `insertMany`.
- **Error Message Strings (frozen):** `"At least one of firstName or lastName is required"`, `"firstName must not exceed 50 characters"`, startup failures use `console.error('Startup failed:', message)` + `process.exit(1)`.
- **Integration Test Update:** `test/search-validation.test.js` must pass `MONGODB_URI` from environment when spawning `server.js`.
- **Lab Script Updates:** `setup-lab.ps1` and `verify-lab.ps1` at repo root; `LAB-03-Search-App-Guide.md` architecture diagram and timing cheatsheet updated.
- **Environment Files:** `.env.example` in `sg-search-service/` with `MONGODB_URI=` placeholder; `.env` gitignored.
- **Implementation Sequence:** (1) dependencies + `.env.example`, (2) `models/User.js`, (3) `lib/db.js`, (4) `lib/seed.js`, (5) refactor `server.js`, (6) update integration test, (7) update lab artifacts.
- **Validation Gate:** Run `verify-lab.ps1` and `npm test` (with `MONGODB_URI` set) before marking stories complete.
- **Anti-Patterns (forbidden):** In-memory user cache after seed, `insertMany` for seeding, exposing `_id`/`__v` in API responses, files under `sg-search/`, committed secrets.

### UX Design Requirements

_N/A — UX excluded per user confirmation. Frontend frozen per Architecture (SM-3). No changes under `sg-search/`._

### FR Coverage Map

FR-1: Epic 1 — Environment-based MongoDB connection
FR-2: Epic 1 — Health endpoint (unchanged contract)
FR-3: Epic 1 — Mongoose User schema & model
FR-4: Epic 1 — Automatic startup seed from CSV
FR-5: Epic 1 — Retire runtime CSV loading
FR-6: Epic 1 — Search query semantics (preserved)
FR-7: Epic 1 — Mongoose query implementation
FR-8: Epic 1 — Optional search indexes
FR-9: Epic 1 — Service README updates
FR-10: Epic 2 — Lab guide updates
FR-11: Epic 2 — Setup script updates
FR-12: Epic 2 — Verification script compatibility
FR-13: Epic 1 — Repository hygiene (`.env`, `.env.example`)

## Epic List

### Epic 1: Participant MongoDB Lab Backend

A workshop participant configures `.env`, runs `npm start`, and gets a MongoDB-backed search API that behaves identically to the CSV version — frontend unchanged, verification test matrix passes.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-13

### Epic 2: Facilitator Workshop Readiness

A facilitator or maintainer can onboard the next cohort using updated guides and scripts — setup validates MongoDB readiness, verification passes, and all artifacts describe the MongoDB workflow (not CSV runtime loading).

**FRs covered:** FR-10, FR-11, FR-12

## Epic 1: Participant MongoDB Lab Backend

A workshop participant configures `.env`, runs `npm start`, and gets a MongoDB-backed search API that behaves identically to the CSV version — frontend unchanged, verification test matrix passes.

### Story 1.1: Project Foundation & Secure Environment Setup

As a **developer participant**,
I want Mongoose dependencies and a secure environment template,
So that I can configure my Atlas connection without committing secrets.

**Acceptance Criteria:**

**Given** the brownfield `sg-search-service` codebase
**When** I run `npm install` in `sg-search-service`
**Then** `package.json` includes `mongoose@^9.6.3` and `dotenv@^17.4.2` as dependencies

**Given** the project root and `sg-search-service/`
**When** I inspect version control configuration
**Then** `.env` is listed in `.gitignore` and no real connection strings appear in committed files

**Given** `sg-search-service/.env.example` exists
**When** I open the file
**Then** it contains `MONGODB_URI=` as a placeholder with no real credentials

**Given** I have copied `.env.example` to `.env` with a valid facilitator `MONGODB_URI`
**When** I inspect `server.js`
**Then** `require('dotenv').config()` is called at process entry before any `MONGODB_URI` reads

---

### Story 1.2: Mongoose User Model & Schema

As a **developer participant**,
I want a validated `User` Mongoose model,
So that user records in MongoDB have a consistent, enforceable document shape.

**Acceptance Criteria:**

**Given** `sg-search-service/models/User.js` exists
**When** I inspect the schema definition
**Then** fields `firstName`, `lastName`, `email`, `department`, and `city` are `String`, `required: true`, `trim: true`

**Given** the `User` schema
**When** I inspect the `email` field
**Then** it has `unique: true` to support idempotent upsert on auto-seed

**Given** the `User` schema
**When** optional search indexes are declared
**Then** an index on `firstName` and/or `lastName` may be added for performance only (not required for correctness)

**Given** a document missing a required field
**When** Mongoose validation runs during seed or save
**Then** the operation is rejected with a validation error

**Given** the model is exported
**When** I inspect the export
**Then** it uses `mongoose.model('User', userSchema)` bound to the `users` collection

---

### Story 1.3: Atlas Connection, Auto-Seed & Startup Lifecycle

As a **developer participant**,
I want `npm start` to connect Atlas, auto-seed from CSV, and listen on port 3001,
So that I am ready to search with one command and no manual seed step.

**Acceptance Criteria:**

**Given** `MONGODB_URI` is unset or empty
**When** I run `npm start`
**Then** the process logs `Startup failed: MONGODB_URI is required` and exits with code 1 before accepting HTTP traffic

**Given** `MONGODB_URI` is invalid or Atlas is unreachable
**When** I run `npm start`
**Then** the process logs `Startup failed:` with the Mongoose connection error and exits with code 1

**Given** `lib/db.js` exports `connectDB()`
**When** connection succeeds
**Then** `mongoose.connect(MONGODB_URI)` completes before any seed or listen step

**Given** `users.csv` is missing or malformed
**When** auto-seed runs during startup
**Then** the process logs `Startup failed:` with a descriptive message and exits with code 1

**Given** a valid `MONGODB_URI` and `users.csv` with 12 data rows
**When** I run `npm start`
**Then** `lib/seed.js` upserts all records via `bulkWrite` with `upsert: true` on `email` before `app.listen`

**Given** startup completes successfully
**When** I read the console output
**Then** it logs connected database info and user count (e.g. `Connected to MongoDB — 12 users in users collection`)

**Given** I run `npm start` a second time with the same fixture
**When** auto-seed completes
**Then** no duplicate logical users are created (upsert on unique `email`)

**Given** the server is running
**When** I call `GET /health`
**Then** I receive HTTP 200 with `{ "status": "ok" }` without a per-request MongoDB round-trip

**Given** `server.js` after this story
**When** I inspect startup behavior
**Then** runtime CSV loading for search is removed; `users.csv` is seed input only; startup logs reference MongoDB not CSV parsing for search

---

### Story 1.4: MongoDB-Backed Search with Preserved API Contract

As a **developer participant**,
I want the search API to query MongoDB with identical behavior to the CSV implementation,
So that the existing frontend and test matrix work without modification.

**Acceptance Criteria:**

**Given** the backend is running with auto-seed completed
**When** I call `GET /api/search?firstName=John&lastName=Smith`
**Then** I receive HTTP 200 with `{ "count": 1, "results": [...] }` containing one matching user

**Given** the backend is running
**When** I call `GET /api/search?firstName=John`
**Then** I receive `{ "count": 3, "results": [...] }`

**Given** the backend is running
**When** I call `GET /api/search?lastName=Smith`
**Then** I receive `{ "count": 2, "results": [...] }`

**Given** the backend is running
**When** I call `GET /api/search?firstName=john`
**Then** I receive `{ "count": 3, "results": [...] }` (case-insensitive exact match)

**Given** the backend is running
**When** I call `GET /api/search` with no non-empty `firstName` or `lastName`
**Then** I receive HTTP 400 with `{ "error": "At least one of firstName or lastName is required" }`

**Given** the backend is running
**When** I call `GET /api/search?firstName=Nobody`
**Then** I receive `{ "count": 0, "results": [] }` with HTTP 200

**Given** the backend is running
**When** I call `GET /api/search` with `firstName` longer than 50 characters
**Then** I receive HTTP 400 with `{ "error": "firstName must not exceed 50 characters" }`

**Given** any successful search response
**When** I inspect each result object
**Then** it contains only `firstName`, `lastName`, `email`, `department`, `city` — no `_id` or `__v`

**Given** the search implementation uses `User.find(filter).select('firstName lastName email department city -_id').lean()`
**When** I compare results against the README test matrix
**Then** every case returns identical `count` and equivalent `results` vs. the CSV baseline

**Given** search input contains RegExp special characters
**When** the query is built
**Then** values are escaped before `$regex` construction with `^...$` and `$options: 'i'`

**Given** optional indexes fail to sync at startup
**When** the server starts
**Then** a warning is logged but startup is not blocked

---

### Story 1.5: Integration Test & Service Documentation

As a **developer participant**,
I want updated integration tests and service README,
So that I can verify search parity and follow accurate MongoDB setup instructions.

**Acceptance Criteria:**

**Given** `MONGODB_URI` is set in the environment
**When** I run `npm test` in `sg-search-service`
**Then** `test/search-validation.test.js` spawns `server.js` with `MONGODB_URI` inherited and all tests pass

**Given** `MONGODB_URI` is unset
**When** I run `npm test`
**Then** tests are skipped or document the prerequisite without false failures

**Given** `sg-search-service/README.md`
**When** I read setup instructions
**Then** they describe Atlas connection, `.env` configuration, and `npm start` (connect → auto-seed → listen) — not runtime CSV loading or manual seed commands

**Given** `sg-search-service/README.md`
**When** I inspect the test matrix table
**Then** expected counts are unchanged from the CSV baseline

**Given** `sg-search-service/README.md`
**When** I read troubleshooting guidance
**Then** it covers missing `MONGODB_URI`, Atlas connectivity, and auto-seed failures

**Given** `sg-search-service/README.md`
**When** I look for model documentation
**Then** it references the `User` model location (`models/User.js`)

**Given** no files under `sg-search/` were modified
**When** I run the lab with MongoDB backend
**Then** the frontend works without changes (NFR-3)

---

## Epic 2: Facilitator Workshop Readiness

A facilitator or maintainer can onboard the next cohort using updated guides and scripts — setup validates MongoDB readiness, verification passes, and all artifacts describe the MongoDB workflow (not CSV runtime loading).

### Story 2.1: Lab Guide MongoDB Workflow

As a **lab facilitator**,
I want the timed lab guide updated for MongoDB setup,
So that participants complete the backend phase within the 05–15 minute window without CSV parsing steps.

**Acceptance Criteria:**

**Given** `LAB-03-Search-App-Guide.md`
**When** I read the architecture diagram
**Then** it shows `sg-search-service` → MongoDB Atlas instead of runtime `users.csv` loading

**Given** the lab guide prerequisites section
**When** I review requirements
**Then** they include facilitator-provided Atlas connection string and `.env` file — not local MongoDB install or Docker

**Given** the backend phase (05–15 min block)
**When** I follow the steps
**Then** they cover `.env` setup, Mongoose `User` model awareness, and `npm start` — not CSV parsing in `server.js` and not a separate seed command

**Given** the troubleshooting table
**When** I review entries
**Then** it includes missing `MONGODB_URI`, Atlas connectivity / IP allowlist, and auto-seed failure (missing/malformed `users.csv`)

**Given** the facilitator timing cheatsheet
**When** I review the backend phase
**Then** it reflects MongoDB setup instead of CSV authoring/loading

**Given** the lab guide
**When** I search for CSV runtime loading instructions
**Then** no steps tell participants to implement CSV parsing in `server.js` for search

---

### Story 2.2: Workshop Setup & Verification Scripts

As a **lab facilitator**,
I want setup and verification scripts aligned with MongoDB readiness,
So that pre-flight checks and smoke tests validate the new persistence model without changing test expectations.

**Acceptance Criteria:**

**Given** `setup-lab.ps1` at repo root
**When** I run it before the lab
**Then** it verifies Node 18+, runs `npm install` in `sg-search-service`, and checks for `.env` with non-empty `MONGODB_URI`

**Given** `.env` is missing or `MONGODB_URI` is empty
**When** I run `setup-lab.ps1`
**Then** it prints facilitator instructions for obtaining the shared connection string

**Given** `setup-lab.ps1`
**When** I review its checks
**Then** it confirms `users.csv` exists as seed input only and does not prompt for a manual seed step

**Given** the backend is running with auto-seed completed
**When** I run `verify-lab.ps1` from repo root
**Then** all existing smoke tests pass with unchanged expected counts and field validation

**Given** `verify-lab.ps1`
**When** I review troubleshooting hints
**Then** they mention MongoDB connection failures where relevant

**Given** `verify-lab.ps1`
**When** I compare test cases to the pre-MongoDB version
**Then** no test case expectations (counts, fields, endpoints) were modified

**Given** all four lab artifacts (README, lab guide, setup script, verify script)
**When** I review them together
**Then** they consistently describe the MongoDB workflow with no conflicting CSV runtime-loading instructions (NFR-4)
