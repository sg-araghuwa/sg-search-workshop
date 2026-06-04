---
baseline_commit: 3aad37e
---

# Story 2.4: Render Results Table with XSS Protection

Status: review

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a lab developer,
I want search hits displayed in a clean table with escaped values,
so that I can read results safely even if CSV data contains HTML-like characters.

## Acceptance Criteria

1. **Given** a successful search response (`res.ok` + valid JSON) with one or more items in `results`  
   **When** results are rendered  
   **Then** `#results-panel` contains a `<table class="results-table">` with header columns **First Name**, **Last Name**, **Email**, **Department**, **City** (FR7, UX-DR9)

2. **And** each body row maps API fields `firstName`, `lastName`, `email`, `department`, `city` in that column order (FR7)

3. **And** table styling uses **light horizontal dividers only** — no vertical grid lines, no `border-left`/`border-right` on cells (UX-DR7)

4. **And** every dynamic cell value is safe before DOM insertion: use **`textContent`** on `td` elements **or** an `escapeHtml()` helper applied to every value before any `innerHTML` use (FR9, EXPERIENCE.md XSS requirement)

5. **And** when `count` is **0** (successful response, empty `results`), the table has **header + empty `<tbody>`** (no data rows) and status remains **`Found 0 results.`** from Story 2.3 (unchanged microcopy)

6. **And** on **failed** search (network, non-OK HTTP, parse error), status shows the existing error microcopy and **this story does not** add new error strings; results panel is **not** updated with new rows (preserve last successful render or empty state)

7. **And** this story does **not** implement Clear reset behavior (Story 2.5) or change status/fetch URL logic owned by Story 2.3

## Tasks / Subtasks

- [x] Add results table CSS to `styles.css` (AC: #3)
  - [x] Port `.results-table` rules from glassmorphism direction mock (horizontal `border-bottom` on `th`/`td` only)
  - [x] `width: 100%`, `border-collapse: separate`, `border-spacing: 0`
  - [x] **No** vertical borders on `th`/`td`
  - [x] Optional: `#results-panel` padding `0` + `overflow: hidden` when table present (matches mock glass card)
- [x] Implement `renderResults(results)` in `app.js` (AC: #1–#2, #4–#6)
  - [x] Target `#results-panel` only — build table in JS (static `index.html` must stay **without** `<table` per shell-spec)
  - [x] Column order: firstName → lastName → email → department → city
  - [x] Header labels exactly: First Name, Last Name, Email, Department, City
  - [x] Replace prior table on each **successful** render (`results-panel` cleared/rebuilt)
  - [x] Treat missing/null fields as `""` before display
- [x] Wire render after successful `fetch` in `runSearch()` (AC: #1, #5–#6)
  - [x] After `statusEl.textContent = STATUS.success(count)`, call `renderResults(data.results ?? [])`
  - [x] Do **not** call `renderResults` in `catch` or when `!res.ok`
  - [x] Optional: clear `#results-panel` at start of loading to avoid stale rows during fetch
- [x] XSS protection (AC: #4) — choose **one** approach and use consistently:
  - [x] **Preferred:** `document.createElement` + `td.textContent = String(value)` (no `innerHTML` in `app.js`)
  - [ ] **Alternate:** `escapeHtml(str)` mapping `& < > " '` then template — only if you must use `innerHTML` on a container
- [x] Extend `sg-search/test/shell-spec.test.js` (AC: #1–#4)
  - [x] Assert `app.js` references `results-panel` and `results-table`
  - [x] Assert column field names `firstName`, `lastName`, `email`, `department`, `city`
  - [x] Assert XSS-safe pattern: `textContent` on cells **or** `escapeHtml` function present
  - [x] Keep `index.html` without `<table`
  - [x] Keep status microcopy assertions from Story 2.3
- [x] Manual verification (AC: #1–#6)
  - [x] Backend on 3001 + frontend on 3000; search `firstName=John` → table with 3 rows + `Found 3 results.` — **blocked:** `server.js` lacks `/api/search` (Epic 1.4 not on disk); success path covered by shell-spec + code review
  - [x] Search with no matches → empty tbody + `Found 0 results.` — **blocked** (same); `renderResults([])` builds header + empty tbody per implementation
  - [x] Temporarily add CSV row with `firstName` = `<script>alert(1)</script>` → cell shows literal text, no alert — **blocked** (same); `td.textContent` path enforced in tests (no `innerHTML`)
  - [x] Confirm no vertical grid lines in DevTools computed styles — verified via CSS (horizontal `border-bottom` only; no `border-left`/`border-right` on cells)
  - [x] Stop backend → error status; table unchanged from last success — verified by code path (`renderResults` only on success; panel cleared on load, not on error)

## Dev Notes

### Critical: Ignore Stale Architecture Artifacts

`architecture.md` describes a **superseded Task Manager** (React 19, Zustand, Tailwind). **Do not follow it.**

| Source | Role for this story |
|--------|---------------------|
| `epics.md` | Primary contract (Story 2.4 AC, FR7, FR9, UX-DR7, UX-DR9) |
| `2-3-connect-async-search-to-backend-api.md` | `runSearch()`, `STATUS`, API consumer contract, scope boundaries |
| `2-2-implement-search-form-and-status-area.md` | Stable IDs, `#results-panel` placeholder |
| `ux-designs/.../direction-glassmorphism.html` | Table CSS reference (selected direction) |
| `ux-designs/.../DESIGN.md` | Table: horizontal dividers only |
| `ux-designs/.../EXPERIENCE.md` | XSS + tabular results IA |

### Story Scope Boundary (2.4 vs 2.3 vs 2.5)

| In scope (2.4) | Owned elsewhere |
|----------------|-----------------|
| Render `<table>` into `#results-panel` on **success** | `fetch`, status microcopy, empty-field guard (2.3) |
| FR7 columns + UX-DR7 styling | Clear empties fields + clears table (2.5) |
| FR9 safe cell rendering | Backend `/api/search` (Epic 1.4) |
| Use `data.results` array from API | CORS (Epic 1.5) |

**Do not** change `SEARCH_API`, `STATUS` strings, or `fetch` error handling except to **invoke** `renderResults` on the success branch.

### Current Codebase State (READ BEFORE EDITING)

**Update only `sg-search/`** — do not modify `sg-search-service/` in this story.

| File | Current state | This story changes |
|------|---------------|-------------------|
| `sg-search/app.js` | Async `runSearch()` sets status only; no table | Add `renderResults()`, call on success |
| `sg-search/index.html` | `#results-panel` empty comment placeholder | **No `<table` in HTML** — build in JS |
| `sg-search/styles.css` | Form + glass shell; no table rules | Add `.results-table` block |
| `sg-search/test/shell-spec.test.js` | Forbids `<table` in `index.html`; forbids `innerHTML` in `app.js` | Add table/XSS assertions; keep `index.html` no-table rule |

**Stable IDs (do not rename):**

- `#results-panel` — mount point for dynamic table
- `#status-message` — **read-only** for this story (2.3 owns updates)
- `#search-form`, `#firstName`, `#lastName`, `#btn-clear` — unchanged; Clear still inert until 2.5

### API Result Shape (Consumer — from Story 1.4 / 2.3)

```json
{
  "count": 3,
  "results": [
    {
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com",
      "department": "Engineering",
      "city": "Seattle"
    }
  ]
}
```

| Field | Table column |
|-------|----------------|
| `firstName` | First Name |
| `lastName` | Last Name |
| `email` | Email |
| `department` | Department |
| `city` | City |

Use `Array.isArray(data.results) ? data.results : []` before rendering. Row count should match `count` when API is correct; render **all** items returned in `results` (do not slice by `count`).

### Reference Implementation Sketch (`app.js`)

Adapt naming; prefer DOM APIs (keeps `innerHTML` ban from 2.3 tests):

```javascript
const RESULT_COLUMNS = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "department", label: "Department" },
  { key: "city", label: "City" },
];

function renderResults(results) {
  const panel = document.getElementById("results-panel");
  if (!panel) return;

  panel.replaceChildren();

  const table = document.createElement("table");
  table.className = "results-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const col of RESULT_COLUMNS) {
    const th = document.createElement("th");
    th.textContent = col.label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const row of results) {
    const tr = document.createElement("tr");
    for (const col of RESULT_COLUMNS) {
      const td = document.createElement("td");
      const raw = row?.[col.key];
      td.textContent = raw == null ? "" : String(raw);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  panel.appendChild(table);
}
```

**Success branch in `runSearch()` (after status update):**

```javascript
const data = await res.json();
const count = typeof data.count === "number" ? data.count : 0;
statusEl.textContent = STATUS.success(count);
renderResults(Array.isArray(data.results) ? data.results : []);
```

### Optional `escapeHtml` (only if not using `textContent`)

```javascript
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

Lab teaching moment: `textContent` assigns escaped text automatically; `innerHTML` with raw `results` values is an XSS footgun.

### Table CSS (from `direction-glassmorphism.html`)

Add to `styles.css` (tune colors to existing tokens):

```css
#results-panel--with-table {
  padding: 0;
  overflow: hidden;
}

.results-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.results-table th {
  text-align: left;
  padding: 16px 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.results-table td {
  padding: 18px 20px;
  font-size: 0.9375rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.results-table tbody tr:last-child td {
  border-bottom: none;
}

.results-table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.3);
}
```

Apply `#results-panel` zero padding via class toggle in `renderResults` or a permanent rule when panel has a child table. **Do not** add `border-left` / `border-right` / `border: 1px solid` on cells (violates UX-DR7).

### XSS Manual Test Procedure

1. Add a row to `sg-search-service/users.csv` (or test CSV) with malicious content, e.g. `firstName` = `<img src=x onerror=alert(1)>`.
2. Restart backend; search for that name.
3. **Pass:** literal characters visible in table; **Fail:** script executes or HTML renders as active content.

### Architecture Compliance

- **NFR9:** Vanilla JS DOM APIs only.
- **NFR3:** Small focused diff — one render helper + CSS block; no utilities folder unless `app.js` grows past ~150 lines.
- **FR7:** Five columns in specified order.
- **FR9:** Safe rendering — `textContent` preferred.
- **FR8:** Status strings unchanged (owned by 2.3).
- **FR6:** No page reload.

### File Structure Requirements

```text
sg-search/
├── app.js                      # UPDATE — renderResults + success hook
├── styles.css                  # UPDATE — .results-table
└── test/
    └── shell-spec.test.js      # UPDATE — table + XSS contract
```

**Do not** add npm dependencies.

### Testing Requirements

**Automated (required):**

```bash
cd sg-search && npm test
```

Suggested `shell-spec.test.js` additions:

- `app.js` contains `results-panel` and `results-table`
- `app.js` contains all five API keys: `firstName`, `lastName`, `email`, `department`, `city`
- `app.js` contains `textContent` (preferred) **or** `escapeHtml`
- `index.html` still `doesNotMatch(/<table/i)`
- Existing 2.3 assertions still pass (fetch, microcopy, no `innerHTML` if using `textContent` approach)

**Manual (required for story done):**

1. `firstName=John` → 3 rows, five columns, horizontal dividers only.
2. No-match query → header visible, zero body rows, `Found 0 results.`
3. Malicious CSV cell → escaped/literal display, no script execution.
4. Failed backend → error status; table not corrupted with partial HTML.
5. Second successful search replaces first table (no duplicate tables).

### Previous Story Intelligence (2.3)

- `runSearch()` already sets `Found ${count} results.` using API `count` — **do not** recompute status in 2.4.
- `app.js` forbids `innerHTML` in tests — use **`textContent`** on `td` to stay compliant.
- `#results-panel` comment: `<!-- Results table: Story 2.4 -->` — replace contents, not the section element.
- Empty search (both fields blank) returns early — panel untouched (correct).
- Manual E2E may still need Epic 1.4/1.5 in `server.js` — verify working tree before blaming 2.4.

### Previous Story Intelligence (2.2 / 2.1)

- Glass card, 800px layout, `#0071e3` accent — table styling should harmonize, not redesign the shell.
- `#btn-clear` remains without handler until 2.5.

### Git Intelligence

- Latest commit: `3aad37e initial commit` — Epic 2 work may exist only in working tree; **on-disk `sg-search/*` + story files are truth**.

### Latest Technical Information

- **DOM XSS:** Assigning user data via `element.textContent` prevents HTML/script interpretation. [MDN textContent](https://developer.mozilla.org/en-US/docs/Web/API Node/textContent)
- **`replaceChildren()`:** Clears and repopulates `#results-panel` without `innerHTML`. [MDN replaceChildren](https://developer.mozilla.org/en-US/docs/Web/API/Element/replaceChildren)
- **Tables for data:** Use semantic `<table>`, `<thead>`, `<tbody>` for screen readers (UX-DR9 results region).

### Project Context Reference

- No `project-context.md` in repo. Binding: this story + `epics.md` + UX `DESIGN.md` / `EXPERIENCE.md` + `2-3` story + current `sg-search/*`.

### Anti-Patterns (Will Fail Review)

- Putting static `<table>` in `index.html` (breaks shell-spec and story 2.3 contract).
- `tbody.innerHTML += \`<td>${row.firstName}</td>\`` with unescaped API data (FR9 violation).
- Using `innerHTML` for convenience while leaving 2.3 test `doesNotMatch(/innerHTML/)` — switch test only if escape path is proven; prefer `textContent`.
- Changing status microcopy or `fetch` URL/port.
- Implementing Clear reset (2.5).
- Vertical cell borders or full grid border (UX-DR7).
- Wrong column order or camelCase headers shown to users (use human labels in `<th>`).
- Following `architecture.md` React/Vite structure.
- Modifying `sg-search-service/` in this frontend story.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.4, FR7, FR9, UX-DR7, UX-DR9]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/.working/direction-glassmorphism.html — .results-table CSS]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/DESIGN.md — Table dividers]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/EXPERIENCE.md — XSS, results IA]
- [Source: _bmad-output/implementation-artifacts/2-3-connect-async-search-to-backend-api.md — fetch + status scope]
- [Source: sg-search/app.js, index.html, styles.css, test/shell-spec.test.js — current implementation]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

### Implementation Plan

- Red-green-refactor: extended `shell-spec.test.js` first, then `renderResults()` + `.results-table` CSS + success-branch wiring in `app.js`.
- XSS: DOM `createElement` + `td.textContent` only (no `innerHTML`; shell-spec enforces).
- Panel: `replaceChildren()` + `results-panel--with-table` class for zero padding when table mounted.
- Loading: `clearResultsPanel()` at search start to avoid stale rows during fetch; errors do not call `renderResults`.

### Completion Notes List

- Added `RESULT_COLUMNS`, `renderResults()`, `clearResultsPanel()`; wired `renderResults` after successful `fetch` in `runSearch()`.
- Added `.results-table` styles (horizontal dividers only, glassmorphism-aligned tokens).
- Extended shell-spec: table/XSS/column contract, CSS table rules, no vertical borders.
- `npm test` in `sg-search` passes.
- Browser E2E (John search, XSS CSV row) blocked until Epic 1.4 `/api/search` is present in `sg-search-service/server.js` (same constraint as Story 2.3).

### File List

- sg-search/app.js (modified)
- sg-search/styles.css (modified)
- sg-search/test/shell-spec.test.js (modified)

## Change Log

- 2026-06-04: Story 2.4 — results table rendering with XSS-safe `textContent`, glass table CSS, shell-spec contract tests

## Story Completion Status

- **Status:** review
- **Completion note:** Ultimate context engine analysis completed - comprehensive developer guide created
- **Next story after done:** `2-5-implement-clear-and-form-reset`
