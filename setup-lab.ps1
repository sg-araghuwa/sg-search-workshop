# setup-lab.ps1 — Bootstrap the Search App lab environment
# Run from repository root: .\setup-lab.ps1

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host "=== Search App Lab Setup ===" -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js v18+ is required. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Backend dependencies
Write-Host "`nInstalling sg-search-service dependencies..." -ForegroundColor Yellow
Push-Location (Join-Path $Root "sg-search-service")
npm install
Pop-Location

# Frontend (serve via npx — no npm install required)
Write-Host "sg-search uses npx serve (no install needed)." -ForegroundColor Green

# Verify users.csv
$csvPath = Join-Path $Root "sg-search-service\users.csv"
if (-not (Test-Path $csvPath)) {
    Write-Host "WARNING: users.csv not found at $csvPath" -ForegroundColor Yellow
    Write-Host "Create it manually with columns: firstName,lastName,email,department,city"
} else {
    Write-Host "users.csv found." -ForegroundColor Green
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host @"

Next steps — open two PowerShell terminals:

  Terminal 1 (Backend — port 3001):
    cd sg-search-service
    npm start

  Terminal 2 (Frontend — port 3000):
    cd sg-search
    npm start

  Browser: http://127.0.0.1:3000

Optional: run .\verify-lab.ps1 after both servers are running.

"@
