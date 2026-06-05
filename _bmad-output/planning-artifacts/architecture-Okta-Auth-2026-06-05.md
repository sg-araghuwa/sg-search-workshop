---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md"
  - "_bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/addendum.md"
  - "_bmad-output/planning-artifacts/epics.md"
  - "_bmad-output/planning-artifacts/architecture-BmadPoc-2026-06-04.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/EXPERIENCE.md"
  - "_bmad-output/planning-artifacts/implementation-readiness-report-2026-06-05.md"
workflowType: 'architecture'
project_name: 'AI_POC_Lab4'
scope: 'Okta Authentication increment'
user_name: 'SG_Engineer_Aman'
date: '2026-06-05'
completedAt: '2026-06-05'
lastStep: 8
status: 'complete'
extends: '_bmad-output/planning-artifacts/architecture-BmadPoc-2026-06-04.md'
---

# Architecture Decision Document — Okta Authentication

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

_Extends the brownfield Search App architecture (`architecture-BmadPoc-2026-06-04.md`) with Okta OIDC auth. Does not replace `architecture.md` (React task app — unrelated)._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The increment adds Okta OIDC authentication to the existing Search App without replacing its search capabilities. Architecturally this decomposes into three capability areas:

1. **Backend protection (FR10–FR14):** Express `requireAuth` middleware validates Bearer JWTs against Okta issuer/audience via JWKS; applied to `GET /api/search` only; returns 401 for missing/invalid/expired tokens and optional 403 for scope violations; `GET /health` remains public; CORS extended for `Authorization` header.

2. **Frontend auth lifecycle (FR1–FR9):** Vanilla JS SPA integrates `@okta/okta-auth-js` with PKCE; externalized Okta config; Sign-In Surface gates search UI; redirect callback at `/login/callback`; Bearer token attached to search requests; token expiry triggers re-auth; Sign Out clears session state.

3. **Documentation & verification (FR15–FR17):** Okta app registration steps, `.env.example` files, updated `verify-lab.ps1`, and preserved search behavior for authenticated users.

**Non-Functional Requirements:**
- **Security:** OIDC/OAuth 2.0 + PKCE only; JWKS validation (no shared secrets); no token/stack trace leakage in errors; `.env` excluded from git.
- **Stack preservation:** Node.js v18+, Vanilla HTML/CSS/JS (no React/bundler), ports 3000/3001, two-package structure unchanged.
- **Local dev:** `localhost` and `127.0.0.1` redirect URIs; PowerShell-compatible lab scripts.
- **Dependencies:** `@okta/okta-auth-js` (frontend), `okta-jwt-verifier` or equivalent (backend).
- **Teaching goal:** Industry-standard stateless Bearer JWT pattern suitable for a 45–60 min lab increment.

**Scale & Complexity:**
- Primary domain: Local full-stack web application with external IdP (Okta OIDC)
- Complexity level: Low–Medium (brownfield increment; OIDC integration adds auth state machine and split-package config)
- Estimated architectural components: 6
  - Okta IdP (external)
  - Frontend auth module (`OktaAuth` client, token manager, UI state machine)
  - Frontend search module (existing, token-aware fetch)
  - Backend auth middleware (`requireAuth` + JWKS)
  - Backend search handler (existing, unchanged logic)
  - Lab verification layer (`verify-lab.ps1` auth assertions)

### Technical Constraints & Dependencies

- **Brownfield baseline required:** LAB-03 must be implemented (`sg-search-service` API + `sg-search` UI). Architecture extends `architecture-BmadPoc-2026-06-04.md`; does not use `architecture.md` (React task app).
- **No client secret in SPA:** Okta app registered as Single-Page Application with PKCE.
- **No server sessions:** Bearer JWT validation only; rejected alternative per addendum.
- **Static serving constraint:** Frontend served via `serve` on port 3000 must handle `/login/callback` without a bundler.
- **Env vars (minimum):**
  - Frontend: `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_REDIRECT_URI`
  - Backend: `OKTA_ISSUER`, `OKTA_AUDIENCE`, optional `OKTA_REQUIRED_SCOPE`
- **Epic sequencing:** Epic 1 (protected API) is independently testable via curl/PowerShell before Epic 2 (SPA sign-in) ships.

### Cross-Cutting Concerns Identified

- **Auth state synchronization:** Frontend UI gates (Sign-In vs Search Surface) must align with backend 401/403 responses.
- **Token lifecycle management:** Acquire at callback, attach on fetch, handle expiry, clear on sign-out — spans frontend auth module and existing search fetch logic.
- **Callback route architecture:** How `/login/callback` is served and how `app.js` detects and handles the redirect.
- **CORS + Authorization:** Preflight must succeed with Bearer header from both localhost variants.
- **Error UX without information leakage:** NFR8 + UX-DR5/DR6/DR7 require consistent, safe error messages across auth and API layers.
- **Configuration management:** Two `.env` files, two `.env.example` files, Okta Admin Console registration — must stay in sync.
- **Brownfield preservation:** Existing XSS-safe rendering, search validation, Clear/Enter-key behavior, and CSV search logic must not regress when auth is added.

## Starter Template Evaluation

### Primary Technology Domain

**Brownfield full-stack extension** — Okta OIDC auth layered onto the existing Custom Minimal Full-Stack Setup (`sg-search` + `sg-search-service`) documented in `architecture-BmadPoc-2026-06-04.md`.

No new project scaffold is required or permitted (NFR10). The "starter" for this increment is the **implemented LAB-03 codebase** itself.

### Starter Options Considered

1. **Extend existing Custom Minimal Full-Stack Setup (Selected)**
   - **Description:** Add Okta auth modules to the two existing packages without restructuring directories or introducing build tooling.
   - **Pros:** Preserves 30-minute LAB-03 teaching model; Epic 1 testable before Epic 2; matches PRD complexity guard; codebase already implements search, CORS, XSS, health.
   - **Cons:** Manual wiring of auth state machine in vanilla `app.js`; no framework-provided routing for callback handling.

2. **Okta React SDK + Vite/Next.js scaffold**
   - **Pros:** Pre-built auth components and routing.
   - **Cons:** Violates NFR3 (no React/bundler); rejected in PRD addendum.

3. **Auth JS CDN-only (no npm dependency)**
   - **Pros:** Zero bundler; simplest script-tag integration.
   - **Cons:** Version pinning relies on CDN URL; lab reproducibility weaker than npm + documented CDN version.

4. **Backend: `jose` + `createRemoteJWKSet` instead of `@okta/jwt-verifier`**
   - **Pros:** Actively maintained generic JWT library.
   - **Cons:** ESM/CJS friction in existing CommonJS `server.js`; more custom middleware code; `@okta/jwt-verifier` is the Okta-documented path (NFR6).

### Selected Starter: Brownfield Extension (Custom Minimal Full-Stack + Okta SDK Add-ons)

**Rationale for Selection:**
The LAB-03 Search App is already implemented and running (`express@^4.21.0`, `cors@^2.8.6`, `csv-parse@^5.6.0` backend; `serve` static frontend on port 3000). The Okta increment adds two dependencies and auth modules — not a new project skeleton. This aligns with NFR10, the PRD teaching goal, and Epic sequencing (backend protection before frontend sign-in).

**Initialization Commands:**

```powershell
# Backend — JWT validation middleware dependency
cd sg-search-service
npm install @okta/jwt-verifier@4.0.2

# Frontend — Okta Auth JS (version pin for lab reproducibility)
cd ..\sg-search
npm install @okta/okta-auth-js@7.14.1
```

> **Version note:** `@okta/okta-auth-js@8.0.0` exists but requires Node 20+. Pin **7.14.1** (stable 7.x series per Okta) to match `engines: ">=18"` in `sg-search-service`.

**Architectural Decisions Provided by Starter (Brownfield Baseline + Auth Add-ons):**

**Language & Runtime:**
- Node.js v18+ (existing `engines` constraint)
- Vanilla ES6+ JavaScript — no TypeScript compilation step
- CommonJS on backend (`require`); browser-side auth SDK loaded without bundler

**Styling Solution:**
- Existing pure CSS3 Glassmorphism (`styles.css`) — auth UI reuses `.search-card`, button, and status patterns (UX-DR1, UX-DR9)

**Build Tooling:**
- **Zero build step preserved** — frontend served via `npx serve -l 3000 -s .` (SPA fallback enables `/login/callback`)
- Backend runs directly via `node server.js`

**Testing Framework:**
- Existing Node test scripts (`test/*.test.js`) — no Jest/Cypress added
- Auth verification via updated `verify-lab.ps1` (401/200 assertions) + manual E2E steps post-Epic 2

**Code Organization (increment additions):**
- `sg-search-service/middleware/requireAuth.js` — JWT validation middleware (new)
- `sg-search-service/server.js` — apply middleware to `/api/search` only; extend CORS (modified)
- `sg-search-service/.env.example` — `OKTA_ISSUER`, `OKTA_AUDIENCE`, optional `OKTA_REQUIRED_SCOPE` (new)
- `sg-search/config.js` — Okta client config from env (new)
- `sg-search/auth.js` — `OktaAuth` init, sign-in/callback/sign-out helpers (new)
- `sg-search/app.js` — auth-gated UI + Bearer token on fetch (modified)
- `sg-search/index.html` — sign-in surface markup, header auth controls, SDK script load (modified)
- `sg-search/login/callback/index.html` — callback landing page OR SPA fallback via `serve -s` (new, decision in Step 4)

**Development Experience:**
- Same VS Code/Cursor F5 debug for backend
- Two `.env` files (frontend + backend), both gitignored
- Okta Admin Console SPA app registration as external prerequisite (FR15)
- PowerShell-compatible setup and verification scripts unchanged in pattern

**Note:** Dependency installation (Story 1.2 / 2.1) is the first implementation step — not a project re-scaffold.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Okta OIDC Authorization Code + PKCE for SPA (`@okta/okta-auth-js@7.14.1`)
- Backend JWT validation via `@okta/jwt-verifier@4.0.2` JWKS (`requireAuth` on `/api/search` only)
- Frontend config via `config.example.js` → `config.js`; backend config via `dotenv` + `.env`
- Callback handling via SPA fallback (`serve -s`) with `/login/callback` path detection in `auth.js`
- CORS updated to allow `Authorization` header from `localhost:3000` and `127.0.0.1:3000`

**Important Decisions (Shape Architecture):**
- Auth module split: `config.js` (settings), `auth.js` (Okta lifecycle), `app.js` (UI gates + search)
- Okta SDK loaded via CDN script tag (version-matched to npm pin) — no bundler
- Token manager uses Okta defaults (memory-first); sessionStorage trade-off documented in setup guide
- Optional scope enforcement via `OKTA_REQUIRED_SCOPE` (403 when set and scope missing)
- Auth error responses: generic JSON `{ "error": "..." }` — no token contents or stack traces (NFR8)

**Deferred Decisions (Post-MVP):**
- Role-based access control beyond valid Okta login
- Refresh token rotation strategy (lab uses access token + re-auth on expiry per FR8)
- Production deployment, custom domains, multi-tenant Okta
- Database migration from CSV
- Automated E2E browser tests (manual verification documented in Story 2.5)

### Data Architecture

- **Data Source:** Unchanged — local `users.csv` loaded at startup (inherited from `architecture-BmadPoc-2026-06-04.md`).
- **Caching:** None — auth does not alter CSV read-on-startup pattern.
- **Auth data:** No user records stored locally; identity claims read from Okta access token / `tokenManager` at runtime only.

### Authentication & Security

- **Identity Provider:** Okta OIDC Single-Page Application (PKCE required, no client secret).
- **Frontend SDK:** `@okta/okta-auth-js@7.14.1` loaded via Okta CDN script tag; npm dependency pins lab version.
- **Backend SDK:** `@okta/jwt-verifier@4.0.2` — validates issuer, audience, expiry via JWKS (NFR2).
- **Middleware placement:** `sg-search-service/middleware/requireAuth.js` exported and applied to `GET /api/search` only; `GET /health` and `GET /` remain unauthenticated.
- **Token attachment:** Frontend sends `Authorization: Bearer <accessToken>` on search requests (FR7).
- **Token storage:** Okta default token manager (memory-first). Lab guide documents sessionStorage option and XSS trade-offs (addendum).
- **Scope enforcement:** When `OKTA_REQUIRED_SCOPE` is unset, skip scope checks. When set, return HTTP 403 with JSON error (FR13).
- **Sign-out:** `oktaAuth.signOut()` clears token manager state; UI returns to Sign-In Surface (FR9).
- **Rejected:** Implicit flow, password grant, client secret in SPA, session cookies, React/Okta React SDK.

### API & Communication Patterns

- **Protocol:** HTTP/1.1 REST — unchanged from LAB-03.
- **Protected endpoint:** `GET /api/search` — requires valid Bearer token; returns 401 if missing/invalid/expired.
- **Public endpoints:** `GET /health` → `{ "status": "ok" }`; `GET /` → text banner (unchanged).
- **Auth error format:**
  - 401: `{ "error": "Unauthorized" }` (generic message — no token details)
  - 403: `{ "error": "Forbidden" }` (when scope enforcement fails)
  - Existing 400 validation errors unchanged for search params.
- **CORS configuration:**
  ```javascript
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
  })
  ```
- **Rate limiting:** None (localhost lab scope).

### Frontend Architecture

- **Module boundaries:**
  - `config.js` — `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_REDIRECT_URI` (copied from `config.example.js`, gitignored)
  - `auth.js` — `OktaAuth` init (`pkce: true`), `signInWithRedirect()`, `handleLoginRedirect()`, `signOut()`, `getAccessToken()`, auth state helpers
  - `app.js` — UI surface switching (Sign-In vs Search), Bearer token on `fetch`, existing search/XSS logic preserved
- **Auth state machine:** `booting` → `unauthenticated` | `callback` | `authenticated` | `error`
- **UI surfaces:**
  - **Sign-In Surface:** Centered card, "Sign In with Okta" primary button; search form and results hidden (UX-DR3)
  - **Callback state:** Status shows "Signing you in..." (UX-DR4)
  - **Search Surface:** Header with user name/email + Sign Out; search form visible (UX-DR2)
- **Callback routing:** `serve -s .` SPA fallback serves `index.html` for `/login/callback`; `auth.js` detects `window.location.pathname` on init and calls `handleLoginRedirect()` before rendering search UI.
- **Script load order in `index.html`:** Okta CDN → `config.js` → `auth.js` → `app.js`
- **Search fetch change:** `runSearch()` adds `Authorization` header from `auth.getAccessToken()`; handles 401 with UX-DR7 microcopy and 401-triggered re-auth per FR8.

### Infrastructure & Deployment

- **Hosting:** Localhost only — no cloud deployment (PRD §8 non-goal).
- **Environment configuration:**
  - Backend: `sg-search-service/.env` loaded via `dotenv` at top of `server.js`; `.env.example` committed
  - Frontend: `sg-search/config.js` copied from `config.example.js`; both listed in `.gitignore`
- **Okta prerequisite:** Facilitator-provisioned Okta dev/test org; SPA app registered with redirect URIs for both localhost variants (FR15, Assumption A1).
- **Verification:** `verify-lab.ps1` asserts 401 without token + 200 on `/health` (Epic 1); manual Bearer token steps documented for authenticated search (Epic 2).
- **Monitoring/logging:** Console logging only — no APM or structured logging added.

### Decision Impact Analysis

**Implementation Sequence:**
1. Backend: add `dotenv`, `@okta/jwt-verifier`, `.env.example`, `requireAuth.js`
2. Backend: apply middleware to `/api/search`, update CORS, verify 401/200 with curl/PowerShell
3. Documentation: Okta app setup guide (Story 1.1)
4. Verification: update `verify-lab.ps1` auth assertions (Story 1.4)
5. Frontend: add `config.example.js`, CDN script, `auth.js`, update `index.html` markup
6. Frontend: wire sign-in/callback/sign-out flow (Story 2.2)
7. Frontend: gate search UI, attach Bearer token, handle expiry/errors (Stories 2.3–2.4)
8. Documentation: E2E verification steps (Story 2.5)

**Cross-Component Dependencies:**
- Backend `OKTA_ISSUER` + `OKTA_AUDIENCE` must match Okta SPA app issuer and client ID used in frontend `config.js`
- Frontend `OKTA_REDIRECT_URI` must match Okta app registration and resolve to a path handled by SPA fallback
- CORS `Authorization` header must be configured before frontend Bearer token requests will succeed
- Epic 2 frontend work depends on Epic 1 returning 401 without token (confirms API protection is live)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
8 areas where AI agents could make incompatible choices: auth middleware placement, JWT error responses, frontend module split, callback handling, config file strategy, UI surface gating, Bearer header attachment, and verification script assertions.

### Naming Patterns

**API Naming Conventions:**
- Endpoints unchanged from LAB-03: `GET /health`, `GET /api/search` (protected), `GET /`
- Query parameters: camelCase (`firstName`, `lastName`) — unchanged
- Auth header: `Authorization: Bearer <token>` (exact casing)

**Code Naming Conventions:**
- Middleware file: `middleware/requireAuth.js`; export name: `requireAuth`
- Frontend auth module: `auth.js`; exported functions: `initAuth`, `signIn`, `handleCallback`, `signOut`, `getAccessToken`, `getUserDisplayName`, `isAuthenticated`
- Config files: `config.example.js` (committed), `config.js` (gitignored, developer copy)
- Env vars: `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_REDIRECT_URI` (frontend); `OKTA_ISSUER`, `OKTA_AUDIENCE`, `OKTA_REQUIRED_SCOPE` (backend) — ALL_CAPS snake
- CSS classes: kebab-case; auth additions reuse existing: `.btn-primary`, `.btn-secondary`, `.glass-card`, `.status`, `.header`
- DOM IDs for auth UI: `#sign-in-section`, `#search-section`, `#user-display`, `#sign-out-btn`, `#sign-in-btn`

### Structure Patterns

**Project Organization:**
- Backend auth code lives in `sg-search-service/middleware/` — do not inline JWT logic in `server.js`
- Frontend auth code lives in `auth.js` — do not initialize `OktaAuth` inside `app.js`
- Do NOT create `src/` directories, React components, or route modules
- Tests remain in existing `test/` folders per package

**File Structure Patterns:**
```
sg-search-service/
  middleware/requireAuth.js    ← NEW
  .env.example                 ← NEW
  .env                         ← gitignored
  server.js                    ← modified (dotenv, CORS, middleware mount)

sg-search/
  config.example.js            ← NEW (committed template)
  config.js                    ← NEW (gitignored, developer copy)
  auth.js                      ← NEW
  app.js                       ← modified (UI gates, Bearer fetch)
  index.html                   ← modified (auth markup, script order)
```

**Script load order in `index.html` (mandatory):**
1. Okta CDN (`@okta/okta-auth-js@7.14.1`)
2. `config.js`
3. `auth.js`
4. `app.js`

### Format Patterns

**API Response Formats:**
- Health (public): `{ "status": "ok" }` — unchanged
- Search success (authenticated): `{ "count": N, "results": [...] }` — unchanged
- Search validation error: `{ "error": "..." }` with HTTP 400 — unchanged
- Auth error 401: `{ "error": "Unauthorized" }` — generic, no token details
- Auth error 403: `{ "error": "Forbidden" }` — only when `OKTA_REQUIRED_SCOPE` set and scope missing
- Never return `{ message: ... }`, `{ detail: ... }`, or stack traces for auth failures (NFR8)

**Data Exchange Formats:**
- JSON fields: camelCase throughout — unchanged from LAB-03
- Bearer token: raw JWT string in `Authorization` header, no `token` query param

### Communication Patterns

**Auth State Machine (frontend):**
- States: `booting` → `unauthenticated` | `callback` | `authenticated` | `error`
- `app.js` calls `auth.init()` on DOMContentLoaded; awaits callback handling before rendering search UI
- UI gating: toggle `#sign-in-section` and `#search-section` visibility — do not conditionally remove DOM nodes

**State Management Patterns:**
- Search state remains in `app.js` (loading, status, results) — unchanged pattern
- Auth state owned by `auth.js` via Okta token manager — do not duplicate token storage in `app.js`
- `app.js` reads auth state via exported helpers only; never accesses `oktaAuth.tokenManager` directly

### Process Patterns

**Authentication Flow (frontend):**
1. `initAuth()` → if path is `/login/callback`, set status "Signing you in...", call `handleLoginRedirect()`, redirect to `/`
2. If no valid token → show Sign-In Surface
3. Sign In click → `signInWithRedirect()` (no manual URL construction)
4. Authenticated → show Search Surface with user display name from token claims
5. Search → attach Bearer token; on 401 → show UX-DR7 message, prompt re-auth
6. Token expired before search → show UX-DR6 message, call `signIn()`
7. Sign Out → `signOut()`, return to Sign-In Surface

**Error Handling Patterns:**
- Backend `requireAuth`: catch JWT errors, respond 401/403 with JSON `{ "error": "..." }`; never `res.send(err.stack)`
- Frontend auth failure: "Sign-in failed. Please try again." + retry button (UX-DR5); no raw Okta error codes in UI
- Frontend API 401: "You are not signed in. Please sign in to search." (UX-DR7)
- Frontend session expiry: "Your session has expired. Please sign in again." (UX-DR6)

**Loading State Patterns:**
- Callback: reuse `#status` element with "Signing you in..." (UX-DR4)
- Search loading: existing "Searching database..." message — unchanged

### Enforcement Guidelines

**All AI Agents MUST:**
- Apply `requireAuth` to `/api/search` only — never to `/health` or `/`
- Load backend secrets from `.env` via `dotenv` — never hardcode issuer/client ID in source
- Load frontend Okta config from `config.js` — never hardcode in `index.html` or `auth.js`
- Use `@okta/jwt-verifier@4.0.2` on backend — do not swap to `jose` or manual JWKS without architecture update
- Pin `@okta/okta-auth-js@7.14.1` — do not use 8.x (requires Node 20+)
- Preserve existing search logic, XSS escaping, and CSV handler — auth wraps, does not replace
- Keep PowerShell compatibility in `verify-lab.ps1` (NFR9)
- Use `textContent` for dynamic DOM — never `innerHTML` for user/token data

**Pattern Enforcement:**
- `verify-lab.ps1` validates 401 without token and 200 on `/health`
- Story acceptance criteria in epics.md are the implementation contract
- Deviations require architecture document update before implementation

### Pattern Examples

**Good Example — Backend middleware mount:**
```javascript
const requireAuth = require('./middleware/requireAuth');
app.get('/api/search', requireAuth, (req, res) => { /* unchanged handler */ });
app.get('/health', (req, res) => { res.status(200).json({ status: 'ok' }); });
```

**Good Example — Frontend Bearer fetch:**
```javascript
const token = await auth.getAccessToken();
const response = await fetch(`${API_BASE}/api/search?${params}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Good Example — Auth error response:**
```javascript
return res.status(401).json({ error: 'Unauthorized' });
```

**Anti-Pattern — Protecting health:**
```javascript
app.use(requireAuth); // WRONG — blocks /health smoke tests
```

**Anti-Pattern — Token in query string:**
```javascript
fetch(`/api/search?token=${accessToken}`); // WRONG — use Authorization header
```

**Anti-Pattern — Hardcoded Okta config:**
```javascript
const oktaAuth = new OktaAuth({ clientId: '0oa...' }); // WRONG — use config.js
```

**Anti-Pattern — React/bundler introduction:**
```javascript
import { OktaAuth } from '@okta/okta-auth-js'; // WRONG — no bundler; use CDN global
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
sg-search-workshop/
├── .gitignore
├── setup-lab.ps1                          # existing — may reference auth setup
├── verify-lab.ps1                         ← MOD — add 401/200 auth assertions (Story 1.4)
├── LAB-03-Search-App-Guide.md             ← MOD — add Okta auth section (Stories 1.1, 2.5)
├── README.md                              ← MOD — link to Okta setup (optional)
│
├── sg-search-service/                     # Backend — port 3001
│   ├── package.json                       ← MOD — add dotenv, @okta/jwt-verifier@4.0.2
│   ├── package-lock.json                  ← MOD
│   ├── server.js                          ← MOD — dotenv, CORS, requireAuth mount
│   ├── users.csv                          # existing — unchanged
│   ├── .env.example                       ← NEW — OKTA_ISSUER, OKTA_AUDIENCE, OKTA_REQUIRED_SCOPE
│   ├── .env                               ← NEW — gitignored, developer-local
│   ├── middleware/
│   │   └── requireAuth.js                 ← NEW — JWT validation via JWKS
│   ├── test/
│   │   └── search-validation.test.js      # existing — unchanged
│   └── README.md                          ← MOD — backend env setup notes
│
├── sg-search/                             # Frontend — port 3000
│   ├── package.json                       ← MOD — add @okta/okta-auth-js@7.14.1 (version pin)
│   ├── package-lock.json                  ← MOD
│   ├── index.html                         ← MOD — auth UI sections, CDN script, load order
│   ├── styles.css                         ← MOD — sign-in card, header auth layout (minimal)
│   ├── config.example.js                  ← NEW — OKTA_ISSUER, OKTA_CLIENT_ID, OKTA_REDIRECT_URI
│   ├── config.js                          ← NEW — gitignored, copied from config.example.js
│   ├── auth.js                            ← NEW — OktaAuth lifecycle (init, sign-in, callback, sign-out)
│   ├── app.js                             ← MOD — UI gating, Bearer fetch, auth error handling
│   ├── test/
│   │   ├── first-name-length.test.js      # existing
│   │   └── shell-spec.test.js             # existing
│   └── README.md                          ← MOD — frontend Okta setup steps
│
└── _bmad-output/planning-artifacts/
    ├── architecture-Okta-Auth-2026-06-05.md   # this document — agent contract for auth increment
    ├── architecture-BmadPoc-2026-06-04.md    # parent stack reference (search lab baseline)
    ├── epics.md                               # story acceptance criteria
    └── prds/prd-AI_POC_Lab4-2026-06-05/       # PRD + addendum
```

> **Note:** No `sg-search/login/callback/index.html` — callback handled via `serve -s` SPA fallback + path detection in `auth.js` (Step 4 decision).

### Architectural Boundaries

**API Boundaries:**

| Boundary | Public | Protected | Handler |
|---|---|---|---|
| Health check | ✅ | — | `server.js` → `GET /health` |
| Search API | — | ✅ Bearer JWT | `requireAuth` → `server.js` search handler |
| Root banner | ✅ | — | `server.js` → `GET /` |
| Okta OIDC | External | — | Okta-hosted login; not in repo |

**Component Boundaries:**

| Component | Owns | Must NOT own |
|---|---|---|
| `requireAuth.js` | JWT validation, 401/403 responses | CSV search logic, CORS config |
| `server.js` | Route mounting, CORS, CSV load | Inline JWT parsing |
| `auth.js` | OktaAuth client, token manager, sign-in/out/callback | Search form logic, DOM table rendering |
| `config.js` | Okta client settings | Secrets in committed files |
| `app.js` | UI surface switching, search fetch + Bearer header | Direct `OktaAuth` initialization |

**Service Boundaries:**

- **Frontend → Backend:** HTTP only via `fetch` to `http://localhost:3001`; Bearer token on `/api/search` only
- **Frontend → Okta:** Redirect-based OIDC (`signInWithRedirect`, `handleLoginRedirect`); no backend proxy for login
- **Backend → Okta:** JWKS fetch only (via `@okta/jwt-verifier`); no Okta Management API calls

**Data Boundaries:**

- **Employee data:** `users.csv` in backend only; frontend never reads CSV directly
- **Identity data:** Okta token claims in browser memory only; no user table, no session store on backend
- **Secrets:** `.env` (backend) and `config.js` (frontend) — both gitignored; `.env.example` and `config.example.js` committed

### Requirements to Structure Mapping

**Epic 1: Okta Foundation & Protected API**

| Story | Primary Files |
|---|---|
| 1.1 Okta setup docs | `LAB-03-Search-App-Guide.md`, `sg-search-service/.env.example`, `sg-search/config.example.js`, `.gitignore` |
| 1.2 JWT middleware | `sg-search-service/middleware/requireAuth.js`, `sg-search-service/package.json` |
| 1.3 Protect API + CORS | `sg-search-service/server.js` |
| 1.4 verify-lab.ps1 | `verify-lab.ps1` |

**Epic 2: Sign-In and Authenticated Search**

| Story | Primary Files |
|---|---|
| 2.1 Okta SDK + config | `sg-search/package.json`, `sg-search/config.example.js`, `sg-search/auth.js`, `sg-search/index.html` |
| 2.2 Sign-in/callback/sign-out | `sg-search/auth.js`, `sg-search/index.html`, `sg-search/app.js` |
| 2.3 Auth header + gate UI | `sg-search/index.html`, `sg-search/styles.css`, `sg-search/app.js` |
| 2.4 Bearer token + errors | `sg-search/app.js` |
| 2.5 E2E documentation | `LAB-03-Search-App-Guide.md`, `sg-search/README.md` |

**Cross-Cutting Concerns:**

| Concern | Location |
|---|---|
| Auth error format | `requireAuth.js` + `app.js` status messages |
| CORS + Authorization | `server.js` only |
| XSS safety | `app.js` `escapeHtml()` — unchanged, preserved |
| Lab verification | `verify-lab.ps1` (root) |
| Agent implementation contract | `architecture-Okta-Auth-2026-06-05.md` (this file) |

### Integration Points

**Internal Communication:**
```
Browser (port 3000)                    Backend (port 3001)
┌─────────────────────┐               ┌──────────────────────┐
│ index.html          │               │ server.js            │
│  ├─ auth.js ────────┼── redirect ──►│ Okta (external IdP)  │
│  └─ app.js ─────────┼── fetch + ───►│  ├─ requireAuth.js   │
│     Bearer token    │   Bearer JWT  │  └─ search handler   │
└─────────────────────┘               │       ↓              │
                                      │   users.csv          │
                                      └──────────────────────┘
```

**External Integrations:**
- **Okta OIDC (Authorization Server):** Issuer URL, JWKS endpoint, authorize/token endpoints — configured via env vars
- **No other third-party services** in v1 scope

**Data Flow (authenticated search):**
1. User signs in → Okta redirects to `/login/callback` → `auth.js` exchanges code for access token
2. User submits search → `app.js` reads token from `auth.getAccessToken()`
3. `fetch GET /api/search?...` with `Authorization: Bearer <JWT>`
4. `requireAuth.js` validates JWT against Okta JWKS + audience
5. Search handler filters `users.csv` → returns `{ count, results }`
6. `app.js` renders results with XSS escape (unchanged)

### File Organization Patterns

**Configuration Files:**
- Backend secrets: `sg-search-service/.env` (runtime) + `.env.example` (template)
- Frontend Okta settings: `sg-search/config.js` (runtime) + `config.example.js` (template)
- Never commit `.env` or `config.js`

**Source Organization:**
- Flat file layout per package — no `src/` directories
- Auth middleware isolated in `middleware/` subdirectory (backend only)

**Test Organization:**
- Unit tests co-located in each package's `test/` folder
- Auth smoke tests in root `verify-lab.ps1` (integration-level, no browser)

**Asset Organization:**
- Static assets remain in `sg-search/` root (HTML, CSS, JS)
- No build output directories

### Development Workflow Integration

**Development Server Structure:**
- Terminal 1: `cd sg-search-service && npm start` → port 3001
- Terminal 2: `cd sg-search && npm start` → port 3000 (`serve -s .`)
- Okta SPA app must have redirect URI matching `OKTA_REDIRECT_URI` in `config.js`

**Build Process Structure:**
- No build step — `npm test` runs existing Node test scripts per package
- Auth increment adds no compilation or bundling

**Deployment Structure:**
- Localhost lab only — no deployment artifacts, Docker, or CI/CD for auth increment

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are mutually compatible. Express 4.x + CommonJS backend pairs with `@okta/jwt-verifier@4.0.2`. Vanilla JS frontend uses CDN-loaded `@okta/okta-auth-js@7.14.1` (7.x pinned for Node 18+ lab compatibility; 8.x rejected). No bundler, React, or session cookie patterns conflict with the Bearer JWT + JWKS architecture. Brownfield CSV search logic remains isolated from auth middleware.

**Pattern Consistency:**
Implementation patterns enforce the Step 4 decisions: middleware on `/api/search` only, config externalization, auth module split, consistent JSON error format, and UI surface gating. Naming conventions extend LAB-03 patterns (camelCase API, kebab-case CSS) without introducing new conventions.

**Structure Alignment:**
Project tree maps directly to epic stories. Component boundaries prevent the most likely agent conflicts (inline JWT in server.js, OktaAuth in app.js, protecting /health). SPA fallback callback routing aligns with existing `serve -s` start script.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**

| Epic | Architectural Support | Status |
|---|---|---|
| Epic 1: Okta Foundation & Protected API | `requireAuth.js`, CORS update, `.env.example`, `verify-lab.ps1` | ✅ Full |
| Epic 2: Sign-In and Authenticated Search | `auth.js`, `config.js`, `app.js`, `index.html` UI gates | ✅ Full |

**Functional Requirements Coverage:** FR1–FR17 — all architecturally supported (see Step 4 decisions and Step 6 epic mapping).

**Non-Functional Requirements Coverage:** NFR1–NFR10 — all architecturally supported.

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with package versions, middleware placement, config strategy, callback routing, and CORS shape.

**Structure Completeness:** Every new/modified file named with epic story mapping. Integration diagram and data flow documented.

**Pattern Completeness:** 8 conflict points addressed with good examples and 4 anti-patterns.

### Gap Analysis Results

**Critical Gaps:** None.

**Important Gaps (non-blocking):**
1. Auth UX not in separate DESIGN.md — UX-DR1–10 in PRD §7 and epics (acceptable for lab)
2. `@okta/jwt-verifier` maintenance inactive on Snyk — acceptable for lab; monitor advisories
3. No automated browser E2E tests — manual verification in Story 2.5

**Nice-to-Have Gaps:** VS Code frontend debug config; config.js generator script; epics.md frontmatter cross-reference update

### Validation Issues Addressed

- Wrong `architecture.md` (React task app) — this document is canonical for Okta increment
- Deferred auth in BmadPoc — activated via Okta OIDC
- Callback route — SPA fallback + path detection in `auth.js`

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

**Confidence Level:** High

**Key Strengths:**
- Brownfield-preserving design
- Epic 1 independently testable before Epic 2
- Explicit agent anti-patterns documented
- Version pins verified (7.14.1, 4.0.2)

**Areas for Future Enhancement:**
- Dedicated auth UX artifact
- Production deployment architecture
- RBAC beyond valid Okta login
- Automated browser E2E tests

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all decisions in this document exactly
- Use implementation patterns consistently
- Do not create `src/`, React, or bundler config
- Refer to `epics.md` for story acceptance criteria
- Parent baseline: `architecture-BmadPoc-2026-06-04.md`

**First Implementation Priority:**
```powershell
cd sg-search-service
npm install dotenv @okta/jwt-verifier@4.0.2
# Then implement middleware/requireAuth.js and mount on GET /api/search (Epic 1, Story 1.2)
```
