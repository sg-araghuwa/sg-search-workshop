---
baseline_commit: 36dd8bb13e709748816ee8f17df7cdc9e34d317a
---

# Story 1.1: Document Okta App Setup and Environment Configuration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab facilitator,
I want documented Okta SPA registration steps and environment variable templates,
so that developers can configure auth locally without committing secrets.

## Acceptance Criteria

1. **Given** a developer preparing the Okta auth increment  
   **When** they follow `LAB-03-Search-App-Guide.md` (Okta auth section) and the package README files  
   **Then** the guide describes creating an Okta OIDC Single-Page Application with Authorization Code + PKCE (FR15, NFR1)

2. **And** redirect URIs include `http://localhost:3000/login/callback` and `http://127.0.0.1:3000/login/callback` (FR15, NFR5)

3. **And** facilitator prerequisites document a shared Okta dev/test org or pre-provisioned test accounts (FR15)

4. **And** `sg-search-service/.env.example` lists `OKTA_ISSUER`, `OKTA_AUDIENCE`, and optional `OKTA_REQUIRED_SCOPE` (FR2 backend, NFR7)

5. **And** `sg-search/config.example.js` lists `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_REDIRECT_URI` (FR2 frontend, NFR7)

6. **And** `.gitignore` excludes `sg-search-service/.env` and `sg-search/config.js` (NFR7)

7. **And** the guide documents token storage trade-offs (memory vs sessionStorage) per addendum (FR15)

8. **And** no Okta client secret appears in any committed file (NFR2)

## Tasks / Subtasks

- [x] Add Okta Authentication section to `LAB-03-Search-App-Guide.md` (AC: #1, #2, #3, #7)
  - [x] Okta Admin Console SPA registration walkthrough (Authorization Code + PKCE)
  - [x] Redirect URI registration for both localhost variants
  - [x] Facilitator prerequisites (shared org, test accounts, assignment)
  - [x] Token storage trade-offs table (memory vs sessionStorage)
  - [x] Step-by-step: copy templates → local gitignored files → verify values align
- [x] Create `sg-search-service/.env.example` (AC: #4)
  - [x] Document `OKTA_ISSUER`, `OKTA_AUDIENCE`, optional `OKTA_REQUIRED_SCOPE`
  - [x] Include comments explaining audience = SPA client ID for this lab
- [x] Update `sg-search/config.example.js` (AC: #5)
  - [x] Use `window.OKTA_CONFIG` shape with `issuer`, `clientId`, `redirectUri` keys
  - [x] Placeholders only — no real client IDs in committed file
  - [x] Document second redirect URI variant (`127.0.0.1`) in comments
- [x] Verify `.gitignore` coverage (AC: #6, #8)
  - [x] Confirm `sg-search-service/.env` and `sg-search/config.js` are excluded
  - [x] Grep repo for accidental secrets before commit
- [x] Update `sg-search/README.md` Okta setup section (AC: #1)
  - [x] Copy `config.example.js` → `config.js` instructions
  - [x] Link to main guide Okta section
- [x] Update `sg-search-service/README.md` backend env section (AC: #1, #4)
  - [x] Copy `.env.example` → `.env` instructions
  - [x] Explain issuer/audience must match frontend Okta app
- [x] Secret audit (AC: #8)
  - [x] No client secret, no real client IDs, no `.env` files committed

### Review Findings

- [x] [Review][Decision] Out-of-scope Epic 2 code in working tree — `sg-search/auth.js` (untracked), `sg-search/app.js`, `index.html`, `styles.css`, and `package.json` changes exist alongside Story 1.1 doc work. Story scope explicitly forbids auth.js and UI changes. Committing the current working tree would mix stories. Choose: revert/isolate 1.1 files only, or expand scope and update story File List. **Resolved:** isolate — only Story 1.1 files staged for commit; Epic 2 WIP left unstaged.

- [x] [Review][Patch] Untracked Story 1.1 deliverables not yet in version control [`sg-search-service/.env.example`, `sg-search/config.example.js`] — AC #4/#5 require committed templates; files exist locally but are `??` untracked.

- [x] [Review][Patch] AC #5 literal variable names missing in `config.example.js` [`sg-search/config.example.js:1-12`] — AC lists `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_REDIRECT_URI`; file uses `issuer`/`clientId`/`redirectUri` only. Add mapping comments to satisfy AC wording (architecture shape is correct).

- [x] [Review][Patch] README anchor may not resolve in all Markdown viewers [`sg-search/README.md:50`, `sg-search-service/README.md:40`] — link target `#okta-authentication-setup-epic-1--story-11` depends on em-dash slugification; simplify heading anchor or use a stable fragment.

- [x] [Review][Defer] `serve -s` flag added in `sg-search/README.md` [`sg-search/README.md:22`] — deferred, pre-existing / acceptable prep for Epic 2 callback; slightly beyond strict 1.1 doc scope but aligned with Okta setup.

- [x] [Review][Defer] Redundant `.gitignore` entry for `sg-search-service/.env` [`.gitignore:3`] — deferred, pre-existing; explicit entry satisfies AC #6 clarity despite generic `.env` rule.

## Dev Notes

### Story Scope Boundary — DOCUMENTATION ONLY

This story creates **documentation and config templates only**. Do **not** implement:

- `middleware/requireAuth.js` (Story 1.2)
- CORS or route protection changes in `server.js` (Story 1.3)
- `verify-lab.ps1` auth assertions (Story 1.4)
- Frontend `auth.js`, CDN script tags, or UI changes (Epic 2)

Epic 1 Story 1.1 unblocks all subsequent auth work by giving developers copy-paste-ready templates and a facilitator guide.

### Facilitator-Provided Okta Configuration (Workshop Org)

The facilitator has provisioned the following **non-secret** values for the shared dev org. These go in **gitignored local files only** (`config.js`, `.env`) — never commit them.

| Setting | Value |
|---------|-------|
| Okta org URL | `https://sgintl-dev.oktapreview.com` |
| Issuer (`OKTA_ISSUER`) | `https://sgintl-dev.oktapreview.com/oauth2/default` |
| SPA Client ID (`OKTA_CLIENT_ID` / `OKTA_AUDIENCE`) | `0oazmspa1yXs5YFpp1d7` |
| Redirect URI (primary) | `http://localhost:3000/login/callback` |
| Redirect URI (alternate) | `http://127.0.0.1:3000/login/callback` |
| Client secret | **None** — SPA public client with PKCE (NFR2) |

**Issuer URL rule:** Always use the authorization server path `/oauth2/default`, not the bare org URL.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1]
- [Source: _bmad-output/planning-artifacts/architecture-Okta-Auth-2026-06-05.md#Authentication--Security]
- [Source: LAB-03-Search-App-Guide.md — Okta Authentication Setup section]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- `git check-ignore -v sg-search-service/.env sg-search/config.js` — both paths excluded
- Secret grep (excluding `_bmad-output`): no `client_secret`, `CLIENT_SECRET`, or real client ID in app source
- `sg-search-service`: search-validation tests passed
- `sg-search`: first-name-length tests passed

### Completion Notes List

- Added comprehensive Okta Authentication Setup section to `LAB-03-Search-App-Guide.md` (SPA registration, redirect URIs, facilitator prerequisites, token storage trade-offs, cross-package alignment, security reminders)
- Created `sg-search-service/.env.example` with `OKTA_ISSUER`, `OKTA_AUDIENCE`, optional `OKTA_REQUIRED_SCOPE`
- Updated `sg-search/config.example.js` with `127.0.0.1` redirect URI comments and Epic 2 mapping note
- Added explicit `sg-search-service/.env` to `.gitignore`
- Updated both package READMEs with copy-template instructions and links to main guide
- Documentation-only story — no runtime auth code added per scope boundary
- Code review resolved: stable guide anchor, OKTA_* mapping comments, templates staged; Epic 2 WIP excluded from Story 1.1 commit scope

### File List

- `LAB-03-Search-App-Guide.md` (modified)
- `sg-search-service/.env.example` (new)
- `sg-search/config.example.js` (modified)
- `.gitignore` (modified)
- `sg-search/README.md` (modified)
- `sg-search-service/README.md` (modified)

## Change Log

- 2026-06-05: Story 1.1 — Okta setup documentation, env templates, gitignore verification (documentation-only)
- 2026-06-05: Code review patches — anchor fix, AC mapping comments, templates staged, isolated commit scope
