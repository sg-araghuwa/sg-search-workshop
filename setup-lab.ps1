# setup-lab.ps1 - Bootstrap Search App lab dependencies (Story 3.1)
# Run from repo root: .\setup-lab.ps1
# If blocked: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

$ErrorActionPreference = 'Stop'

Set-Location -LiteralPath $PSScriptRoot

function Test-NodeVersion {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Error 'Node.js is not on PATH. Install Node.js 18+ and retry.'
        exit 1
    }

    $versionOutput = & node -v 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to run node -v: $versionOutput"
        exit 1
    }

    $versionStr = ($versionOutput | Out-String).Trim()
    if ($versionStr -match '^v?(\d+)') {
        $major = [int]$Matches[1]
        if ($major -lt 18) {
            Write-Error "Node.js 18+ required; found $versionStr"
            exit 1
        }
        Write-Host "Node $versionStr OK" -ForegroundColor DarkGray
    } else {
        Write-Error "Could not parse Node version from: $versionStr"
        exit 1
    }
}

function Test-NpmPresent {
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npmCmd) {
        Write-Error 'npm is not on PATH. Install Node.js (includes npm) and retry.'
        exit 1
    }
    $npmVer = (& npm -v 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        Write-Error 'Failed to run npm -v'
        exit 1
    }
    Write-Host "npm $npmVer OK" -ForegroundColor DarkGray
}

function Invoke-NpmInstall {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PackageDir,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    if (-not (Test-Path (Join-Path $PackageDir 'package.json'))) {
        throw "$Label/package.json not found at $PackageDir"
    }

    Write-Host "`nInstalling $Label dependencies..." -ForegroundColor Cyan
    Push-Location $PackageDir
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed in $Label (exit $LASTEXITCODE)"
        }
        Write-Host "$Label dependencies installed." -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

function Ensure-UsersCsv {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CsvPath
    )

    if (Test-Path $CsvPath) {
        Write-Host 'users.csv already present - left unchanged.' -ForegroundColor DarkGray
        return
    }

    Write-Host "Creating sample users.csv..." -ForegroundColor Yellow
    $sample = @'
firstName,lastName,email,department,city
John,Smith,john.smith@example.com,Engineering,Seattle
John,Doe,john.doe@example.com,Marketing,Portland
John,Williams,john.williams@example.com,Sales,Denver
Jane,Smith,jane.smith@example.com,HR,Seattle
Alice,Johnson,alice.johnson@example.com,Engineering,Austin
Bob,Johnson,bob.johnson@example.com,Finance,Chicago
Carol,Davis,carol.davis@example.com,Marketing,Portland
David,Miller,david.miller@example.com,Sales,Denver
Emma,Wilson,emma.wilson@example.com,HR,Seattle
Frank,Brown,frank.brown@example.com,Engineering,Austin
Grace,Taylor,grace.taylor@example.com,Finance,Chicago
Henry,Anderson,henry.anderson@example.com,Operations,Boston
'@
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($CsvPath, $sample.TrimEnd(), $utf8NoBom)
    Write-Host ('Created ' + $CsvPath + ' with 12 data rows.') -ForegroundColor Green
}

function Write-NextSteps {
    param([bool]$FrontendReady)

    Write-Host ''
    Write-Host '=== Lab setup complete ===' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Terminal 1 - Backend (port 3001):' -ForegroundColor Cyan
    Write-Host '  cd sg-search-service' -ForegroundColor White
    Write-Host '  npm start' -ForegroundColor White
    Write-Host ''
    if ($FrontendReady) {
        Write-Host 'Terminal 2 - Frontend (port 3000):' -ForegroundColor Cyan
        Write-Host '  cd sg-search' -ForegroundColor White
        Write-Host '  npm start' -ForegroundColor White
    } else {
        Write-Host 'Terminal 2 - Frontend (port 3000, after Epic 2):' -ForegroundColor Cyan
        Write-Host '  cd sg-search' -ForegroundColor White
        Write-Host '  npm start' -ForegroundColor DarkGray
        Write-Host '  (sg-search not set up yet - complete Epic 2 frontend first)' -ForegroundColor Yellow
    }
    Write-Host ''
    Write-Host 'Smoke test (with backend running):' -ForegroundColor Cyan
    Write-Host '  curl http://127.0.0.1:3001/health' -ForegroundColor White
    Write-Host ''
    Write-Host 'Full verification: run verify-lab.ps1 after both apps are up (Story 3.2).' -ForegroundColor DarkGray
}

Write-Host 'Search App Lab - setup' -ForegroundColor Green
Write-Host "Project root: $PSScriptRoot`n" -ForegroundColor DarkGray

Test-NodeVersion
Test-NpmPresent

$backendDir = Join-Path $PSScriptRoot 'sg-search-service'
$frontendDir = Join-Path $PSScriptRoot 'sg-search'
$usersCsv = Join-Path $backendDir 'users.csv'

if (-not (Test-Path (Join-Path $backendDir 'package.json'))) {
    Write-Error 'sg-search-service/package.json not found. Complete Epic 1 first.'
    exit 1
}

Ensure-UsersCsv -CsvPath $usersCsv
Invoke-NpmInstall -PackageDir $backendDir -Label 'sg-search-service'

$frontendReady = $false
$frontendPkg = Join-Path $frontendDir 'package.json'
if (Test-Path $frontendPkg) {
    Invoke-NpmInstall -PackageDir $frontendDir -Label 'sg-search'
    $frontendReady = $true
} else {
    Write-Warning 'sg-search/ not found or missing package.json - skip frontend install (Epic 2). Backend setup completed.'
}

Write-NextSteps -FrontendReady $frontendReady
exit 0
