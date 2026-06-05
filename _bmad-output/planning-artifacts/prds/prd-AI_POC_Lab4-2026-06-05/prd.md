---
title: LAB-03 MongoDB Persistence Enhancement
status: final
created: 2026-06-05
updated: 2026-06-05
---

# PRD: LAB-03 MongoDB Persistence Enhancement

## 0. Document Purpose

This PRD defines requirements for evolving the **LAB-03 Full-Stack Search Application** from CSV file storage to **MongoDB Atlas** persistence. It is written for facilitators, developers implementing the change, and downstream workflows (architecture, epics/stories, dev).

The document builds on the finalized LAB-03 PRD (`prd-BmadPoc-2026-06-04`) and the implemented codebase (`sg-search-service`, `sg-search`, `LAB-03-Search-App-Guide.md`). Vocabulary is Glossary-anchored; features group nested FRs with globally stable IDs (FR-1 through FR-13); resolved decisions are in §8; implementation defaults are in §9.

**Scope boundary:** backend storage-layer replacement and supporting lab artifacts. The frontend and public API contract remain unchanged.

## 1. Vision

The LAB-03 search workshop currently teaches full-stack integration using a local `users.csv` file as a stand-in database. That keeps setup fast but does not reflect how most applications persist data in practice.

This enhancement replaces CSV-backed, in-memory search with **MongoDB Atlas** as the authoritative data store — while preserving the 30-minute lab rhythm and the existing frontend experience. Participants connect to a **pre-provisioned Atlas free-tier cluster** using a supplied connection string; they do not install MongoDB locally or run Docker.

The search API (`GET /api/search`, `GET /health`, CORS, response shapes, validation rules) stays identical so `sg-search` continues to work without modification. On startup, the backend **automatically** imports the existing `users.csv` fixture into Atlas (no manual seed step for participants or facilitators) so search test matrices and verification scripts produce the same results as today.

Success means learners gain hands-on exposure to database connection, **Mongoose models and schemas**, and query-based retrieval — without the lab becoming an infrastructure exercise.

## 2. Target User

### 2.1 Jobs To Be Done

- **As a Lab Facilitator**, I want participants to connect to a shared Atlas cluster with minimal setup so that the workshop stays on schedule and nobody blocks on local database installation.
- **As a Developer Participant**, I want to replace file-based storage with a Mongoose-backed MongoDB connection so that I understand how schemas, models, and queries work in a realistic Node.js backend.
- **As a Maintainer**, I want lab guides, setup scripts, and verification scripts updated in one pass so that documentation matches the new persistence model and automated checks still pass.

### 2.2 Non-Users (v1)

- **Production operators** — no HA clustering, backup SLAs, or production hardening beyond what Atlas free tier provides.
- **Frontend developers changing UI** — no frontend work is in scope; API contract is frozen.
- **Data engineers** — no ETL pipelines, change streams, or multi-collection data modeling beyond the single `users` collection.

### 2.3 Key User Journeys

- **UJ-1. Alex configures the database connection before the lab.**
  - **Persona + context:** Alex, a workshop participant, opens the repo in Cursor with Node 18+ already installed.
  - **Entry state:** Facilitator has shared an Atlas connection string template; `users.csv` exists in `sg-search-service/`.
  - **Path:** Alex copies `.env.example` to `.env`, pastes the shared facilitator `MONGODB_URI`, and runs `npm install` in `sg-search-service`.
  - **Climax:** Alex runs `npm start`; console shows MongoDB connection plus automatic seed completion (12 users upserted from `users.csv`).
  - **Resolution:** Alex is ready to start the backend.
  - **Edge case:** Invalid or missing `MONGODB_URI` — backend logs `Startup failed:` and exits with code 1 (same fail-fast posture as missing CSV today).

- **UJ-2. Alex runs the backend and verifies search behavior is unchanged.**
  - **Persona + context:** Alex wants to confirm MongoDB-backed search matches the CSV lab expectations.
  - **Entry state:** `.env` configured with shared Atlas URI.
  - **Path:** Alex runs `npm start` in `sg-search-service` (auto-seed runs during startup). Console shows successful MongoDB connection and user count. Alex runs `.\verify-lab.ps1` from repo root, then starts the frontend and searches for "John" in the browser.
  - **Climax:** `verify-lab.ps1` prints green checks; browser shows "Found 3 results" for `firstName=John`; `curl` test matrix matches the README table.
  - **Resolution:** Alex proceeds to frontend work (unchanged) or wrap-up commit.
  - **Edge case:** Atlas IP allowlist blocks connection — troubleshooting table in lab guide points to facilitator-provided network access steps.

- **UJ-3. Pat (facilitator) onboards the next cohort with updated docs.**
  - **Persona + context:** Pat runs the workshop quarterly and distributes connection strings securely.
  - **Path:** Pat follows updated facilitator section in `LAB-03-Search-App-Guide.md`: distribute the shared `.env` values, run `setup-lab.ps1` and `verify-lab.ps1` as pre-flight (first `npm start` auto-seeds the shared cluster).
  - **Climax:** Entire cohort completes backend phase within the 05–15 minute window without CSV parsing steps.
  - **Resolution:** Workshop timing cheatsheet reflects MongoDB setup instead of CSV authoring.

## 3. Glossary

- **sg-search-service** — Node.js + Express backend on port 3001. Owns Mongoose connection, `User` model, search API, and automatic startup seeding from `users.csv`.
- **sg-search** — Vanilla HTML/CSS/JS frontend on port 3000. Unchanged in this enhancement.
- **users.csv** — Legacy fixture file with columns `firstName`, `lastName`, `email`, `department`, `city`. Retained as the **seed input**; no longer read at runtime by the API.
- **MongoDB Atlas** — Managed MongoDB service. Lab uses a pre-provisioned **free-tier cluster** with a **shared connection string** for all participants.
- **MONGODB_URI** — Environment variable holding the shared Atlas connection string. Loaded from `.env` at runtime; never committed to git.
- **users collection** — MongoDB collection backing the `User` Mongoose model. Default name: `users` in database `sg-search-lab`.
- **User model** — Mongoose model defining the user document schema (`firstName`, `lastName`, `email`, `department`, `city`). See FR-3.
- **Mongoose** — ODM (Object Document Mapper) for MongoDB; used for connection, schema definition, validation, and queries.
- **auto-seed** — Startup routine that reads `users.csv` and upserts documents via the `User` model before the HTTP server accepts traffic. No manual seed command.
- **LAB-03-Search-App-Guide.md** — Primary timed lab guide; must be updated for MongoDB setup flow.
- **setup-lab.ps1** — Bootstrap script: dependency install and `.env` presence check.
- **verify-lab.ps1** — API smoke-test script; behavior unchanged except troubleshooting hints for MongoDB connectivity.

## 4. Features

### 4.1 Feature: MongoDB Connection & Startup

**Description:** On startup, `sg-search-service` connects to MongoDB Atlas via `mongoose.connect(MONGODB_URI)` before binding the HTTP port. Connection failure prevents the server from listening — mirroring today's CSV fail-fast behavior. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-1: Environment-Based MongoDB Connection

The backend loads `MONGODB_URI` from environment variables (via `.env` in local development). Realizes UJ-1.

**Consequences (testable):**
- When `MONGODB_URI` is unset or empty, the process logs `Startup failed: MONGODB_URI is required` and exits with code 1 before `app.listen`.
- When `MONGODB_URI` is invalid or Atlas is unreachable, the process logs `Startup failed:` with the Mongoose connection error and exits with code 1.
- When connection succeeds, console logs include connected database name and a user count from the `users` collection (e.g. `Connected to MongoDB — 12 users in users collection`).

**Out of Scope:**
- Connection pooling tuning beyond Mongoose defaults.
- Automatic retry/reconnect loops that delay startup indefinitely.

#### FR-2: Health Endpoint (Unchanged Contract)

`GET /health` remains a liveness check independent of per-request database health. Realizes UJ-2.

**Consequences (testable):**
- `GET /health` returns HTTP 200 with JSON `{ "status": "ok" }` when the server is running.
- Health endpoint does not perform a new MongoDB round-trip on every request (liveness only; see §9).

**Notes:** If the MongoDB connection drops after startup, search requests may fail at query time; automatic reconnection is out of scope for v1 (see Non-Goals).

---

### 4.2 Feature: User Document Model & Automatic CSV Seed

**Description:** User records are stored as MongoDB documents defined by a **Mongoose schema and `User` model**. On every startup, the service automatically imports `users.csv` into Atlas via the model so the dataset and search test expectations remain identical without a manual seed step. Realizes UJ-1, UJ-3.

**Functional Requirements:**

#### FR-3: Mongoose User Schema & Model

A `User` Mongoose model defines the document shape: `firstName`, `lastName`, `email`, `department`, `city` (all required strings). Realizes UJ-1.

**Schema definition (Mongoose):**
- **Schema file** — e.g. `models/User.js` (or equivalent) exports a Mongoose model bound to the `users` collection.
- **Field types & validation** — Each field is `String`, `required: true`, `trim: true`. `email` is `unique: true` (supports idempotent upsert on auto-seed).
- **Indexes** — Optional compound or single-field indexes on `firstName` / `lastName` declared on the schema (see FR-8).
- **API serialization** — Search responses use `.select()` or `.lean()` to return only the five API fields; `_id` and `__v` are excluded from `results`.

**Consequences (testable):**
- `mongoose` appears in `package.json` dependencies.
- A `User` model file exists and is imported by `server.js` (or a dedicated db module).
- Documents in the `users` collection contain all five fields as non-empty strings after auto-seed.
- Field names match the API response property names exactly (camelCase).
- API `results` objects do not expose `_id` or `__v` to the frontend.
- Invalid documents (missing required fields) are rejected by Mongoose validation during auto-seed.

#### FR-4: Automatic Startup Seed from CSV

After `mongoose.connect` succeeds and before `app.listen`, the backend reads `sg-search-service/users.csv` and upserts all data rows via the `User` model (`findOneAndUpdate` / `bulkWrite` with `upsert: true` on `email`). No participant or facilitator action is required. Realizes UJ-1.

**Consequences (testable):**
- `npm start` alone triggers connect → auto-seed → listen; there is no separate `npm run seed` command in the lab workflow.
- On success, console logs include the number of records upserted (expect **12** for the current fixture).
- On missing `users.csv`, startup logs `Startup failed:` and exits with code 1.
- Re-running `npm start` does not create duplicate logical users — upsert keyed on unique `email` in the Mongoose schema.
- Auto-seed completes before the server accepts HTTP traffic.

**Out of Scope:**
- Admin UI for data management.
- Incremental/sync seeding from external sources.
- Manual seed CLI for participants.

#### FR-5: Retire Runtime CSV Loading

`server.js` no longer reads or parses `users.csv` at startup. Realizes UJ-2.

**Consequences (testable):**
- `csv-parse` may remain as a runtime dependency for auto-seed only, or auto-seed uses a minimal inline parser; it is not used to serve search requests.
- Startup log messages reference MongoDB, not `users.csv`.
- `users.csv` remains in the repo as seed input only.

---

### 4.3 Feature: MongoDB-Backed Search API

**Description:** `GET /api/search` queries MongoDB via the `User` Mongoose model instead of an in-memory array. Request validation, response shape, status codes, and search semantics are unchanged. Realizes UJ-2.

**Functional Requirements:**

#### FR-6: Search Query Semantics (Preserved)

Search accepts optional `firstName` and `lastName` query parameters with case-insensitive **exact match** on provided fields; empty/missing parameter acts as wildcard for that field. Realizes UJ-2.

**Consequences (testable):**
- `GET /api/search?firstName=John&lastName=Smith` returns `{ "count": 1, "results": [...] }` with one matching user.
- `GET /api/search?firstName=John` returns `count: 3`.
- `GET /api/search?lastName=Smith` returns `count: 2`.
- `GET /api/search?firstName=john` returns `count: 3` (case-insensitive).
- `GET /api/search` with no non-empty parameters returns HTTP 400 with `{ "error": "At least one of firstName or lastName is required" }`.
- `GET /api/search?firstName=Nobody` returns `{ "count": 0, "results": [] }`.
- Each result object includes `firstName`, `lastName`, `email`, `department`, `city`.
- `firstName` longer than 50 characters returns HTTP 400 with the existing validation error message.

#### FR-7: Mongoose Query Implementation

Search builds a Mongoose query (`User.find(...)`) equivalent to the prior in-memory `filterUsers` logic. Realizes UJ-2.

**Consequences (testable):**
- When only `firstName` is provided, query matches documents where `firstName` equals the parameter (case-insensitive — e.g. `$regex` with `^...$` and `i` flag, or collation).
- When only `lastName` is provided, query matches documents where `lastName` equals the parameter (case-insensitive).
- When both are provided, query requires both conditions (AND).
- Results returned by Mongoose produce the same `count` and row set as the CSV implementation for the standard test matrix in `sg-search-service/README.md`.

#### FR-8: Optional Search Indexes

Indexes may be added for query performance only. Realizes UJ-2.

**Consequences (testable):**
- Any index on `firstName` and/or `lastName` is a performance optimization only — search results must not change compared to unindexed queries.
- Indexes may be declared on the `User` schema (`userSchema.index(...)`); index sync failure logs a warning but does not block startup.

---

### 4.4 Feature: Lab Documentation & Script Updates

**Description:** All participant-facing and facilitator-facing artifacts reflect the MongoDB workflow. Realizes UJ-3.

**Functional Requirements:**

#### FR-9: README Updates

`sg-search-service/README.md` documents Atlas connection, shared `.env` setup, automatic startup seeding, and updated troubleshooting. Realizes UJ-3.

**Consequences (testable):**
- README removes instructions implying runtime CSV loading or manual seed commands.
- README includes copy-paste `.env.example` with `MONGODB_URI=` placeholder.
- README test matrix table is unchanged (same expected counts).
- README states that `npm start` connects via Mongoose, auto-seeds from `users.csv`, then listens — one command for participants.
- README references the `User` model / schema file location.

#### FR-10: Lab Guide Updates

`LAB-03-Search-App-Guide.md` replaces CSV authoring/loading steps with MongoDB configuration and seeding within the existing timing blocks. Realizes UJ-3.

**Consequences (testable):**
- Architecture diagram shows `sg-search-service` → MongoDB Atlas instead of `users.csv`.
- Prerequisites include Atlas connection string (facilitator-provided) and `.env` file — not local MongoDB install.
- Backend phase (05–15 min) covers `.env`, Mongoose `User` model, and `npm start` — not CSV parsing in `server.js` and not a separate seed step.
- Troubleshooting table includes: missing `MONGODB_URI`, Atlas connectivity / IP allowlist, auto-seed failure (missing/malformed `users.csv`).
- Facilitator timing cheatsheet updated accordingly.

#### FR-11: Setup Script Updates

`setup-lab.ps1` validates MongoDB readiness instead of (or in addition to) CSV presence. Realizes UJ-3.

**Consequences (testable):**
- Script checks for `.env` with non-empty `MONGODB_URI` (or prints facilitator instructions if absent).
- Script still verifies Node 18+ and runs `npm install` in `sg-search-service`.
- Script does not prompt for a manual seed step.
- `users.csv` check confirms seed-input file exists (auto-seed source), not a runtime search dependency.

#### FR-12: Verification Script Compatibility

`verify-lab.ps1` continues to pass against a MongoDB-backed backend without modification to test cases. Realizes UJ-2, UJ-3.

**Consequences (testable):**
- All existing smoke tests pass when backend has started (auto-seed completed) and is running.
- Troubleshooting hints mention MongoDB connection failures where relevant.
- No changes to expected counts or field validation in test cases.

#### FR-13: Repository Hygiene

Secrets and environment files are excluded from version control. Realizes UJ-1.

**Consequences (testable):**
- `.env` is listed in `.gitignore`.
- `.env.example` is committed with placeholder values only (no real credentials).
- No connection string appears in source code, guides, or committed config files.

---

## 5. Non-Goals (Explicit)

- **Frontend changes** — no modifications to `sg-search` HTML, CSS, JS, or UX.
- **API contract changes** — no new endpoints, renamed fields, or altered response/error shapes.
- **Local MongoDB or Docker** — participants do not install MongoDB locally; Atlas only.
- **Production-grade persistence** — no transactions, replica-set failover handling, schema migrations framework, or backup/restore runbooks.
- **User management APIs** — no CREATE/UPDATE/DELETE endpoints; read-only search lab remains read-only.
- **Authentication/authorization** — Atlas credentials are shared lab secrets; no per-user DB auth in the app.
- **Search behavior changes** — no partial/substring search, fuzzy match, pagination, or sorting changes.
- **Real-time sync from CSV** — CSV is seed input only; no file watcher or hot reload from CSV at runtime.

## 6. MVP Scope

### 6.1 In Scope

- MongoDB Atlas connection via `MONGODB_URI` and `mongoose.connect`
- Fail-fast startup when MongoDB is unavailable
- `User` Mongoose model and `users` collection with five-field documents
- Automatic startup seed from `users.csv` producing the current 12-user dataset
- MongoDB-backed `GET /api/search` with identical semantics and responses
- Unchanged `GET /health`, CORS, ports, and root route
- Removal of runtime CSV parsing from `server.js`
- Updates to `README.md`, `LAB-03-Search-App-Guide.md`, `setup-lab.ps1`, `verify-lab.ps1`, `.env.example`, `.gitignore`
- Optional compound indexes on `firstName` / `lastName` (performance only)

### 6.2 Out of Scope for MVP

- **Per-participant Atlas clusters or connection strings** — one shared `MONGODB_URI` for the cohort; reason: lab simplicity.
- **Automated Atlas provisioning** — manual facilitator setup; reason: out of workshop scope.
- **Frontend health indicator for DB status** — backend concern only; reason: frontend frozen.
- **Migration rollback to CSV** — can be done via git revert but not a supported dual-mode runtime; reason: single persistence path keeps lab clear.
- **New automated test suites** — existing `search-validation.test.js` updated to run against MongoDB-backed server when `MONGODB_URI` is set; no additional test framework or mock layer required for MVP.

## 7. Success Metrics

**Primary**

- **SM-1: Search parity** — 100% of README/verify-lab test matrix cases return identical `count` and equivalent `results` vs. the CSV baseline. Validates FR-6, FR-7.
- **SM-2: Lab time preserved** — Facilitator reports backend phase (05–15 min block) completable without local DB install; median setup including `.env` + `npm start` ≤ 5 minutes. Validates FR-4, FR-9, FR-10, FR-11.

**Secondary**

- **SM-3: Zero frontend diffs** — No file changes under `sg-search/` required for a passing lab run. Validates Non-Goals.
- **SM-4: Documentation completeness** — All four artifacts (README, lab guide, setup script, verify script) reference MongoDB workflow; no remaining instructions to implement CSV runtime loading. Validates FR-9–FR-12.

**Counter-metrics (do not optimize)**

- **SM-C1: Architectural restraint** — Use a single `User` Mongoose model only; do not add repository/service layers, multiple collections, or migrations frameworks beyond what the lab requires. Counterbalances SM-1 (parity is the goal, not architectural showcase).

## 8. Resolved Decisions

| # | Topic | Decision |
|---|--------|----------|
| 1 | Atlas access | **Shared** `MONGODB_URI` for all workshop participants on one Atlas free-tier cluster. |
| 2 | Seed timing | **Automatic at startup** — `npm start` connects and auto-seeds from `users.csv`; no manual seed step for participants or facilitators. |
| 3 | ODM & schema | **Mongoose** with a `User` schema/model (`models/User.js`). Connection via `mongoose.connect(MONGODB_URI)`. See FR-3. |
| 4 | Automated tests | **Keep existing integration test** (`search-validation.test.js`); update to inherit `MONGODB_URI` from environment when spawning `server.js`. No mock layer or new test suite required for MVP. Skip or document prerequisite when `MONGODB_URI` is unset. |

## 9. Assumptions Index

- **Database `sg-search-lab`, collection `users`** — Override via env vars `MONGODB_DB` / `MONGODB_COLLECTION` if facilitator prefers.
- **Auto-seed upserts on unique `email`** — Safe for repeated `npm start` on the shared cluster.
- **`/health` stays a process liveness check** — no per-request DB ping.
- **Index creation failure warns but does not block startup.**
- **`mongoose` package** — sole ODM; native `mongodb` driver pulled in as Mongoose dependency, not used directly in application code.
