---
baseline_commit: 36dd8bb13e709748816ee8f17df7cdc9e34d317a
---

# Story 1.3: Protect Search API and Update CORS

Status: done

## Story

As a lab developer,
I want `GET /api/search` protected and CORS extended for Bearer tokens,
so that only authenticated clients can search while health checks and existing search logic remain intact.

## Acceptance Criteria

1. **Given** `requireAuth` middleware from Story 1.2  
   **When** `server.js` is updated  
   **Then** `GET /api/search` is mounted with `requireAuth` before the existing CSV search handler (FR10, FR11)

2. **And** `GET /health` returns HTTP 200 with `{ "status": "ok" }` without authentication (FR12)

3. **And** `GET /` root banner remains unauthenticated

4. **And** CORS allows origins `http://localhost:3000` and `http://127.0.0.1:3000` with `allowedHeaders` including `Authorization` (FR14)

5. **And** `credentials: false` is set on CORS config

6. **And** existing search filtering, validation (HTTP 400), and CSV handler logic is unchanged (FR17 baseline)

7. **And** a curl/PowerShell request to `/api/search` without a token returns HTTP 401 (FR11)

8. **And** ports 3000/3001 are preserved (NFR4, NFR10)

## Tasks / Subtasks

- [x] Mount `requireAuth` on `GET /api/search` (AC: #1, #7)
- [x] Update CORS configuration with lab origins, Authorization header, credentials false (AC: #4, #5)
- [x] Verify `/health` and `/` remain public (AC: #2, #3)
- [x] Update `search-validation.test.js` to use mock auth for authenticated search cases (AC: #6)
- [x] Add `test/protected-api.test.js` for 401 without token and CORS preflight (AC: #7, #4)

### Review Findings

- [x] [Review][Patch] Gate `OKTA_TEST_MOCK` to test-only execution [sg-search-service/middleware/requireAuth.js:82]
- [x] [Review][Defer] CORS preflight test does not assert `Access-Control-Allow-Origin` on GET responses [sg-search-service/test/protected-api.test.js:90] — deferred, pre-existing test-gap pattern; preflight covers Authorization header AC
- [x] [Review][Defer] CORS integration test only exercises `localhost:3000`, not `127.0.0.1:3000` [sg-search-service/test/protected-api.test.js:93] — deferred, both origins configured correctly in server.js

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `npm test` — search-validation, requireAuth, protected-api all passed

### Completion Notes List

- Mounted `requireAuth` on `GET /api/search`; `/health` and `/` unchanged
- CORS: origins localhost + 127.0.0.1:3000, allowedHeaders Content-Type + Authorization, credentials false
- Added `OKTA_TEST_MOCK=1` test hook in requireAuth for authenticated search regression tests
- New `protected-api.test.js` asserts 401 without token, public health/root, CORS preflight for Authorization

### File List

- `sg-search-service/server.js` (modified)
- `sg-search-service/middleware/requireAuth.js` (modified)
- `sg-search-service/test/search-validation.test.js` (modified)
- `sg-search-service/test/protected-api.test.js` (new)
- `sg-search-service/package.json` (modified)

## Change Log

- 2026-06-05: Story 1.3 — protect search API, CORS for Bearer tokens, integration tests
- 2026-06-05: Code review — gate OKTA_TEST_MOCK to NODE_ENV=test only
