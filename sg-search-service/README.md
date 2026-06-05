# sg-search-service

Lab backend search API (Express) backed by MongoDB Atlas.

## Requirements

- **Node.js 20.19.0+** (see `engines` in `package.json`; required for Mongoose 9.x)
- **MongoDB Atlas URI** — facilitator provides `MONGODB_URI` for the shared cluster

## MongoDB Atlas setup

1. Copy the environment template:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Paste the facilitator-provided Atlas connection string into `.env`:

   ```
   MONGODB_URI=mongodb+srv://...
   ```

   Quote the value if it contains `#` or `=` characters (see comments in `.env.example`).

3. Install dependencies and start the server:

   ```powershell
   npm install
   npm start
   ```

Server listens on **http://localhost:3001** by default. Override with `$env:PORT=3002` (PowerShell) if needed.

## Startup behavior

On `npm start`, the service runs this sequence before accepting requests:

1. Load `.env` via `dotenv`
2. Validate `MONGODB_URI` (fail-fast if missing)
3. Connect to Atlas (`lib/db.js`)
4. Sync indexes on the `User` model (warn-only on failure)
5. Auto-seed from `users.csv` via idempotent upsert on `email` at every startup (`lib/seed.js`)
6. Bind HTTP port and listen

Expected success output:

```
Connected to MongoDB — 12 users in users collection
sg-search-service listening on http://localhost:3001
```

`users.csv` is **seed input only** — it is not read at search request time.

If startup fails, the process logs `Startup failed:` and exits with code 1 (no port binding).

## User model

User documents are defined in **`models/User.js`** with fields: `firstName`, `lastName`, `email`, `department`, `city`.

Search queries MongoDB via `User.find()` with `.select('firstName lastName email department city -_id').lean()`.

## API overview

**`GET /health`** — returns HTTP 200 with JSON `{ "status": "ok" }` (liveness check).

**`GET /api/search`** — filters users by optional `firstName` and `lastName` query parameters (case-insensitive exact match). At least one non-empty parameter is required; otherwise HTTP 400 with `{ "error": "At least one of firstName or lastName is required" }`.

**CORS** — enabled globally via `app.use(cors())` in `server.js` (before route handlers). Browser requests from the lab frontend at **http://localhost:3000** receive `Access-Control-Allow-Origin` on responses.

- Serve the frontend over HTTP on port 3000 (e.g. `npx serve -l 3000` in `sg-search`). Opening HTML via `file://` will **not** work with fetch to this API.
- Backend stays **localhost-only** on port 3001 (no cloud deployment).

### Test CORS

With the server running (`npm start`):

```powershell
# Root route — expect Access-Control-Allow-Origin in headers
curl.exe -H "Origin: http://localhost:3000" -i http://127.0.0.1:3001/

# Health route — same CORS headers
curl.exe -H "Origin: http://localhost:3000" -i http://127.0.0.1:3001/health

# Optional preflight
curl.exe -X OPTIONS -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -i http://127.0.0.1:3001/
```

### Test health endpoint

With the server running (`npm start`):

```powershell
# curl (if available)
curl -s -w "`nHTTP %{http_code}`n" http://127.0.0.1:3001/health

# PowerShell
$r = Invoke-WebRequest -Uri http://127.0.0.1:3001/health -UseBasicParsing
$r.StatusCode   # expect 200
$r.Content      # expect {"status":"ok"}
```

### Test search endpoint (`GET /api/search`)

With the server running (`npm start`), against the 12-user seed fixture:

| Query | Expected `count` |
|-------|------------------|
| `?firstName=John&lastName=Smith` | 1 |
| `?firstName=John` | 3 |
| `?lastName=Smith` | 2 |
| `?firstName=john` | 3 (case-insensitive) |
| (no params) | HTTP **400** |
| `?firstName=Nobody` | 0 |

**Success response shape:** `{ "count": number, "results": [ { firstName, lastName, email, department, city }, ... ] }`

**400 response:** `{ "error": "At least one of firstName or lastName is required" }`

```powershell
# curl (escape & in PowerShell when needed)
curl "http://127.0.0.1:3001/api/search?firstName=John&lastName=Smith"
curl "http://127.0.0.1:3001/api/search?firstName=John"
curl "http://127.0.0.1:3001/api/search?lastName=Smith"
curl "http://127.0.0.1:3001/api/search?firstName=john"
curl -i "http://127.0.0.1:3001/api/search"

# PowerShell
$r = Invoke-RestMethod "http://127.0.0.1:3001/api/search?firstName=John"
$r.count           # expect 3
$r.results.Count   # expect 3
$r.results[0].email

try { Invoke-WebRequest "http://127.0.0.1:3001/api/search" -UseBasicParsing } catch { $_.Exception.Response.StatusCode.value__ }
# expect 400
```

## Integration test

```powershell
npm test
```

`npm test` runs `test/search-validation.test.js`, which spawns `server.js` on port **3099** with `MONGODB_URI` from `.env` or the environment.

**Prerequisite:** `MONGODB_URI` must be set. If it is missing, the test prints a skip message and exits with code **0** (not a failure).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Startup failed: MONGODB_URI is required` | Missing or empty `.env` | Copy `.env.example` → `.env`, paste facilitator URI |
| `Startup failed:` + connection error | Invalid URI or Atlas unreachable | Verify URI; check Atlas IP allowlist with facilitator |
| `Startup failed:` + CSV/seed error | Missing or malformed `users.csv` | Restore `users.csv` from repo |
| `npm test` prints "skipped" | No `MONGODB_URI` | Configure `.env` before running tests |
| Search returns 0 unexpectedly | Auto-seed didn't run | Restart with `npm start`; check startup logs |
