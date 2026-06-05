---
baseline_commit: 36dd8bb13e709748816ee8f17df7cdc9e34d317a
---

# Story 1.4: Update verify-lab.ps1 for Auth Assertions

Status: done

## Story

As a lab facilitator,
I want `verify-lab.ps1` to assert API protection,
so that I can confirm Epic 1 is complete before participants wire the SPA sign-in flow.

## Acceptance Criteria

1. **Given** `sg-search-service` is running with Okta middleware enabled  
   **When** `verify-lab.ps1` executes in Windows PowerShell (NFR9)  
   **Then** it asserts `GET /health` returns HTTP 200 (FR16, FR12)

2. **And** it asserts `GET /api/search?firstName=John` without an `Authorization` header returns HTTP 401 (FR16, FR11)

3. **And** the script reports pass/fail with actionable messages on failure

4. **And** documentation describes optional manual authenticated search: copy Bearer token from browser Network tab after Epic 2 sign-in (FR16)

5. **And** existing LAB-03 health and search JSON checks are not regressed when a valid token is provided manually

## Tasks / Subtasks

- [x] Add unauthenticated search 401 assertion and auth troubleshooting hints (AC: #1, #2, #3)
- [x] Add `-BearerToken` parameter; pass `Authorization` header to authenticated search tests (AC: #5)
- [x] Update test runner: health + 401 always required; search matrix runs only when `-BearerToken` supplied (AC: #5)
- [x] Document manual authenticated search in `LAB-03-Search-App-Guide.md` (AC: #4)
- [x] Manual verification on Windows PowerShell with backend running (AC: all)

### Review Findings

- [x] [Review][Patch] Strip existing `Bearer ` prefix in `Get-AuthHeaders` [verify-lab.ps1:146]
- [x] [Review][Defer] Large Okta setup block in `LAB-03-Search-App-Guide.md` diff — Story 1.1 scope, not in Story 1.4 file list

## Dev Notes

- [Source: epics.md — Story 1.4]
- [Source: architecture-Okta-Auth-2026-06-05.md — verify-lab.ps1 auth assertions table]
- [Source: addendum.md — GET /health 200, GET /api/search no auth → 401, manual Bearer steps]
- Default run (no token): **required** checks = health + 401; search JSON matrix **skipped** with guidance
- With `-BearerToken`: run full LAB-03 search matrix (John+Smith, John, no-params 400) using header
- Preserve Story 3.2 patterns: `Invoke-LabGet`, `Write-TestResult`, troubleshooting hints, exit codes
- 401 body contract: `{ "error": "Unauthorized" }` per architecture

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- Default run: `verify-lab.ps1 -ApiBaseUrl http://127.0.0.1:3097 -SkipFrontend` → 2/2 PASS
- Full run: `verify-lab.ps1 -ApiBaseUrl ... -BearerToken test-token -SkipFrontend` → 5/5 PASS (mock backend)
- `npm test` in sg-search-service — all passed

### Completion Notes List

- Added `Test-UnauthenticatedSearch401` for `GET /api/search?firstName=John` without token
- Added `-BearerToken` param; authenticated search matrix runs only when token supplied
- Added `AuthRequired` and `AuthTokenInvalid` troubleshooting hints
- Replaced `Invoke-LabGet` with `HttpWebRequest` so Windows PowerShell reads 401 JSON bodies reliably
- Updated `LAB-03-Search-App-Guide.md` verification section and new `manual-authenticated-search` anchor

### File List

- `verify-lab.ps1` (modified)
- `LAB-03-Search-App-Guide.md` (modified)

## Change Log

- 2026-06-05: Story 1.4 — verify-lab auth assertions, -BearerToken optional full matrix, guide docs
- 2026-06-05: Code review — strip existing Bearer prefix in Get-AuthHeaders
