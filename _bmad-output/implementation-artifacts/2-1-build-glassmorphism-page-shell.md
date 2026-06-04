---
baseline_commit: 3aad37e
---

# Story 2.1: Build Glassmorphism Page Shell

Status: review

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want the search page layout and global styles applied,
so that the UI matches the approved visual direction before adding behavior.

## Acceptance Criteria

1. **Given** the `sg-search` frontend package exists  
   **When** the page is opened at 1280px viewport width or wider  
   **Then** the layout is a centered single column with max-width **800px** (UX-DR4, UX-DR8)

2. **And** the page uses a soft gradient background and glass card with `backdrop-filter: blur(20px)` per DESIGN tokens (UX-DR1, UX-DR2)

3. **And** typography uses the system-ui stack at **17px** base with semi-bold headings (UX-DR3)

4. **And** cards use **12px** radius and buttons/inputs use **8px** radius with subtle shadows (UX-DR5)

5. **And** the header shows lab title and brief instructions above the search area (UX-DR9)

6. **And** only Vanilla HTML/CSS/JS is used with no UI frameworks (NFR9)

7. **And** whitespace is generous without overcrowding (UX-DR13)

## Tasks / Subtasks

- [x] Create `sg-search/` at repository root (AC: #1, #6)
  - [x] Add `package.json` with `"start"` serving static files on port **3000** (NFR5)
  - [x] Prefer `npx serve -l 3000 .` or equivalent — document in README (NFR8)
- [x] Add `index.html` page shell (AC: #1, #5, #9)
  - [x] Semantic structure: `header` (title + instructions), `main` with placeholder regions for search/results (Stories 2.2–2.4)
  - [x] Link `styles.css`; include empty or stub `app.js` (no behavior in this story)
  - [x] Use stable element IDs/classes documented below for downstream stories
- [x] Implement `styles.css` design system (AC: #2–#4, #7)
  - [x] CSS custom properties for all DESIGN.md tokens (see Dev Notes)
  - [x] `.glass-card` with `rgba(255,255,255,0.7)`, `-webkit-backdrop-filter` + `backdrop-filter: blur(20px)`
  - [x] `@supports` fallback for browsers without backdrop-filter
  - [x] Base `font-size: 17px`, system font stack, heading weights/letter-spacing
- [x] Add `README.md` for package (AC: #6, NFR5, NFR8)
  - [x] Node 18+ if using npm scripts; **must** serve over `http://localhost:3000` (not `file://`)
  - [x] PowerShell start command; note backend on 3001 is separate (`sg-search-service`)
- [x] Visual verification at 1280px+ (AC: #1–#7)
  - [x] Open in browser via `npm start`; confirm layout, glass effect, typography, radii
  - [x] Confirm **no** React, Vite, Tailwind, or bundler config added (NFR9, NFR3)

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` and `tech-stack.md` describe a **superseded Task Manager** (React 19, Zustand, Tailwind, `create-sparkvite`, `src/components/`). **Do not follow them.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Story 2.1 AC, UX-DR1–DR13, NFR9) |
| `ux-designs/.../DESIGN.md` | Color, typography, layout tokens |
| `ux-designs/.../EXPERIENCE.md` | IA: header → search → status → results (structure only here) |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | Ports 3000/3001, Vanilla JS, `npx serve` |
| `idea.md` | Canonical `sg-search/` file layout (`index.html`, `styles.css`, `app.js`) |
| `implementation-readiness-report-2026-06-04.md` | Confirms architecture mismatch |

**Do not:** run `npx create-sparkvite`, add React/Vite/Tailwind, copy Task Manager `src/` tree, or implement search/fetch/Clear (Stories 2.2–2.5).

### UX Prototype vs Binding Tokens (READ BEFORE CODING)

The working HTML mock at `ux-designs/ux-AI_POC_Lab4-2026-06-03/.working/direction-glassmorphism.html` is **inspiration only**. It diverges from approved specs — **epics + DESIGN.md win**:

| Property | Prototype (ignore) | Binding (use) |
|----------|------------------|---------------|
| Accent | `#BF5AF2` purple | `#0071e3` Apple Blue (UX-DR2) |
| Max width | `1000px` | `800px` (UX-DR4) |
| Card radius | `24px` | `12px` (UX-DR5) |
| Input/button radius | `14px` | `8px` (UX-DR5) |
| Glass opacity | `0.6` | `0.7` per epics UX-DR2 |

Optional decorative background blobs from the prototype are **allowed** if they stay subtle and do not break the 800px column or NFR3 complexity guard.

### Story Scope Boundary (2.1 vs 2.2+)

| In scope (2.1) | Out of scope (later stories) |
|----------------|------------------------------|
| Package scaffold + static shell | First/Last Name inputs, Search/Clear buttons (2.2) |
| Global CSS + glass layout | Status microcopy, loading states (2.2, 2.3) |
| Header title + instructions | `fetch` to `localhost:3001` (2.3) |
| Placeholder `<main>` regions with IDs | Results table population, XSS escape (2.4) |
| Empty `app.js` or comment-only stub | Clear/reset behavior (2.5) |

**Placeholder markup example** (structure only — no inputs required for AC):

```html
<header class="page-header">
  <h1>Lab 03 — Search App</h1>
  <p class="instructions">…brief facilitator copy…</p>
</header>
<main class="app-main">
  <section id="search-panel" class="glass-card" aria-label="Search area"></section>
  <section id="status-panel" class="status-area" aria-live="polite"></section>
  <section id="results-panel" class="glass-card" aria-label="Results area"></section>
</main>
```

Stories 2.2–2.4 will populate `#search-panel`, `#status-panel`, `#results-panel` — **keep these IDs stable**.

### Current Codebase State

- **`sg-search-service/`** exists (Epic 1, port **3001**). Backend is **not** required to verify Story 2.1 visually.
- **`sg-search/`** does **not** exist yet — greenfield create at repo root `AI_POC_Lab4/sg-search/`.
- **`idea.md`** mentions `cursor-workshop-app/` — **ignore**; epics and Story 1.1 established **root-level** packages.

### Target Directory Structure (Story 2.1 Only)

```text
AI_POC_Lab4/
└── sg-search/
    ├── package.json       # start script → port 3000 static serve
    ├── index.html         # shell + header + empty main sections
    ├── styles.css         # full design system / glass layout
    ├── app.js             # empty or "// behavior in Story 2.x" only
    └── README.md          # serve instructions, ports, file:// warning
```

**Out of scope for 2.1:** `fetch`, form controls, table rows, XSS helper, `setup-lab.ps1` (Epic 3).

### CSS Design Tokens (Implement in `:root`)

```css
:root {
  /* Background */
  --bg-gradient-start: #f5f5f7;
  --bg-gradient-end: #ffffff;

  /* Glass */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-blur: 20px;

  /* Typography & color */
  --font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-size-base: 17px;
  --line-height-body: 1.5;
  --color-text: #1d1d1f;
  --color-accent: #0071e3;

  /* Layout */
  --layout-max-width: 800px;
  --card-padding: 24px; /* 24–32px per UX-DR4 */
  --radius-card: 12px;
  --radius-control: 8px;
  --shadow-soft: 0 4px 24px rgba(0, 0, 0, 0.06);
}
```

**Body / page layout:**

- `min-height: 100vh`; centered column `max-width: var(--layout-max-width)`; horizontal auto margins.
- Background: linear gradient `var(--bg-gradient-start)` → `var(--bg-gradient-end)`.
- `-webkit-font-smoothing: antialiased` optional (prototype pattern).

**`.glass-card` (required):**

```css
.glass-card {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-soft);
  padding: var(--card-padding);
}
```

**Fallback** when backdrop-filter unsupported:

```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-card {
    background: rgba(255, 255, 255, 0.92);
  }
}
```

**Headings:** `font-weight: 600` (semi-bold); `letter-spacing: -0.02em` on main title acceptable.

### `package.json` Requirements

```json
{
  "name": "sg-search",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "npx --yes serve -l 3000 ."
  },
  "engines": {
    "node": ">=18"
  }
}
```

Alternative without pinning `serve` in dependencies is acceptable (NFR3). **Port 3000 is mandatory** (NFR5) — matches backend CORS expectations from Epic 1.

### Header Content (UX-DR9)

Suggested copy (adjust wording slightly; keep tone professional/technical):

- **Title:** `Lab 03 — User Search` (or `Search App Lab`)
- **Instructions (1–2 sentences):** e.g. “Build a name search against the local CSV API. Form and results wiring come in the next stories.”

Do **not** add functional search UI in the header; instructions only.

### Epic 1 / Backend Context (For Later Stories — Do Not Implement Now)

| Backend fact | Relevance |
|--------------|-----------|
| `sg-search-service` on port **3001** | Story 2.3 will call `http://localhost:3001/api/search` |
| CORS enabled (Story 1.5) | Browser fetch from 3000 will work once 2.3 lands |
| CSV fields: `firstName`, `lastName`, `email`, `department`, `city` | Table columns in Story 2.4 |

### Architecture Compliance

- **NFR9:** Vanilla HTML/CSS/JS only — three files, no transpiler.
- **NFR3:** No extra libraries beyond static server for dev; no CSS frameworks.
- **NFR5:** Frontend **3000**, backend **3001** — never swap.
- **NFR8:** Static CSV on backend only; frontend has no database.
- **NFR10:** Localhost only.

### Library & Framework Requirements

- **None** for UI. Static file server via `npx serve` (or `http-server`) at lab time.
- **Forbidden:** React, Vue, jQuery, Bootstrap, Tailwind CDN, bundlers (Vite/Webpack).

### File Structure Requirements

- All frontend assets live under `sg-search/` at repo root (sibling to `sg-search-service/`).
- Single `styles.css` — avoid splitting into modules unless file exceeds ~250 lines (unlikely for shell).
- `app.js` linked from `index.html` but **must not** attach event listeners or `fetch` in 2.1.

### Testing Requirements

**Manual (required):**

1. `cd sg-search` → `npm start` → open `http://localhost:3000` (not `file://`).
2. Resize viewport to **1280px** width — confirm centered column ≤ 800px content width.
3. DevTools → inspect `.glass-card` — confirm `backdrop-filter: blur(20px)` and semi-transparent background.
4. Verify heading/body font stack and 17px base on `body`.
5. Confirm card corners 12px (measure in DevTools or visual check against spec).
6. Confirm no console errors from `app.js`.

**Regression / negative checks:**

- No `package.json` `dependencies` on React/Tailwind.
- No `src/` React folder created at repo root.

**Optional:** Compare side-by-side with `direction-glassmorphism.html` for *layout feel* only — colors/sizes must match DESIGN.md table above.

### Latest Technical Information

- **`backdrop-filter`** is Baseline newly available (Sept 2024+); still ship **`-webkit-backdrop-filter`** for Safari ≤16 lab machines. [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)
- Effect requires **semi-transparent** background on the glass element; opaque white blocks the blur.
- Parent `opacity` &lt; 1 creates a backdrop root — avoid lowering opacity on wrappers around `.glass-card`.
- **`npx serve`** remains the PRD-recommended static server; `-l 3000` binds port 3000 explicitly.

### Git Intelligence Summary

- Latest commit: `3aad37e initial commit` — backend stories may exist locally uncommitted; treat **epics + this story file** as source of truth for `sg-search` layout.
- Mirror Epic 1 conventions: root-level package folder, `README.md`, `engines.node >= 18`, PowerShell-friendly commands.

### Project Context Reference

- No `project-context.md` in repo. Binding: this story + `epics.md` + `DESIGN.md` + PRD.

### Anti-Patterns (Will Fail Review)

- Implementing search form, buttons, status text, `fetch`, or results table data (belongs to 2.2–2.4).
- Copying purple accent / 1000px width / 24px card radius from `.working/direction-glassmorphism.html`.
- Using `file://` to open `index.html` (fetch will fail in Story 2.3; establish HTTP habit now).
- Following `architecture.md` React/Vite structure or `create-sparkvite`.
- Placing frontend only under `cursor-workshop-app/` without root `sg-search/`.
- Adding React, Tailwind, or auth.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.1]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/DESIGN.md]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/EXPERIENCE.md — IA]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md — §3.2, §6.2]
- [Source: idea.md — sg-search folder layout]
- [Source: _bmad-output/implementation-artifacts/1-1-initialize-express-search-service.md — package location conventions]
- [Source: ux-designs/.../.working/direction-glassmorphism.html — visual reference only, not token source]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- `npm test` in `sg-search/` — shell-spec contract checks passed

### Completion Notes List

- Created root-level `sg-search/` package with vanilla HTML/CSS/JS shell per epics and DESIGN.md tokens (800px column, #0071e3 accent, 12px/8px radii, glass blur 20px).
- `index.html` exposes stable `#search-panel`, `#status-panel`, `#results-panel` for Stories 2.2–2.4; `app.js` is comment-only stub.
- Added `test/shell-spec.test.js` to validate markup/CSS contract without a browser; manual check: `npm start` → http://localhost:3000.

### File List

- sg-search/package.json
- sg-search/index.html
- sg-search/styles.css
- sg-search/app.js
- sg-search/README.md
- sg-search/test/shell-spec.test.js

### Change Log

- 2026-06-04: Story 2.1 — glassmorphism page shell scaffold (sg-search package)

## Story Completion Status

- **Status:** review
- **Completion note:** Implementation complete; ready for code review
- **Next story after done:** `2-2-implement-search-form-and-status-area`
