## PROMPT START
Act as an expert Senior Developer and Technical Architect. Create a highly structured, markdown-formatted, step-by-step 30-minute hands-on lab guide for a development team.
The lab must be tightly timed for a 30-minute execution window.
Also i want you to write this out as a verbose plan into a markdown file, do not make any code changes till we review the plan.
It needs to guide a developer through creating a fully functional search application composed of:
Frontend (`sg-search`) — A rich, clean UI with a search interface. Users enter First Name and Last Name, click Search, and results display in a tabular format on the same screen without a full page reload (use `fetch`, no full navigation).
Backend (`sg-search-service`) — A lightweight API that accepts First Name and Last Name query parameters.
Data source — Backend reads from a local `users.csv` file (mock database).
Environment — Entire setup must run, debug, and test locally inside the IDE (Cursor / VS Code) using two integrated terminals + browser.
Save all lab artifacts and documentation to:
create new directory in existing directory with name :cursor-workshop-app
Keep all artifacts in ./cursor-workshop-app/

## Stack preference
Choose the fastest, lowest-boilerplate stack for a 30-minute lab:
Backend: Node.js + Express (preferred) OR Python FastAPI
Frontend: Vanilla HTML/CSS/JS (preferred for speed) OR minimal React — avoid bundler setup unless necessary
Use `serve` or similar static server for frontend (avoid `file://` CORS issues)

Application requirements (must implement)

# Requirement

## 1	Frontend app folder: `sg-search`
2	Backend app folder: `sg-search-service`
3	CSV columns: `firstName`, `lastName`, `email`, `department`, `city`
4	CSV: header row + at least 10 sample users with duplicate first/last names for realistic search
5	API endpoint: `GET /api/search?firstName=\&lastName=`
6	Search: case-insensitive; match provided fields only (empty param = wildcard for that field)
7	Return JSON: `{ count, results\[] }`
8	Return 400 if both firstName and lastName are missing
9	Health endpoint: `GET /health`
10	Enable CORS for local frontend on port 3000
11	Backend port: 3001; frontend port: 3000
12	UI: form + Search + Clear buttons + status message + results table
13	No page reload on search — update DOM via JavaScript
14	Escape HTML in table cells (XSS-safe rendering)

## Output structure (single comprehensive markdown guide)
Generate `LAB-03-Search-App-Guide.md` with these sections and time targets:
Section	Target time	Content
Lab Overview & Prerequisites	2 min	Objectives, stack, ports, Lab3 folder tree
Step 1: Mock Data Setup	3 min	Exact `users.csv` layout + full sample rows (copy-paste ready)
Step 2: Backend Service Development	10 min	Complete `package.json`, `server.js`, install/run commands, curl smoke tests
Step 3: Frontend UI Development	10 min	Complete `index.html`, `styles.css`, `app.js`, `package.json`, start command
Step 4: Verification & Testing	5 min	Run both apps in two terminals; curl commands; browser test matrix; optional verify script
Step 5: Commit to GitHub	—	`git init`, `.gitignore`, commit message, `gh repo create` + manual remote options, PR optional

Additional artifacts to generate (not just the guide)
Create these files on disk in `Lab3/`:

```
Lab3/
├── LAB-03-Search-App-Guide.md
├── README.md
├── setup-lab.ps1              # npm install backend deps; print instructions
├── verify-lab.ps1             # optional API smoke test
├── .gitignore                 # node\_modules, .env, logs
├── .vscode/launch.json        # Node debug config for backend
├── sg-search-service/
│   ├── package.json
│   ├── server.js
│   └── users.csv
└── sg-search/
    ├── package.json
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## Code quality rules
No placeholders — every code block must be complete and copy-paste ready.
No "insert code here" or `TODO` in delivered solution files.
Keep backend CSV parser simple (handle quoted fields if possible).
Frontend CSS: modern, clean, professional (card layout, responsive form, styled table).
Include troubleshooting table (CORS, port conflicts, file:// vs http server).
Include facilitator timing cheatsheet (minute-by-minute).
All terminal commands must work on Windows PowerShell.

Verification commands (must document in guide)

```powershell
# Terminal 1
cd sg-search-service
npm install
npm start

# Terminal 2
cd sg-search
npm start

# API tests
curl http://127.0.0.1:3001/health
curl "http://127.0.0.1:3001/api/search?firstName=John\&lastName=Smith"
curl "http://127.0.0.1:3001/api/search?firstName=John"
curl -i "http://127.0.0.1:3001/api/search"

# Browser
http://127.0.0.1:3000
```

## Expected test results
Query	Expected
firstName=John, lastName=Smith	1 row
firstName=John only	3 rows
lastName=Smith only	2 rows
No parameters	HTTP 400

GitHub commit (Step 5)
Document these exact steps:

```powershell
cd C:\\AI-Workshop\\Labs\\Lab3
git init
git branch -M main
git add .
git commit -m "feat(lab3): add sg-search UI and sg-search-service CSV API"
gh repo create sg-search-lab-YOURNAME --private --source=. --remote=origin --push
```

## Include manual `git remote add` + `git push` fallback if `gh` is unavailable.

## Styling rules for the markdown guide
Use clean headers (`#`, `##`, `###`)
Short, action-oriented sentences
Tables for ports, folder structure, verification matrix
Publication-ready for PDF export
Deliver the complete file tree, all source files, and the markdown guide in one response (or write directly to the workspace path above).
PROMPT END

Shorter variant (Copilot quick prompt)
Use this if the full prompt exceeds Copilot context limits:

```
Create a 30-minute hands-on lab at current directory for a full-stack search app:
- sg-search-service (Node/Express, port 3001): reads users.csv, GET /api/search?firstName=\&lastName=, GET /health, CORS
- sg-search (HTML/CSS/JS, port 3000): search form, fetch API, results table without page reload
- users.csv: firstName,lastName,email,department,city — 10+ rows
- Guide: LAB-03-Search-App-Guide.md with 5 sections (2+3+10+10+5 min), complete code (no placeholders), setup/verify scripts, GitHub commit steps
- Windows PowerShell commands throughout
```

---

What this prompt produced (reference)
Artifact	Description
`LAB-03-Search-App-Guide.md`	30-min timed guide, all steps
`sg-search-service/`	Express API + CSV
`sg-search/`	Rich UI with fetch
`setup-lab.ps1` / `verify-lab.ps1`	Setup and smoke test
`.vscode/launch.json`	Backend debug config

Please ask me any clarifying questions you may have regarding this request.