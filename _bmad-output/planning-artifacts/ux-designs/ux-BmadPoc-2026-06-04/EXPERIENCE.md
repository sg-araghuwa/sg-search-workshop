---
title: BmadPoc Search Application User Experience (EXPERIENCE.md)
status: draft
created: 2026-06-04
updated: 2026-06-04
---

# User Experience & Interaction Specifications (EXPERIENCE.md)

## 1. Foundation
- **Form-Factor**: Desktop-first web application, optimized for local IDE-based browser preview (`http://127.0.0.1:3000`).
- **UI System**: Vanilla HTML5, CSS3, and ES6 JavaScript. No external UI libraries or frameworks (e.g., Tailwind, Bootstrap) are used to keep the 30-minute lab lightweight and zero-config.
- **Visual Identity**: Inherits all tokens and styles from `DESIGN.md`. Features a **Vibrant Dark-Mode Tech** aesthetic.

## 2. Information Architecture
The application is a single-page interface centered around a single functional card:
- **Header**: Title "LAB-03: Full-Stack User Search" in bold electric blue, and a brief sub-headline.
- **Search Form**: Two text inputs (First Name, Last Name) arranged horizontally with an active "Search" and "Clear" button group below.
- **Status Area**: A dynamic text block below the form displaying current state (e.g., "Enter search criteria", "Searching...", "Found 3 results", or error messages) with animated transitions.
- **Results Table**: A tabular display of matched users, hidden initially and shown only when results are available. Features smooth row transitions and hover states.

## 3. Voice and Tone
- **Microcopy**: Professional, concise, and helpful.
- **Status Messages**:
  - *Initial*: "Enter First Name or Last Name to search."
  - *Loading*: "Searching local database..."
  - *Success*: "Found {count} matching user(s)."
  - *No Results*: "No matching users found. Try different criteria."
  - *Error*: "Error: At least one search parameter is required."

## 4. Component Patterns
- **Inputs**:
  - Placeholder text: "e.g., John" and "e.g., Smith".
  - Pressing `Enter` while focused on either input triggers the search form submission.
  - Focus state: Smooth 0.2s transition to glowing electric blue border (`#3B82F6`) and subtle shadow.
- **Buttons**:
  - Hover states: Smooth background color and glow transition (0.2s cubic-bezier(0.4, 0, 0.2, 1)).
  - Active (Click) states: Tactile feedback via scaling (`transform: scale(0.97)`).
  - Focus states: Clear outline ring for keyboard accessibility.
- **Results Table**:
  - Columns: First Name, Last Name, Email, Department, City.
  - Safe rendering: All cells are populated using `document.createElement` and `textContent` to escape HTML characters.
  - Row Hover: Highlights the row with a smooth background color shift (`#334155`) and slides in a left-side emerald accent border (`#10B981`).

## 5. State Patterns
1. **Empty/Initial State**: Form is empty, status message is "Enter First Name or Last Name to search" in cool gray, and the table is completely hidden.
2. **Loading State**: Inputs and buttons are disabled, status message is "Searching local database..." with a pulsing fade animation, and a glowing blue progress bar or pulsing skeleton is shown.
3. **Results State**: Inputs/buttons re-enabled, status message displays "Found X matching user(s)" in vibrant emerald, and the table is visible with populated rows appearing with a subtle fade-in animation.
4. **No Results State**: Inputs/buttons re-enabled, status message displays "No matching users found. Try different criteria" in cool gray, and the table is hidden.
5. **Error State**: Status message displays the error in red text (`{colors.error}`), and the table is hidden.

## 6. Interaction Primitives
- **Keyboard Navigation**:
  - `Tab` navigates sequentially through First Name -> Last Name -> Search -> Clear.
  - `Enter` submits the form.
  - `Escape` clears the form and resets the state.

## 7. Accessibility Floor
- **Semantic HTML**: Uses `<main>`, `<form>`, `<label>`, `<input>`, `<button>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`.
- **Labels**: Every input has an associated `<label>` element with a matching `for` attribute.
- **Contrast**: Text colors meet WCAG AA contrast guidelines against their respective backgrounds.

## 8. Key Flows

### UJ-1. Searching for Users
- **Protagonist**: Dave, a developer testing the app.
- **Action**: Dave enters "John" in the First Name input and clicks "Search".
- **Interaction**:
  1. Frontend intercepts form submission, prevents page reload.
  2. Status updates to "Searching local database...".
  3. Frontend sends `GET http://127.0.0.1:3001/api/search?firstName=John&lastName=` via `fetch`.
  4. On successful response (HTTP 200), frontend parses JSON, updates status to "Found 3 matching user(s)", clears existing table rows, builds new rows safely, and displays the table.
- **Climax**: Dave sees exactly 3 rows in the table with "John" as the first name.

### UJ-2. Clearing Search
- **Action**: Dave clicks the "Clear" button.
- **Interaction**:
  1. Inputs are cleared.
  2. Status resets to "Enter First Name or Last Name to search."
  3. Results table is hidden, and all rows are removed from the DOM.
