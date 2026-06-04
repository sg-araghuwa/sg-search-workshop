---
baseline_commit: NO_VCS
---

# Story 1.1: Initialize Express Search Service

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want a scaffolded `sg-search-service` Express project with sample `users.csv`,
so that I can start backend development without manual project wiring.

## Acceptance Criteria

1. **Given** the `sg-search-service` folder does not exist or is empty  
   **When** the project is initialized per lab conventions  
   **Then** it contains `package.json`, `server.js` (or entry), and a sample `users.csv` with headers matching PRD fields (`firstName`, `lastName`, `email`, `department`, `city`)

2. **And** `npm start` launches the server on port **3001** by default (NFR5)

3. **And** Node.js **v18+** is documented as the minimum runtime (NFR4)

4. **And** no authentication middleware is added (NFR7)

## Tasks / Subtasks

- [x] Create `sg-search-service/` at project root (AC: #1)
  - [x] Add `package.json` with `express` dependency and `"start": "node server.js"`
  - [x] Add minimal `server.js` that listens on port 3001 and logs startup (routes added in later stories)
  - [x] Add `README.md` or inline comment documenting Node 18+ requirement
- [x] Add sample `users.csv` (AC: #1)
  - [x] Header row: `firstName,lastName,email,department,city`
  - [x] At least **10 data rows** with **duplicate first/last names** for realistic search (see Dev Notes)
- [x] Verify `npm install` and `npm start` in PowerShell (AC: #2)
- [x] Confirm no auth/CORS/search logic yet — scope is scaffold only (AC: #4, NFR3)

### Review Findings

- [x] [Review][Defer] PORT env not validated (non-numeric, out of range, `"0"`) [sg-search-service/server.js:4] — deferred, pre-existing; story prescribes `process.env.PORT || 3001` without guards; harden in lab troubleshooting (Story 1.5) if needed
- [x] [Review][Defer] `app.listen` lacks error callback (EADDRINUSE, EACCES) [sg-search-service/server.js:10] — deferred, pre-existing; acceptable for minimal scaffold
- [x] [Review][Defer] `engines.node` not enforced at install time [sg-search-service/package.json:9] — deferred, pre-existing; consider `.nvmrc` or `engineStrict` in Epic 3
- [x] [Review][Defer] No repo `.gitignore` for `node_modules` [repo root] — deferred, pre-existing; Epic 3 story calls this out explicitly
- [x] [Review][Defer] Unquoted CSV fields vulnerable to comma-in-value breaks [sg-search-service/users.csv:1] — deferred, pre-existing; Story 1.2 parsing scope; current fixture has no commas in values

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` and `tech-stack.md` describe a **superseded Task Manager** (React 19, Zustand, Tailwind, `create-sparkvite`). **Do not follow them.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary technical contract |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | API/ports/NFRs |
| `idea.md` | Sample CSV content and verification matrix |
| `implementation-readiness-report-2026-06-04.md` | Confirms architecture mismatch |

**Do not:** run `npx create-sparkvite`, add React, Zustand, Tailwind, `localStorage`, or task-manager folders under `src/`.

### Package Location (Resolved)

- **Canonical layout (per epics):** `AI_POC_Lab4/sg-search-service/` and later `AI_POC_Lab4/sg-search/` at **repository root**.
- `idea.md` mentions `cursor-workshop-app/` — that was an early workshop path. Use **root-level** `sg-search-service` unless the facilitator explicitly redirects.

### Target Directory Structure (Story 1.1 Only)

```text
AI_POC_Lab4/
└── sg-search-service/
    ├── package.json
    ├── server.js
    ├── users.csv
    └── README.md          # optional but recommended: Node 18+, npm start, port 3001
```

**Out of scope for 1.1:** `GET /health`, `GET /api/search`, CORS, CSV parsing in memory (Stories 1.2–1.5).

### `package.json` Requirements

```json
{
  "name": "sg-search-service",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "express": "^4.21.0"
  }
}
```

- Use **Express 4.x** (stable; Node 18+ supported per Express docs).
- **No** `cors`, `csv-parse`, or `nodemon` in this story unless you need nodemon for local dev — keep deps minimal (NFR3 complexity guard).
- Do **not** add `"type": "module"` unless the team standardizes ESM; default **CommonJS** (`require`) matches lab simplicity.

### `server.js` Minimal Scaffold

```javascript
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

- **Port:** `process.env.PORT || 3001` so Story 1.5 / lab troubleshooting (`$env:PORT=3002`) works without refactor.
- **No** `app.use(cors())`, **no** body parsers, **no** auth — added in later stories.
- Root `GET /` is optional smoke route; not a PRD requirement.

### Sample `users.csv` (Pedagogy Note)

Epics require a **sample** CSV in the scaffold. PRD also says learners may create CSV manually in the guide — both are valid: scaffold seeds data for immediate `npm start`; the lab guide (Epic 3) can still teach manual creation.

**Required columns (exact header names):**

`firstName,lastName,email,department,city`

**Data rules (from `idea.md` verification matrix):**

| Constraint | Reason |
|------------|--------|
| ≥ 10 rows | Lab search demos |
| Duplicate names | e.g. multiple "John" rows so `firstName=John` returns 3 rows in later testing |
| Mix of departments/cities | Realistic table display in Epic 2 |

**Example test-oriented rows (illustrative — implement full set in file):**

| firstName | lastName | Notes |
|-----------|----------|-------|
| John | Smith | Pair for `John` + `Smith` → 1 row test |
| John | Doe | Contributes to `firstName=John` → 3 rows |
| John | Williams | Third John |
| Jane | Smith | Contributes to `lastName=Smith` → 2 rows |
| … | … | Fill to ≥10 rows total |

Use plain CSV (comma-separated). Quoted fields optional for this story; Story 1.2 handles parsing edge cases.

### Architecture Compliance (Search App — Not `architecture.md`)

| Decision | Value |
|----------|-------|
| Runtime | Node.js 18+ |
| Backend framework | Express 4.x |
| Data (later) | CSV file, no DB |
| Default port | 3001 |
| Auth | None |
| Deployment | Localhost only |
| Complexity | Minimal scaffold — no extra middleware |

### Library / Framework Requirements

| Package | Version guidance | Story 1.1 |
|---------|------------------|-------------|
| `express` | ^4.18.2 or ^4.21.x | Required |
| `cors` | — | **Do not add** (Story 1.5) |
| `csv-parse` | — | **Do not add** (Story 1.2) |

### File Structure Requirements

- All backend lab code lives under `sg-search-service/`.
- Entry file name **`server.js`** (epics reference `server.js`; `idea.md` uses same).
- Do not nest under `src/` unless you have a team reason — flat layout matches lab guide expectations.

### Testing Requirements (Story 1.1)

Manual verification only (automated tests are Epic 3 / optional):

```powershell
cd sg-search-service
npm install
npm start
# Expect: console shows port 3001
# Optional: curl http://127.0.0.1:3001/
```

- Confirm `users.csv` exists and opens with correct headers.
- Confirm no `node_modules` committed (add root `.gitignore` in Epic 3 if missing).

### Previous Story Intelligence

None — first implementation story. Greenfield repository (no `sg-search-service` yet, no git history).

### Latest Technical Information

- **Express 4.x** remains the standard production line; requires **Node 18+** (Express installation docs, 2025).
- **Express 5** exists but adds breaking changes — stay on **4.x** for lab stability unless explicitly upgraded project-wide.
- Use `npm init -y` pattern or hand-written `package.json`; avoid `express-generator` scaffolding (adds views/routes not needed for lab).

### Project Context Reference

- No `project-context.md` in repo. Treat this story file + `epics.md` + PRD as binding.
- UX (`DESIGN.md`) is frontend-only — not applicable to Story 1.1 beyond knowing Epic 2 will consume port 3000.

### Anti-Patterns (Will Fail Review)

- Implementing search, health, or CORS in 1.1 (belongs to 1.3–1.5).
- Using port 3000 for backend (reserved for frontend, NFR5).
- Adding JWT, sessions, or database drivers.
- Following `architecture.md` React/Vite structure.
- Placing packages only under `cursor-workshop-app/` without updating epics/sprint tracking.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.1]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md — §3.1, §6.2]
- [Source: idea.md — folder layout, CSV columns, verification matrix]
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-06-04.md — stale architecture warning]
- [Source: Express installation — Node 18+, npm install express](https://expressjs.com/)

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- PowerShell: used `Set-Location` + `;` instead of `&&` for command chaining
- `git rev-parse HEAD` unavailable (no VCS); `baseline_commit` set to `NO_VCS`

### Implementation Plan

- Greenfield scaffold at repo root `sg-search-service/` per epics (ignored stale Task Manager `architecture.md`)
- CommonJS Express 4.x, port `process.env.PORT || 3001`, optional `GET /` smoke route only
- `users.csv`: 12 rows; 3× John (Smith/Doe/Williams), 2× Smith (John/Jane) for later search matrix

### Completion Notes List

- Created `package.json`, `server.js`, `users.csv`, `README.md` under `sg-search-service/`
- `npm install` succeeded (68 packages); `npm start` logs port 3001; `GET /` returns scaffold message
- No CORS, auth, health, or search routes (deferred to stories 1.2–1.5)

### File List

- sg-search-service/package.json
- sg-search-service/server.js
- sg-search-service/users.csv
- sg-search-service/README.md
- sg-search-service/package-lock.json

### Change Log

- 2026-06-04: Story 1.1 — initialized Express search service scaffold (SG_Engineer_Aman / dev-story)

## Story Completion Status

- **Status:** done
- **Completion note:** Code review passed (2026-06-04); AC met; deferrals logged for Epic 3 / later stories
- **Next story after done:** `1-2-load-and-parse-csv-user-data`
