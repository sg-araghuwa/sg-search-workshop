---
title: LAB-03: Full-Stack Search Application Hands-On Lab
status: final
created: 2026-06-04
updated: 2026-06-04
---

# PRD: LAB-03: Full-Stack Search Application Hands-On Lab

## 0. Document Purpose
This Product Requirements Document (PRD) defines the requirements, scope, and deliverables for **LAB-03: Full-Stack Search Application**, a 30-minute hands-on lab designed for development teams. The lab guides developers through building a lightweight, local full-stack search application composed of a Vanilla HTML/CSS/JS frontend (`sg-search`) and a Node.js + Express backend (`sg-search-service`) that queries a local CSV file. This document is structured with a Glossary-anchored vocabulary, globally numbered stable Functional Requirements (FRs), inline assumptions, and success metrics.

## 1. Vision
The vision of LAB-03 is to provide a frictionless, highly structured, and tightly timed 30-minute learning experience that teaches developers how to build, integrate, debug, and test a local full-stack application within their IDE (Cursor/VS Code). By using a low-boilerplate stack (Vanilla JS + Express + CSV), developers focus on core concepts: API design, asynchronous frontend fetching, CORS, XSS-safe rendering, local debugging, and basic automation scripting.

## 2. Target User

### 2.1 Jobs To Be Done
- **As a Lab Facilitator**, I want a highly structured, error-free, and copy-paste-ready guide so that I can run a 30-minute hands-on workshop without developers getting stuck on environment issues or syntax errors.
- **As a Developer Participant**, I want to build a fully functional local search application in 30 minutes so that I can understand full-stack integration, CORS, local debugging, and git-based workflows without complex bundler setups.

### 2.2 Non-Users (v1)
- **Production DevOps Engineers**: This lab is strictly for local IDE-based development and is not intended to show production-grade deployment, containerization (Docker), or cloud hosting.
- **Advanced Full-Stack Architects**: This lab uses a minimal stack (Express + Vanilla JS + CSV) and is not designed to demonstrate enterprise-grade frameworks (e.g., NestJS, Next.js) or database ORMs.

### 2.3 Key User Journeys

- **UJ-1. Dave sets up the lab environment and mock data.**
  - **Persona + context:** Dave, a junior developer participating in the team workshop, opens the project in Cursor.
  - **Entry state:** Cursor is open; terminal is in the project root.
  - **Path:** Dave runs `.\setup-lab.ps1` in PowerShell. The script installs backend dependencies and prints step-by-step instructions. Dave creates the `users.csv` file with 10 sample rows in the `sg-search-service` folder.
  - **Climax:** The setup script completes successfully in under 1 minute, and the mock data is verified.
  - **Resolution:** Dave is ready to begin backend development.
  - **Edge case:** If PowerShell script execution is restricted, the guide provides an explicit bypass command (`Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process`).

- **UJ-2. Dave implements and debugs the backend service.**
  - **Persona + context:** Dave wants to implement the Express API and verify it using local tools.
  - **Entry state:** Backend folder structure is ready.
  - **Path:** Dave writes `package.json` and `server.js` in `sg-search-service`. He starts the backend in Terminal 1 using `npm start`. He uses the VS Code debugger (configured via `.vscode/launch.json`) to set breakpoints in the CSV parsing logic. He tests the endpoints using `curl` in Terminal 2.
  - **Climax:** Dave hits a breakpoint in `server.js`, inspects the parsed CSV rows, and verifies that `GET /api/search?firstName=John` returns exactly 3 rows.
  - **Resolution:** The backend is fully functional, CORS is enabled for port 3000, and Dave is ready for frontend development.

- **UJ-3. Dave builds and runs the frontend search interface.**
  - **Persona + context:** Dave wants to build a clean UI that fetches data from the backend without page reloads.
  - **Entry state:** Backend is running on port 3001.
  - **Path:** Dave writes `index.html`, `styles.css`, and `app.js` in `sg-search`. He starts the frontend static server on port 3000 using `npm start` in Terminal 2. He opens `http://127.0.0.1:3000` in his browser, enters "John" in the First Name field, and clicks Search.
  - **Climax:** The search results render instantly in a styled table on the same page. The status message updates to "Found 3 results". Dave verifies that entering HTML tags in the search fields does not trigger XSS due to safe DOM rendering.
  - **Resolution:** Dave clicks "Clear", which resets the form, clears the table, and resets the status message.

- **UJ-4. Dave verifies the complete lab and commits to GitHub.**
  - **Persona + context:** Dave wants to run a final automated verification and save his work.
  - **Entry state:** Both frontend and backend are running.
  - **Path:** Dave runs `.\verify-lab.ps1` in a terminal to execute automated API smoke tests. Once verified, he initializes a git repository, adds files, commits with a structured message, and uses the GitHub CLI (`gh`) to create a private repository and push his code.
  - **Climax:** The verification script prints green checkmarks for all endpoints, and the repository is successfully pushed to GitHub.
  - **Resolution:** Dave completes the lab within the 30-minute window and reports success to the facilitator.

## 3. Glossary
- **sg-search**: The frontend application directory containing `package.json`, `index.html`, `styles.css`, and `app.js`.
- **sg-search-service**: The backend application directory containing `package.json`, `server.js`, and `users.csv`.
- **users.csv**: The local comma-separated values file containing mock user data, acting as the database.
- **LAB-03-Search-App-Guide.md**: The primary step-by-step markdown guide for the lab.
- **setup-lab.ps1**: A PowerShell script that automates dependency installation and prints initial lab instructions.
- **verify-lab.ps1**: A PowerShell script that performs automated HTTP requests to verify backend functionality.
- **CORS (Cross-Origin Resource Sharing)**: A security mechanism that allows the frontend on `http://127.0.0.1:3000` to safely query the backend on `http://127.0.0.1:3001`.
- **XSS (Cross-Site Scripting) Protection**: Ensuring that user-supplied data from the CSV or search inputs is escaped before rendering in the DOM to prevent malicious script execution.

## 4. Features

### 4.1 Feature 1: Backend CSV Search API (`sg-search-service`)
**Description:** A lightweight Node.js + Express API that reads user records from a local CSV file and provides search and health endpoints. It must handle basic CSV parsing and enable CORS for the frontend.

**Functional Requirements:**

#### FR-1: Health Endpoint
The backend must expose a `GET /health` endpoint.
**Consequences (testable):**
- Sending a GET request to `http://127.0.0.1:3001/health` must return HTTP 200 OK with a JSON payload: `{ "status": "UP" }`.

#### FR-2: CSV Data Parsing
The backend must read and parse `users.csv` on startup or on each request. [ASSUMPTION: CSV_READ_ON_REQUEST]
**Consequences (testable):**
- The CSV file must contain columns: `firstName`, `lastName`, `email`, `department`, `city`.
- Malformed rows or missing columns must not crash the server.

#### FR-3: Case-Insensitive Search
The backend must expose a `GET /api/search` endpoint accepting `firstName` and `lastName` query parameters.
**Consequences (testable):**
- Search must be case-insensitive (e.g., `john` matches `John`).
- If a parameter is empty or omitted, it must act as a wildcard (matches any value for that field).
- If `firstName=John` and `lastName=Smith`, the backend must perform an `AND` search (both fields must match).
- The returned JSON payload must be structured as: `{ "count": X, "results": [...] }`.

#### FR-4: Parameter Validation
The backend must validate that at least one search parameter is provided.
**Consequences (testable):**
- If both `firstName` and `lastName` query parameters are missing or empty, the API must return HTTP 400 Bad Request with a JSON error message: `{ "error": "At least one search parameter (firstName or lastName) is required." }`.

#### FR-5: CORS Enablement
The backend must enable CORS for requests originating from the local frontend.
**Consequences (testable):**
- The backend must respond with header `Access-Control-Allow-Origin: http://127.0.0.1:3000` (or `*` for local simplicity) [ASSUMPTION: CORS_ORIGIN].

### 4.2 Feature 2: Frontend Search Interface (`sg-search`)
**Description:** A clean, responsive single-page search interface built with Vanilla HTML/CSS/JS. It communicates with the backend API via `fetch` and displays results dynamically without full page reloads.

**Functional Requirements:**

#### FR-6: Search Form UI
The frontend must provide a form with input fields for First Name and Last Name, a Search button, and a Clear button.
**Consequences (testable):**
- Clicking "Search" triggers an asynchronous API call.
- Clicking "Clear" resets both input fields, clears the results table, and resets the status message.

#### FR-7: Asynchronous Search Execution
The frontend must fetch results from the backend API using `fetch` without triggering a full page reload.
**Consequences (testable):**
- The page URL must remain `http://127.0.0.1:3000/` during and after search execution.
- A status message must display "Searching..." during the fetch operation.

#### FR-8: Tabular Results Rendering
The frontend must render search results in a clean, styled HTML table.
**Consequences (testable):**
- The table must display columns: First Name, Last Name, Email, Department, City.
- If no results are found, the table must be hidden or empty, and the status message must display "No results found."
- If results are found, the status message must display "Found X results."

#### FR-9: XSS-Safe DOM Insertion
The frontend must safely escape all user-supplied data before inserting it into the DOM.
**Consequences (testable):**
- Table cells must be populated using `textContent` or an explicit HTML escaping helper rather than raw `innerHTML` to prevent Cross-Site Scripting (XSS).

### 4.3 Feature 3: Lab Automation, Debugging & Documentation
**Description:** Automation scripts and configuration files to ensure the lab can be set up, debugged, and verified in under 30 minutes.

**Functional Requirements:**

#### FR-10: Automated Setup Script
A PowerShell script `setup-lab.ps1` must automate the initial workspace preparation.
**Consequences (testable):**
- Running `.\setup-lab.ps1` must run `npm install` in `sg-search-service` and `sg-search` (if dependencies exist), verify Node.js installation, and print clear step-by-step instructions.

#### FR-11: Automated Verification Script
A PowerShell script `verify-lab.ps1` must provide a quick smoke test for the backend API.
**Consequences (testable):**
- Running `.\verify-lab.ps1` must perform `Invoke-RestMethod` calls to `GET /health` and `GET /api/search` with various query parameters, printing green checkmarks for successful assertions.

#### FR-12: VS Code Debug Configuration
A `.vscode/launch.json` file must be provided to enable seamless backend debugging.
**Consequences (testable):**
- Pressing F5 in VS Code/Cursor must launch the `sg-search-service` backend with the debugger attached, allowing breakpoints to be hit in `server.js`.

#### FR-13: Timed Lab Guide
A comprehensive markdown guide `LAB-03-Search-App-Guide.md` must be generated with strict section-by-section timing targets.
**Consequences (testable):**
- The guide must contain: Lab Overview (2 min), Step 1: Mock Data (3 min), Step 2: Backend (10 min), Step 3: Frontend (10 min), Step 4: Verification (5 min), Step 5: GitHub Commit.
- It must contain a facilitator timing cheatsheet and a troubleshooting table.

## 5. System Architecture, Ports & Non-Goals

### 5.1 System Architecture & Ports
The application is composed of two local services communicating over HTTP.

| Service | Directory | Port | Technology Stack | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `sg-search` | `3000` | Vanilla HTML/CSS/JS + `serve` | User search interface and dynamic DOM rendering. |
| **Backend** | `sg-search-service` | `3001` | Node.js + Express + `csv-parser` | REST API querying local CSV database. |

### Directory Structure
All lab artifacts and documentation must be saved inside the `cursor-workshop-app` directory:

```text
cursor-workshop-app/
├── LAB-03-Search-App-Guide.md  # Comprehensive step-by-step lab guide
├── README.md                   # Lab overview and quick-start instructions
├── setup-lab.ps1               # PowerShell script to automate dependency setup
├── verify-lab.ps1              # PowerShell script to run API smoke tests
├── .gitignore                  # Git ignore rules (node_modules, logs, etc.)
├── .vscode/
│   └── launch.json             # VS Code Node.js debugger launch configuration
├── sg-search-service/          # Backend service directory
│   ├── package.json            # Backend dependencies and start scripts
│   ├── server.js               # Express API implementation
│   └── users.csv               # Local CSV mock database (10+ sample rows)
└── sg-search/                  # Frontend application directory
    ├── package.json            # Frontend dependencies (serve) and start scripts
    ├── index.html              # Search form and results table HTML
    ├── styles.css              # Modern, responsive CSS styling
    └── app.js                  # Frontend fetch and DOM rendering logic
```

### 5.2 Non-Goals (Explicit)
- **No Database Integration**: The backend must strictly read from the local `users.csv` file. Integrating SQLite, MongoDB, or any other database is out of scope.
- **No Authentication/Authorization**: There are no user login, JWT, or session requirements. The application is entirely public on localhost.
- **No Advanced Search Features**: Fuzzy matching, pagination, sorting, or multi-field filtering (beyond First Name and Last Name) are explicitly out of scope for v1.
- **No Frontend Bundlers**: The frontend must not use Webpack, Vite, Babel, or complex React setups. It must remain Vanilla HTML/CSS/JS to fit the 30-minute window.

## 6. MVP Scope

### 6.1 In Scope
- Complete directory structure inside `./cursor-workshop-app/`.
- `LAB-03-Search-App-Guide.md` (comprehensive step-by-step guide).
- `README.md`, `setup-lab.ps1`, `verify-lab.ps1`, `.gitignore`, `.vscode/launch.json`.
- `sg-search-service/` containing `package.json`, `server.js`, and `users.csv` (with at least 10 sample rows, including duplicate first/last names).
- `sg-search/` containing `package.json` (configured to run a local static server like `serve`), `index.html`, `styles.css`, and `app.js`.

### 6.2 Out of Scope for MVP
- Production deployment scripts (e.g., Dockerfile, PM2 config).
- Unit and integration testing frameworks (e.g., Jest, Mocha, Cypress) — verification is handled via PowerShell script and manual testing.
- Persistent write operations (e.g., adding or editing users via the UI) — the CSV is read-only.

## 7. Success Metrics

### 7.1 Primary Metrics
- **SM-1: Lab Completion Rate**: Percentage of developers who successfully complete all 5 steps of the lab and have a fully working application in under 30 minutes. (Target: > 90% of participants in a typical workshop).
- **SM-2: Zero-Config Setup Success**: Percentage of developers who run `setup-lab.ps1` and have their environment fully prepared without manual dependency troubleshooting. (Target: > 95%).

### 7.2 Secondary Metrics
- **SM-3: Debugger Adoption**: Percentage of developers who successfully launch the backend debugger via F5 and hit a breakpoint during Step 2. (Target: > 80%).

### 7.3 Counter-Metrics
- **SM-C1: Documentation Verbosity**: The total reading time of `LAB-03-Search-App-Guide.md` must not exceed 8 minutes. If the documentation is too long, developers will spend too much time reading and fail to complete the hands-on coding within the 30-minute window.

## 8. Open Questions
None. All key architectural and implementation questions have been resolved during discovery.

## 9. Assumptions Index
- **[ASSUMPTION: CSV_READ_ON_REQUEST]**: The backend will read and parse the CSV file on every search request rather than caching it in memory on startup. This allows developers to edit `users.csv` during the lab and see changes instantly without restarting the backend.
- **[ASSUMPTION: CORS_ORIGIN]**: The backend will allow CORS from `http://127.0.0.1:3000` or `http://localhost:3000` using standard Express middleware or simple custom headers (`res.setHeader('Access-Control-Allow-Origin', '*')`).
- **[ASSUMPTION: POWERSHELL_COMPAT]**: The participants are running on Windows with PowerShell 5.1+ or PowerShell Core, or have a compatible terminal environment. The guide will focus on PowerShell commands as requested.
- **[ASSUMPTION: CSV_PARSER_LIB]**: The backend will use the standard `csv-parser` npm package for robust CSV parsing, including handling quotes and edge cases.
- **[ASSUMPTION: LOCAL_SERVE_DEP]**: The frontend will use `serve` as a local dependency in `sg-search/package.json` and run it via `npm start` (which executes `serve . -p 3000`). This ensures zero-config local execution without global permissions.
