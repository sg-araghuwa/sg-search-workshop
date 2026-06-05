# Deferred Work

Tracked items deferred during code review (not blocking story completion).

## Deferred from: code review of 1-1-initialize-express-search-service.md (2026-06-04)

- PORT env not validated (non-numeric, out of range, `"0"`) — story prescribes bare `process.env.PORT || 3001`; harden in Story 1.5 lab troubleshooting if needed
- `app.listen` lacks error callback for EADDRINUSE / EACCES — acceptable for minimal scaffold
- `engines.node` not enforced at install — consider `.nvmrc` or `engineStrict` in Epic 3
- No repo `.gitignore` for `node_modules` — Epic 3 explicit scope
- Unquoted CSV comma-in-value edge case — Story 1.2 parsing; current fixture has no embedded commas

## Deferred from: code review of 3-3-author-lab-03-search-app-guide-md.md (2026-06-04)

- Full `launch.json` JSON embedded in guide — added under Story 3.4 scope; acceptable merged deliverable
- `Set-Content -Encoding utf8` may write UTF-8 BOM on Windows, breaking csv-parse header detection — pre-existing lab pattern
- Guide length (~860 lines) may exceed 30-minute window for slow typists — acceptable for copy-paste lab format

## Deferred from: code review of 1-2-load-and-parse-csv-user-data.md (2026-06-04)

- `app.listen` lacks error callback for EADDRINUSE / EACCES — carried from Story 1.1; CSV load is fail-fast before bind
- UTF-8 BOM not stripped before `parse()` — Excel-exported CSV may fail required-column check with confusing message
- README hardcodes "Loaded 12 users" — update if `users.csv` row count changes
- `loadUsers()` at module top-level — side effects on `require(server.js)`; extract if Epic 3 adds unit tests

## Deferred from: code review of 2-3-connect-async-search-to-backend-api.md (2026-06-04)

- Manual E2E verification blocked until Epic 1.4/1.5 (`GET /api/search`, CORS) land in `sg-search-service/server.js`

## Deferred from: code review of 2-4-render-results-table-with-xss-protection.md (2026-06-04)

- Manual E2E (John search, empty tbody, XSS CSV row) blocked until Epic 1.4 `/api/search` is present in `sg-search-service/server.js`

## Deferred from: code review of 1-1-project-foundation-secure-environment-setup.md (2026-06-05)

- No database readiness signal in health endpoint — Story 1.3+ when MongoDB connection lands
- CI pipeline Node version matrix not aligned with mongoose 9.x (requires Node >=20.19.0) — Epic 3 / infra scope
- dotenv does not fail-fast on corrupt .env parse errors — acceptable for Story 1.1; Story 1.3 may add env validation

## Deferred from: code review of 1-2-mongoose-user-model-schema.md (2026-06-05)

- Whitespace-only strings pass `required: true` after trim — Story 1.3 CSV seed unlikely to hit; optional hardening
- Case-variant emails bypass unique constraint — Story 1.3 upsert on email; consider `lowercase: true` if cohort data varies
- `validateSync()` does not enforce email uniqueness — spec documents DB-backed enforcement in Story 1.3
- Race before unique index build on concurrent saves — Story 1.3 startup/index sync lifecycle
- `OverwriteModelError` if module required twice — test/hot-reload edge; tests pass today
- No `maxlength` on string fields — server.js has 50-char API cap; model alignment optional for Story 1.5
- Compound index shape may not match Story 1.4 query patterns — optional performance index per AC3

## Deferred from: code review of 1-3-atlas-connection-auto-seed-startup-lifecycle.md (2026-06-05)

- package.json modified in Story 1.3 scope — dotenv/mongoose deps are Story 1.1 work; uncommitted state
- CORS unrestricted defaults on `app.use(cors())` — pre-existing from CSV era; out of Story 1.3 scope
- No graceful shutdown (SIGTERM / mongoose.disconnect / server.close) — out of Story 1.3 scope
- No auth or rate limiting on `/api/search` — out of Story 1.3 scope
- Large CSV OOM via `readFileSync` in seed — lab fixture is 12 rows; workshop scale only
- Duplicate or case-variant emails in CSV not rejected at seed — controlled fixture; optional hardening
- bulkWrite batch limits, partial failure, and hang timeout — 12-row fixture; Story 1.5+ if needed
- Multi-instance concurrent seed race on startup — workshop single-instance assumption
- Regex search performance vs compound index — Story 1.4 territory
- Story 1.4 MongoDB search shipped in Story 1.3 (AC9 / 503 stub) — combined implementation in flight; Story 1.4 review will reconcile scope
- Extra per-row empty-cell validation in seed.js beyond lifted loadUsers() — low-risk hardening; controlled 12-row fixture has no empty cells

## Deferred from: code review of 1-4-mongodb-backed-search-with-preserved-api-contract.md (2026-06-05)

- `package.json` / lockfile modified outside Story 1.4 file list — Story 1.1 deps bundled in uncommitted diff
- No MongoDB readiness signal in `/health` — Story 1.1 deferred item
- Unrestricted CORS on PII search endpoint — CSV era; noted in Story 1.3 review
- No auth or rate limiting on `/api/search` — workshop scope
- Case-insensitive `$regex` may full-scan if indexes absent — AC11 warn-only index sync by design; 12-user lab fixture
- Non-string query params coerced via `String()` in `queryValue` — object bracket notation edge case; fix needs new error string
- No `maxTimeMS` on MongoDB find — workshop scale; no timeout requirement in spec
- Locale-sensitive Unicode case beyond ASCII `$options: 'i'` — architecture chose `$regex` over collation for CSV parity
- Error logging records `err.message` only, no stack — lab diagnostic level
- `process.exit` on listen failure without `mongoose.disconnect` — Story 1.3 lifecycle

## Deferred from: code review of 1-5-integration-test-service-documentation.md (2026-06-05)

- Strict `count === 3` may flake on polluted shared Atlas cluster — spec allows optional tighten with shared-cluster caveat
- `waitReady()` 5s cap may fail on slow Atlas connect+seed — pre-existing timeout pattern
- Startup failures on stderr not surfaced in test error message — pre-existing spawn pattern
- Non-empty collection with extra users can skew matrix/integration counts — workshop single-seed assumption

## Deferred from: code review of 2-1-lab-guide-mongodb-workflow.md (2026-06-05)

- setup-lab.ps1 terminal output lacks `.env` creation reminder — Story 2.2 will add MongoDB readiness checks
- verify-lab.ps1 CORS header check claimed in guide but script does not inspect Access-Control-Allow-Origin — pre-existing CSV-era prose
- Shared Atlas cluster may log >12 users via countDocuments() — workshop infra assumes clean or isolated collection

## Deferred from: code review of 2-2-workshop-setup-verification-scripts.md (2026-06-05)

- Lab guide diff exceeds Story 2.2 scope (+78/−183 lines vs ~3–5 line alignment) — ship scripts now; split/reconcile guide scope in follow-up
- Guide falsely claims `verify-lab.ps1` runs a CORS header check — pre-existing from Story 2.1; explicitly out of 2.2 scope
- README says auto-seed only when collection is empty; runtime upserts every startup — README out of 2.2 scope
- Guide says frontend needs no `npm install` but `setup-lab.ps1` installs when `sg-search/package.json` exists — pre-existing
- Guide says restore missing `users.csv` from repo; `setup-lab.ps1` auto-creates fixture — pre-existing (setup handles recovery)
