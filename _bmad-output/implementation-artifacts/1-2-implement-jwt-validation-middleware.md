---
baseline_commit: 36dd8bb13e709748816ee8f17df7cdc9e34d317a
---

# Story 1.2: Implement JWT Validation Middleware

Status: done

## Story

As a lab developer,
I want a `requireAuth` middleware that validates Okta Bearer tokens,
so that protected API routes reject unauthenticated requests using industry-standard JWKS validation.

## Acceptance Criteria

1. **Given** `sg-search-service` with `dotenv` and `@okta/jwt-verifier@4.0.2` installed (NFR6)  
   **When** `middleware/requireAuth.js` is implemented and loaded via `require` in `server.js`  
   **Then** the middleware reads `OKTA_ISSUER` and `OKTA_AUDIENCE` from environment variables (FR10, FR2)

2. **And** it validates `Authorization: Bearer <token>` against Okta JWKS (NFR2)

3. **And** a missing or malformed token returns HTTP 401 with JSON `{ "error": "Unauthorized" }` (FR11, NFR8)

4. **And** an expired or invalid signature returns HTTP 401 with the same generic JSON shape (FR11, NFR8)

5. **And** when `OKTA_REQUIRED_SCOPE` is set and the token lacks that scope, HTTP 403 with `{ "error": "Forbidden" }` is returned (FR13)

6. **And** when `OKTA_REQUIRED_SCOPE` is unset, scope checks are skipped (Assumption A3)

7. **And** JWT logic is isolated in `middleware/requireAuth.js` — not inlined in `server.js`

8. **And** no stack traces or token contents appear in error responses (NFR8)

## Tasks / Subtasks

- [x] Install `dotenv` and `@okta/jwt-verifier@4.0.2` (AC: #1)
- [x] Create `middleware/requireAuth.js` with JWKS validation (AC: #1–#8)
  - [x] Read `OKTA_ISSUER`, `OKTA_AUDIENCE`, optional `OKTA_REQUIRED_SCOPE`
  - [x] Parse `Authorization: Bearer <token>`
  - [x] Return 401 `{ "error": "Unauthorized" }` for missing/malformed/invalid tokens
  - [x] Return 403 `{ "error": "Forbidden" }` when scope enforcement fails
  - [x] Skip scope check when `OKTA_REQUIRED_SCOPE` unset
- [x] Load `dotenv` and `requireAuth` in `server.js` (AC: #1, #7) — mount on `/api/search` deferred to Story 1.3
- [x] Add `test/requireAuth.test.js` for bearer parsing, scope logic, and 401 paths

### Review Findings

- [x] [Review][Patch] Pin exact `@okta/jwt-verifier@4.0.2` per NFR6 [`sg-search-service/package.json:14`] — currently `^4.0.2` allows minor drift from lab pin.

- [x] [Review][Patch] No middleware-level 403 test for scope enforcement (AC #5) [`sg-search-service/test/requireAuth.test.js`] — `hasRequiredScope` unit tests cover logic, but no test asserts `requireAuth` returns `{ "error": "Forbidden" }` when scope claim is missing.

- [x] [Review][Patch] Invalid-token test hits live JWKS endpoint [`sg-search-service/test/requireAuth.test.js:52`] — `Bearer not-a-real-jwt` triggers network fetch to `example.okta.com`; tests fail offline and add flakiness.

- [x] [Review][Defer] Test-only exports on production module [`sg-search-service/middleware/requireAuth.js:66-69`] — deferred, pre-existing lab pattern; `_resetVerifierForTests` acceptable for workshop scope.

- [x] [Review][Defer] `requireAuth` imported but not mounted [`sg-search-service/server.js:9`] — deferred, pre-existing; Story 1.3 scope per story tasks.

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `npm test` — search-validation + requireAuth tests passed

### Completion Notes List

- Added `middleware/requireAuth.js` using `@okta/jwt-verifier@4.0.2` with lazy verifier init from `OKTA_ISSUER` / `OKTA_AUDIENCE`
- Installed `dotenv`; `server.js` loads env at startup and requires middleware (Story 1.3 mounts on route)
- Generic 401/403 JSON errors; no stack traces or token leakage
- Exported test helpers `parseBearerToken`, `hasRequiredScope`, `_setVerifierForTests`, `_resetVerifierForTests`
- Code review patches applied: exact jwt-verifier pin, offline mock tests for 401/403 middleware paths

### File List

- `sg-search-service/package.json` (modified)
- `sg-search-service/package-lock.json` (modified)
- `sg-search-service/middleware/requireAuth.js` (new)
- `sg-search-service/server.js` (modified)
- `sg-search-service/test/requireAuth.test.js` (new)

## Change Log

- 2026-06-05: Story 1.2 — JWT validation middleware and unit tests
- 2026-06-05: Code review patches — exact version pin, offline mock tests for 401/403
