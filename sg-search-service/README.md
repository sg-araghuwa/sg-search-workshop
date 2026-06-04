# sg-search-service

Lab backend search API (Express).

## Requirements

- **Node.js 18+** (see `engines` in `package.json`)

## Run locally

```powershell
npm install
npm start
```

Server listens on **http://localhost:3001** by default. Override with `$env:PORT=3002` (PowerShell) if needed.

## Scope

**Story 1.1:** Express scaffold, sample `users.csv`, `GET /` smoke route.

**Story 1.2:** At startup (before the server listens), `users.csv` is read from the same folder as `server.js` and parsed into an in-memory `users` array. On success you should see:

```
Loaded 12 users from users.csv
sg-search-service listening on http://localhost:3001
```

If `users.csv` is missing, malformed, or has no data rows, the process logs a `Startup failed:` message and exits with code 1 (no port binding).

**Story 1.3:** `GET /health` returns HTTP 200 with JSON `{ "status": "ok" }` (liveness check).

**Story 1.4:** `GET /api/search` filters the in-memory `users` array by optional `firstName` and `lastName` query parameters (case-insensitive exact match). At least one non-empty parameter is required; otherwise HTTP 400 with `{ "error": "At least one of firstName or lastName is required" }`.

**Story 1.5:** Cross-Origin Resource Sharing (CORS) is enabled globally via `app.use(cors())` in `server.js` (before route handlers). Browser requests from the lab frontend at **http://localhost:3000** receive `Access-Control-Allow-Origin` on responses.

- Serve the frontend over HTTP on port 3000 (e.g. `npx serve -l 3000` in `sg-search`). Opening HTML via `file://` will **not** work with fetch to this API.
- Backend stays **localhost-only** on port 3001 (no cloud deployment).

### Test CORS (Story 1.5)

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

With the server running (`npm start`), against the 12-user `users.csv` fixture:

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
