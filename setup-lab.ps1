# setup-lab.ps1 - Bootstrap Search App lab dependencies (Story 3.1)
# Run from repo root: .\setup-lab.ps1
# If blocked: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

$ErrorActionPreference = 'Stop'

Set-Location -LiteralPath $PSScriptRoot

function Test-NodeVersion {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Error 'Node.js is not on PATH. Install Node.js 20.19.0+ and retry.'
        exit 1
    }

    $versionOutput = & node -v 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to run node -v: $versionOutput"
        exit 1
    }

    $versionStr = ($versionOutput | Out-String).Trim()
    $major = $null
    $minor = 0
    $patch = 0

    if ($versionStr -match '^v?(\d+)\.(\d+)\.(\d+)') {
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
        $patch = [int]$Matches[3]
    } elseif ($versionStr -match '^v?(\d+)\.(\d+)') {
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
    } elseif ($versionStr -match '^v?(\d+)') {
        $major = [int]$Matches[1]
    } else {
        Write-Error "Could not parse Node version from: $versionStr"
        exit 1
    }

    if ($major -lt 18) {
        Write-Error "Node.js 20.19.0+ required; found $versionStr"
        exit 1
    }

    $meetsMongoose = ($major -gt 20) -or ($major -eq 20 -and $minor -ge 19)
    if (-not $meetsMongoose) {
        Write-Host ('WARN - Node.js 20.19.0+ recommended (Mongoose 9.x); found ' + $versionStr) -ForegroundColor Yellow
        Write-Host '       Upgrade Node before npm start if mongoose install or startup fails.' -ForegroundColor Yellow
        return $false
    }

    Write-Host "Node $versionStr OK" -ForegroundColor DarkGray
    return $true
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

function Write-FacilitatorEnvInstructions {
    param([string]$ExamplePath)

    Write-Host ''
    Write-Host 'Facilitator: provide the shared Atlas connection string securely before the lab.' -ForegroundColor Yellow
    Write-Host 'Participant steps:' -ForegroundColor Yellow
    Write-Host '  cd sg-search-service' -ForegroundColor White
    Write-Host '  Copy-Item .env.example .env' -ForegroundColor White
    Write-Host '  Paste MONGODB_URI into .env (quote the value if it contains # or = characters)' -ForegroundColor White
    if ($ExamplePath -and (Test-Path $ExamplePath)) {
        Write-Host '  See comments in sg-search-service/.env.example for quoting guidance.' -ForegroundColor DarkGray
    }
    Write-Host 'See sg-search-service/README.md and LAB-03-Search-App-Guide.md Step 2 for details.' -ForegroundColor DarkGray
}

function Test-MongodbEnv {
    param([string]$BackendDir)

    $envPath = Join-Path $BackendDir '.env'
    $examplePath = Join-Path $BackendDir '.env.example'

    if (-not (Test-Path $envPath)) {
        Write-Host 'WARN - sg-search-service/.env not found' -ForegroundColor Yellow
        Write-FacilitatorEnvInstructions -ExamplePath $examplePath
        return $false
    }

    $uri = $null
    try {
        $lines = Get-Content -LiteralPath $envPath -Encoding UTF8
    } catch {
        Write-Host 'WARN - Cannot read sg-search-service/.env' -ForegroundColor Yellow
        Write-FacilitatorEnvInstructions -ExamplePath $examplePath
        return $false
    }

    foreach ($line in $lines) {
        $trimmed = $line.Trim().TrimStart([char]0xFEFF)
        if ($trimmed -match '^\s*MONGODB_URI\s*=\s*(.+)$' -and -not $trimmed.StartsWith('#')) {
            $candidate = $Matches[1].Trim().Trim('"').Trim("'")
            if (-not [string]::IsNullOrWhiteSpace($candidate)) {
                $uri = $candidate
                break
            }
        }
    }

    if ([string]::IsNullOrWhiteSpace($uri)) {
        Write-Host 'WARN - MONGODB_URI is missing or empty in .env' -ForegroundColor Yellow
        Write-FacilitatorEnvInstructions -ExamplePath $examplePath
        return $false
    }

    Write-Host 'MongoDB .env configured (MONGODB_URI present)' -ForegroundColor DarkGray
    return $true
}

function Ensure-UsersCsv {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CsvPath
    )

    if (Test-Path $CsvPath) {
        Write-Host 'users.csv seed fixture present (auto-seed input only)' -ForegroundColor DarkGray
        return
    }

    Write-Host 'Creating users.csv seed fixture (auto-seed input only)...' -ForegroundColor Yellow
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
    param(
        [bool]$FrontendReady,
        [bool]$MongodbReady,
        [bool]$EnvFileExists,
        [bool]$NodeReady = $true
    )

    Write-Host ''
    Write-Host '=== Lab setup complete ===' -ForegroundColor Green
    Write-Host ''
    if (-not $NodeReady) {
        Write-Host 'Note: Upgrade to Node.js 20.19.0+ before npm start (Mongoose 9.x requirement).' -ForegroundColor Yellow
        Write-Host ''
    }
    Write-Host 'Terminal 1 - Backend (port 3001):' -ForegroundColor Cyan
    Write-Host '  cd sg-search-service' -ForegroundColor White
    if (-not $MongodbReady) {
        if ($EnvFileExists) {
            Write-Host '  Edit .env: set non-empty MONGODB_URI (get value from facilitator)' -ForegroundColor White
        } else {
            Write-Host '  Copy-Item .env.example .env    # paste facilitator MONGODB_URI' -ForegroundColor White
        }
    }
    Write-Host '  npm start                      # connect -> auto-seed -> listen' -ForegroundColor White
    Write-Host ''
    if ($FrontendReady) {
        Write-Host 'Terminal 2 - Frontend (port 3000):' -ForegroundColor Cyan
        Write-Host '  cd sg-search' -ForegroundColor White
        Write-Host '  npm start' -ForegroundColor White
    } else {
        Write-Host 'Terminal 2 - Frontend (port 3000):' -ForegroundColor Cyan
        Write-Host '  cd sg-search' -ForegroundColor White
        Write-Host '  npm start' -ForegroundColor DarkGray
        Write-Host '  (sg-search not found - skip frontend until available)' -ForegroundColor Yellow
    }
    Write-Host ''
    Write-Host 'Smoke test (with backend running):' -ForegroundColor Cyan
    Write-Host '  curl http://127.0.0.1:3001/health' -ForegroundColor White
    Write-Host ''
    Write-Host 'Full verification: .\verify-lab.ps1 (backend must be running)' -ForegroundColor DarkGray
}

Write-Host 'Search App Lab - setup' -ForegroundColor Green
Write-Host "Project root: $PSScriptRoot`n" -ForegroundColor DarkGray

$nodeReady = Test-NodeVersion
Test-NpmPresent

$backendDir = Join-Path $PSScriptRoot 'sg-search-service'
$frontendDir = Join-Path $PSScriptRoot 'sg-search'
$usersCsv = Join-Path $backendDir 'users.csv'

if (-not (Test-Path (Join-Path $backendDir 'package.json'))) {
    Write-Error 'sg-search-service/package.json not found. Complete Epic 1 first.'
    exit 1
}

Ensure-UsersCsv -CsvPath $usersCsv
$envFileExists = Test-Path (Join-Path $backendDir '.env')
$mongodbReady = Test-MongodbEnv -BackendDir $backendDir
Invoke-NpmInstall -PackageDir $backendDir -Label 'sg-search-service'

$frontendReady = $false
$frontendPkg = Join-Path $frontendDir 'package.json'
if (Test-Path $frontendPkg) {
    Invoke-NpmInstall -PackageDir $frontendDir -Label 'sg-search'
    $frontendReady = $true
} else {
    Write-Warning 'sg-search/ not found or missing package.json - skip frontend install (Epic 2). Backend setup completed.'
}

Write-NextSteps -FrontendReady $frontendReady -MongodbReady $mongodbReady -EnvFileExists $envFileExists -NodeReady $nodeReady
exit 0
