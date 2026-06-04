---
baseline_commit: 3aad37e
---

# Story 2.5: Implement Clear and Form Reset

Status: review

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want Clear to reset the form and UI state instantly,
so that I can run another search without refreshing the page.

## Acceptance Criteria

1. **Given** the form has values in one or both fields and/or a prior search left status text and/or a results table in `#results-panel`  
   **When** the user clicks **Clear** (`#btn-clear`)  
   **Then** `#firstName` and `#lastName` are emptied immediately (UX-DR12, FR6)

2. **And** `#status-message` is reset to the exact initial empty-state microcopy: **"Enter a name to begin searching."** (UX-DR10, UX-DR12, FR6)

3. **And** the results table is removed: `#results-panel` has no child nodes and `results-panel--with-table` class is removed (reuse `clearResultsPanel()` from Story 2.4) (UX-DR12, FR6)

4. **And** no full page reload occurs — Clear stays `type="button"` and must not submit `#search-form` (FR6, NFR5)

5. **And** Clear does **not** call `fetch` or change `SEARCH_API`, `STATUS` string literals, or `runSearch()` / `renderResults()` logic except via shared reset helpers (scope boundary with 2.3–2.4)

6. **And** if a search request is **in flight** when Clear is clicked, the UI still ends in the initial empty state and a **late** response must **not** repopulate status or the table (stale-response guard)

7. **And** after Clear, the user can run a new Search or press Enter without reloading the page (FR6)

## Tasks / Subtasks

- [x] Implement `resetSearchUi()` in `app.js` (AC: #1–#3, #5)
  - [x] Set `firstName` / `lastName` input `.value` to `""` (do not rely on full `form.reset()` unless you verify it does not break future fields)
  - [x] Set `statusEl.textContent = STATUS.empty` (exact string already in `STATUS.empty`)
  - [x] Call existing `clearResultsPanel()` — do not duplicate panel-clear logic
- [x] Wire `#btn-clear` click handler in `DOMContentLoaded` (AC: #4, #7)
  - [x] `document.getElementById("btn-clear")?.addEventListener("click", ...)`
  - [x] Handler calls `resetSearchUi()` only — no `preventDefault` on form needed (button is not submit)
  - [x] Do **not** attach Clear to `search-form` `submit`
- [x] Stale in-flight `fetch` guard (AC: #6)
  - [x] **Preferred:** monotonic `searchGeneration` (or `searchId`) incremented at start of `runSearch` and again on Clear; before applying success status/table, check `generation === currentGeneration`
  - [x] **Alternate:** `AbortController` aborted on Clear — only if you keep abort handling in `catch` without overwriting cleared UI with error text
  - [x] On Clear: increment generation **before** clearing DOM so late `runSearch` completion is ignored
- [x] Extend `sg-search/test/shell-spec.test.js` (AC: #1–#5)
  - [x] Assert `app.js` wires `btn-clear` (listener or handler name e.g. `resetSearchUi`)
  - [x] Assert `resetSearchUi` (or equivalent) clears inputs and uses `STATUS.empty` / `Enter a name to begin searching.`
  - [x] Assert `clearResultsPanel` is invoked from reset path (function call reference)
  - [x] Keep existing 2.3–2.4 assertions passing (`fetch`, `renderResults`, no `innerHTML`)
- [x] Manual verification (AC: #1–#7)
  - [x] `cd sg-search` → `npm test` → `npm start` → `http://localhost:3000`
  - [x] Search with values → table + `Found N results.` → Clear → empty fields, empty panel, empty-state status
  - [x] Click Clear on initial load → still empty-state status (no error)
  - [x] Slow backend or throttled network: click Clear during "Searching database..." → final state is empty prompt, no table (AC #6)
  - [x] After Clear, new Search works without reload

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` describes a **superseded Task Manager** (React 19, Zustand, Tailwind). **Do not follow it.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Story 2.5 AC, FR6, UX-DR12) |
| `2-4-render-results-table-with-xss-protection.md` | `clearResultsPanel()`, `#results-panel`, scope boundary |
| `2-3-connect-async-search-to-backend-api.md` | `STATUS`, `runSearch()`, microcopy ownership |
| `2-2-implement-search-form-and-status-area.md` | `#btn-clear` markup, initial status in HTML |
| `ux-designs/.../EXPERIENCE.md` | "The Reset" flow — fields empty, table/status return to clean state |
| `prds/prd-AI_POC_Lab4-2026-06-03/prd.md` | Clear resets form/results, no reload |

### Story Scope Boundary (2.5 vs 2.3 vs 2.4)

| In scope (2.5) | Owned elsewhere |
|----------------|-----------------|
| Clear click → empty inputs + `STATUS.empty` + `clearResultsPanel()` | `fetch`, loading/success/error microcopy (2.3) |
| Stale-response guard for in-flight search | Table render + XSS (2.4) |
| FR6 Clear half of "async search + Clear, no reload" | Backend `/api/search`, CORS (Epic 1) |

**Do not** change `SEARCH_API`, `STATUS` string literals, `RESULT_COLUMNS`, or `renderResults()` column logic.

### UX-DR12 vs EXPERIENCE.md

- **UX-DR12 / epics:** Reset status to **initial empty prompt** (not blank).
- **EXPERIENCE "Reset" flow:** "status message disappear, returning … initial clean state" — implement as **`STATUS.empty`**, same as `index.html` load state and Story 2.2.

### Current Codebase State (READ BEFORE EDITING)

**Update only `sg-search/`** — do not modify `sg-search-service/` in this story.

| File | Current state | This story changes |
|------|---------------|-------------------|
| `sg-search/app.js` | `runSearch`, `renderResults`, `clearResultsPanel`; `#btn-clear` has **no** handler | Add `resetSearchUi`, Clear listener, optional `searchGeneration` guard in `runSearch` |
| `sg-search/index.html` | Clear button present, initial status in HTML | **No markup changes** unless tests require `aria` on Clear (optional) |
| `sg-search/styles.css` | Complete shell + table styles | **No changes** unless reset exposes layout bug |
| `sg-search/test/shell-spec.test.js` | Table/fetch/XSS contract | Add Clear/reset assertions |

**Stable IDs (do not rename):**

- `#btn-clear` — `type="button"` (already correct)
- `#firstName`, `#lastName`, `#search-form`, `#status-message`, `#results-panel`

### Reference Implementation Sketch (`app.js`)

Adapt naming; integrate with existing `DOMContentLoaded` block:

```javascript
let searchGeneration = 0;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("search-form");
  const statusEl = document.getElementById("status-message");
  const clearBtn = document.getElementById("btn-clear");
  if (!form || !statusEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await runSearch(statusEl);
  });

  clearBtn?.addEventListener("click", () => {
    resetSearchUi(statusEl);
  });
});

function resetSearchUi(statusEl) {
  searchGeneration += 1;

  const first = document.getElementById("firstName");
  const last = document.getElementById("lastName");
  if (first) first.value = "";
  if (last) last.value = "";

  if (statusEl) statusEl.textContent = STATUS.empty;
  clearResultsPanel();
}

async function runSearch(statusEl) {
  const generation = ++searchGeneration;
  // ... existing trim / empty guard ...

  try {
    // ... existing fetch ...
    if (generation !== searchGeneration) return;
    statusEl.textContent = STATUS.success(count);
    renderResults(Array.isArray(data.results) ? data.results : []);
  } catch {
    if (generation !== searchGeneration) return;
    statusEl.textContent = STATUS.error;
  }
}
```

**Notes:**

- Increment `searchGeneration` on Clear **and** at the start of each new `runSearch` so only the latest operation wins.
- Empty-field early return in `runSearch` already sets `STATUS.empty` — behavior after Clear + Search with empty fields remains correct.
- `clearResultsPanel()` already removes children and `results-panel--with-table` — **reuse it**.

### Architecture Compliance

- **NFR9:** Vanilla JS only; no new dependencies.
- **NFR3:** Small diff — one reset helper + listener + optional generation integer.
- **FR6:** Completes Clear portion of no-reload search UX.
- **FR8:** Do not alter microcopy strings; only restore `STATUS.empty` on Clear.

### File Structure Requirements

```text
sg-search/
├── app.js                      # UPDATE — resetSearchUi, btn-clear listener, stale guard
└── test/
    └── shell-spec.test.js      # UPDATE — Clear/reset contract
```

### Testing Requirements

**Automated (required):**

```bash
cd sg-search && npm test
```

Suggested `shell-spec.test.js` additions:

- `app.js` contains `btn-clear` and `resetSearchUi` (or `resetSearch` / `handleClear`)
- `app.js` contains `Enter a name to begin searching.` in reset path (via `STATUS.empty` reference)
- `app.js` calls `clearResultsPanel` from reset flow
- Optional: `searchGeneration` or stale-guard pattern (`generation !== searchGeneration`)
- All existing assertions still pass

**Manual (required for story done):**

1. Search → populated table + success status → Clear → empty form, empty panel, empty-state status.
2. Clear on fresh page load → unchanged empty-state (no crash).
3. Clear during loading → ends at empty-state; no table flash from late response.
4. After Clear, Search again → normal 2.3/2.4 behavior without reload.
5. Clear does not navigate or reload (Network tab: no document navigation).

### Previous Story Intelligence (2.4)

- `clearResultsPanel()` is the single source of truth for removing the dynamic table — **call it from reset**, do not reimplement.
- `#btn-clear` was intentionally inert until this story.
- `runSearch` already calls `clearResultsPanel()` at loading start — Clear must still fully reset status to empty prompt, not leave "Searching database...".

### Previous Story Intelligence (2.3)

- `STATUS.empty` must match `index.html` initial copy exactly.
- `runSearch` empty guard: both fields blank → `STATUS.empty` without fetch — compatible with post-Clear state.
- Do not add `innerHTML` for status (shell-spec forbids).

### Previous Story Intelligence (2.2 / 2.1)

- Clear uses `.btn-secondary` styling — no CSS work required.
- Form `novalidate` unchanged.

### Git Intelligence

- Latest commit: `3aad37e initial commit` — Epic 2 frontend work lives in working tree; **on-disk `sg-search/*` + story files are truth**.

### Latest Technical Information

- **`HTMLInputElement.value = ""`** — standard way to clear controlled inputs without navigation. [MDN HTMLInputElement/value](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/value)
- **Race with async `fetch`:** Use a generation counter or `AbortController` so UI resets are not overwritten by stale promises (common SPA pattern).
- **`type="button"`** on Clear prevents implicit form submit (already in `index.html`).

### Project Context Reference

- No `project-context.md` in repo. Binding: this story + `epics.md` + `EXPERIENCE.md` + Stories 2.2–2.4 + current `sg-search/*`.

### Anti-Patterns (Will Fail Review)

- Using `location.reload()` or `form.submit()` for reset (FR6 violation).
- Leaving success/error status or table visible after Clear (UX-DR12 violation).
- Duplicating panel-clear logic instead of calling `clearResultsPanel()`.
- Changing `STATUS` success/error/loading strings or `SEARCH_API`.
- Implementing Clear as `type="submit"` (would trigger search).
- Letting a late `fetch` resolve after Clear and repopulate the table (AC #6 failure).
- Adding `innerHTML` for status or table (breaks 2.3/2.4 contract).
- Modifying `sg-search-service/` in this frontend-only story.
- Following `architecture.md` React/Vite structure.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.5, FR6, UX-DR12]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/EXPERIENCE.md — Form Reset, Key Flow 2]
- [Source: _bmad-output/implementation-artifacts/2-4-render-results-table-with-xss-protection.md — clearResultsPanel, btn-clear deferred]
- [Source: _bmad-output/implementation-artifacts/2-3-connect-async-search-to-backend-api.md — STATUS, runSearch scope]
- [Source: sg-search/app.js, index.html, test/shell-spec.test.js — current implementation]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

### Completion Notes List

- Added `resetSearchUi()` to clear `#firstName` / `#lastName`, restore `STATUS.empty`, and call `clearResultsPanel()`.
- Wired `#btn-clear` click handler in `DOMContentLoaded` (no form submit).
- Added monotonic `searchGeneration` guard in `runSearch` and on Clear so stale fetch responses cannot repopulate UI.
- Extended `shell-spec.test.js` with Clear/reset and stale-guard contract assertions; `npm test` passes.

### Implementation Plan

- Reused story sketch: generation counter incremented on Clear (first) and at each `runSearch` start; compare before applying loading/success/error UI.

### File List

- sg-search/app.js
- sg-search/test/shell-spec.test.js

### Change Log

- 2026-06-04: Story 2.5 — Clear button reset UI, stale-response guard, shell-spec tests (Composer)

## Story Completion Status

- **Status:** review
- **Completion note:** All ACs implemented; automated tests pass; ready for code review
- **Completes FR6 (frontend):** Clear reset with async Search (Story 2.3) — Epic 2 UX feature-complete after this story is done
