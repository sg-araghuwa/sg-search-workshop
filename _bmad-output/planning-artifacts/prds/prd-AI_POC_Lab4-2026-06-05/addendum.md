# Addendum — Okta Authentication Technical Details

*Companion to `prd.md`. Mechanism and transport decisions that support FRs but do not belong in the main requirements narrative.*

## Okta Application Registration

| Setting | Value |
|---------|-------|
| App type | Single-Page Application (OIDC) |
| Grant type | Authorization Code |
| PKCE | Required (`pkce: true`) |
| Redirect URIs | `http://localhost:3000/login/callback`, `http://127.0.0.1:3000/login/callback` |
| Client secret | None (public SPA) |

## Environment Variables

### Frontend (`sg-search`)

| Variable | Purpose |
|----------|---------|
| `OKTA_ISSUER` | Okta authorization server issuer URL (e.g. `https://{org}.okta.com/oauth2/default`) |
| `OKTA_CLIENT_ID` | OIDC SPA client ID |
| `OKTA_REDIRECT_URI` | Callback URL (must match Okta app registration) |

Deliver `.env.example`; exclude `.env` via `.gitignore`.

### Backend (`sg-search-service`)

| Variable | Purpose |
|----------|---------|
| `OKTA_ISSUER` | Same issuer as frontend |
| `OKTA_AUDIENCE` | Client ID or custom API audience for JWT validation |
| `OKTA_REQUIRED_SCOPE` | *(Optional)* Scope claim enforced for 403 responses (FR13) |

## Package Dependencies

| Package | Location | Role |
|---------|----------|------|
| `@okta/okta-auth-js` | `sg-search` | OIDC client, PKCE, token manager |
| `okta-jwt-verifier` (or `jose` + JWKS fetch) | `sg-search-service` | JWT validation via Okta JWKS |

## Backend Middleware Pattern

```
requireAuth middleware
  → applied to GET /api/search only
  → validates Bearer token against OKTA_ISSUER + OKTA_AUDIENCE
  → 401: missing / invalid / expired token
  → 403: valid token, missing required scope (if OKTA_REQUIRED_SCOPE set)
  → pass-through: CSV search handler unchanged
```

`GET /health` — no middleware.

## CORS Update

```javascript
// Conceptual — exact implementation in server.js
cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

## Frontend Auth Flow

1. App init → check Okta token manager for existing session.
2. Unauthenticated → render Sign-In Surface (FR3, UX-DR3).
3. **Sign In with Okta** → `signInWithRedirect()` (FR4).
4. `/login/callback` → `handleLoginRedirect()`, show "Signing you in..." (FR5, UX-DR4).
5. Authenticated → Search Surface with header identity (FR6).
6. Search submit → `fetch` with `Authorization: Bearer ${accessToken}` (FR7).
7. Token expired → re-auth prompt (FR8, UX-DR6).
8. **Sign Out** → `signOut()`, return to Sign-In Surface (FR9).

## Token Storage Trade-offs

`@okta/okta-auth-js` default token manager uses memory with optional `sessionStorage` persistence.

| Storage | Pros | Cons |
|---------|------|------|
| Memory only | Lowest XSS exfiltration window | Lost on tab close |
| sessionStorage | Survives refresh within tab | Accessible to same-origin scripts |

**Lab default:** token manager defaults; document trade-off in setup guide (FR15).

## Callback Route Serving

Port 3000 static server must serve `/login/callback` — via dedicated `login/callback/index.html` or SPA fallback to `index.html` with route detection in `app.js`.

## verify-lab.ps1 Auth Assertions

| Assertion | Expected |
|-----------|----------|
| `GET /health` | HTTP 200 |
| `GET /api/search?firstName=John` (no Authorization header) | HTTP 401 |
| Authenticated search | Document manual steps: copy Bearer token from browser Network tab after Epic 2 sign-in |

## Rejected Alternatives

| Option | Why rejected |
|--------|--------------|
| Implicit flow | Deprecated; NFR1 requires Authorization Code + PKCE |
| Password grant | Not suitable for SPA; violates NFR1/NFR2 |
| Client secret in SPA | Public client; NFR2 |
| Session cookies instead of Bearer JWT | Adds server session state; conflicts with stateless API teaching goal |
| React + Okta React SDK | Violates NFR3 (Vanilla JS preserved) |

## Architecture Document Note

The file `architecture.md` (React 19 + Zustand task app) is **not** the architecture for this increment. Use `architecture-BmadPoc-2026-06-04.md` for the Search App stack. A future `architecture` update should document Okta middleware placement and frontend auth module boundaries.
