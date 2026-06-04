---
status: draft
project: AI_POC_Lab4
updated: 2026-06-03
---

# EXPERIENCE.md - AI_POC_Lab4 Search App

## Foundation
- **Form Factor**: Desktop Web (1280px+ optimized).
- **UI System**: Vanilla HTML/CSS/JS (no frameworks).
- **Visual Reference**: {DESIGN.md} (Apple-inspired aesthetic).

## Information Architecture
- **Search Surface**: 
  - Header: Lab Title & Instructions.
  - Search Form: Input fields for `firstName` and `lastName`.
  - Actions: `Search` (Primary), `Clear` (Secondary).
  - Status: Inline feedback area for loading and result counts.
  - Results: Tabular display of user data.

## Voice and Tone
- **Tone**: Professional, technical, and encouraging (for the developer building it).
- **Microcopy**:
  - Empty State: "Enter a name to begin searching."
  - Loading: "Searching database..."
  - Success: "Found {n} results."
  - Error: "Search failed. Please check the backend connection."

## Interaction Primitives
- **Async Search**: Triggered by button click or `Enter` key. Updates the results table without page reload.
- **Form Reset**: The `Clear` button clears inputs and removes the results table/status message.
- **XSS Protection**: All data rendered in the table must be escaped.

## Key Flows

### 1. The Quick Search (Protagonist: Alex, a new developer)
Alex is running the lab and wants to verify the search works.
1. Alex enters "John" in the First Name field.
2. Alex presses `Enter`.
3. The status message changes to "Searching...".
4. Within 100ms, the table populates with 3 rows of "Johns".
5. Alex sees "Found 3 results" and feels a sense of accomplishment. **[CLIMAX]**

### 2. The Reset
Alex wants to try a different search.
1. Alex clicks the "Clear" button.
2. The form fields empty immediately.
3. The results table and status message disappear, returning the app to its initial clean state.
