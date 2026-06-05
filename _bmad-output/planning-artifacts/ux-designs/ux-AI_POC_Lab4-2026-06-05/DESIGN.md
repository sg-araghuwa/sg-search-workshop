---
name: AI_POC_Lab4 Okta Sign-In
description: Glassmorphism landscape visual identity for Okta-hosted authentication and matching local Sign-In Surface.
status: final
project: AI_POC_Lab4
scope: Okta Authentication increment — sign-in surfaces only
updated: 2026-06-05
sources:
  - imports/README.md
  - _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-05/prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/DESIGN.md
colors:
  sky-light: '#B8D4E8'
  sky-mid: '#7EB3D4'
  mountain-far: '#5A9BB8'
  mountain-mid: '#3D7FA3'
  mountain-near: '#214D72'
  forest: '#1A3344'
  sun: '#FFFFFF'
  cloud: 'rgba(255, 255, 255, 0.85)'
  glass-surface: 'rgba(255, 255, 255, 0.22)'
  glass-border: 'rgba(255, 255, 255, 0.45)'
  text: '#1A1A1A'
  text-muted: '#4A5568'
  text-on-dark: '#FFFFFF'
  primary: '#3D7FA3'
  primary-light: '#6EB5D8'
  primary-foreground: '#FFFFFF'
  input-line: 'rgba(26, 26, 26, 0.35)'
  input-line-focus: '#214D72'
  link: '#214D72'
typography:
  body:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  card-title:
    fontFamily: '{typography.body.fontFamily}'
    fontSize: 22px
    fontWeight: '700'
    letterSpacing: '0.12em'
    textTransform: uppercase
  label:
    fontFamily: '{typography.body.fontFamily}'
    fontSize: 14px
    fontWeight: '500'
  button:
    fontFamily: '{typography.body.fontFamily}'
    fontSize: 16px
    fontWeight: '600'
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  xl: 20px
  button: 24px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  card-padding: 40px
  field-gap: 20px
components:
  landscape-bg:
    type: css-vector-layers
    palette: '{colors.sky-light} through {colors.mountain-near}'
  glass-login-card:
    max-width: 400px
    background: '{colors.glass-surface}'
    border: '1px solid {colors.glass-border}'
    border-radius: '{rounded.xl}'
    padding: '{spacing.card-padding}'
    backdrop-filter: blur(20px)
  underline-input:
    border-bottom: '1px solid {colors.input-line}'
    icon-position: trailing
    min-height: 44px
  primary-button:
    height: 48px
    background: 'linear-gradient(90deg, {colors.mountain-near} 0%, {colors.primary-light} 100%)'
    foreground: '{colors.primary-foreground}'
    border-radius: '{rounded.button}'
    border: none
---

# DESIGN.md — AI_POC_Lab4 Okta Sign-In

## Brand & Style

Authentication presents as a **frosted glass login card** floating over a **serene vector landscape** — layered mountains, pine silhouettes, pale sky, and soft clouds in cool blues and teals. The mood is calm and modern; glassmorphism ties the sign-in moment to the Search App's existing frosted UI while the illustrated backdrop signals a distinct entry point.

Applies to **Okta Hosted Sign-In Page** (full form styling) and **local Sign-In Surface** (glass card + single redirect CTA). Search Surface retains the 800px glass column from `ux-AI_POC_Lab4-2026-06-03/DESIGN.md` on the default page background when authenticated.

Reference: `imports/README.md` (glassmorphism landscape, v2).

Visual mock: `mockups/key-okta-sign-in.html`. Spines win on conflict.

## Colors

| Token | Role |
|-------|------|
| `{colors.sky-light}` → `{colors.mountain-near}` | Landscape layer stack (sky to foreground peaks) |
| `{colors.forest}` | Pine tree silhouettes |
| `{colors.glass-surface}` / `{colors.glass-border}` | Frosted login card fill and edge |
| `{colors.primary}` → `{colors.primary-light}` | Primary CTA horizontal gradient |
| `{colors.input-line}` / `{colors.input-line-focus}` | Underline inputs default and focus |
| `{colors.text}` | Card titles and labels |
| `{colors.link}` | Forgot password, Register links (Okta page) |

Search actions continue using `#0071e3` Apple blue inside the authenticated Search Surface only.

## Typography

- **Card title:** `{typography.card-title}` — uppercase **LOGIN** / **SIGN IN** centered.
- **Field labels:** `{typography.label}` — above underline inputs on Okta page.
- **Body:** `{typography.body}` at 15px.
- **Button:** `{typography.button}` — white on gradient.

## Layout & Spacing

- **Viewport:** Full-bleed landscape background; card centered vertically and horizontally (1280px+).
- **Card width:** max `{components.glass-login-card.max-width}` (400px).
- **Card padding:** `{spacing.card-padding}` (40px).
- **Field stack:** `{spacing.field-gap}` (20px) between underline inputs.
- **Local surface:** Same card dimensions; single CTA + optional lead line — no nav bar.

Marketing navigation from reference (HOME, ABOUT, etc.) is **omitted** — out of lab scope.

## Elevation & Depth

1. **Landscape** — flat vector layers; no photographic texture required.
2. **Glass card** — `{colors.glass-surface}` + `backdrop-filter: blur(20px)`; soft shadow `0 8px 32px rgba(33, 77, 114, 0.2)`.
3. **Inputs** — bottom-border only; icons float at line end.
4. **Primary button** — horizontal gradient lift; no heavy drop shadow.

## Shapes

| Element | Radius |
|---------|--------|
| Glass login card | `{rounded.xl}` (20px) |
| Primary button | `{rounded.button}` (24px pill) |
| Checkbox (Okta Remember Me) | `{rounded.sm}` (4px) |

## Components

### Landscape Background

CSS vector or uploaded illustration: sky gradient, 3 mountain layers, foreground pines, sun disc, cloud shapes, optional bird silhouettes. Cool palette only — no warm sunset tones.

### Glass Login Card

- Frosted panel per `{components.glass-login-card}`.
- Centered title: **LOGIN** (Okta) or **SIGN IN** (local variant acceptable).
- Local variant: lead copy + **Sign In with Okta** only.

### Underline Input (Okta hosted)

- Label above; single bottom border `{colors.input-line}`.
- Trailing icon: envelope (email), eye-slash (password toggle).
- Focus: darken line to `{colors.input-line-focus}`; 2px offset outline optional.
- Placeholders: **Email**, **Password** (or Okta defaults).

### Okta-only Footer Rows

- **Forgot Password?** — right-aligned link below password field.
- **Remember Me** — checkbox + label, left-aligned.
- **Don't have an Account?** / **Register** — footer row; Register bold link.

Not rendered on local redirect surface.

### Primary Button — Okta Hosted Page

- Label: **Secure sign in** (FR/Okta policy) or styled as reference **Login** gradient button.
- Style: `{components.primary-button}` — full width, pill radius.

### Local Redirect Button

- Label: **Sign In with Okta** (FR4).
- Same `{components.primary-button}` gradient styling inside glass card.

## Do's and Don'ts

**Do**

- Use heavy blur (20px+) on the glass card over the landscape.
- Keep underline-input minimalism on Okta page.
- Align auth glass language with Search Surface frosted cards.
- Center the card; full-viewport illustrated background on sign-in mode.

**Don't**

- Reintroduce medical badge / N3 mark (superseded).
- Add marketing nav to the lab app.
- Put email/password fields on local `sg-search` page.
- Use boxed full-border inputs on Okta sign-in (conflicts with reference).

## Okta Admin Console Mapping

| DESIGN element | Okta setting |
|----------------|--------------|
| Landscape illustration | Background image (or CSS in Custom CSS) |
| Glass card | Custom CSS on `.auth-container` |
| Underline inputs | Custom CSS on `.o-form-input` |
| Gradient button | Primary button + Custom CSS |
| Forgot / Register | Okta Widget footer (enable per org policy) |
