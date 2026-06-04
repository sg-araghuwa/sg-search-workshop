---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-BmadPoc-2026-06-04/prd.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-BmadPoc-2026-06-04/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-BmadPoc-2026-06-04/EXPERIENCE.md"
workflowType: 'architecture'
project_name: 'BmadPoc'
user_name: 'BmadPoc'
date: '2026-06-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The application requires a lightweight full-stack search application composed of a Vanilla HTML/CSS/JS frontend (`sg-search`) and a Node.js + Express backend (`sg-search-service`). The backend reads from a local `users.csv` file acting as a mock database. The system must support case-insensitive search by first name, last name, or both (AND search), with wildcard matching for empty parameters. It must return HTTP 400 if both parameters are missing. It must also expose a health check endpoint and enable CORS. The frontend must provide a responsive, single-page search form with Search/Clear buttons, dynamic status messages, and an XSS-safe results table.

**Non-Functional Requirements:**
- **Performance**: Instantaneous local response times (<100ms) with smooth CSS transitions (0.2s cubic-bezier) for a highly reactive feel.
- **Security**: XSS-safe DOM rendering using `textContent` to escape user-supplied CSV data, and CORS configuration restricted to the local frontend port.
- **Usability**: Extremely low-boilerplate stack to fit within a tight 30-minute lab window, with clear status messages and tactile interactive states (scaling buttons, glowing inputs, row hover effects).
- **Portability**: All terminal commands and scripts must be fully compatible with Windows PowerShell.

**Scale & Complexity:**
- Primary domain: Local Full-Stack Web Application
- Complexity level: Low (Hands-on training lab)
- Estimated architectural components: 2 (Frontend static server + Backend Express API)

### Technical Constraints & Dependencies
- **Node.js Environment**: Requires Node.js installed locally.
- **Port Allocation**: Frontend must run on port `3000` and backend on port `3001`.
- **CSV Parsing**: Must use the standard `csv-parser` npm package for robust parsing.
- **Static Server**: Must use `serve` as a local dependency in the frontend to avoid global permission issues.
- **PowerShell Compatibility**: Setup and verification scripts (`setup-lab.ps1`, `verify-lab.ps1`) must run on Windows PowerShell.

### Cross-Cutting Concerns Identified
- **CORS Management**: Enabling cross-origin resource sharing between `http://127.0.0.1:3000` and `http://127.0.0.1:3001` without introducing security vulnerabilities.
- **XSS Protection**: Ensuring that malicious data injected into the CSV file or search fields is never executed as HTML/JS on the frontend.
- **Local Developer Experience (DX)**: Providing seamless local debugging via VS Code/Cursor launch configurations and clear automated setup/verification feedback.

## Starter Template Evaluation

### Primary Technology Domain
**Local Full-Stack Web Application** based on project requirements analysis.

### Starter Options Considered

1. **Custom Minimal Full-Stack Setup (Selected)**
   - **Description**: A custom-crafted, low-boilerplate full-stack workspace consisting of two independent, lightweight directories: `sg-search-service` (Node.js + Express backend) and `sg-search` (Vanilla HTML/CSS/JS frontend).
   - **Pros**: Zero-config, extremely fast to set up and run (perfect for a 30-minute lab), no complex build steps or bundlers, easy for beginners to understand.
   - **Cons**: No pre-built database or authentication layers (not needed for this lab).
   - **Maintenance Status**: Custom-crafted for this lab, utilizing the latest, actively maintained packages.

2. **Vite (Vanilla JS) + Express Starter**
   - **Description**: Using Vite to scaffold the frontend (`npm create vite@latest sg-search -- --template vanilla`) and an Express template for the backend.
   - **Pros**: Hot module reloading (HMR) out of the box for the frontend, modern build tool.
   - **Cons**: Adds unnecessary bundler configuration, `node_modules` overhead, and potential build-step friction that could easily exceed the 30-minute lab execution window.

### Selected Starter: Custom Minimal Full-Stack Setup

**Rationale for Selection:**
For a tightly timed 30-minute hands-on training lab, any build-step overhead or bundler configuration is a critical risk. Scaffolding the frontend with Vanilla HTML/CSS/JS and serving it via a lightweight local `serve` dependency ensures instant startup, zero compilation time, and maximum focus on full-stack integration concepts (CORS, async fetching, DOM manipulation). For the backend, a minimal Express API with `csv-parse` provides a robust, standard, and highly readable implementation.

**Initialization Command:**
Since this is a custom minimal setup, the project is initialized by creating the directories and running standard `npm init` commands.

```powershell
# Create the parent directory
New-Item -ItemType Directory -Path "cursor-workshop-app"
cd cursor-workshop-app

# Initialize the backend service
New-Item -ItemType Directory -Path "sg-search-service"
cd sg-search-service
npm init -y
npm install express@5.2.1 csv-parse@6.2.1

# Initialize the frontend application
cd ..
New-Item -ItemType Directory -Path "sg-search"
cd sg-search
npm init -y
npm install --save-dev serve@14.2.6
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- **Runtime**: Node.js (v14+ required, v18+ recommended).
- **Language**: Vanilla ES6+ JavaScript for both frontend and backend to eliminate TypeScript compilation overhead during the 30-minute lab.

**Styling Solution:**
- **CSS**: Pure, custom CSS3 (`styles.css`) utilizing modern CSS variables for the **Vibrant Dark-Mode Tech** theme, flexbox/grid layout, and smooth cubic-bezier transitions. No external libraries or utility frameworks are required.

**Build Tooling:**
- **Frontend**: Zero build step. Served directly as static files using `serve` (v14.2.6).
- **Backend**: Zero build step. Executed directly via Node.js (`node server.js`).

**Testing Framework:**
- **Smoke Testing**: No heavy testing libraries (like Jest or Cypress) are installed to keep the setup fast. Instead, a custom PowerShell script `verify-lab.ps1` is provided to perform automated HTTP assertions against the running API.

**Code Organization:**
- **Structure**: Clear separation of concerns with a backend directory (`sg-search-service/`) and a frontend directory (`sg-search/`).
- **Data Storage**: Local read-only `users.csv` file inside the backend directory acting as the mock database.

**Development Experience:**
- **Local Server**: Frontend runs on `http://127.0.0.1:3000` via local `serve`.
- **API Server**: Backend runs on `http://127.0.0.1:3001` via Express.
- **Debugging**: Pre-configured VS Code/Cursor `launch.json` to allow F5 debugging of the Express API with breakpoints.

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Data Source**: Local `users.csv` file parsed on every request using `csv-parse` (v6.2.1).
- **CORS Handling**: Backend must enable CORS specifically for the frontend origin `http://127.0.0.1:3000` (or `*` for local simplicity).
- **Input Validation**: Backend must return HTTP 400 if both `firstName` and `lastName` query parameters are missing or empty.

**Important Decisions (Shape Architecture):**
- **XSS Protection**: Frontend must use `textContent` or `document.createElement` to safely insert dynamic data into the DOM, preventing script execution.
- **Port Allocation**: Frontend static server runs on port `3000`; Backend Express API runs on port `3001`.
- **PowerShell Compatibility**: Automation scripts (`setup-lab.ps1` and `verify-lab.ps1`) must be written in standard Windows PowerShell.

**Deferred Decisions (Post-MVP):**
- **Database Integration**: Migrating from CSV to SQLite or PostgreSQL is deferred to a future advanced lab.
- **Authentication**: Adding user login (e.g., JWT, OAuth) is deferred to a future security lab.

### Data Architecture
- **Data Source**: Local `users.csv` file.
- **Parsing Library**: `csv-parse` (v6.2.1) loaded dynamically on each search request.
- **Caching**: None. Reading the CSV file on every request ensures that any manual changes made to the CSV file by the developer during the lab are reflected instantly without restarting the server.
- **Data Schema**:
  - `firstName` (String)
  - `lastName` (String)
  - `email` (String)
  - `department` (String)
  - `city` (String)

### Authentication & Security
- **Authentication**: None. The application is public and runs entirely on `localhost`.
- **CORS Configuration**: Simple Express middleware setting the `Access-Control-Allow-Origin` header to `*` (or specifically `http://127.0.0.1:3000`) to allow cross-origin requests from the local static server.
- **XSS Prevention**: Strict frontend rule: never use `innerHTML` to render user-supplied or CSV-supplied data. All table cells must be populated using `element.textContent` or `document.createTextNode`.

### API & Communication Patterns
- **Protocol**: HTTP/1.1 REST API.
- **Endpoints**:
  - `GET /health`: Returns `{ "status": "UP" }` (HTTP 200).
  - `GET /api/search?firstName=...&lastName=...`:
    - Performs case-insensitive, wildcard-supported search.
    - If both query parameters are missing or empty, returns `{ "error": "At least one search parameter (firstName or lastName) is required." }` (HTTP 400).
    - On success, returns `{ "count": X, "results": [...] }` (HTTP 200).

### Frontend Architecture
- **State Management**: A single, global state object in `app.js` to track inputs, loading status, and search results:
  ```javascript
  const state = {
    loading: false,
    status: 'Enter First Name or Last Name to search.',
    results: []
  };
  ```
- **DOM Rendering**: Dynamic DOM manipulation using Vanilla ES6 JavaScript. The results table is hidden by default and displayed only when `state.results.length > 0`.
- **Transitions & Animations**: Custom CSS transitions (`transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`) for glowing inputs, scaling buttons, and row hovers to provide a highly reactive feel.

### Infrastructure & Deployment
- **Local Execution**: Both services run locally in integrated terminals.
- **Debugging**: Node.js debugger launch configuration in `.vscode/launch.json`:
  ```json
  {
    "version": "0.2.0",
    "configurations": [
      {
        "type": "node",
        "request": "launch",
        "name": "Debug Backend",
        "program": "${workspaceFolder}/sg-search-service/server.js",
        "cwd": "${workspaceFolder}/sg-search-service"
      }
    ]
  }
  ```
- **Automation**:
  - `setup-lab.ps1`: Automated PowerShell script to run dependency installs and print instructions.
  - `verify-lab.ps1`: Automated PowerShell script to run API assertions.

### Decision Impact Analysis

**Implementation Sequence:**
1. **Step 1: Environment & Mock Data**: Create `users.csv` and set up directories.
2. **Step 2: Backend Development**: Implement Express API, `csv-parse` logic, CORS, and parameter validation.
3. **Step 3: Frontend Development**: Implement HTML form, CSS transitions, and Vanilla JS fetch/DOM rendering logic.
4. **Step 4: Debugging & Verification**: Test with VS Code debugger and PowerShell verification script.

**Cross-Component Dependencies:**
- The frontend `app.js` depends directly on the backend's `GET /api/search` JSON structure and port `3001`.
- The backend's CSV parsing depends on the exact column headers defined in `users.csv`.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
4 areas where AI agents could make different choices: API endpoint naming, JSON/CSV schema alignment, DOM manipulation/XSS safety, and error response structures.

### Naming Patterns

**API Naming Conventions:**
- Endpoints: singular, lowercase, prefixed with `/api` for functional routes (`GET /health`, `GET /api/search`).
- Query parameters: camelCase (`firstName`, `lastName`).

**Code Naming Conventions:**
- Variables and functions: camelCase (`searchForm`, `handleSearch`).
- CSS classes: kebab-case (`.search-card`, `.btn-primary`).
- Files: lowercase flat names (`index.html`, `styles.css`, `app.js`, `server.js`, `users.csv`).
- Directories: kebab-case (`sg-search`, `sg-search-service`).

### Structure Patterns

**Project Organization:**
- Frontend (`sg-search/`): `package.json`, `index.html`, `styles.css`, `app.js`.
- Backend (`sg-search-service/`): `package.json`, `server.js`, `users.csv`.
- Root (`cursor-workshop-app/`): `.gitignore`, `.vscode/launch.json`, `setup-lab.ps1`, `verify-lab.ps1`, `LAB-03-Search-App-Guide.md`, `README.md`.

### Format Patterns

**API Response Formats:**
- Health success: `{ "status": "UP" }`
- Search success: `{ "count": 3, "results": [{ "firstName": "...", "lastName": "...", "email": "...", "department": "...", "city": "..." }] }`
- Error: `{ "error": "At least one search parameter (firstName or lastName) is required." }`

**Data Exchange Formats:**
- JSON fields: camelCase throughout (matching CSV headers exactly).
- CSV headers: `firstName,lastName,email,department,city`

### Process Patterns

**Error Handling:**
- Backend: HTTP 400 for validation failures; HTTP 500 for file read/parse failures.
- Frontend: catch network/non-200 responses; display error in status block using `{colors.error}`; hide and clear results table.

**Loading State:**
- On search: set `state.loading = true`, disable inputs/buttons, show `"Searching local database..."` with pulsing animation.
- On completion: set `state.loading = false`, re-enable inputs/buttons.

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `textContent` or `document.createElement` for table cells — never `innerHTML` for dynamic data.
- Set CORS headers to allow requests from `http://127.0.0.1:3000`.
- Read and parse `users.csv` inside the route handler on every request (no global cache).

**Good Example:**
```javascript
const td = document.createElement('td');
td.textContent = user.firstName;
tr.appendChild(td);
```

**Anti-Pattern:**
```javascript
tr.innerHTML += `<td>${user.firstName}</td>`;
```
