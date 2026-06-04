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
