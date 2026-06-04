---
title: AI POC Lab 4 - Search App Hands-on Lab
status: final
created: 2026-06-03
updated: 2026-06-03
---

# PRD: AI POC Lab 4 - Search App Hands-on Lab

## 1. Vision & Purpose
The Search App Lab delivers a high-velocity "win". Developers build a functional full-stack search application in 30 minutes. The zero-config stack (Express + Vanilla JS) eliminates environmental friction, allowing developers to master API consumption and DOM manipulation. This PRD ensures technical artifacts—backend, frontend, and guide—remain cohesive and resilient.

## 2. Facilitator Quick-Start
### 2.1 Timing Cheatsheet (30-min window)
| Time | Step | Focus |
| :--- | :--- | :--- |
| **00-05 min** | Setup | Overview & Initialize `users.csv` |
| **05-15 min** | Backend | `sg-search-service` Express API development |
| **15-25 min** | Frontend | `sg-search` Vanilla JS UI development |
| **25-30 min** | Wrap-up | Verification, Testing, and GitHub Commit |

### 2.2 Troubleshooting Table
| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **CORS Error** | Missing middleware | Ensure `app.use(cors())` is in `server.js`. |
| **Port Conflict** | Port 3000/3001 busy | Use `$env:PORT=3002; npm start` in PowerShell. |
| **Fetch Failure** | `file://` protocol | Use `npx serve` to serve over `http://`. |

## 3. Features & Scope
### 3.1 Backend: Search Service (`sg-search-service`)
A lightweight API parsing a local CSV.
- **FR-1: Search Endpoint** (`GET /api/search?firstName=&lastName=`)
 - Return JSON `{ count, results[] }`.
 - Ensure matches are case-insensitive. Match provided fields only; treat empty parameters as wildcards.
 - Return HTTP 400 if all parameters are missing.
- **FR-2: Health Check** (`GET /health`) returns HTTP 200 with "status: ok".
- **FR-3: CORS Support** must allow requests from port 3000.

### 3.2 Frontend: Search UI (`sg-search`)
A single-page interface with a professional card layout.
- **FR-4: Search Form**
 - Fields: First Name, Last Name.
 - Actions: Search (async fetch), Clear (reset form/results).
 - Constraint: No page reloads.
- **FR-5: Results Display & Status**
 - Tabular format: `firstName`, `lastName`, `email`, `department`, `city`.
 - Status area: Display "Searching..." during fetch and "Found N results" or error messages upon completion.
 - Security: Escape all output to prevent XSS.

### 3.3 Deliverables (In-Scope)
- `LAB-03-Search-App-Guide.md` (Expert Senior Developer/Architect tone).
- Functional Backend (Express) & Frontend (Vanilla JS).
- `setup-lab.ps1` and `verify-lab.ps1` scripts (Windows PowerShell).
- VS Code `launch.json` for debugging.
- GitHub commit steps with manual `git remote add` fallback.

## 4. Success Metrics
- **TTFS (Time to First Success) < 15 min**: Ensure developers see the first search result within 15 minutes.
- **Completion Rate > 90%**: Full completion within the 30-minute window.
- **Complexity Guard**: Limit code complexity. Do not add "best practice" features if they increase line count by more than 20%.

## 5. Non-Goals
- No authentication/authorization.
- No persistent database (CSV only).
- No frameworks (Vanilla JS/CSS only).
- No cloud deployment (Localhost only).

## 6. Technical Appendix
### 6.1 Assumptions & Open Questions
- **CSV Parsing**: Use string-split or `csv-parse` for low boilerplate.
- **Static Serving**: Use `npx serve` for the frontend.
- **CLI Tools**: `gh` CLI is assumed available; provide manual `git` fallbacks.
- **Data Entry**: Users create `users.csv` manually to learn the structure.

### 6.2 Environment Specs
- **Runtime**: Node.js v18+.
- **Ports**: Frontend: 3000, Backend: 3001.
- **Shell**: Windows PowerShell.
