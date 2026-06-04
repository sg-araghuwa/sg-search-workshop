---
stepsCompleted: [1, 2, 3, 4]
status: complete
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-AI_POC_Lab4-2026-06-03/prd.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-AI_POC_Lab4-2026-06-03/EXPERIENCE.md"
---

# AI_POC_Lab4 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AI_POC_Lab4, decomposing the requirements from the PRD, UX Design, and lab technical constraints into implementable stories.

**Scope note:** Architecture.md and tech-stack.md describe a prior Task Manager concept and are excluded. This breakdown targets the Search App Hands-on Lab per PRD and UX specs.

## Requirements Inventory

### Functional Requirements

FR1: The backend shall expose `GET /api/search?firstName=&lastName=` returning JSON `{ count, results[] }`.
FR2: Search matching shall be case-insensitive; provided fields only shall be matched; empty parameters shall act as wildcards; HTTP 400 shall be returned when all parameters are missing.
FR3: The backend shall expose `GET /health` returning HTTP 200 with `status: ok`.
FR4: The backend shall enable CORS for requests originating from port 3000 (frontend).
FR5: The frontend shall provide a search form with First Name and Last Name fields.
FR6: The frontend shall support Search via async fetch and Clear to reset form and results, with no full page reloads.
FR7: The frontend shall display search results in a table with columns: firstName, lastName, email, department, city.
FR8: The frontend shall display a status area showing "Searching..." during fetch and "Found N results" or error messages on completion.
FR9: The frontend shall escape all dynamic output rendered in the results table to prevent XSS.
FR10: The project shall include `LAB-03-Search-App-Guide.md` written for a Senior Developer/Architect audience.
FR11: The project shall include `setup-lab.ps1` and `verify-lab.ps1` Windows PowerShell scripts.
FR12: The project shall include VS Code `launch.json` for debugging backend and frontend.
FR13: The project shall document GitHub commit steps including manual `git remote add` fallback when `gh` CLI is unavailable.

### NonFunctional Requirements

NFR1: Time to First Success (first visible search result) shall be under 15 minutes for lab participants.
NFR2: Lab completion rate target shall exceed 90% within the 30-minute lab window.
NFR3: Complexity guard — avoid "best practice" additions that increase code size by more than 20%.
NFR4: Runtime shall be Node.js v18 or newer.
NFR5: Frontend shall run on port 3000; backend shall run on port 3001.
NFR6: Lab scripts and instructions shall target Windows PowerShell.
NFR7: No authentication or authorization shall be implemented.
NFR8: Data storage shall be CSV file only (no persistent database).
NFR9: Frontend shall use Vanilla HTML/CSS/JS only (no React or other UI frameworks).
NFR10: Deployment shall be localhost only (no cloud hosting).

### Additional Requirements

- **Packages:** Implement `sg-search-service` (Express API) and `sg-search` (Vanilla JS UI) as separate deliverables.
- **CSV data:** Learners create `users.csv` manually to understand structure; parse via string-split or `csv-parse` for low boilerplate.
- **Static serving:** Frontend must be served over HTTP (e.g. `npx serve`), not `file://`, to avoid fetch failures.
- **CLI assumptions:** `gh` CLI assumed available; documentation must include manual `git` fallbacks.
- **Troubleshooting:** Document fixes for CORS (`app.use(cors())`), port conflicts (`$env:PORT=3002`), and fetch/CORS from `file://`.
- **Excluded:** React 19, Zustand, Tailwind, task-manager architecture from prior artifacts.

### UX Design Requirements

UX-DR1: Visual identity shall follow Apple.com-inspired clarity with **Glassmorphism** as the selected direction (soft blurs, translucent cards, airy feel).
UX-DR2: Implement color tokens — soft gradient background (#f5f5f7 to #ffffff), glass card `rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(20px)`, text `#1d1d1f`, accent `#0071e3`, semi-transparent white borders `rgba(255, 255, 255, 0.3)`.
UX-DR3: Typography shall use system-ui / -apple-system stack at 17px base, semi-bold headings with tight tracking, body line-height 1.5.
UX-DR4: Layout shall be centered single-column with max-width 800px, card padding 24–32px, and clear vertical rhythm between sections.
UX-DR5: Border radius 12px for cards/containers and 8px for buttons/inputs; subtle soft shadows only.
UX-DR6: Inputs shall be large with subtle borders and focus glow; primary buttons solid accent blue with white text; secondary buttons ghost or light gray.
UX-DR7: Results table shall use light horizontal dividers only (no vertical grid lines).
UX-DR8: Form factor shall target desktop web at 1280px and above.
UX-DR9: Information architecture shall include header (lab title/instructions), search form, inline status, and results table.
UX-DR10: Microcopy — empty: "Enter a name to begin searching."; loading: "Searching database..."; success: "Found {n} results."; error: "Search failed. Please check the backend connection."
UX-DR11: Pressing Enter in a search field shall trigger the same async search as the Search button.
UX-DR12: Clear shall empty inputs and remove results table and status message immediately.
UX-DR13: Use generous whitespace; avoid heavy borders, clashing colors, and overcrowded layout.

### FR Coverage Map

FR1: Epic 1 — Story 1.4 (Search API endpoint)
FR2: Epic 1 — Story 1.4 (Search filtering rules)
FR3: Epic 1 — Story 1.3 (Health check)
FR4: Epic 1 — Story 1.5 (CORS configuration)
FR5: Epic 2 — Story 2.2 (Search form)
FR6: Epic 2 — Stories 2.3, 2.5 (Async search and Clear)
FR7: Epic 2 — Story 2.4 (Results table)
FR8: Epic 2 — Stories 2.2, 2.3 (Status area)
FR9: Epic 2 — Story 2.4 (XSS escaping)
FR10: Epic 3 — Story 3.3 (Lab guide)
FR11: Epic 3 — Stories 3.1, 3.2 (PowerShell scripts)
FR12: Epic 3 — Story 3.4 (VS Code launch.json)
FR13: Epic 3 — Story 3.5 (GitHub workflow docs)

## Epic List

### Epic 1: Search API Service
A lab developer can query user records from a running Express API with correct filtering, health verification, and CORS for the frontend.
**FRs covered:** FR1, FR2, FR3, FR4

### Epic 2: Search Web Experience
A lab developer can search by name in the browser with a glassmorphism UI, see results and status feedback, and interact safely without page reloads.
**FRs covered:** FR5, FR6, FR7, FR8, FR9 | **UX-DRs covered:** UX-DR1 through UX-DR13

### Epic 3: Lab Tooling & Facilitation
A facilitator and developer can set up, verify, debug, and complete the lab using scripts, documentation, and IDE tooling.
**FRs covered:** FR10, FR11, FR12, FR13

## Epic 1: Search API Service

Lab developers can run a local Express service that reads `users.csv`, exposes health and search endpoints, and accepts cross-origin requests from the lab frontend.

### Story 1.1: Initialize Express Search Service

As a lab developer,
I want a scaffolded `sg-search-service` Express project with sample `users.csv`,
So that I can start backend development without manual project wiring.

**Acceptance Criteria:**

**Given** the `sg-search-service` folder does not exist or is empty
**When** the project is initialized per lab conventions
**Then** it contains `package.json`, `server.js` (or entry), and a sample `users.csv` with headers matching PRD fields (firstName, lastName, email, department, city)
**And** `npm start` launches the server on port 3001 by default (NFR5)
**And** Node.js v18+ is documented as the minimum runtime (NFR4)
**And** no authentication middleware is added (NFR7)

### Story 1.2: Load and Parse CSV User Data

As a lab developer,
I want the service to load `users.csv` into memory at startup,
So that search requests can filter records without a database.

**Acceptance Criteria:**

**Given** a valid `users.csv` exists in the service directory
**When** the server starts
**Then** all rows are parsed into an in-memory array of user objects
**And** parsing uses string-split or `csv-parse` with minimal boilerplate (NFR3)
**And** a missing or malformed CSV produces a clear startup error in the console
**And** no database or ORM is introduced (NFR8)

### Story 1.3: Implement Health Check Endpoint

As a lab developer,
I want a `GET /health` endpoint,
So that I can confirm the API is running before testing search.

**Acceptance Criteria:**

**Given** the server is running
**When** a client sends `GET /health`
**Then** the response status is 200
**And** the JSON body includes `status: "ok"` (FR3)

### Story 1.4: Implement Search API with Filtering Rules

As a lab developer,
I want a `GET /api/search` endpoint with firstName and lastName query parameters,
So that I can retrieve matching users as JSON for the frontend.

**Acceptance Criteria:**

**Given** the server has loaded user records from CSV
**When** a client calls `GET /api/search?firstName=john` (case variants included)
**Then** the response is JSON `{ count, results[] }` where each result includes firstName, lastName, email, department, city (FR1)
**And** matching is case-insensitive (FR2)
**And** only provided query fields are used for filtering; omitted fields act as wildcards (FR2)
**And** when both `firstName` and `lastName` are missing or empty, the API returns HTTP 400 with a clear error message (FR2)
**And** `results` contains only matching records and `count` equals `results.length`

### Story 1.5: Enable CORS for Lab Frontend

As a lab developer,
I want CORS configured for the frontend origin,
So that browser fetch calls from port 3000 succeed during the lab.

**Acceptance Criteria:**

**Given** the Express app is running on port 3001
**When** a browser on `http://localhost:3000` calls `/api/search` or `/health`
**Then** the response includes appropriate CORS headers and the request succeeds (FR4)
**And** `cors` middleware is applied in `server.js` (troubleshooting requirement)
**And** the service remains localhost-only with no cloud deployment (NFR10)

## Epic 2: Search Web Experience

Lab developers can use a single-page Vanilla JS search UI with Apple-inspired glassmorphism styling, async search, and safe rendering of results.

### Story 2.1: Build Glassmorphism Page Shell

As a lab developer,
I want the search page layout and global styles applied,
So that the UI matches the approved visual direction before adding behavior.

**Acceptance Criteria:**

**Given** the `sg-search` frontend package exists
**When** the page is opened at 1280px viewport width or wider
**Then** the layout is a centered single column with max-width 800px (UX-DR4, UX-DR8)
**And** the page uses a soft gradient background and glass card with `backdrop-filter: blur(20px)` per DESIGN tokens (UX-DR1, UX-DR2)
**And** typography uses the system-ui stack at 17px base with semi-bold headings (UX-DR3)
**And** cards use 12px radius and buttons/inputs use 8px radius with subtle shadows (UX-DR5)
**And** the header shows lab title and brief instructions above the search area (UX-DR9)
**And** only Vanilla HTML/CSS/JS is used with no UI frameworks (NFR9)
**And** whitespace is generous without overcrowding (UX-DR13)

### Story 2.2: Implement Search Form and Status Area

As a lab developer,
I want First Name and Last Name fields with Search, Clear, and a status region,
So that I have the core interaction surface for the lab.

**Acceptance Criteria:**

**Given** the glassmorphism shell from Story 2.1
**When** the page loads with no prior search
**Then** First Name and Last Name inputs and Search (primary) and Clear (secondary) controls are visible (FR5, UX-DR6)
**And** the status area shows "Enter a name to begin searching." (UX-DR10)
**And** inputs have focus glow styling and buttons follow primary/secondary styles (UX-DR6)
**And** clicking Search does not reload the page (FR6)

### Story 2.3: Connect Async Search to Backend API

As a lab developer,
I want Search and Enter to fetch results from the API without reloading,
So that I can verify end-to-end search during the lab.

**Acceptance Criteria:**

**Given** the backend is running on port 3001 and the frontend is served over HTTP on port 3000 (not `file://`)
**When** the user clicks Search or presses Enter in a name field (UX-DR11)
**Then** the status shows "Searching database..." during the request (UX-DR10, FR8)
**And** on success the status shows "Found {n} results." where n matches the API count (UX-DR10, FR8)
**And** on network or server failure the status shows "Search failed. Please check the backend connection." (UX-DR10, FR8)
**And** the page does not perform a full reload at any point (FR6, NFR5)
**And** fetch targets `http://localhost:3001/api/search` with current field values as query params (FR1 integration)

### Story 2.4: Render Results Table with XSS Protection

As a lab developer,
I want search hits displayed in a clean table with escaped values,
So that I can read results safely even if CSV data contains HTML-like characters.

**Acceptance Criteria:**

**Given** a successful search response with one or more results
**When** results are rendered
**Then** a table displays columns firstName, lastName, email, department, city (FR7)
**And** the table uses horizontal dividers only with no vertical grid lines (UX-DR7)
**And** every cell value is HTML-escaped before insertion into the DOM (FR9)
**And** when count is zero, the table is empty and status still reflects "Found 0 results."

### Story 2.5: Implement Clear and Form Reset

As a lab developer,
I want Clear to reset the form and UI state instantly,
So that I can run another search without refreshing the page.

**Acceptance Criteria:**

**Given** the form has values and/or results and status from a prior search
**When** the user clicks Clear
**Then** First Name and Last Name fields are emptied immediately (UX-DR12, FR6)
**And** the results table and status message are removed or reset to the initial empty prompt (UX-DR12, FR6)
**And** no full page reload occurs (FR6)

## Epic 3: Lab Tooling & Facilitation

Facilitators and developers can bootstrap, verify, debug, and document completion of the Search App lab on Windows.

### Story 3.1: Create setup-lab.ps1 Bootstrap Script

As a facilitator,
I want a one-command lab setup script,
So that developers reach a runnable environment quickly (NFR1, NFR6).

**Acceptance Criteria:**

**Given** a Windows machine with Node.js v18+ installed
**When** `setup-lab.ps1` is executed from the project root in PowerShell
**Then** dependencies for `sg-search-service` and `sg-search` are installed
**And** a sample or template `users.csv` is present where the lab expects it
**And** the script prints next steps to start backend (3001) and frontend (3000) (NFR5, FR11)
**And** the script avoids optional complexity beyond lab needs (NFR3)

### Story 3.2: Create verify-lab.ps1 Validation Script

As a facilitator,
I want an automated verification script,
So that I can confirm the lab environment works before or after the session (NFR2).

**Acceptance Criteria:**

**Given** backend and frontend are started per lab instructions
**When** `verify-lab.ps1` runs in PowerShell
**Then** it checks `GET /health` returns 200 with `status: ok`
**And** it performs a sample `GET /api/search` and confirms JSON with `count` and `results`
**And** it reports pass/fail with actionable error messages (FR11)
**And** failures reference troubleshooting fixes (CORS, port conflict, `file://` serving)

### Story 3.3: Author LAB-03-Search-App-Guide.md

As a lab developer,
I want a step-by-step guide in Senior Developer/Architect tone,
So that I can complete the lab within the 30-minute window (NFR1, NFR2).

**Acceptance Criteria:**

**Given** the guide file `LAB-03-Search-App-Guide.md` exists
**When** a developer follows it sequentially
**Then** it covers setup, backend (05–15 min), frontend (15–25 min), and wrap-up (25–30 min) per PRD timing cheatsheet (FR10)
**And** it documents CORS, port override (`$env:PORT=3002`), and `npx serve` vs `file://` troubleshooting
**And** it instructs manual `users.csv` creation to teach data structure
**And** tone is expert, concise, and encouraging without exceeding complexity guard (NFR3)

### Story 3.4: Add VS Code launch.json Debug Configurations

As a lab developer,
I want VS Code debug configurations for backend and frontend,
So that I can set breakpoints during the lab (FR12).

**Acceptance Criteria:**

**Given** a `.vscode/launch.json` in the workspace
**When** the developer starts the "Search API" configuration
**Then** Node attaches to `sg-search-service` on port 3001
**And** a separate configuration launches or attaches to the frontend served on port 3000
**And** configurations are documented in the lab guide

### Story 3.5: Document GitHub Commit Workflow with Fallbacks

As a lab developer,
I want documented GitHub commit steps including manual remote setup,
So that I can finish the lab even without the `gh` CLI (FR13).

**Acceptance Criteria:**

**Given** the lab guide or a linked doc section on Git workflow
**When** the developer follows GitHub commit instructions
**Then** steps cover `git add`, `git commit`, and push using `gh` when available
**And** manual `git remote add origin <url>` and `git push -u origin main` fallback steps are included when `gh` is unavailable (FR13)
**And** no secrets or credentials are hard-coded in scripts or docs
