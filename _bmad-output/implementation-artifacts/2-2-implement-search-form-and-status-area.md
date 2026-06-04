---
baseline_commit: 3aad37e
---

# Story 2.2: Implement Search Form and Status Area

Status: review

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want First Name and Last Name fields with Search, Clear, and a status region,
so that I have the core interaction surface for the lab.

## Acceptance Criteria

1. **Given** the glassmorphism shell from Story 2.1  
   **When** the page loads with no prior search  
   **Then** First Name and Last Name inputs and Search (primary) and Clear (secondary) controls are visible inside `#search-panel` (FR5, UX-DR6)

2. **And** the status area (`#status-panel`) shows the exact initial microcopy: **"Enter a name to begin searching."** (UX-DR10)

3. **And** inputs use large fields with subtle borders and **focus glow**; Search uses solid accent blue with white text; Clear uses ghost/light secondary styling (UX-DR6)

4. **And** clicking Search does **not** reload the page — use `preventDefault` on form submit and/or `type="button"` where appropriate (FR6)

5. **And** existing Story 2.1 layout tokens remain unchanged: 800px column, `#0071e3` accent, 12px card / 8px control radii, glass blur 20px (UX-DR2, UX-DR5)

6. **And** only Vanilla HTML/CSS/JS under `sg-search/` — no frameworks, no `fetch`, no results table rows (NFR9; Stories 2.3–2.4)

## Tasks / Subtasks

- [x] Populate `#search-panel` with labeled form markup (AC: #1, #3)
  - [x] `<form id="search-form">` with `firstName` and `lastName` fields (labels: "First Name", "Last Name")
  - [x] Search button: primary (`#btn-search`); Clear button: secondary (`#btn-clear`)
  - [x] Use `name` attributes matching API query params: `firstName`, `lastName` (Story 2.3 integration)
- [x] Set initial status microcopy in `#status-panel` (AC: #2)
  - [x] Element `#status-message` (or equivalent) containing exact UX-DR10 empty-state string
  - [x] Keep `aria-live="polite"` on `#status-panel` from Story 2.1
- [x] Extend `styles.css` for form layout and controls (AC: #3, #5)
  - [x] `.input` — large padding, subtle border, focus ring/glow using `--color-accent`
  - [x] `.btn-primary` / `.btn-secondary` — 8px radius, primary solid blue, secondary ghost/gray
  - [x] Responsive form layout (stack on narrow; side-by-side fields + actions at 1280px+ if space allows)
- [x] Wire minimal `app.js` to prevent full page reload (AC: #4)
  - [x] `search-form` `submit` → `preventDefault()` (Search may be `type="submit"`)
  - [x] Clear button: `type="button"` only — **no reset logic yet** (Story 2.5)
  - [x] **Do not** call `fetch`, update status to loading/success, or render table rows
- [x] Update `sg-search/test/shell-spec.test.js` contract (AC: #1–#4)
  - [x] Assert form fields, buttons, and initial status text exist in `index.html`
  - [x] Allow `addEventListener` in `app.js` but still forbid `fetch(`
- [x] Manual verification (AC: #1–#5)
  - [x] `cd sg-search` → `npm test` → `npm start` → `http://localhost:3000`
  - [x] Click Search — URL must not change, page must not reload
  - [x] DevTools: focus an input — confirm accent focus glow
  - [x] Confirm `#results-panel` remains empty placeholder (no table yet)

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` and `tech-stack.md` describe a **superseded Task Manager** (React 19, Zustand, Tailwind, `src/components/`). **Do not follow them.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Story 2.2 AC, FR5, FR6 partial, UX-DR6, UX-DR10) |
| `2-1-build-glassmorphism-page-shell.md` | Stable IDs, CSS tokens, scope boundaries |
| `ux-designs/.../DESIGN.md` | Input/button/table component styling |
| `ux-designs/.../EXPERIENCE.md` | IA order, microcopy strings |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | Form fields, no reload constraint |

### Story Scope Boundary (2.2 vs 2.3–2.5)

| In scope (2.2) | Out of scope (later stories) |
|----------------|------------------------------|
| Form markup + CSS for inputs/buttons | `fetch` to `http://localhost:3001/api/search` (2.3) |
| Initial status: "Enter a name to begin searching." | Loading: "Searching database..." (2.3) |
| `preventDefault` so Search does not reload | Success/error status updates (2.3) |
| Clear button **visible** with secondary styling | Clear empties fields + resets status/table (2.5) |
| `#results-panel` stays empty | Table columns, XSS escape (2.4) |
| Enter key handling | Enter triggers async search (2.3) |

**FR6 split:** This story satisfies **"Search does not reload the page"** only. Async fetch + Clear reset are **2.3** and **2.5**.

### Current Codebase State (READ BEFORE EDITING)

Story 2.1 delivered `sg-search/` with empty panels. **Update these files; do not recreate the package.**

| File | Current state | This story changes |
|------|---------------|-------------------|
| `sg-search/index.html` | Empty `#search-panel`, empty `#status-panel`, empty `#results-panel` | Add form inside `#search-panel`; set `#status-panel` initial text |
| `sg-search/styles.css` | Design tokens + `.glass-card`; stub `.btn`/`.input` selectors only | Full form, input, button, focus-glow rules |
| `sg-search/app.js` | Comment-only stub | Minimal event listeners (`preventDefault` only) |
| `sg-search/test/shell-spec.test.js` | Forbids `addEventListener` and `fetch` | Extend assertions; allow listeners; still forbid `fetch` |

**Preserve unchanged:**
- `#search-panel`, `#status-panel`, `#results-panel` IDs
- `.page-wrap`, `.glass-card`, `.status-area`, header copy
- `package.json` start script on port **3000**
- Decorative `.bg-blob` elements (optional, already present)

### Target Markup Contract (Stable for 2.3–2.5)

Implement inside `#search-panel` (adapt class names; **keep IDs**):

```html
<section id="search-panel" class="glass-card" aria-label="Search area">
  <form id="search-form" class="search-form" novalidate>
    <div class="form-row">
      <div class="form-group">
        <label for="firstName">First Name</label>
        <input class="input" type="text" id="firstName" name="firstName" autocomplete="given-name" />
      </div>
      <div class="form-group">
        <label for="lastName">Last Name</label>
        <input class="input" type="text" id="lastName" name="lastName" autocomplete="family-name" />
      </div>
    </div>
    <div class="form-actions">
      <button type="submit" id="btn-search" class="btn btn-primary">Search</button>
      <button type="button" id="btn-clear" class="btn btn-secondary">Clear</button>
    </div>
  </form>
</section>

<section id="status-panel" class="status-area" aria-live="polite">
  <p id="status-message">Enter a name to begin searching.</p>
</section>
```

**`#results-panel`:** Leave empty (optional HTML comment: `<!-- Results table: Story 2.4 -->`). Do not add `<table>` rows yet.

### CSS Requirements (Extend `styles.css`)

Use existing `:root` tokens from Story 2.1. Add only what 2.2 needs:

**Inputs (UX-DR6):**
- `width: 100%`; generous padding (e.g. `12px 16px`)
- Border: `1px solid rgba(0, 0, 0, 0.12)` or `var(--glass-border)`
- Background: semi-transparent white (e.g. `rgba(255, 255, 255, 0.5)`)
- Focus: `outline: none`; `border-color: var(--color-accent)`; `box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.25)` (focus glow)

**Buttons:**
- `.btn-primary`: `background: var(--color-accent)`; `color: #fff`; no underline
- `.btn-secondary`: transparent/ghost or `rgba(0, 0, 0, 0.06)` background; `color: var(--color-text)`
- Shared: `border-radius: var(--radius-control)`; padding ~`10px 20px`; `font-size: var(--font-size-base)`; cursor pointer
- Hover states: subtle darken/lighten (keep NFR3 — no heavy animation libraries)

**Form layout:**
- `.search-form` flex or grid with gap `16px–24px`
- `.form-row`: two columns on wide viewports; stack on narrow
- `.form-actions`: flex gap; Search before Clear

### Minimal `app.js` (Story 2.2 Only)

```javascript
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("search-form");
  if (form) {
    form.addEventListener("submit", (e) => e.preventDefault());
  }
});
```

- **Do not** attach Clear click handler that mutates DOM (2.5).
- **Do not** add Enter-key duplicate logic beyond native form submit + `preventDefault`.
- Export no modules; no bundler.

### UX Prototype vs Binding Tokens

`direction-glassmorphism.html` shows a 3-column grid with purple accent and 14px input radius — **do not copy**. Binding values remain from Story 2.1 / DESIGN.md (`#0071e3`, 8px control radius, 800px max width).

### Epic 2 Cross-Story Context

| Story | Depends on 2.2 |
|-------|----------------|
| 2.3 | Reads `#firstName`, `#lastName`; updates `#status-message`; calls API |
| 2.4 | Renders into `#results-panel` |
| 2.5 | `#btn-clear` resets form + status + table |

Query param names for backend (Epic 1): `firstName`, `lastName` — align `name` attributes now.

### Architecture Compliance

- **NFR9:** Vanilla HTML/CSS/JS only.
- **NFR3:** No new npm dependencies; minimal CSS/JS additions.
- **NFR5:** Frontend port **3000** unchanged.
- **NFR7:** No auth.
- **FR5:** Search form fields delivered in this story.
- **FR6 (partial):** No full page reload on Search; async behavior deferred to 2.3.

### Library & Framework Requirements

- **Forbidden:** React, Vue, jQuery, Bootstrap, Tailwind, bundlers.
- **Allowed:** DOM APIs, CSS only.

### File Structure Requirements

```text
sg-search/
├── index.html      # UPDATE — form + status markup
├── styles.css      # UPDATE — input/button/form styles
├── app.js          # UPDATE — preventDefault only
└── test/
    └── shell-spec.test.js  # UPDATE — new contract checks
```

All changes stay under `sg-search/`. Do not modify `sg-search-service/` in this story.

### Testing Requirements

**Automated (required):**
- `cd sg-search && npm test` — extend `shell-spec.test.js`:
  - `index.html` contains `id="search-form"`, `id="firstName"`, `id="lastName"`, `id="btn-search"`, `id="btn-clear"`
  - `index.html` contains exact string `Enter a name to begin searching.`
  - `app.js` contains `preventDefault` (or `addEventListener` on submit)
  - `app.js` still **must not** contain `fetch(`

**Manual (required):**
1. `npm start` → open `http://localhost:3000` (not `file://`).
2. Confirm both inputs and both buttons visible in glass search card.
3. Click Search with empty or filled fields — page must not navigate/reload.
4. Tab to input — focus glow visible (accent blue ring).
5. Click Clear — **acceptable:** no-op for now; must not cause errors or reload.
6. `#results-panel` still empty.

### Previous Story Intelligence (2.1)

- `sg-search/` created at repo root (sibling to `sg-search-service/`).
- Stable region IDs: `#search-panel`, `#status-panel`, `#results-panel`.
- CSS tokens in `:root` — **extend, do not replace** accent `#0071e3` or `800px` max width.
- `shell-spec.test.js` exists — **must update** when adding `addEventListener` (2.1 test currently fails if listeners added without test change).
- Story 2.1 completion note: manual verify via `npm start` on port 3000.

### Git Intelligence Summary

- Latest commit: `3aad37e initial commit` — `sg-search/` may exist locally from Story 2.1 work; **treat this story file + repo files as truth**.
- Follow Epic 1 conventions: root-level package, `engines.node >= 18`, PowerShell-friendly README commands.

### Latest Technical Information

- **Form submit + SPA pattern:** Use `<form>` + `submit` listener + `preventDefault()` — standard approach before `fetch` in 2.3. [MDN: Event.preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
- **`type="button"` on Clear:** Prevents accidental form submission when Clear wiring lands in 2.5.
- **`aria-live="polite"`** on `#status-panel` already set — 2.3 status updates will announce without `aria-live="assertive"` unless UX changes.

### Project Context Reference

- No `project-context.md` in repo. Binding: this story + `epics.md` + `DESIGN.md` + `EXPERIENCE.md` + Story 2.1 file.

### Anti-Patterns (Will Fail Review)

- Implementing `fetch`, results table, XSS helper, or loading/success/error status strings (2.3–2.4).
- Wiring Clear to empty fields or remove status/table (2.5).
- Changing `#0071e3` to prototype purple or widening layout to 1000px.
- Removing or renaming `#search-panel` / `#status-panel` / `#results-panel`.
- Using `<form action="...">` without `preventDefault` (causes reload).
- Adding React, Tailwind, or npm UI dependencies.
- Following `architecture.md` React/Vite structure.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.2]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/DESIGN.md — Components]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/EXPERIENCE.md — Microcopy, IA]
- [Source: _bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md — §3.2 FR-4]
- [Source: _bmad-output/implementation-artifacts/2-1-build-glassmorphism-page-shell.md — IDs, tokens, scope]
- [Source: sg-search/index.html, styles.css, app.js — current implementation]
- [Source: ux-designs/.../.working/direction-glassmorphism.html — layout inspiration only]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- `npm test` in `sg-search/` — shell-spec: all checks passed

### Implementation Plan

- Extended Story 2.1 shell with target form markup inside `#search-panel` and `#status-message` in `#status-panel`.
- Added form/input/button CSS using existing `:root` tokens; responsive `.form-row` at 1280px+.
- Minimal `app.js`: `DOMContentLoaded` + `search-form` submit `preventDefault` only (no Clear handler, no fetch).

### Completion Notes List

- Implemented search form (First/Last Name, Search/Clear) and initial status microcopy per UX-DR10.
- Search submit prevented via `preventDefault`; Clear is `type="button"` with no handler (Story 2.5).
- `#results-panel` left empty with Story 2.4 comment; no table or fetch.
- Extended `shell-spec.test.js` for form IDs, status text, `preventDefault`, and continued `fetch(` ban.
- Automated tests pass; manual verify: `npm start` on port 3000, Search does not reload.

### File List

- sg-search/index.html
- sg-search/styles.css
- sg-search/app.js
- sg-search/test/shell-spec.test.js

### Change Log

- 2026-06-04: Story 2.2 — search form markup, status area, form/button CSS, preventDefault wiring, shell-spec contract updates.

## Story Completion Status

- **Status:** review
- **Completion note:** All ACs satisfied; ready for code review.
- **Next story after done:** `2-3-connect-async-search-to-backend-api`
