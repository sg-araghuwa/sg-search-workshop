---
baseline_commit: 3aad37e
---

# Story 3.1: Create setup-lab.ps1 Bootstrap Script

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a facilitator,
I want a one-command lab setup script,
so that developers reach a runnable environment quickly (NFR1, NFR6).

## Acceptance Criteria

1. **Given** a Windows machine with Node.js v18+ installed  
   **When** `setup-lab.ps1` is executed from the project root in PowerShell  
   **Then** dependencies for `sg-search-service` and `sg-search` are installed

2. **And** a sample or template `users.csv` is present where the lab expects it

3. **And** the script prints next steps to start backend (3001) and frontend (3000) (NFR5, FR11)

4. **And** the script avoids optional complexity beyond lab needs (NFR3)

## Tasks / Subtasks

- [x] Add `setup-lab.ps1` at **repository root** (AC: #1, #3, #4)
  - [x] Anchor paths with `$PSScriptRoot` + `Set-Location -LiteralPath` (portable from any cwd)
  - [x] Preflight: `node`/`npm` on PATH; Node major version ≥ 18
  - [x] `npm install` in `sg-search-service/` (fail fast on non-zero exit)
  - [x] `npm install` in `sg-search/` when `package.json` exists (see Dev Notes if folder missing)
  - [x] Ensure `sg-search-service/users.csv` exists without overwriting a learner file (AC: #2)
  - [x] Print colored next-step banner for two terminals (AC: #3)
- [x] Manual verification on Windows PowerShell (AC: all)
  - [x] Run `.\setup-lab.ps1` from repo root on clean `node_modules` (or after delete)
  - [x] Confirm backend deps installed; frontend deps installed if `sg-search` present
  - [x] Confirm script does **not** start servers (install + instruct only)
- [x] Out of scope for 3.1: `verify-lab.ps1`, `LAB-03-Search-App-Guide.md`, `.vscode/launch.json`, `.gitignore` (Stories 3.2–3.5)

### Review Findings

- [x] [Review][Patch] Validate `npm -v` exit code in `Test-NpmPresent` [setup-lab.ps1:42] — resolved in implementation
- [x] [Review][Defer] Skip frontend `npm install` when `sg-search/` missing — deferred, matches story dev notes (Epic 2 backlog); AC#1 satisfied when folder exists

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` and `tech-stack.md` describe a **superseded Task Manager** (React 19, Zustand, Tailwind). **Do not follow them.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Epic 3, Story 3.1) |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | Deliverables, ports, PowerShell, TTFS |
| `idea.md` | Intended repo tree, `setup-lab.ps1` purpose |
| Epic 1 story files | Backend layout, `users.csv` rules |

**Do not:** add React/Vite scaffolding, `gh` install, Docker, or run servers inside the setup script.

### Package Layout (Canonical — Repository Root)

```text
sg-search-workshop/
├── setup-lab.ps1
├── verify-lab.ps1          # Story 3.2
├── sg-search-service/
│   ├── package.json
│   ├── server.js
│   └── users.csv
└── sg-search/
    └── package.json        # when Epic 2 frontend exists
```

### Implementation Summary (`setup-lab.ps1`)

- `$ErrorActionPreference = 'Stop'`; anchors to `$PSScriptRoot`
- `Test-NodeVersion` — Node 18+ required
- `Test-NpmPresent` — npm on PATH with exit-code check
- `Invoke-NpmInstall` — `npm install` with `$LASTEXITCODE` validation
- `Ensure-UsersCsv` — create 12-row sample only if missing (never overwrite)
- `Write-NextSteps` — Terminal 1 backend 3001, Terminal 2 frontend 3000, references `verify-lab.ps1`
- Warns and continues if `sg-search/` missing (Epic 2)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.1]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md — §2.1, §3.3]
- [Source: setup-lab.ps1]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- PowerShell parse error fixed: avoid `(12 data rows)` inside double-quoted strings
- Use ASCII hyphens only for PS 5.1 compatibility

### Completion Notes List

- Added root `setup-lab.ps1` with Node/npm preflight, backend/conditional frontend install, create-if-missing `users.csv`, next-steps banner
- Manual test: `npm install` succeeds; existing `users.csv` left unchanged; does not start servers
- Story file recreated after accidental loss; implementation unchanged

### File List

- setup-lab.ps1

### Change Log

- 2026-06-04: Story 3.1 — added `setup-lab.ps1` lab bootstrap script
- 2026-06-04: Recreated story artifact; status `done`

## Story Completion Status

- **Status:** done
- **Completion note:** `setup-lab.ps1` implemented and verified; code review complete
- **Next story:** `3-2-create-verify-lab-ps1-validation-script` (done)
