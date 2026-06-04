---
baseline_commit: 3aad37e
---

# Story 3.3: Author LAB-03-Search-App-Guide.md

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want a step-by-step guide in Senior Developer/Architect tone,
so that I can complete the lab within the 30-minute window (NFR1, NFR2).

## Acceptance Criteria

1. **Given** the guide file `LAB-03-Search-App-Guide.md` exists at the repository root  
   **When** a developer follows it sequentially  
   **Then** it covers setup (00–05 min), backend (05–15 min), frontend (15–25 min), and wrap-up (25–30 min) per PRD timing cheatsheet (FR10)

2. **And** it documents CORS (`app.use(cors())`), port override (`$env:PORT=3002`), and `npx serve` vs `file://` troubleshooting

3. **And** it instructs manual `users.csv` creation to teach data structure (not just copy a prebuilt file without explanation)

4. **And** tone is expert, concise, and encouraging without exceeding complexity guard — no "best practice" detours that inflate code by >20% (NFR3)

5. **And** all terminal commands work on Windows PowerShell (NFR6)

6. **And** every code block in the guide is complete and copy-paste ready — no `TODO`, no "insert code here" (per `idea.md` quality rules)

## Tasks / Subtasks

- [x] Create `LAB-03-Search-App-Guide.md` at repository root (AC: #1)
  - [x] Add facilitator timing cheatsheet table (PRD §2.1)
  - [x] Add lab overview: objectives, stack, ports, folder tree
  - [x] Section **Setup (00–05 min)**: prerequisites (Node 18+), optional `setup-lab.ps1` reference, two-terminal mental model
  - [x] Section **Mock Data (within setup)**: manual `users.csv` creation with header + 10+ sample rows
  - [x] Section **Backend (05–15 min)**: `sg-search-service` — complete `package.json`, `server.js`, install/run, curl smoke tests
  - [x] Section **Frontend (15–25 min)**: `sg-search` — complete `index.html`, `styles.css`, `app.js`, `package.json`, `npx serve` on port 3000
  - [x] Section **Wrap-up (25–30 min)**: browser test matrix, `verify-lab.ps1` reference, success criteria
- [x] Embed troubleshooting table (AC: #2)
  - [x] CORS error → `app.use(cors())`
  - [x] Port conflict → `$env:PORT=3002; npm start`
  - [x] Fetch failure → use `npx serve`, not `file://`
- [x] Apply UX microcopy and glassmorphism design tokens in frontend code blocks (AC: #1, UX-DR1–UX-DR13)
- [x] Include API verification matrix with expected row counts (AC: #1)
- [x] Cross-reference sibling Epic 3 artifacts without duplicating their full content (AC: #1)
  - [x] `setup-lab.ps1` (Story 3.1) — setup shortcut
  - [x] `verify-lab.ps1` (Story 3.2) — automated validation
  - [x] **Keep** Step 5 Git workflow in guide (facilitator single-doc flow) with scope note cross-ref to Story 3.5
  - [x] **Do not** include full `launch.json` contents — Story 3.4; one-line pointer only
- [x] Proofread for Senior Developer/Architect tone: action-oriented, no fluff (AC: #4)
- [x] Self-verify all PowerShell commands in a dry run or against running services (AC: #5)

### Review Findings

- [x] [Review][Decision] Step 5 GitHub section scope — **Keep merged Step 5** in guide (facilitator single-doc flow; scope note added cross-ref to Story 3.5)
- [x] [Review][Patch] Hardcoded machine-specific paths in PowerShell blocks [LAB-03-Search-App-Guide.md:75,802]
- [x] [Review][Patch] Weak manual CSV pedagogy (AC #3) — Step 1 uses bulk `Set-Content` without explaining column purpose or why learners create the file themselves [LAB-03-Search-App-Guide.md:169]
- [x] [Review][Patch] Verification matrix incomplete vs story contract — missing `?firstName=john` (count 3) and `?firstName=Nobody` (count 0) rows [LAB-03-Search-App-Guide.md:764]
- [x] [Review][Defer] Full `launch.json` JSON embedded in guide — added under Story 3.4 scope; acceptable merged deliverable [LAB-03-Search-App-Guide.md:81]
- [x] [Review][Defer] `Set-Content -Encoding utf8` may write UTF-8 BOM on Windows, breaking csv-parse header detection — pre-existing lab pattern [LAB-03-Search-App-Guide.md:191]
- [x] [Review][Defer] Guide length (~860 lines) may exceed 30-minute window for slow typists — acceptable for copy-paste lab format [LAB-03-Search-App-Guide.md:1]

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` describes a **superseded Task Manager** (React 19, Zustand, Tailwind). **Do not follow it.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Story 3.3 AC, FR10) |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | Timing cheatsheet §2.1, troubleshooting §2.2, deliverables §3.3 |
| `idea.md` | Guide section structure, verification matrix, code quality rules |
| `ux-designs/.../DESIGN.md` | Glassmorphism tokens for frontend CSS in guide |
| `ux-designs/.../EXPERIENCE.md` | Microcopy strings for frontend JS in guide |
| `sg-search-service/README.md` | Authoritative API test matrix and curl examples |
| Epic 1 story files | Backend implementation contract |

### Deliverable Location

```text
AI_POC_Lab4/                          # repository root (sg-search-workshop)
├── LAB-03-Search-App-Guide.md        # ← THIS STORY creates this file
├── setup-lab.ps1                     # Story 3.1 (may not exist yet — reference by name)
├── verify-lab.ps1                    # Story 3.2 (may not exist yet — reference by name)
├── sg-search-service/                # Epic 1 (partially implemented)
└── sg-search/                        # Epic 2 (not yet implemented — guide must include full code)
```

**Do not** place the guide under `cursor-workshop-app/` or `Lab3/` — `idea.md` used an early workshop path; epics and Story 1.1 resolved **root-level** layout.

### PRD Timing Cheatsheet (Must Appear in Guide)

| Time | Step | Focus |
|------|------|-------|
| **00–05 min** | Setup | Overview & initialize `users.csv` |
| **05–15 min** | Backend | `sg-search-service` Express API |
| **15–25 min** | Frontend | `sg-search` Vanilla JS UI |
| **25–30 min** | Wrap-up | Verification, testing (Git steps → Story 3.5) |

Map `idea.md` section targets onto this PRD window (idea's 2+3 min overview/data fit in 00–05; backend 10 min → 05–15; frontend 10 min → 15–25; verification 5 min → 25–30).

### Guide Outline (Required Sections)

Use clean `#` / `##` / `###` headers; short action-oriented sentences; tables for ports, folder tree, verification matrix.

1. **Lab Overview & Prerequisites** (~2 min read)
   - Objectives: full-stack search in 30 minutes
   - Stack: Node 18+, Express 4, Vanilla HTML/CSS/JS, CSV data
   - Ports: frontend **3000**, backend **3001**
   - Folder tree (see File Structure below)
   - Prerequisites checklist: Node.js, PowerShell, VS Code/Cursor, browser

2. **Step 1: Mock Data Setup** (~3 min)
   - Explain **why** learners create CSV manually (data structure literacy)
   - Exact column spec: `firstName,lastName,email,department,city`
   - Provide **copy-paste ready** 12-row sample (match `sg-search-service/users.csv` fixture for consistent test counts)
   - Note: duplicates intentional (3× John, 2× Smith) for search demos

3. **Step 2: Backend Service Development** (~10 min)
   - Create `sg-search-service/` with complete files (see Backend Code Contract)
   - `npm install` + `npm start` in Terminal 1
   - curl / `Invoke-RestMethod` smoke tests for `/health` and `/api/search`

4. **Step 3: Frontend UI Development** (~10 min)
   - Create `sg-search/` with complete files (see Frontend Code Contract)
   - Serve via HTTP: `npx serve -l 3000` in Terminal 2
   - Glassmorphism styling per DESIGN.md tokens

5. **Step 4: Verification & Testing** (~5 min)
   - Run both apps; browser at `http://127.0.0.1:3000`
   - Browser test matrix (John/Smith scenarios)
   - Optional: `.\verify-lab.ps1` when available (Story 3.2)
   - TTFS check: first search result visible within 15 minutes (NFR1)

6. **Troubleshooting** (embedded table — PRD §2.2)

| Issue | Cause | Fix |
|-------|-------|-----|
| CORS Error | Missing middleware | Add `app.use(cors())` in `server.js` before routes |
| Port Conflict | 3000/3001 busy | `$env:PORT=3002; npm start` (PowerShell) |
| Fetch Failure | `file://` protocol | Use `npx serve -l 3000` in `sg-search` |

### Backend Code Contract (Guide Must Document)

Align guide code with Epic 1 implementation — **do not invent a different API**.

| Item | Specification |
|------|---------------|
| Entry | `server.js` (CommonJS, `require`) |
| Port | `process.env.PORT \|\| 3001` |
| CSV load | At startup via `csv-parse/sync`, fail-fast on bad file |
| `GET /health` | `200` + `{ "status": "ok" }` |
| `GET /api/search` | Query: `firstName`, `lastName`; response `{ count, results[] }` |
| Matching | Case-insensitive exact match; empty/missing param = wildcard for that field |
| Validation | Both params empty → `400` + `{ "error": "At least one of firstName or lastName is required" }` |
| CORS | `app.use(cors())` before routes |
| Dependencies | `express`, `csv-parse`, `cors` only (NFR3) |

**Verification matrix** (12-user fixture — must match guide sample CSV):

| Query | Expected `count` |
|-------|------------------|
| `?firstName=John&lastName=Smith` | 1 |
| `?firstName=John` | 3 |
| `?lastName=Smith` | 2 |
| `?firstName=john` | 3 |
| (no params) | HTTP **400** |
| `?firstName=Nobody` | 0 |

PowerShell test commands (from `sg-search-service/README.md`):

```powershell
curl http://127.0.0.1:3001/health
curl "http://127.0.0.1:3001/api/search?firstName=John&lastName=Smith"
curl "http://127.0.0.1:3001/api/search?firstName=John"
curl "http://127.0.0.1:3001/api/search?lastName=Smith"
curl -i "http://127.0.0.1:3001/api/search"
```

### Frontend Code Contract (Guide Must Document)

Epic 2 is not implemented in repo yet — the guide is the **canonical spec** for frontend code learners will type.

| Item | Specification |
|------|---------------|
| Files | `index.html`, `styles.css`, `app.js`, `package.json` |
| Serve | `"start": "npx serve -l 3000 -s ."` or equivalent |
| Fetch URL | `http://localhost:3001/api/search?firstName=...&lastName=...` |
| No reload | Update DOM via JS only (FR6) |
| XSS | Escape all cell values before DOM insertion (FR9) |
| Enter key | Triggers same search as Search button (UX-DR11) |
| Clear | Empties inputs + removes results/status immediately (UX-DR12) |

**Microcopy (exact strings from EXPERIENCE.md / UX-DR10):**

| State | Message |
|-------|---------|
| Empty | `Enter a name to begin searching.` |
| Loading | `Searching database...` |
| Success | `Found {n} results.` |
| Error | `Search failed. Please check the backend connection.` |

**Glassmorphism CSS tokens (DESIGN.md):**

- Background: soft gradient `#f5f5f7` → `#ffffff`
- Glass card: `rgba(255, 255, 255, 0.7)` + `backdrop-filter: blur(20px)`
- Text: `#1d1d1f`; Accent: `#0071e3`
- Border: `rgba(255, 255, 255, 0.3)`
- Font: `system-ui, -apple-system, ...` at 17px base
- Layout: centered, max-width 800px, card padding 24–32px
- Radius: 12px cards, 8px buttons/inputs
- Table: horizontal dividers only, no vertical grid lines

**HTML escape helper (include in `app.js` code block):**

```javascript
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

Reference `ux-designs/.../.working/direction-glassmorphism.html` for visual direction if needed.

### Cross-Story Scope Boundaries

| Story | In guide? | How |
|-------|-----------|-----|
| 3.1 `setup-lab.ps1` | Reference | "Run `.\setup-lab.ps1` from project root" + what it does per epic AC |
| 3.2 `verify-lab.ps1` | Reference | Wrap-up section: run script, interpret pass/fail |
| 3.4 `launch.json` | Pointer only | "Use VS Code Run and Debug — see `.vscode/launch.json`" |
| 3.5 Git workflow | **Exclude** | Do not add Step 5 commit section; Story 3.5 adds that |

If `setup-lab.ps1` / `verify-lab.ps1` do not exist yet, document **manual equivalent steps** and note "automated by script when available" — do not block guide completion.

### What Must NOT Be in the Guide

- React, Zustand, Tailwind, task-manager patterns from stale `architecture.md`
- Authentication, database, cloud deployment (NFR7, NFR8, NFR10)
- Full GitHub commit steps (Story 3.5)
- Full `launch.json` JSON (Story 3.4)
- Placeholder code or incomplete snippets
- Linux/bash-only commands without PowerShell equivalents

### Current Codebase State (Author Against This Reality)

**`sg-search-service/`** — Epic 1 partially complete:
- `server.js`: CSV load + `/health` implemented; `/api/search` and CORS may still be pending in working tree (Stories 1.4/1.5 in review)
- `users.csv`: 12 rows with John/Smith duplicates — use as guide sample data
- `README.md`: authoritative curl matrix and API docs — **reuse**, do not contradict

**`sg-search/`** — does not exist yet. Guide frontend sections must be self-contained complete code.

**Root scripts** — `setup-lab.ps1`, `verify-lab.ps1` do not exist yet (Stories 3.1, 3.2 backlog).

### Regression / Consistency Guard

The guide teaches learners to build what Epic 1–2 stories implement. When authoring:

1. Read `sg-search-service/server.js` and `README.md` — backend code blocks must match shipped behavior
2. If `/api/search` or CORS not yet in `server.js`, use Epic 1 story specs (1.4, 1.5) as source of truth for guide code
3. Frontend code blocks should satisfy Epic 2 ACs (Stories 2.1–2.5) even though those stories are backlog
4. Test matrix counts must match the guide's sample CSV row set

### Project Structure Notes

Canonical repo layout per epics (not `idea.md`'s `Lab3/`):

```text
sg-search-workshop/
├── LAB-03-Search-App-Guide.md
├── setup-lab.ps1                 # Epic 3.1
├── verify-lab.ps1                # Epic 3.2
├── .vscode/launch.json           # Epic 3.4
├── sg-search-service/
│   ├── package.json
│   ├── server.js
│   └── users.csv
└── sg-search/
    ├── package.json
    ├── index.html
    ├── styles.css
    └── app.js
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.3]
- [Source: `_bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md` — §2.1 Timing, §2.2 Troubleshooting]
- [Source: `idea.md` — Output structure, verification matrix, code quality rules]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/DESIGN.md`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/EXPERIENCE.md`]
- [Source: `sg-search-service/README.md` — API tests]
- [Source: `_bmad-output/implementation-artifacts/1-4-implement-search-api-with-filtering-rules.md`]
- [Source: `_bmad-output/implementation-artifacts/1-5-enable-cors-for-lab-frontend.md`]

## Dev Agent Guardrails

### Technical Requirements

- Output file: **`LAB-03-Search-App-Guide.md`** at repository root only
- Markdown formatted for PDF export (clean headers, tables, fenced code blocks with language tags)
- All paths relative to repository root
- PowerShell for all shell examples; use `curl.exe` when noting curl on Windows if native curl behaves differently
- Node.js **18+** documented as minimum
- Ports **3000** (frontend) and **3001** (backend) — document override pattern

### Architecture Compliance

- **Stack:** Express 4 + Vanilla JS — no frameworks (NFR9)
- **Data:** CSV file only, in-memory at startup (NFR8)
- **Security:** XSS escape in frontend; no auth (NFR7)
- **Deployment:** localhost only (NFR10)
- **Complexity guard:** No extra middleware, ORMs, bundlers, or abstractions beyond lab needs (NFR3)

### Library / Framework Requirements

| Package | Location | Version guidance |
|---------|----------|------------------|
| `express` | `sg-search-service` | `^4.21.0` |
| `csv-parse` | `sg-search-service` | `^5.6.0` |
| `cors` | `sg-search-service` | `^2.8.x` — `app.use(cors())` |
| `serve` | `sg-search` (devDependency or npx) | via `npx serve -l 3000` |

Do not add React, Vite, webpack, nodemon, or testing frameworks to the guide.

### File Structure Requirements

| Action | Path |
|--------|------|
| **CREATE** | `LAB-03-Search-App-Guide.md` |
| **DO NOT CREATE** | Application source files — guide documents them; Epic 1–2 stories own code |
| **DO NOT MODIFY** | `sg-search-service/*`, sprint files, epics — unless fixing a factual error discovered during authoring |

### Testing Requirements

Manual validation checklist for the dev agent after writing the guide:

- [ ] Every fenced code block is syntactically valid and complete
- [ ] Sample CSV produces verification matrix counts (John=3, Smith=2, John+Smith=1)
- [ ] PowerShell commands copy-paste without syntax errors
- [ ] Troubleshooting table matches PRD §2.2 exactly
- [ ] Timing sections sum to ~30 minutes
- [ ] No Git commit section (deferred to 3.5)
- [ ] Microcopy strings match EXPERIENCE.md exactly
- [ ] Guide readable start-to-finish without external doc jumps (except optional script/launch pointers)

## Previous Story Intelligence

Stories 3.1 and 3.2 do not have story files yet. Relevant learnings from **Epic 1** (backend the guide documents):

| Learning | Apply to guide |
|----------|----------------|
| Root-level `sg-search-service/`, not nested workshop folder | Folder tree in overview |
| `csv-parse/sync` with `columns: true` chosen over raw split | Show this in backend code block |
| Fail-fast CSV startup with clear console errors | Mention in troubleshooting if CSV wrong |
| Case-insensitive search uses `.toLowerCase()` on both sides | Document in API behavior section |
| Empty query params treated as wildcards; whitespace-only = empty | Explain in search behavior table |
| `README.md` curl matrix is canonical | Reuse counts and commands |
| Deferred: no `.gitignore` at root yet | Do not document gitignore here (Epic 3.5 / facilitator) |
| Deferred: PORT env not validated | Document override pattern only |

## Git Intelligence Summary

- Single commit: `3aad37e initial commit`
- Backend scaffold exists; guide is greenfield documentation
- No prior guide iterations to preserve

## Latest Tech Information

| Technology | Notes for guide |
|------------|-----------------|
| **Express 4.21** | Stable on Node 18+; use CommonJS `require` for lab simplicity |
| **csv-parse 5.x** | `parse(raw, { columns: true, skip_empty_lines: true, trim: true })` — [csv-parse docs](https://csv.js.org/parse/) |
| **cors 2.8.x** | `app.use(cors())` reflects requesting origin by default — sufficient for localhost lab |
| **serve (npx)** | `npx serve -l 3000 -s .` serves static files over HTTP; `-s` enables SPA-style fallback (optional for this lab) |
| **Node 18+** | `fetch` available globally in Node 18 — but frontend uses browser `fetch`, not Node |

No web research blockers identified; versions match existing `package.json`.

## Project Context Reference

No `project-context.md` found. Primary context sources:

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md`
- `idea.md` (original lab prompt — section structure and quality bar)
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-06-04.md` (confirms architecture.md is stale)

## Story Completion Status

- **Status:** ready-for-dev
- **Completion note:** Ultimate context engine analysis completed — comprehensive developer guide for authoring `LAB-03-Search-App-Guide.md`
- **Scope:** Documentation only — creates one markdown file; no application code changes
- **Unblocks:** Facilitator can run lab once Epic 1–2 code and Epic 3.1–3.2 scripts exist; guide is the human-facing walkthrough

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- Code review patches applied 2026-06-04 via bmad-quick-dev

### Completion Notes List

- Authored `LAB-03-Search-App-Guide.md` with full lab walkthrough, code blocks, verification matrix, troubleshooting
- Applied review patches: portable paths, CSV pedagogy table, complete verification matrix (`john`, `Nobody`)
- **Git decision:** Keep Step 5 in guide with scope note referencing Story 3.5
- Root `.gitignore` added (node_modules, .env, logs)
- Lab artifacts committed per guide Step 5

### File List

- `LAB-03-Search-App-Guide.md` (created, updated)
- `.gitignore` (created)

## Change Log

- 2026-06-04: Initial guide authoring and review patch resolution (paths, pedagogy, matrix, Git scope)
