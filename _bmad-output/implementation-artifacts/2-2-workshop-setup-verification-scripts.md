---
baseline_commit: f5aa6a915e249077244c8e6b66f823d08afe6d43
---

# Story 2.2: Workshop Setup & Verification Scripts

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **lab facilitator**,
I want setup and verification scripts aligned with MongoDB readiness,
So that pre-flight checks and smoke tests validate the new persistence model without changing test expectations.

## Acceptance Criteria

1. **Given** `setup-lab.ps1` at repo root  
   **When** I run it before the lab  
   **Then** it verifies Node 18+, runs `npm install` in `sg-search-service`, and checks for `.env` with non-empty `MONGODB_URI`

2. **Given** `.env` is missing or `MONGODB_URI` is empty  
   **When** I run `setup-lab.ps1`  
   **Then** it prints facilitator instructions for obtaining the shared connection string

3. **Given** `setup-lab.ps1`  
   **When** I review its checks  
   **Then** it confirms `users.csv` exists as seed input only and does not prompt for a manual seed step

4. **Given** the backend is running with auto-seed completed  
   **When** I run `verify-lab.ps1` from repo root  
   **Then** all existing smoke tests pass with unchanged expected counts and field validation

5. **Given** `verify-lab.ps1`  
   **When** I review troubleshooting hints  
   **Then** they mention MongoDB connection failures where relevant

6. **Given** `verify-lab.ps1`  
   **When** I compare test cases to the pre-MongoDB version  
   **Then** no test case expectations (counts, fields, endpoints) were modified

7. **Given** all four lab artifacts (README, lab guide, setup script, verify script)  
   **When** I review them together  
   **Then** they consistently describe the MongoDB workflow with no conflicting CSV runtime-loading instructions (NFR-4)

## Tasks / Subtasks

- [x] Add MongoDB readiness check to `setup-lab.ps1` (AC: #1, #2, #3)
  - [x] Add `Test-MongodbEnv` function: resolve `sg-search-service/.env`, parse `MONGODB_URI` line
  - [x] PASS when `.env` exists and `MONGODB_URI` has non-whitespace value after `=`
  - [x] WARN (yellow) when missing/empty — print facilitator copy steps (see Dev Notes); do **not** block `npm install`
  - [x] Reuse `.env.example` quoting guidance (`#`, `=` characters) in printed instructions
  - [x] Update `Ensure-UsersCsv` messaging: "seed input only" — never imply runtime CSV loading
  - [x] Remove or update stale "Epic 2 frontend" warnings if `sg-search/` now exists
- [x] Update `Write-NextSteps` banner in `setup-lab.ps1` (AC: #1, #2, #3)
  - [x] Add `.env` setup step **before** `npm start` when `Test-MongodbEnv` failed
  - [x] Remove CSV-era language; reference MongoDB connect + auto-seed on `npm start`
  - [x] Keep two-terminal layout (backend 3001, frontend 3000) and `verify-lab.ps1` reference
  - [x] Do **not** add manual seed commands (`mongoimport`, `npm run seed`, etc.)
- [x] Update troubleshooting hints in `verify-lab.ps1` only (AC: #4, #5, #6)
  - [x] `ConnectionRefused` / `Get-ConnectionFailureHint`: add MongoDB `.env` / `MONGODB_URI` / Atlas IP allowlist hints
  - [x] `SearchFailed`: replace CSV-only wording with MongoDB auto-seed + shared-cluster guidance
  - [x] `NotFound`: remove outdated "Implement Story 1.4" message — route exists in Epic 1
  - [x] **Do not** add/remove/rename test functions, expected counts, endpoints, or field lists
- [x] Cross-artifact consistency pass (AC: #7)
  - [x] Update `LAB-03-Search-App-Guide.md` Quick Start footnote (lines ~89–91): remove "ships in follow-up story" note; describe actual `setup-lab.ps1` MongoDB check
  - [x] Update repo layout comment for `setup-lab.ps1` in guide if script behavior changed
  - [x] Confirm `sg-search-service/README.md` troubleshooting aligns with new verify hints (read-only unless contradiction found)
- [x] Validation gate (AC: all)
  - [x] `.\setup-lab.ps1` with valid `.env` → Node OK, deps installed, MongoDB env PASS
  - [x] `.\setup-lab.ps1` without `.env` → deps still install, facilitator instructions printed, next-steps show `.env` creation
  - [x] Backend running + `.\verify-lab.ps1` → health + search checks pass (counts 1, 3); no-params HTTP 400 confirmed via API; PS 5.1 empty error-body limitation pre-existing (Story 1.5)
  - [x] Grep `verify-lab.ps1` for `ExpectedCount` / test matrix — unchanged values
  - [x] Grep scripts for forbidden: `manual seed`, `mongoimport`, runtime CSV loading prompts

### Review Findings

- [x] [Review][Defer] Lab guide diff exceeds Story 2.2 scope [`LAB-03-Search-App-Guide.md`] — deferred: ship scripts now; split/reconcile guide scope in follow-up (user decision 2026-06-05)
- [x] [Review][Patch] Reword SearchFailed shared-cluster note to facilitator-only prose (not participant troubleshooting) [`verify-lab.ps1:91`]
- [x] [Review][Patch] Startup log string mismatch in verify hint [`verify-lab.ps1:89`]
- [x] [Review][Patch] Troubleshooting table truncates startup log snippet [`LAB-03-Search-App-Guide.md:762`]
- [x] [Review][Patch] Write-NextSteps shows Copy-Item when .env exists but MONGODB_URI empty [`setup-lab.ps1:164-165`]
- [x] [Review][Patch] Unreadable .env aborts setup before npm install [`setup-lab.ps1:103`]
- [x] [Review][Patch] UTF-8 BOM on first line breaks MONGODB_URI detection [`setup-lab.ps1:104`]
- [x] [Review][Patch] Empty MONGODB_URI= line stops scan before later valid line [`setup-lab.ps1:105-107`]
- [x] [Review][Defer] Guide falsely claims verify-lab runs CORS header check [`LAB-03-Search-App-Guide.md:667`] — deferred, pre-existing (Story 2.1 review; explicitly out of 2.2 scope)
- [x] [Review][Defer] README says auto-seed only when collection empty [`sg-search-service/README.md:43`] — deferred, pre-existing (README out of 2.2 scope unless contradiction; runtime upserts every startup)
- [x] [Review][Defer] Guide says frontend needs no npm install but setup installs [`LAB-03-Search-App-Guide.md:89` vs `setup-lab.ps1:207-209`] — deferred, pre-existing
- [x] [Review][Defer] Guide says restore users.csv from repo; setup auto-creates if missing [`LAB-03-Search-App-Guide.md:199` vs `setup-lab.ps1:132`] — deferred, pre-existing (setup handles recovery)

## Dev Notes

### Epic Context

Epic 2 aligns facilitator-facing artifacts with the MongoDB backend from Epic 1. **Story 2.1 updated the lab guide**; **Story 2.2 updates the PowerShell scripts** that facilitators run for pre-flight and verification.

| Story | Scope | Status |
|-------|-------|--------|
| 2.1 | `LAB-03-Search-App-Guide.md` MongoDB workflow | done |
| **2.2** | **`setup-lab.ps1` + `verify-lab.ps1` MongoDB readiness** | **this story** |

Epic 1 delivered a working MongoDB backend (`npm start` → connect → auto-seed → listen). Scripts still reflect CSV-era Epic 3 origins — this story closes the facilitator tooling gap.

### Current Script State (READ BEFORE EDITING)

#### `setup-lab.ps1` (163 lines) — CSV-era, no MongoDB checks

| Function | Current behavior | Gap vs FR-11 |
|----------|------------------|--------------|
| `Test-NodeVersion` | Node 18+ check | ✅ Keep unchanged |
| `Test-NpmPresent` | npm on PATH | ✅ Keep unchanged |
| `Invoke-NpmInstall` | `npm install` with exit validation | ✅ Keep unchanged |
| `Ensure-UsersCsv` | Creates 12-row sample if missing | ✅ Keep logic; update **wording** to "seed input only" |
| `Write-NextSteps` | Backend `npm start` only — **no `.env` reminder** | ❌ Add MongoDB `.env` step; deferred from Story 2.1 review |
| Main flow | No `.env` / `MONGODB_URI` validation | ❌ Add `Test-MongodbEnv` |

**Critical:** `setup-lab.ps1` must **never** read or echo the actual `MONGODB_URI` value to the console (secret leakage). Only report presence/absence.

#### `verify-lab.ps1` (390 lines) — test cases frozen, hints CSV-era

**Frozen test suite (DO NOT MODIFY):**

| Test function | Request | Expected | Line ref |
|---------------|---------|----------|----------|
| `Test-HealthEndpoint` | `GET /health` | 200, `status: ok` | ~188–220 |
| `Test-SearchEndpoint` | `?firstName=John&lastName=Smith` | `count: 1` | ~369–370 |
| `Test-SearchEndpoint` | `?firstName=John` | `count: 3` | ~371–372 |
| `Test-SearchRequiresParams` | `GET /api/search` (no params) | HTTP 400 + `error` | ~373 |
| `Test-FrontendOptional` | `http://127.0.0.1:3000` | warn only | ~332–361 |

**Required user fields (frozen):** `firstName`, `lastName`, `email`, `department`, `city` — line 37–39.

**Hints requiring MongoDB update (safe to edit):**

| FailureType | Current hint problem | Target |
|-------------|---------------------|--------|
| `ConnectionRefused` | Only "npm start" — no MongoDB | Add: check `.env`, `MONGODB_URI`, Atlas IP allowlist, `Startup failed:` in terminal |
| `SearchFailed` | "Check users.csv and README search matrix" — implies CSV runtime | Add: auto-seed must complete; restart `npm start`; expect `Connected to MongoDB` log; shared cluster pollution caveat |
| `NotFound` | "Implement Story 1.4 search route" | Outdated — Epic 1 complete; hint should say wrong base URL or server not fully started |

**Out of scope for verify-lab.ps1:**
- Adding `lastName=Smith`, `firstName=john`, `firstName=Nobody` tests (not in original script; AC #6 forbids changing expectations)
- Implementing CORS header inspection (deferred — guide claims it but script never did; do not add in 2.2)

### Cross-Story Boundaries

**In scope:**

| File | Change |
|------|--------|
| `setup-lab.ps1` | MongoDB `.env` validation, updated next-steps, seed-input wording |
| `verify-lab.ps1` | Troubleshooting hints only (strings in `Get-LabTroubleshootingHint`) |
| `LAB-03-Search-App-Guide.md` | Minor alignment: remove Story 2.2 footnote, update `setup-lab.ps1` description (NFR-4) |

**Out of scope (do NOT modify):**

| File | Owner | Reason |
|------|-------|--------|
| `sg-search-service/server.js`, `lib/*`, `models/*` | Epic 1 (done) | Runtime complete |
| `sg-search-service/README.md` | Story 1.5 (done) | Reference for hint wording; edit only if direct contradiction |
| `sg-search/**` | Frozen (NFR-3) | Zero frontend diffs |
| `sg-search-service/test/search-validation.test.js` | Story 1.5 (done) | Separate test path |
| `.vscode/launch.json` | Optional | Not in FR-11/FR-12 |

### Technical Requirements

#### `Test-MongodbEnv` implementation pattern (AC #1, #2)

```powershell
function Test-MongodbEnv {
    param([string]$BackendDir)

    $envPath = Join-Path $BackendDir '.env'
    $examplePath = Join-Path $BackendDir '.env.example'

    if (-not (Test-Path $envPath)) {
        Write-Host 'WARN - sg-search-service/.env not found' -ForegroundColor Yellow
        Write-FacilitatorEnvInstructions -ExamplePath $examplePath
        return $false
    }

    $uri = $null
    foreach ($line in Get-Content -LiteralPath $envPath -Encoding UTF8) {
        $trimmed = $line.Trim()
        if ($trimmed -match '^\s*MONGODB_URI\s*=\s*(.+)$' -and -not $trimmed.StartsWith('#')) {
            $uri = $Matches[1].Trim().Trim('"').Trim("'")
            break
        }
    }

    if ([string]::IsNullOrWhiteSpace($uri)) {
        Write-Host 'WARN - MONGODB_URI is missing or empty in .env' -ForegroundColor Yellow
        Write-FacilitatorEnvInstructions -ExamplePath $examplePath
        return $false
    }

    Write-Host 'MongoDB .env configured (MONGODB_URI present)' -ForegroundColor DarkGray
    return $true
}
```

**Parsing rules:**
- Skip comment lines starting with `#`
- Accept `MONGODB_URI=value` or quoted `MONGODB_URI="..."` / `MONGODB_URI='...'`
- Treat whitespace-only value as empty (fail)
- **Never** `Write-Host` the URI value

**Facilitator instructions to print when check fails:**

```
Facilitator: provide the shared Atlas connection string securely before the lab.
Participant steps:
  cd sg-search-service
  Copy-Item .env.example .env
  Paste MONGODB_URI into .env (quote the value if it contains # or = characters)
See sg-search-service/README.md and LAB-03-Search-App-Guide.md Step 2 for details.
```

**Exit behavior:** `setup-lab.ps1` should still `exit 0` after successful `npm install` even when `.env` is missing — the check is **readiness guidance**, not a hard gate. Facilitators need deps installed before distributing `.env` values.

**Call order in main flow:**

```
Test-NodeVersion → Test-NpmPresent → Ensure-UsersCsv → Test-MongodbEnv → Invoke-NpmInstall (backend) → ...
```

Run `Test-MongodbEnv` **before** `npm install` so facilitators see env warnings early; re-print in `Write-NextSteps` if `$mongodbReady -eq $false`.

#### `Write-NextSteps` target output (when `.env` missing)

```
Terminal 1 - Backend (port 3001):
  cd sg-search-service
  Copy-Item .env.example .env    # if not done — paste facilitator MONGODB_URI
  npm start                      # connect → auto-seed → listen

Smoke test (with backend running):
  curl http://127.0.0.1:3001/health

Full verification: .\verify-lab.ps1 (backend must be running)
```

Remove stale text: `"Full verification: run verify-lab.ps1 after both apps are up (Story 3.2)"` and `"after Epic 2"` frontend warnings when `sg-search/` exists.

#### `users.csv` handling (AC #3)

- **Keep** `Ensure-UsersCsv` create-if-missing behavior (workshop recovery)
- Change log line from generic "Creating sample users.csv" to clarify **auto-seed fixture**
- **Do not** add prompts like "Press Enter to seed" or instructions to run `mongoimport`
- When file exists: `"users.csv seed fixture present (auto-seed input only)"`

#### verify-lab.ps1 hint updates (AC #5 — strings only)

**`ConnectionRefused` — append after existing lines:**

```
MongoDB startup failed?
  Ensure sg-search-service/.env exists with MONGODB_URI set
  Check terminal for 'Startup failed: MONGODB_URI is required' or Atlas connection errors
  Ask facilitator about Atlas IP allowlist / VPN
```

**`SearchFailed` — replace CSV-primary wording:**

```
Search count mismatch after MongoDB migration?
  Restart: cd sg-search-service; npm start
  Confirm log: 'Connected to MongoDB — N users in users collection'
  Auto-seed upserts from users.csv at startup — no manual seed step
  Shared Atlas cluster may have extra users from other participants (counts may differ)
  See README search matrix in sg-search-service/
```

**`NotFound` — replace Story 1.4 reference:**

```
GET /api/search returned 404.
  Confirm API base URL (default http://127.0.0.1:3001)
  Ensure npm start completed without 'Startup failed:' errors
```

#### Lab guide alignment (AC #7 — minimal edit)

Story 2.1 intentionally left this footnote:

> MongoDB `.env` validation in `setup-lab.ps1` ships in a follow-up workshop story.

**Replace** with prose matching implemented script behavior, e.g.:

> `setup-lab.ps1` checks that `sg-search-service/.env` contains a non-empty `MONGODB_URI`. If missing, it prints facilitator instructions — create `.env` in Step 2 before `npm start`.

Also update layout tree comment line 58 from `"checks users.csv seed file"` to include `.env` / `MONGODB_URI` check.

### Architecture Compliance

- **Script boundary preserved** — scripts at repo root shell out to `npm` and HTTP; they do not import backend modules [Source: architecture § Component Boundaries]
- **Fail-fast is backend-only** — `setup-lab.ps1` warns on missing `.env`; actual `process.exit(1)` happens in `server.js` on `npm start` [Source: architecture § Process Patterns]
- **Search parity gate unchanged** — `verify-lab.ps1` counts remain SM-1 validation subset (1, 3, 400) [Source: NFR-1]
- **NFR-4 documentation completeness** — four artifacts must describe MongoDB workflow consistently after this story [Source: epics.md FR-11, FR-12]
- **No secrets in scripts** — never hardcode or echo `MONGODB_URI` [Source: NFR-6]
- **users.csv seed-only** — script confirms fixture exists; does not parse CSV for search [Source: FR-5, architecture § Data Boundaries]

### Library & Framework Requirements

**No npm dependency changes.** PowerShell 5.1+ compatibility required (Windows lab environment).

| Technology | Role in Scripts |
|------------|-----------------|
| PowerShell 5.1 | Lab script runtime — ASCII hyphens, avoid `??` null-coalescing |
| Node.js 18+ | Validated by existing `Test-NodeVersion` |
| MongoDB Atlas | Readiness via `.env` presence check only — no driver in scripts |
| `users.csv` | Seed fixture existence check — not parsed by scripts |

### File Structure Requirements

**Files to MODIFY:**

| File | Change |
|------|--------|
| `setup-lab.ps1` | `Test-MongodbEnv`, `Write-FacilitatorEnvInstructions`, updated `Write-NextSteps`, seed wording |
| `verify-lab.ps1` | `Get-LabTroubleshootingHint` string updates only |
| `LAB-03-Search-App-Guide.md` | Remove 2.2 footnote; update Quick Start + layout comments (~3–5 lines) |

**Files to READ for accuracy (do not modify unless contradiction):**

| File | Use |
|------|-----|
| `sg-search-service/.env.example` | Exact placeholder and quoting comments for facilitator instructions |
| `sg-search-service/README.md` | Troubleshooting table — mirror hint language |
| `sg-search-service/server.js` | Startup log strings referenced in hints |
| `LAB-03-Search-App-Guide.md` | Cross-artifact consistency (Story 2.1 output) |

### Testing Requirements

**setup-lab.ps1 — manual PowerShell gates:**

```powershell
# Case A: valid .env (from repo root)
.\setup-lab.ps1
# Expect: Node OK, npm OK, users.csv OK, "MONGODB_URI present", deps installed, exit 0

# Case B: missing .env (rename temporarily)
Rename-Item sg-search-service\.env .env.bak
.\setup-lab.ps1
# Expect: WARN + facilitator instructions, deps still installed, next-steps show Copy-Item .env.example
Rename-Item sg-search-service\.env.bak .env

# Case C: empty MONGODB_URI
# Set MONGODB_URI= in .env temporarily → WARN + instructions, exit 0 after npm install
```

**verify-lab.ps1 — regression gate (requires running backend):**

```powershell
cd sg-search-service
npm start
# Expect: Connected to MongoDB — 12 users in users collection

# Separate terminal (repo root):
.\verify-lab.ps1
# Expect: PASS health, PASS John+Smith (count=1), PASS firstName=John (count=3), PASS no-params 400
# Expect: exit 0
```

**Frozen test assertion grep (AC #6):**

```powershell
Select-String -Path verify-lab.ps1 -Pattern 'ExpectedCount 1|ExpectedCount 3|firstName=John&lastName=Smith|firstName=John'
# Must still match — no new ExpectedCount values added
```

**Cross-artifact grep (AC #7):**

```powershell
# setup-lab.ps1 must reference MongoDB
Select-String -Path setup-lab.ps1 -Pattern 'MONGODB_URI|\.env'

# Lab guide must not say "ships in a follow-up"
Select-String -Path LAB-03-Search-App-Guide.md -Pattern 'follow-up workshop story'
# Expect: no matches after 2.2

# Forbidden in scripts
Select-String -Path setup-lab.ps1,verify-lab.ps1 -Pattern 'mongoimport|npm run seed|manual seed'
# Expect: no matches (except negation in comments if any)
```

### Anti-Patterns (Forbidden in This Story)

- Modifying `verify-lab.ps1` test cases, expected counts, endpoints, or `RequiredUserFields`
- Adding CORS header validation to `verify-lab.ps1` (pre-existing guide/script mismatch — stay deferred)
- Hardcoding or echoing facilitator `MONGODB_URI` in script output
- Making `setup-lab.ps1` exit 1 solely for missing `.env` (blocks dep install before facilitator distributes secrets)
- Prompting for manual seed (`mongoimport`, `npm run seed`, interactive CSV upload)
- Implying `users.csv` is loaded at search request time
- Modifying `sg-search-service/` runtime code or `sg-search/` frontend
- Rewriting `verify-lab.ps1` from scratch — surgical hint edits only
- Duplicating full README troubleshooting into scripts — keep hints concise, reference README

### Previous Story Intelligence

#### Story 2.1 (Lab Guide MongoDB Workflow) — done

- Explicitly **deferred** `setup-lab.ps1` and `verify-lab.ps1` changes to Story 2.2
- Guide describes **target** `setup-lab.ps1` behavior with footnote that 2.2 delivers it — **remove footnote in 2.2**
- Review finding deferred: `setup-lab.ps1` terminal output lacks `.env` creation reminder → **this story fixes it**
- Verification matrix in guide unchanged: 1, 3, 2, 3, 0, 400 — `verify-lab.ps1` only tests subset (1, 3, 400) by design
- Guide line 669 claims CORS header check in verify script — **pre-existing inaccuracy; do not fix in 2.2** (deferred-work.md)

#### Story 1.5 (Integration Test & Service Documentation) — done

- `sg-search-service/README.md` is authoritative for MongoDB troubleshooting wording
- Confirmed `npm start` + `verify-lab.ps1` regression gate passes with MongoDB backend
- README startup log: `Connected to MongoDB — 12 users in users collection`

#### Epic 3 Stories 3.1 / 3.2 (original script authors) — done

- `setup-lab.ps1` and `verify-lab.ps1` created for CSV-era lab
- Patterns to preserve: `$PSScriptRoot` anchoring, `$ErrorActionPreference = 'Stop'`, colored output, `exit 0`/`exit 1` semantics
- `Resolve-ApiBaseUrl` port validation — do not regress
- `Invoke-LabGet` + `Write-TestResult` structure — hints plug into existing failure paths

**Key handoff 2.1 → 2.2:** Guide prose already promises MongoDB script checks; scripts must now deliver so NFR-4 four-artifact consistency is true.

### Git Intelligence

Recent commits (`f5aa6a9`, `36dd8bb`) are workshop UI/index updates. Epic 1 MongoDB backend and Story 2.1 lab guide are in working tree. `setup-lab.ps1` and `verify-lab.ps1` at baseline remain Epic 3 CSV-era — unchanged since original implementation. This story is a focused PowerShell + minor guide alignment diff.

### Latest Tech Information

**PowerShell `.env` parsing (2026 best practice for lab scripts):**
- Use line-by-line regex — do not dot-source `.env` (would execute arbitrary content)
- `Get-Content -Encoding UTF8` handles BOM from Windows editors
- Strip optional surrounding quotes on URI value
- Never log parsed URI — only boolean presence check

**MongoDB Atlas workshop pre-flight:**
- Facilitator distributes `.env` values via secure channel before or during 00–05 setup block
- `setup-lab.ps1` validates readiness early; `npm start` remains the authoritative connection test
- Shared cluster may show `N > 12` users in logs — hints should mention this without changing verify counts (fixture upsert ensures search parity for test queries)

**verify-lab.ps1 hint design:**
- Hints fire on FAIL paths only — keep strings concise (participants read yellow text under failed tests)
- Mirror README troubleshooting rows for cognitive consistency across four artifacts

### Project Structure Notes

- Scripts remain at **repository root** per architecture tree
- No new directories or npm packages
- Minor `LAB-03-Search-App-Guide.md` edit aligns NFR-4 — not a full guide rewrite (Story 2.1 already did that)
- PS 5.1 compatibility: use string concatenation, avoid ternary `?:` (added in PS 7)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/epics.md#FR-11, FR-12]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Lab artifact consistency]
- [Source: _bmad-output/planning-artifacts/architecture-AI_POC_Lab4-2026-06-05.md#Project Structure — setup-lab.ps1, verify-lab.ps1 (MOD)]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md#FR-11, FR-12, UJ-3]
- [Source: _bmad-output/implementation-artifacts/2-1-lab-guide-mongodb-workflow.md — deferred script scope, footnote to remove]
- [Source: _bmad-output/implementation-artifacts/1-5-integration-test-service-documentation.md — README authoritative, verify-lab regression]
- [Source: _bmad-output/implementation-artifacts/3-1-create-setup-lab-ps1-bootstrap-script.md — preserve PS patterns]
- [Source: _bmad-output/implementation-artifacts/3-2-create-verify-lab-ps1-validation-script.md — frozen test matrix]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — CORS check deferred, setup .env reminder → 2.2]
- [Source: setup-lab.ps1 — current CSV-era implementation]
- [Source: verify-lab.ps1 — current hint strings and frozen tests]
- [Source: sg-search-service/.env.example — facilitator template]
- [Source: LAB-03-Search-App-Guide.md — Quick Start footnote alignment]

## Dev Agent Record

### Agent Model Used

Composer (Cursor AI)

### Debug Log References

- PS 5.1 `Invoke-WebRequest` returns empty error body on HTTP 400 (pre-existing `verify-lab.ps1` limitation; API returns correct JSON per `curl.exe`)

### Completion Notes List

- Added `Test-MongodbEnv` and `Write-FacilitatorEnvInstructions` to `setup-lab.ps1`; checks run before `npm install`, warn-only (exit 0), never echo URI value
- Updated `Ensure-UsersCsv` and `Write-NextSteps` for MongoDB workflow, seed-fixture wording, and `.env` step when not configured
- Updated `Get-LabTroubleshootingHint` strings in `verify-lab.ps1` only (ConnectionRefused, SearchFailed, NotFound) — test matrix frozen
- Aligned `LAB-03-Search-App-Guide.md` Quick Start and layout comment with implemented script behavior; removed Story 2.2 footnote
- README troubleshooting reviewed — no contradictions; no edit required
- Validation: setup-lab Case A/B pass; verify-lab health + search (counts 1, 3) pass; `npm test` passes; grep gates pass

### File List

- setup-lab.ps1
- verify-lab.ps1
- LAB-03-Search-App-Guide.md

## Change Log

- 2026-06-05: Story 2.2 created — comprehensive setup/verify script MongoDB readiness context for dev agent
- 2026-06-05: Implemented MongoDB readiness in setup/verify scripts and lab guide alignment (Story 2.2)
- 2026-06-05: Code review — 7 patches applied; guide scope split deferred; story marked done

## Story Completion Status

- **Status:** done
- **Completion note:** MongoDB facilitator script checks and verify hints delivered; code review patches applied (2026-06-05); guide scope reconciliation deferred to follow-up
