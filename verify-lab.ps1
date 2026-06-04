# verify-lab.ps1 — Smoke test the Search App lab environment
# Prerequisites: backend on 3001, frontend optional for this script
# Run from repository root: .\verify-lab.ps1

$ErrorActionPreference = "Continue"
$BaseUrl = "http://127.0.0.1:3001"
$passed = 0
$failed = 0

function Test-Step {
    param([string]$Name, [scriptblock]$Block)
    Write-Host "`n[$Name]" -ForegroundColor Cyan
    try {
        & $Block
        Write-Host "  PASS" -ForegroundColor Green
        $script:passed++
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "=== Search App Lab Verification ===" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl"
Write-Host "Ensure sg-search-service is running (npm start in sg-search-service).`n"

Test-Step "Health check GET /health" {
    $r = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    if ($r.status -ne "ok") { throw "Expected status 'ok', got '$($r.status)'" }
}

Test-Step "Search John+Smith (expect count=1)" {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/search?firstName=John&lastName=Smith"
    if ($r.count -ne 1) { throw "Expected count=1, got $($r.count)" }
}

Test-Step "Search firstName=John (expect count=3)" {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/search?firstName=John"
    if ($r.count -ne 3) { throw "Expected count=3, got $($r.count)" }
}

Test-Step "Search lastName=Smith (expect count=2)" {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/search?lastName=Smith"
    if ($r.count -ne 2) { throw "Expected count=2, got $($r.count)" }
}

Test-Step "Search no params (expect HTTP 400)" {
    try {
        Invoke-WebRequest -Uri "$BaseUrl/api/search" -UseBasicParsing | Out-Null
        throw "Expected HTTP 400, got success"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -ne 400) { throw "Expected HTTP 400, got $code" }
    }
}

Test-Step "CORS header on /health" {
    $r = Invoke-WebRequest -Uri "$BaseUrl/health" -Headers @{ Origin = "http://localhost:3000" } -UseBasicParsing
    if (-not $r.Headers["Access-Control-Allow-Origin"]) {
        throw "Missing Access-Control-Allow-Origin. Add app.use(cors()) in server.js"
    }
}

Write-Host "`n=== Results: $passed passed, $failed failed ===" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -gt 0) {
    Write-Host @"

Troubleshooting:
  CORS Error     → Ensure app.use(cors()) is in server.js
  Port Conflict  → `$env:PORT=3002; npm start` in sg-search-service
  Fetch Failure  → Serve frontend with npx serve, not file://

"@
    exit 1
}

Write-Host "Lab environment verified. Open http://127.0.0.1:3000 in your browser." -ForegroundColor Green
exit 0
