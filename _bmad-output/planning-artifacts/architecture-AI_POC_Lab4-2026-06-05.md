---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md"
  - "_bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/.decision-log.md"
  - "_bmad-output/planning-artifacts/prds/prd-BmadPoc-2026-06-04/prd.md"
  - "_bmad-output/planning-artifacts/architecture-BmadPoc-2026-06-04.md"
  - "LAB-03-Search-App-Guide.md"
  - "sg-search-service/README.md"
workflowType: 'architecture'
project_name: 'AI_POC_Lab4'
user_name: 'SG_Engineer_Aman'
date: '2026-06-05'
lastStep: 8
scope: 'LAB-03 MongoDB Persistence Enhancement'
status: 'complete'
completedAt: '2026-06-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

This enhancement replaces CSV-backed, in-memory search in `sg-search-service` with MongoDB Atlas persistence via Mongoose — while keeping the public API contract frozen. Thirteen FRs across four feature areas define the scope:

- **Connection & Startup (FR-1, FR-2):** Load `MONGODB_URI` from environment; connect via `mongoose.connect` before HTTP listen; fail fast on missing/invalid URI or unreachable Atlas. `GET /health` remains a process liveness check (no per-request DB ping).
- **Model & Seed (FR-3, FR-4, FR-5):** Define a `User` Mongoose schema/model (`firstName`, `lastName`, `email`, `department`, `city` — all required, trimmed strings; `email` unique). Auto-seed from `users.csv` at startup (upsert on `email`, expect 12 records). Retire runtime CSV loading for search; CSV becomes seed input only.
- **Search API (FR-6, FR-7, FR-8):** `GET /api/search` queries MongoDB via `User.find(...)` with preserved semantics — case-insensitive exact match, wildcard for empty params, AND when both provided, HTTP 400 when neither provided, same response/error shapes. Optional indexes on `firstName`/`lastName` are performance-only and must not alter results.
- **Lab Artifacts (FR-9–FR-13):** Update README, lab guide, `setup-lab.ps1`, `verify-lab.ps1`, `.env.example`, `.gitignore`. Verification script test cases unchanged; secrets never committed.

The current implementation (`server.js`) loads CSV synchronously at startup into an in-memory array and filters in-process. The architectural delta is confined to the data layer and startup orchestration — Express routes, CORS middleware, parameter validation, and port binding remain structurally the same.

**Non-Functional Requirements:**

- **Search parity (SM-1):** 100% of README/verify-lab test matrix cases return identical `count` and equivalent `results` vs. the CSV baseline — the primary architectural validation gate.
- **Lab time preserved (SM-2):** Setup (`.env` + `npm start`) completable in ≤ 5 minutes; no local MongoDB or Docker install.
- **Zero frontend diffs (SM-3):** No changes under `sg-search/`; API serialization excludes `_id` and `__v`.
- **Documentation completeness (SM-4):** All four lab artifacts reference MongoDB workflow; no remaining CSV runtime-loading instructions.
- **Architectural restraint (SM-C1):** Single `User` model; no repository/service layers, migrations framework, or multi-collection design.
- **Security:** Shared Atlas credentials via `.env`; `.gitignore` excludes secrets; no connection strings in source or committed config.
- **Reliability:** Fail-fast startup; index sync failure logs warning but does not block startup; post-startup connection drops are out of scope for v1.

**Scale & Complexity:**

This is a low-complexity, brownfield storage-layer swap on an existing 30-minute hands-on lab application. The system serves a single `users` collection on a shared Atlas free-tier cluster for workshop participants. Data volume is fixed (12-user fixture). No multi-tenancy, authentication, write APIs, or production-grade persistence patterns are required.

- Primary domain: Backend API with managed MongoDB persistence (Node.js + Express + Mongoose)
- Complexity level: Low
- Estimated architectural components: 5 (Startup lifecycle orchestrator, User Mongoose model, Auto-seed pipeline, Search query builder, Express HTTP layer)

### Technical Constraints & Dependencies

- **Brownfield codebase:** `sg-search-service/server.js` already implements Express, CORS, health, search validation, and in-memory filtering — migration must preserve behavior, not rewrite structure.
- **MongoDB Atlas (managed):** Pre-provisioned free-tier cluster; shared `MONGODB_URI` for all participants; database `sg-search-lab`, collection `users` (overridable via `MONGODB_DB` / `MONGODB_COLLECTION`).
- **Mongoose ODM:** Sole data access layer; native `mongodb` driver not used directly in application code.
- **Environment:** Node.js 18+; `MONGODB_URI` via `.env` (dotenv or equivalent); Windows PowerShell for lab scripts.
- **Ports frozen:** Frontend `3000`, backend `3001`.
- **CSV fixture retained:** `users.csv` remains in repo as auto-seed input; `csv-parse` may remain for seeding only.
- **API contract frozen:** Endpoints, query params, status codes, JSON shapes, CORS, and error messages unchanged from current implementation.
- **Frontend frozen:** No UX or frontend architectural decisions required.
- **Testing:** Existing `search-validation.test.js` updated to pass `MONGODB_URI` from environment; no new test framework or mock layer for MVP.

### Cross-Cutting Concerns Identified

- **Startup lifecycle orchestration:** Connect → auto-seed → listen must be atomic and ordered; HTTP must not accept traffic until seed completes.
- **Search parity / behavioral equivalence:** Mongoose query construction must exactly replicate `filterUsers()` semantics (case-insensitive exact match, wildcard, AND logic).
- **Idempotent seeding on shared cluster:** Upsert keyed on unique `email` prevents duplicate users across repeated starts and multiple participants.
- **Secret & environment management:** `MONGODB_URI` loading, validation, and `.env` hygiene without credential leakage.
- **Fail-fast error posture:** Consistent `Startup failed:` logging and exit code 1 for connection, seed, and config failures.
- **Lab artifact consistency:** README, guide, setup script, and verify script must align with runtime behavior so facilitators and participants have a single source of truth.
- **API response sanitization:** Exclude MongoDB internal fields (`_id`, `__v`) from search results via `.select()` or `.lean()` configuration.

## Starter Template Evaluation

### Primary Technology Domain

**Backend API persistence enhancement** on an existing Node.js + Express service — adding Mongoose/Atlas to `sg-search-service` while keeping the frontend and API contract frozen.

### Starter Options Considered

1. **Brownfield Extension of Existing Custom Minimal Setup (Selected)**
   - **Description:** Keep the implemented `sg-search-service` + `sg-search` layout; add `mongoose`, environment loading, `models/User.js`, and startup orchestration modules to the existing Express app.
   - **Pros:** Zero frontend impact; preserves lab timing; minimal diff; matches SM-C1 architectural restraint; participants already know the codebase structure.
   - **Cons:** No pre-built MongoDB patterns — defined in core architectural decisions (step 4).

2. **Express Generator / NestJS / Fastify Starters**
   - **Description:** Scaffold a new backend with a CLI boilerplate.
   - **Pros:** Opinionated structure, built-in patterns.
   - **Cons:** Full rewrite of working code; breaks API contract parity risk; far exceeds 30-minute lab scope.

3. **MongoDB/Mongoose Boilerplate (MEAN/MERN starters)**
   - **Description:** Adopt a pre-built MongoDB + Express starter.
   - **Pros:** Mongoose patterns included out of the box.
   - **Cons:** Brings auth, routing, and folder structures not needed; would replace a working lab codebase.

### Selected Starter: Brownfield Extension of Existing Custom Minimal Setup

**Rationale for Selection:**
The LAB-03 codebase is already implemented and passing verification. The PRD scopes a storage-layer swap only — not a re-scaffold. Adding Mongoose to the existing Express service is the lowest-risk path that preserves search parity (SM-1), lab timing (SM-2), and zero frontend diffs (SM-3).

**Initialization Command:**

```powershell
cd sg-search-service
npm install mongoose@^9.6.3 dotenv@^17.4.2
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- Vanilla ES6+ JavaScript; Node.js 18+; no TypeScript compilation.

**Build Tooling:**
- Zero build step — `node server.js` via `npm start`; no bundler or transpiler.

**Testing Framework:**
- Existing Node.js integration test (`search-validation.test.js`); no Jest/Mocha added.

**Code Organization:**
```
sg-search-service/
├── server.js              # Express app + async startup orchestration
├── models/
│   └── User.js            # Mongoose schema & model
├── lib/
│   ├── db.js              # mongoose.connect wrapper
│   └── seed.js            # CSV → bulkWrite upsert
├── users.csv              # Seed input only
├── .env.example           # MONGODB_URI placeholder
└── package.json           # + mongoose@^9.6.3, dotenv@^17.4.2
```

**Development Experience:**
- `.env` file for local Atlas connection; `npm start` runs connect → auto-seed → listen in one command.
- VS Code debugger config unchanged (`launch.json` still targets `server.js`).
- PowerShell scripts updated for MongoDB readiness checks.

**Note:** The first implementation story is adding Mongoose dependencies and the `User` model — not re-scaffolding the project.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- MongoDB Atlas as authoritative data store via `mongoose.connect(MONGODB_URI)` before HTTP listen
- `User` Mongoose schema with five required string fields and unique `email` for idempotent upsert
- Auto-seed pipeline: CSV parse → `bulkWrite` upsert on `email` → then `app.listen`
- Mongoose query builder replicating `filterUsers()` semantics via `$regex` (case-insensitive exact match)
- Async startup wrapper in `server.js` — top-level `await` or `main().catch()` pattern; fail-fast on any startup error

**Important Decisions (Shape Architecture):**
- Module split: `lib/db.js` (connection), `lib/seed.js` (auto-seed), `models/User.js` (schema), `server.js` (Express + orchestration)
- Environment loading via `dotenv@^17.4.2` at process entry (Node 18 minimum; native `--env-file` requires 20.6+)
- Search results via `User.find(filter).select('firstName lastName email department city -_id').lean()`
- Optional compound index `{ firstName: 1, lastName: 1 }` on schema; sync failure logs warning only
- `csv-parse@^5.6.0` retained for auto-seed only — removed from search request path

**Deferred Decisions (Post-MVP):**
- Express 5.x migration — working 4.x codebase; out of scope for storage swap
- Per-request MongoDB health ping on `/health` — liveness-only per PRD §9
- Automatic reconnect after post-startup connection drop — out of scope v1
- Repository/service layer abstraction — SM-C1 forbids for MVP
- Per-participant Atlas clusters — shared URI for lab simplicity

### Data Architecture

- **Database:** MongoDB Atlas managed cluster; database `sg-search-lab` (override via `MONGODB_DB` env var); collection `users` (override via `MONGODB_COLLECTION`).
- **ODM:** Mongoose **9.6.3** — schema validation, connection management, query API.
- **Schema (`models/User.js`):**
  ```javascript
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, trim: true, unique: true },
    department:{ type: String, required: true, trim: true },
    city:      { type: String, required: true, trim: true }
  }
  ```
- **Indexes:** Optional `userSchema.index({ firstName: 1, lastName: 1 })` — performance only; must not alter search results.
- **Auto-seed strategy:** Read `users.csv` with `csv-parse/sync`; validate required columns; `User.bulkWrite([{ updateOne: { filter: { email }, update: { $set: doc }, upsert: true } }, ...])`. Expect 12 upserted records. Re-runs are idempotent on `email`.
- **Caching:** None. MongoDB is the runtime source of truth after startup seed completes.
- **Migration approach:** Big-bang replacement — remove in-memory `users` array and `loadUsers()` from search path; no dual-mode CSV/MongoDB runtime.

### Authentication & Security

- **Authentication:** None. Application remains public on localhost; Atlas credentials are shared workshop secrets.
- **Secret management:** `MONGODB_URI` loaded from `.env` via `dotenv`; `.env` in `.gitignore`; `.env.example` committed with empty placeholder only.
- **CORS:** Unchanged — `app.use(cors())` global middleware; frontend origin `http://127.0.0.1:3000` / `http://localhost:3000`.
- **Input validation:** Preserved from current `server.js` — `firstName` max 50 chars (HTTP 400); at least one non-empty search param required (HTTP 400).
- **Output sanitization:** `.select()` excludes `_id` and `__v` from API responses; Mongoose validation rejects malformed seed documents.

### API & Communication Patterns

- **Protocol:** HTTP/1.1 REST — unchanged from CSV implementation.
- **Endpoints (frozen contract):**
  - `GET /` — text smoke route (unchanged)
  - `GET /health` — `{ "status": "ok" }` HTTP 200; process liveness only, no DB round-trip
  - `GET /api/search?firstName=&lastName=` — `{ "count", "results" }` or HTTP 400 error shape unchanged
- **Search query construction:**
  - Build Mongoose filter object dynamically from non-empty params
  - Case-insensitive exact match via `$regex: ^${escapedValue}$` with `$options: 'i'` (mirrors `toLowerCase()` comparison in current `filterUsers()`)
  - Both params provided → AND conditions in single filter object
  - One param provided → wildcard for the other field (omit from filter)
  - RegExp special characters in search input must be escaped before `$regex` construction
- **Error handling:** Startup errors → `console.error('Startup failed:', message)` + `process.exit(1)`. Runtime search errors → HTTP 500 with generic message (preserve existing posture). Validation errors → HTTP 400 with existing error strings.
- **Startup sequence:**
  1. `require('dotenv').config()`
  2. Validate `MONGODB_URI` present
  3. `await connectDB()` — `mongoose.connect(MONGODB_URI)`
  4. `await seedFromCsv()` — parse + bulkWrite upsert
  5. Log user count: `Connected to MongoDB — N users in users collection`
  6. `app.listen(PORT)`

### Frontend Architecture

- **No changes.** Frontend architecture decisions from LAB-03 baseline remain in effect. `sg-search/` is untouched — fetch to port 3001, XSS-safe `textContent` rendering, Vanilla JS state object.

### Infrastructure & Deployment

- **Hosting:** Local development only — backend port 3001, frontend port 3000. Atlas is the only external dependency.
- **Environment configuration:** `.env` with `MONGODB_URI` (required); optional `MONGODB_DB`, `MONGODB_COLLECTION`, `PORT`.
- **CI/CD:** None for MVP — lab runs locally with PowerShell scripts.
- **Logging:** Console-only — connection success, seed count, listen message, startup failures. No structured logging framework.
- **Monitoring:** None — workshop lab scope.
- **Scaling:** Single-process Node.js; Mongoose default connection pool; no horizontal scaling.

### Decision Impact Analysis

**Implementation Sequence:**
1. Add `mongoose@^9.6.3` and `dotenv@^17.4.2` to `package.json`; create `.env.example`
2. Create `models/User.js` with schema, unique email, optional indexes
3. Create `lib/db.js` — connect with fail-fast validation
4. Create `lib/seed.js` — CSV parse + bulkWrite upsert
5. Refactor `server.js` — async startup, remove in-memory array, wire Mongoose search
6. Update `search-validation.test.js` to pass `MONGODB_URI` from env
7. Update README, lab guide, `setup-lab.ps1`, `verify-lab.ps1`

**Cross-Component Dependencies:**
- Search route depends on `User` model which depends on successful `connectDB()` + `seedFromCsv()` completing first
- Auto-seed depends on `users.csv` column headers matching schema field names exactly
- Verify script depends on auto-seed having run (backend started at least once) for test matrix counts
- Frontend depends on unchanged JSON response shape — `.select()` configuration is the serialization contract gate
- Setup script depends on `.env` with valid `MONGODB_URI` before `npm start` will succeed

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
8 areas where AI agents could make different choices: MongoDB collection/field naming, module file placement, search query strategy, startup orchestration style, error message strings, env var loading approach, seed upsert mechanism, and API response serialization.

### Naming Patterns

**Database Naming Conventions:**
- **Collection:** `users` (lowercase plural) — Mongoose default from model name `User`
- **Field names:** camelCase matching CSV headers exactly — `firstName`, `lastName`, `email`, `department`, `city`
- **Database name:** `sg-search-lab` (embedded in `MONGODB_URI` or overridden via `MONGODB_DB`)
- **Index names:** Mongoose auto-generated; do not manually rename unless required
- **Never** use snake_case field names in schema — breaks API contract parity

**API Naming Conventions:**
- Endpoints unchanged: `GET /`, `GET /health`, `GET /api/search`
- Query parameters: camelCase — `firstName`, `lastName`
- Error messages must match existing strings exactly:
  - `"At least one of firstName or lastName is required"`
  - `"firstName must not exceed 50 characters"`
- Health response: `{ "status": "ok" }` — not `"UP"`

**Code Naming Conventions:**
- **Files:** lowercase — `server.js`, `User.js`, `db.js`, `seed.js`
- **Directories:** lowercase — `models/`, `lib/`, `test/`
- **Model export:** `module.exports = mongoose.model('User', userSchema)` — model name `'User'`, file `models/User.js`
- **Functions:** camelCase — `connectDB`, `seedFromCsv`, `buildSearchFilter`, `escapeRegex`
- **Constants:** UPPER_SNAKE — `MONGODB_URI`, `CSV_PATH`, `MAX_FIRST_NAME_LENGTH`, `REQUIRED_COLUMNS`
- **Env vars:** UPPER_SNAKE — `MONGODB_URI`, `MONGODB_DB`, `MONGODB_COLLECTION`, `PORT`

### Structure Patterns

**Project Organization:**
- **Backend only changes** under `sg-search-service/` — no files added to repo root or `sg-search/`
- **New modules:**
  - `models/User.js` — schema + model definition only
  - `lib/db.js` — `connectDB()` and connection validation
  - `lib/seed.js` — `seedFromCsv()` CSV parse + bulkWrite
  - `server.js` — Express routes + async `main()` startup orchestration
- **Tests:** remain in `test/search-validation.test.js` — co-located test directory, not Jest
- **No** `services/`, `repositories/`, or `controllers/` directories — SM-C1 restraint

**File Structure Patterns:**
- `.env` and `.env.example` live in `sg-search-service/` (same directory as `server.js`)
- `users.csv` stays in `sg-search-service/` — seed input, not moved to `data/` or `fixtures/`
- `dotenv.config()` called once at top of `server.js` before any env var reads

### Format Patterns

**API Response Formats:**
- Search success: `{ "count": number, "results": [{ firstName, lastName, email, department, city }] }` — direct response, no wrapper
- Search empty: `{ "count": 0, "results": [] }` — HTTP 200, not 404
- Validation error: `{ "error": "message string" }` — HTTP 400
- Health: `{ "status": "ok" }` — HTTP 200
- **Never** expose `_id`, `__v`, or MongoDB internal fields in `results`

**Data Exchange Formats:**
- JSON fields: camelCase throughout
- Booleans: `true`/`false` (no 1/0)
- Dates: not applicable — no date fields in User schema
- Null handling: required fields never null after successful seed; Mongoose validation enforces at write time

### Communication Patterns

**Event System Patterns:**
- Not applicable — no event bus, WebSockets, or pub/sub in this lab backend

**State Management Patterns:**
- Backend: stateless per request — no in-memory user cache after startup seed
- Frontend: unchanged global `state` object in `app.js` — do not modify

### Process Patterns

**Error Handling Patterns:**
- **Startup fail-fast:** All startup failures use `console.error('Startup failed:', err.message)` then `process.exit(1)`. Specific messages:
  - Missing URI: `MONGODB_URI is required`
  - Missing CSV: include file path in message
  - Connection failure: include Mongoose error message
- **Runtime validation:** HTTP 400 with `{ error: '...' }` — same strings as current `server.js`
- **Runtime search/DB errors:** HTTP 500 with generic `{ error: 'Internal server error' }` — do not leak MongoDB stack traces to client
- **Index sync failure:** `console.warn(...)` only — never block startup

**Loading State Patterns:**
- Not applicable to backend — frontend loading states unchanged

### Enforcement Guidelines

**All AI Agents MUST:**
- Load environment via `require('dotenv').config()` at the top of `server.js` — not `--env-file` flag (Node 18 minimum)
- Connect to MongoDB and complete auto-seed **before** calling `app.listen()`
- Use `User.find(filter).select('firstName lastName email department city -_id').lean()` for search queries
- Build case-insensitive exact-match filters with escaped `$regex` — never substring/contains matching
- Upsert seed data on `email` via `bulkWrite` — never `insertMany` (duplicates on re-run)
- Preserve exact API error message strings from the CSV implementation
- Never add files under `sg-search/` — zero frontend diffs (SM-3)
- Never commit `.env` or real connection strings

**Pattern Enforcement:**
- Run `verify-lab.ps1` after changes — all smoke tests must pass
- Run `npm test` in `sg-search-service` when `MONGODB_URI` is set — integration test validates search parity
- Compare test matrix counts against README table before marking complete

### Pattern Examples

**Good Example — Search filter builder:**
```javascript
function buildSearchFilter(firstName, lastName) {
  const filter = {};
  if (firstName) filter.firstName = { $regex: `^${escapeRegex(firstName)}$`, $options: 'i' };
  if (lastName)  filter.lastName  = { $regex: `^${escapeRegex(lastName)}$`,  $options: 'i' };
  return filter;
}
```

**Good Example — Startup orchestration:**
```javascript
async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('Startup failed: MONGODB_URI is required');
    process.exit(1);
  }
  await connectDB();
  const count = await seedFromCsv();
  console.log(`Connected to MongoDB — ${count} users in users collection`);
  app.listen(PORT, () => console.log(`sg-search-service listening on http://localhost:${PORT}`));
}
main().catch((err) => { console.error('Startup failed:', err.message); process.exit(1); });
```

**Anti-Pattern — In-memory cache after seed:**
```javascript
// WRONG: re-introduces CSV-era pattern
let users = await User.find().lean();
app.get('/api/search', (req, res) => res.json({ count: users.length, results: filterUsers(users, ...) }));
```

**Anti-Pattern — insertMany seed (not idempotent):**
```javascript
// WRONG: duplicates on second npm start
await User.insertMany(records);
```

**Anti-Pattern — Exposing MongoDB internals:**
```javascript
// WRONG: leaks _id and __v to frontend
const results = await User.find(filter);
res.json({ count: results.length, results });
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
AI_POC_Lab4/                              # Workshop repo root
├── LAB-03-Search-App-Guide.md            # (MOD) MongoDB setup flow, updated diagram
├── setup-lab.ps1                         # (MOD) Check .env + MONGODB_URI, not CSV runtime
├── verify-lab.ps1                        # (MOD) MongoDB troubleshooting hints only
├── .gitignore                            # (MOD) ensure .env excluded
├── .vscode/
│   └── launch.json                       # (UNCH) Debug Backend → server.js
├── sg-search-service/                    # Backend — all MongoDB changes here
│   ├── package.json                      # (MOD) + mongoose, dotenv
│   ├── package-lock.json                 # (MOD) regenerated on npm install
│   ├── server.js                         # (MOD) async startup, Mongoose search routes
│   ├── .env.example                      # (NEW) MONGODB_URI= placeholder
│   ├── .env                              # (NEW, gitignored) facilitator-shared Atlas URI
│   ├── users.csv                         # (UNCH) seed input only — 12-user fixture
│   ├── README.md                         # (MOD) Atlas setup, auto-seed, test matrix
│   ├── models/
│   │   └── User.js                       # (NEW) Mongoose schema + model
│   ├── lib/
│   │   ├── db.js                         # (NEW) connectDB(), URI validation
│   │   └── seed.js                       # (NEW) seedFromCsv(), bulkWrite upsert
│   └── test/
│       └── search-validation.test.js     # (MOD) pass MONGODB_URI when spawning server
├── sg-search/                            # Frontend — ZERO changes (SM-3)
│   ├── package.json                      # (UNCH)
│   ├── index.html                        # (UNCH)
│   ├── styles.css                        # (UNCH)
│   ├── app.js                            # (UNCH)
│   ├── README.md                         # (UNCH)
│   └── test/                             # (UNCH)
│       ├── shell-spec.test.js
│       └── first-name-length.test.js
└── _bmad-output/                         # Planning artifacts (out of runtime scope)
    └── planning-artifacts/
        └── architecture-AI_POC_Lab4-2026-06-05.md
```

### Architectural Boundaries

**API Boundaries:**
- **Public HTTP surface (frozen):** `sg-search-service` exposes `GET /`, `GET /health`, `GET /api/search` on port **3001**
- **Internal data boundary:** Search route → `User` model → MongoDB Atlas `users` collection — no direct driver calls in route handlers
- **Seed boundary:** `lib/seed.js` is the only module that reads `users.csv`; search route never touches the filesystem
- **Frontend boundary:** `sg-search/app.js` calls `http://127.0.0.1:3001/api/search` via `fetch` — no knowledge of MongoDB

**Component Boundaries:**
- **`server.js`:** Express app definition, route handlers, startup orchestration — imports from `lib/` and `models/` only
- **`models/User.js`:** Schema, indexes, model export — no Express or CSV dependencies
- **`lib/db.js`:** Connection lifecycle only — no seed or route logic
- **`lib/seed.js`:** CSV parse + bulkWrite — imports `User` model and `csv-parse`; no Express
- **`sg-search/`:** Completely isolated — no backend imports, no shared code packages

**Service Boundaries:**
- **Local process boundary:** Node.js single process; no microservices, no message queues
- **External service boundary:** MongoDB Atlas is the sole external dependency — accessed only via `mongoose.connect` in `lib/db.js`
- **Script boundary:** `setup-lab.ps1` and `verify-lab.ps1` operate at repo root; they shell out to `npm` and HTTP — they do not import backend modules

**Data Boundaries:**
- **Runtime data source:** MongoDB `users` collection (post-seed) — authoritative for search
- **Seed data source:** `users.csv` — read once at startup, never at request time
- **No caching layer:** No in-memory array, no Redis, no file watcher
- **Serialization boundary:** `.select('firstName lastName email department city -_id').lean()` is the gate between MongoDB documents and API JSON

### Requirements to Structure Mapping

**FR Category → Location:**

| FR Category | FRs | Primary Files |
|-------------|-----|---------------|
| MongoDB Connection & Startup | FR-1, FR-2 | `lib/db.js`, `server.js` (main), `.env.example` |
| User Model & Auto-Seed | FR-3, FR-4, FR-5 | `models/User.js`, `lib/seed.js`, `users.csv` |
| MongoDB-Backed Search API | FR-6, FR-7, FR-8 | `server.js` (route + `buildSearchFilter`) |
| Lab Documentation & Scripts | FR-9–FR-13 | `README.md`, `LAB-03-Search-App-Guide.md`, `setup-lab.ps1`, `verify-lab.ps1`, `.gitignore` |

**Cross-Cutting Concerns:**

| Concern | Location |
|---------|----------|
| Fail-fast startup | `server.js` main(), `lib/db.js`, `lib/seed.js` |
| Secret management | `.env`, `.env.example`, `.gitignore` |
| Search parity validation | `test/search-validation.test.js`, `verify-lab.ps1` |
| CORS | `server.js` — `app.use(cors())` unchanged |
| Input validation | `server.js` — route handler, unchanged logic |

### Integration Points

**Internal Communication:**
```
server.js
  ├── require('./lib/db')      → connectDB()
  ├── require('./lib/seed')    → seedFromCsv()
  ├── require('./models/User') → User.find() in /api/search
  └── express routes           → HTTP responses
```

**External Integrations:**
- **MongoDB Atlas:** `mongoose.connect(MONGODB_URI)` — TLS handled by Mongoose/driver; IP allowlist managed by facilitator outside codebase
- **No other external services:** No auth providers, payment, analytics, or CDN

**Data Flow:**
```
Startup:
  .env → dotenv → MONGODB_URI
    → lib/db.js (connect)
    → lib/seed.js (read users.csv → bulkWrite upsert → users collection)
    → server.js (app.listen)

Search request:
  Browser → GET /api/search?firstName=&lastName=
    → server.js (validate params)
    → User.find(filter).select(...).lean()
    → MongoDB Atlas users collection
    → JSON { count, results } → Browser
```

### File Organization Patterns

**Configuration Files:**
- Runtime secrets: `sg-search-service/.env` (gitignored)
- Template: `sg-search-service/.env.example` (committed, empty placeholder)
- Package config: `sg-search-service/package.json` (engines, dependencies, scripts)
- Debugger: `.vscode/launch.json` at repo root (cwd: `sg-search-service`)

**Source Organization:**
- Flat backend with two helper directories (`models/`, `lib/`) — no deeper nesting
- Single entry point: `server.js` — no `app.js` / `index.js` split
- Frontend remains flat: `index.html`, `styles.css`, `app.js`

**Test Organization:**
- Backend integration: `sg-search-service/test/search-validation.test.js`
- Frontend unit: `sg-search/test/` (unchanged, no MongoDB dependency)
- Smoke tests: `verify-lab.ps1` at repo root (HTTP-level, backend must be running)

**Asset Organization:**
- Static frontend assets: `sg-search/` served via `npx serve -l 3000`
- Data fixture: `sg-search-service/users.csv` (seed input, version-controlled)
- No `public/`, `assets/`, or `static/` directories

### Development Workflow Integration

**Development Server Structure:**
- Terminal 1: `cd sg-search-service && npm start` (connect → seed → listen on 3001)
- Terminal 2: `cd sg-search && npm start` (serve static on 3000)
- Pre-flight: `.\setup-lab.ps1` from repo root
- Verification: `.\verify-lab.ps1` from repo root (backend must be running)

**Build Process Structure:**
- No build step — `node server.js` directly
- No transpilation, bundling, or compilation

**Deployment Structure:**
- Local-only lab — no Dockerfile, no CI/CD pipeline, no cloud deployment config
- Atlas cluster provisioned manually by facilitator outside the repo

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible: Node.js 18+ satisfies Mongoose 9.x and Express 4.x requirements. `dotenv@^17.4.2` is the correct env-loading choice given the Node 18 minimum (native `--env-file` requires 20.6+). Mongoose pulls in the native `mongodb` driver as a transitive dependency — no direct driver usage conflicts. The brownfield extension approach preserves the working Express route layer while swapping only the data access path. No contradictory decisions identified.

**Pattern Consistency:**
Implementation patterns directly enforce architectural decisions: `$regex` exact-match aligns with search parity requirement; `bulkWrite` upsert aligns with idempotent shared-cluster seeding; `.select().lean()` aligns with API contract freeze; fail-fast startup aligns with FR-1. Naming conventions (camelCase fields, lowercase files, UPPER_SNAKE env vars) are consistent across schema, API, and code patterns. Anti-patterns explicitly guard against CSV-era mistakes (in-memory cache, insertMany, exposing `_id`).

**Structure Alignment:**
The project tree supports all decisions: new modules (`models/User.js`, `lib/db.js`, `lib/seed.js`) map cleanly to the three new architectural components (model, connection, seed). Frontend isolation is enforced by structure — zero files under `sg-search/`. Lab script updates at repo root align with facilitator/participant workflow without polluting backend modules.

### Requirements Coverage Validation ✅

**Feature Coverage:**

| Feature | FRs | Architectural Support |
|---------|-----|----------------------|
| MongoDB Connection & Startup | FR-1, FR-2 | `lib/db.js`, async `main()` in `server.js`, `.env.example` |
| User Model & Auto-Seed | FR-3, FR-4, FR-5 | `models/User.js`, `lib/seed.js`, CSV retained as seed input |
| MongoDB-Backed Search API | FR-6, FR-7, FR-8 | `buildSearchFilter` + `User.find()` in `server.js` |
| Lab Documentation & Scripts | FR-9–FR-13 | Structure mapping to README, guide, scripts, `.gitignore` |

**Functional Requirements Coverage:**
All 13 FRs have explicit architectural support — no orphaned requirements. FR-5 (retire runtime CSV loading) is enforced by structure (`lib/seed.js` as sole CSV reader) and anti-patterns (no in-memory cache). FR-8 (optional indexes) is documented as schema-level with warn-only sync failure.

**Non-Functional Requirements Coverage:**
- **SM-1 (Search parity):** `$regex` exact-match + `.select()` serialization + verify-lab test matrix as validation gate
- **SM-2 (Lab time):** Single `npm start` command, no local DB install, shared Atlas URI
- **SM-3 (Zero frontend diffs):** Structural boundary — no `sg-search/` changes permitted
- **SM-4 (Documentation completeness):** Four lab artifacts mapped in structure section
- **SM-C1 (Architectural restraint):** No services/repositories/controllers; single User model
- **Security:** `.env` gitignore, no secrets in source, CORS unchanged
- **Performance:** Optional indexes only; 12-user dataset; no caching complexity needed

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical and important decisions documented with verified package versions (Mongoose 9.6.3, dotenv 17.4.2, Express 4.x retained). Startup sequence, schema definition, seed strategy, and query construction are specified concretely. Deferred decisions explicitly listed with rationale.

**Structure Completeness:**
Complete directory tree with (NEW/MOD/UNCH) annotations for every affected file. Integration points, data flow, and FR-to-file mapping tables provided. Component boundaries defined with import direction rules.

**Pattern Completeness:**
8 conflict points identified and resolved. Good examples and anti-patterns provided for search filter, startup orchestration, seed idempotency, and response serialization. Enforcement guidelines tie to `verify-lab.ps1` and `npm test`.

### Gap Analysis Results

**Critical Gaps:** None.

**Important Gaps:**
- **`buildSearchFilter` / `escapeRegex` location:** Implement inline in `server.js` alongside the route handler (consistent with SM-C1; avoids unnecessary `lib/search.js` module).
- **Facilitator Atlas setup:** Manual provisioning documented as out-of-scope in PRD — architecture assumes facilitator provides working `MONGODB_URI` and IP allowlist before lab.

**Nice-to-Have Gaps:**
- Sample `.env.example` content block could be added during implementation (not blocking)
- Optional `lib/search.js` extraction if `server.js` grows beyond ~150 lines post-refactor

### Validation Issues Addressed

No critical or blocking issues found. Search helpers live in `server.js` as private functions, not exported modules. Facilitator Atlas setup remains a pre-lab checklist item outside the codebase.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — brownfield scope with frozen API contract, detailed PRD with resolved decisions, and existing passing CSV baseline provide a clear migration target.

**Key Strengths:**
- Narrow, well-bounded scope — storage-layer swap only
- Search parity explicitly validated via existing test matrix
- Patterns include concrete good/anti-pattern examples preventing common agent mistakes
- Complete FR-to-file mapping eliminates ambiguity about where code lives
- Architectural restraint (SM-C1) prevents over-engineering

**Areas for Future Enhancement:**
- Express 5.x migration (deferred)
- Per-request DB health check on `/health` (deferred)
- Automatic reconnect after connection drop (deferred)
- Per-participant Atlas clusters for production-like isolation (deferred)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented in this file
- Use implementation patterns consistently — especially error message strings, `.select()` serialization, and `$regex` exact-match
- Respect project structure boundaries — backend changes only under `sg-search-service/`
- Never modify `sg-search/` — zero frontend diffs is a hard constraint
- Run `verify-lab.ps1` and `npm test` (with `MONGODB_URI` set) before marking any story complete

**First Implementation Priority:**
```powershell
cd sg-search-service
npm install mongoose@^9.6.3 dotenv@^17.4.2
```
Then create `models/User.js`, `lib/db.js`, `lib/seed.js`, and refactor `server.js` per the implementation sequence in Core Architectural Decisions.
