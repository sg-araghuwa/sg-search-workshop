---
name: AI_POC_Lab4 Okta Sign-In
status: final
project: AI_POC_Lab4
scope: Okta Authentication increment
updated: 2026-06-05
sources:
  - _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md
  - _bmad-output/planning-artifacts/architecture-Okta-Auth-2026-06-05.md
  - DESIGN.md
---

# EXPERIENCE.md — AI_POC_Lab4 Okta Sign-In

Paired with `{DESIGN.md}` (glassmorphism landscape). Search behavior unchanged — see `ux-AI_POC_Lab4-2026-06-03/EXPERIENCE.md`.

Composition reference: `mockups/key-okta-sign-in.html`. Spines win on conflict.

## Foundation

- **Form factor:** Desktop web, 1280px+ optimized (UX-DR10).
- **UI system:** Vanilla HTML/CSS/JS in `sg-search`; Okta Sign-In Widget on Okta-hosted domain.
- **Visual reference:** `{DESIGN.md}` — landscape backdrop, frosted glass card, underline inputs (Okta); glass card + redirect CTA (local).
- **Auth model:** OIDC Authorization Code + PKCE; credentials on Okta-hosted page only (FR4).

## Information Architecture

| Surface | URL / host | Purpose |
|---------|------------|---------|
| **Local Sign-In Surface** | `http://localhost:3000/` (unauthenticated) | Full-viewport landscape; centered glass card; **Sign In with Okta**; search hidden (FR3) |
| **Okta Hosted Sign-In Page** | Okta org domain | Same visual language; underline email/password; **Secure sign in**; optional Forgot / Remember / Register |
| **Callback processing** | `/login/callback` | Token exchange; **Signing you in...** (UX-DR4) |
| **Search Surface** | `/` (authenticated) | Glass search card + header identity (UX-DR2); default gradient page background |

## Voice and Tone

Calm, modern, approachable. Landscape evokes clarity — not clinical, not corporate-heavy.

| Context | Copy | Notes |
|---------|------|-------|
| Card title (local) | **SIGN IN** | Uppercase per `{typography.card-title}` |
| Card title (Okta) | **LOGIN** | Uppercase; Okta may override with org string |
| Local lead | Sign in to access the employee search lab. | Optional helper below title |
| Okta primary action | **Secure sign in** | Okta page |
| Local redirect CTA | **Sign In with Okta** | FR4 |
| Callback loading | **Signing you in...** | UX-DR4 |
| Sign-in failure | **Sign-in failed. Please try again.** | UX-DR5 |
| Session expiry | **Your session has expired. Please sign in again.** | UX-DR6 |
| API 401 | **You are not signed in. Please sign in to search.** | UX-DR7 |
| Okta field labels | **Email**, **Password** | Underline pattern |
| Forgot password (Okta) | **Forgot Password?** | If enabled in org |
| Register (Okta) | **Don't have an Account?** / **Register** | If self-service registration enabled |

## Component Patterns

| Component | Surface | Behavioral rules |
|-----------|---------|------------------|
| Landscape background | Local + Okta | Decorative; fixed/full-viewport; no interaction |
| Glass login card | Local + Okta | Contains all auth controls; `{colors.glass-surface}` + blur |
| Underline input | Okta hosted | Label + line + trailing icon; password toggle via Okta Widget |
| Remember Me | Okta hosted | Okta session persistence — document XSS trade-off in lab guide |
| **Sign In with Okta** | Local | `signInWithRedirect()`; full-width gradient button |
| **Secure sign in** | Okta hosted | Widget primary submit |
| Header identity | Search Surface | Title + truncated user + **Sign Out** ghost (UX-DR2) |
| Status block | Local | Callback, errors, session, API 401 |

## State Patterns

| State | Surface | Treatment |
|-------|---------|-----------|
| Unauthenticated | Local | `#sign-in-section` visible; landscape + glass card |
| Redirect in flight | Local → Okta | CTA disabled optional; navigate to Okta |
| Okta default | Okta hosted | Empty underline fields; glass card over landscape |
| Okta field error | Okta hosted | Inline validation; preserve underline styling |
| Callback | Local `/login/callback` | `#status` = **Signing you in...** |
| Authenticated | Local `/` | Search glass card; landscape background off |
| Auth failure | Local | Error in card + retry (UX-DR5) |
| Token expired | Local | UX-DR6 → re-auth |
| Search 401 | Local | UX-DR7 |

## Interaction Primitives

- **Local sign-in:** Full-page redirect to Okta — no iframe.
- **Okta sign-in:** Tab order through underline fields → primary → footer links.
- **Password toggle:** Okta Widget eye icon on hosted page only.
- **Callback / sign-out / search:** Unchanged from architecture doc.

## Accessibility Floor

- Glass card text must meet WCAG 2.1 AA (4.5:1) against blurred landscape — increase `{colors.glass-surface}` opacity if needed.
- Underline inputs require visible labels (not placeholder-only).
- Focus: darken `{colors.input-line-focus}` + visible focus ring on buttons.
- Local CTA: min 48px height, native `<button>`.

## Key Flows

### 1. First Sign-In (Protagonist: Jordan, lab participant)

1. Jordan opens the app — landscape fills the screen; frosted **SIGN IN** card centered.
2. Jordan clicks **Sign In with Okta**; browser opens Okta with matching glass-over-landscape styling.
3. Jordan enters email and password in underline fields; clicks **Secure sign in**.
4. Callback shows **Signing you in...**; Search Surface appears. **[CLIMAX]**

### 2. Session Recovery (Protagonist: Jordan)

1. Search fails with expired token message.
2. Jordan re-authenticates through Okta glass login.
3. Search succeeds again. **[CLIMAX]**

### 3. Sign-Out Return (Protagonist: Jordan)

1. **Sign Out** clears session.
2. Landscape + glass **SIGN IN** card returns. **[CLIMAX]**

## Auth UX Decision Records

| ID | Decision |
|----|----------|
| UX-DR-A1 | Auth uses glassmorphism landscape per `{DESIGN.md}` — aligns with UX-DR1/11 |
| UX-DR-A2 | Okta page: underline inputs + gradient pill CTA + optional Forgot/Remember/Register |
| UX-DR-A3 | Local surface: glass card + **Sign In with Okta** only |
| UX-DR-A4 | UX-DR2, UX-DR4–UX-DR13 unchanged |
| UX-DR-A5 | Medical badge identity **retired** (2026-06-05 update) |

## Responsive & Platform

- **1280px+:** Canonical centered card.
- **Below 1280px:** Card `min(400px, 92vw)`; landscape crops center; padding `{spacing.4}`.
- **Okta mobile:** Responsive widget + same Custom CSS where supported.

## Inspiration & Anti-patterns

**Inspired by:** Glassmorphism login over illustrated nature — calm entry, modern SaaS trope done with cool palette.

**Anti-patterns:**

- Medical badge theme (superseded).
- Marketing nav on lab sign-in page.
- Boxed inputs on Okta sign-in when underline pattern specified.
- Local credential fields duplicating Okta.
