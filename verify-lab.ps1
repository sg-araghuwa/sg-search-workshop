# verify-lab.ps1 - Smoke-test Search App lab API (Story 3.2)
# Prerequisite: backend running (cd sg-search-service; npm start)
# Run from repo root: .\verify-lab.ps1
# Port override: $env:PORT=3002; .\verify-lab.ps1 -ApiBaseUrl http://127.0.0.1:3002

param(
    [string]$ApiBaseUrl = '',
    [string]$FrontendUrl = 'http://127.0.0.1:3000',
    [int]$TimeoutSec = 5,
    [switch]$SkipFrontend
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Resolve-ApiBaseUrl {
    param([string]$Override)

    if (-not [string]::IsNullOrWhiteSpace($Override)) {
        return $Override.TrimEnd('/')
    }

    if ($env:PORT) {
        $portNum = 0
        if (-not [int]::TryParse($env:PORT, [ref]$portNum) -or $portNum -lt 1 -or $portNum -gt 65535) {
            Write-Error ('Invalid $env:PORT value "' + $env:PORT + '". Use a numeric port 1-65535 or pass -ApiBaseUrl.')
            exit 1
        }
        return 'http://127.0.0.1:' + $portNum
    }

    return 'http://127.0.0.1:3001'
}

$ApiBaseUrl = Resolve-ApiBaseUrl -Override $ApiBaseUrl

$script:RequiredUserFields = @(
    'firstName', 'lastName', 'email', 'department', 'city'
)

function Get-LabTroubleshootingHint {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet(
            'ConnectionRefused',
            'NotFound',
            'PortConflict',
            'SearchFailed',
            'HealthFailed',
            'FrontendUnreachable',
            'CorsBrowser',
            'FileProtocol'
        )]
        [string]$FailureType
    )

    switch ($FailureType) {
        'ConnectionRefused' {
            return @(
                'Backend not running or wrong port.'
                '  cd sg-search-service'
                '  npm start'
                'Port in use? Try: $env:PORT=3002; npm start'
                'Then re-run: .\verify-lab.ps1 -ApiBaseUrl http://127.0.0.1:3002'
                'MongoDB startup failed?'
                '  Ensure sg-search-service/.env exists with MONGODB_URI set'
                '  Check terminal for ''Startup failed: MONGODB_URI is required'' or Atlas connection errors'
                '  Ask facilitator about Atlas IP allowlist / VPN'
            ) -join "`n"
        }
        'NotFound' {
            return @(
                'GET /api/search returned 404.'
                '  Confirm API base URL (default http://127.0.0.1:3001)'
                '  Ensure npm start completed without ''Startup failed:'' errors'
            ) -join "`n"
        }
        'PortConflict' {
            return @(
                'Port conflict or wrong API base URL.'
                'Try: $env:PORT=3002; npm start'
                'Then: .\verify-lab.ps1 -ApiBaseUrl http://127.0.0.1:3002'
            ) -join "`n"
        }
        'SearchFailed' {
            return @(
                'Search count mismatch after MongoDB migration?'
                '  Restart: cd sg-search-service; npm start'
                '  Confirm log: ''Connected to MongoDB — N users in users collection'''
                '  Auto-seed upserts from users.csv at startup - no manual seed step'
                '  See README search matrix in sg-search-service/'
                '(Facilitator) Shared Atlas may log N>12 users; verify still expects search counts 1 and 3.'
            ) -join "`n"
        }
        'HealthFailed' {
            return 'GET /health must return 200 with JSON { "status": "ok" } (Story 1.3).'
        }
        'FrontendUnreachable' {
            return @(
                'Frontend not reachable on port 3000.'
                'After Epic 2: cd sg-search; npm start (npx serve -l 3000)'
                'Do not open HTML via file:// - use http://127.0.0.1:3000'
            ) -join "`n"
        }
        'CorsBrowser' {
            return 'Browser CORS errors: add app.use(cors()) in server.js (Story 1.5).'
        }
        'FileProtocol' {
            return 'Fetch from file:// fails. Serve frontend over HTTP on port 3000.'
        }
    }
}

function Get-ConnectionFailureHint {
    if ($env:PORT) {
        return Get-LabTroubleshootingHint -FailureType PortConflict
    }
    return Get-LabTroubleshootingHint -FailureType ConnectionRefused
}

function Invoke-LabGet {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Uri
    )

    # HttpWebRequest reads error response bodies reliably on PowerShell 5.1
    # (Invoke-WebRequest often returns an empty body on 4xx/5xx).
    $request = [System.Net.HttpWebRequest]::Create($Uri)
    $request.Method = 'GET'
    $request.Timeout = $TimeoutSec * 1000
    $request.UserAgent = 'verify-lab.ps1'

    try {
        $response = $request.GetResponse()
        try {
            $stream = $response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            try {
                $content = $reader.ReadToEnd()
            } finally {
                $reader.Close()
            }
            return @{
                Ok = $true
                StatusCode = [int]$response.StatusCode
                Content = $content
            }
        } finally {
            $response.Close()
        }
    } catch [System.Net.WebException] {
        $webResponse = $_.Exception.Response
        $code = $null
        $content = $null
        if ($webResponse) {
            $code = [int]$webResponse.StatusCode
            $stream = $webResponse.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                try {
                    $content = $reader.ReadToEnd()
                } finally {
                    $reader.Close()
                }
            }
        }
        return @{
            Ok = $false
            StatusCode = $code
            Content = $content
            Error = $_.Exception.Message
        }
    }
}

function Write-TestResult {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$Detail = '',
        [string]$Hint = ''
    )

    if ($Passed) {
        Write-Host ('PASS - ' + $Name) -ForegroundColor Green
        if ($Detail) {
            Write-Host ('       ' + $Detail) -ForegroundColor DarkGray
        }
    } else {
        Write-Host ('FAIL - ' + $Name) -ForegroundColor Red
        if ($Detail) {
            Write-Host ('       ' + $Detail) -ForegroundColor Red
        }
        if ($Hint) {
            Write-Host '       Hint:' -ForegroundColor Yellow
            foreach ($line in ($Hint -split "`n")) {
                Write-Host ('         ' + $line) -ForegroundColor Yellow
            }
        }
    }

    return [PSCustomObject]@{
        Name = $Name
        Passed = $Passed
    }
}

function Test-HealthEndpoint {
    $uri = $ApiBaseUrl + '/health'
    $r = Invoke-LabGet -Uri $uri

    if (-not $r.StatusCode) {
        $hint = Get-ConnectionFailureHint
        return (Write-TestResult -Name 'Health endpoint' -Passed $false `
            -Detail ('Cannot reach ' + $uri + ' - ' + $r.Error) -Hint $hint)
    }

    if ($r.StatusCode -ne 200) {
        $hint = Get-LabTroubleshootingHint -FailureType HealthFailed
        return (Write-TestResult -Name 'Health endpoint' -Passed $false `
            -Detail ('HTTP ' + $r.StatusCode + ' from ' + $uri) -Hint $hint)
    }

    try {
        $json = $r.Content | ConvertFrom-Json
    } catch {
        $hint = Get-LabTroubleshootingHint -FailureType HealthFailed
        return (Write-TestResult -Name 'Health endpoint' -Passed $false `
            -Detail 'Response is not valid JSON' -Hint $hint)
    }

    if ($json.status -ne 'ok') {
        $hint = Get-LabTroubleshootingHint -FailureType HealthFailed
        return (Write-TestResult -Name 'Health endpoint' -Passed $false `
            -Detail ('status field is "' + $json.status + '", expected "ok"') -Hint $hint)
    }

    return (Write-TestResult -Name 'Health endpoint' -Passed $true `
        -Detail 'GET /health returned 200 with status ok')
}

function Test-SearchEndpoint {
    param(
        [string]$Query,
        [int]$ExpectedCount,
        [string]$TestLabel
    )

    $uri = $ApiBaseUrl + '/api/search' + $Query
    $r = Invoke-LabGet -Uri $uri

    if (-not $r.StatusCode) {
        $hint = Get-ConnectionFailureHint
        return (Write-TestResult -Name $TestLabel -Passed $false `
            -Detail ('Cannot reach ' + $uri) -Hint $hint)
    }

    if ($r.StatusCode -eq 404) {
        $hint = Get-LabTroubleshootingHint -FailureType NotFound
        return (Write-TestResult -Name $TestLabel -Passed $false `
            -Detail 'HTTP 404 - route not found' -Hint $hint)
    }

    if ($r.StatusCode -ne 200) {
        $hint = Get-LabTroubleshootingHint -FailureType SearchFailed
        return (Write-TestResult -Name $TestLabel -Passed $false `
            -Detail ('HTTP ' + $r.StatusCode + ' from ' + $uri) -Hint $hint)
    }

    try {
        $json = $r.Content | ConvertFrom-Json
    } catch {
        $hint = Get-LabTroubleshootingHint -FailureType SearchFailed
        return (Write-TestResult -Name $TestLabel -Passed $false `
            -Detail 'Response is not valid JSON' -Hint $hint)
    }

    if ($null -eq $json.count -or $null -eq $json.results) {
        $hint = Get-LabTroubleshootingHint -FailureType SearchFailed
        return (Write-TestResult -Name $TestLabel -Passed $false `
            -Detail 'JSON missing count or results' -Hint $hint)
    }

    if ([int]$json.count -ne $ExpectedCount) {
        $hint = Get-LabTroubleshootingHint -FailureType SearchFailed
        return (Write-TestResult -Name $TestLabel -Passed $false `
            -Detail ('count=' + $json.count + ', expected ' + $ExpectedCount) -Hint $hint)
    }

    $results = @($json.results)
    if ($results.Count -ne $ExpectedCount) {
        $hint = Get-LabTroubleshootingHint -FailureType SearchFailed
        return (Write-TestResult -Name $TestLabel -Passed $false `
            -Detail ('results length ' + $results.Count + ', expected ' + $ExpectedCount) -Hint $hint)
    }

    if ($ExpectedCount -gt 0) {
        $first = $results[0]
        foreach ($field in $script:RequiredUserFields) {
            if (-not ($first.PSObject.Properties.Name -contains $field)) {
                $hint = Get-LabTroubleshootingHint -FailureType SearchFailed
                return (Write-TestResult -Name $TestLabel -Passed $false `
                    -Detail ('result missing field: ' + $field) -Hint $hint)
            }
        }
    }

    return (Write-TestResult -Name $TestLabel -Passed $true `
        -Detail ('count=' + $ExpectedCount + ' as expected'))
}

function Test-SearchRequiresParams {
    $uri = $ApiBaseUrl + '/api/search'
    $r = Invoke-LabGet -Uri $uri

    if (-not $r.StatusCode) {
        $hint = Get-ConnectionFailureHint
        return (Write-TestResult -Name 'Search validation (no params)' -Passed $false `
            -Detail ('Cannot reach ' + $uri) -Hint $hint)
    }

    if ($r.StatusCode -eq 404) {
        $hint = Get-LabTroubleshootingHint -FailureType NotFound
        return (Write-TestResult -Name 'Search validation (no params)' -Passed $false `
            -Detail 'HTTP 404 - route not found' -Hint $hint)
    }

    if ($r.StatusCode -ne 400) {
        $hint = Get-LabTroubleshootingHint -FailureType SearchFailed
        return (Write-TestResult -Name 'Search validation (no params)' -Passed $false `
            -Detail ('HTTP ' + $r.StatusCode + ', expected 400') -Hint $hint)
    }

    try {
        $json = $r.Content | ConvertFrom-Json
    } catch {
        $hint = Get-LabTroubleshootingHint -FailureType SearchFailed
        return (Write-TestResult -Name 'Search validation (no params)' -Passed $false `
            -Detail '400 body is not JSON' -Hint $hint)
    }

    if (-not $json.error) {
        $hint = Get-LabTroubleshootingHint -FailureType SearchFailed
        return (Write-TestResult -Name 'Search validation (no params)' -Passed $false `
            -Detail '400 JSON missing error property' -Hint $hint)
    }

    return (Write-TestResult -Name 'Search validation (no params)' -Passed $true `
        -Detail 'HTTP 400 with error message')
}

function Test-FrontendOptional {
    if ($SkipFrontend) {
        Write-Host 'SKIP - Frontend reachability ( -SkipFrontend )' -ForegroundColor DarkGray
        return $null
    }

    $frontendDir = Join-Path $PSScriptRoot 'sg-search'
    if (-not (Test-Path (Join-Path $frontendDir 'package.json'))) {
        Write-Warning 'sg-search/ not found - skipping frontend probe (Epic 2).'
        Write-Host ('       ' + (Get-LabTroubleshootingHint -FailureType FileProtocol)) -ForegroundColor DarkGray
        return $null
    }

    $r = Invoke-LabGet -Uri $FrontendUrl

    if ($r.StatusCode -and $r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
        return (Write-TestResult -Name 'Frontend reachability' -Passed $true `
            -Detail ($FrontendUrl + ' responded HTTP ' + $r.StatusCode))
    }

    $hint = Get-LabTroubleshootingHint -FailureType FrontendUnreachable
    Write-Host 'WARN - Frontend reachability' -ForegroundColor Yellow
    Write-Host ('       ' + $FrontendUrl + ' not reachable (API checks still count)') -ForegroundColor Yellow
    Write-Host '       Hint:' -ForegroundColor Yellow
    foreach ($line in ($hint -split "`n")) {
        Write-Host ('         ' + $line) -ForegroundColor Yellow
    }
    Write-Host ('       ' + (Get-LabTroubleshootingHint -FailureType CorsBrowser)) -ForegroundColor DarkGray
    return $null
}

Write-Host 'Search App Lab - verify' -ForegroundColor Green
Write-Host ('API base: ' + $ApiBaseUrl) -ForegroundColor DarkGray
Write-Host ''

$results = @()
$results += Test-HealthEndpoint
$results += Test-SearchEndpoint -Query '?firstName=John&lastName=Smith' -ExpectedCount 1 `
    -TestLabel 'Search John+Smith'
$results += Test-SearchEndpoint -Query '?firstName=John' -ExpectedCount 3 `
    -TestLabel 'Search firstName=John'
$results += Test-SearchRequiresParams
$frontendResult = Test-FrontendOptional
if ($frontendResult) {
    $results += $frontendResult
}

$required = @($results | Where-Object { $null -ne $_ })
$failed = @($required | Where-Object { -not $_.Passed })

Write-Host ''
if ($failed.Count -eq 0) {
    Write-Host ('=== All ' + $required.Count + ' checks passed ===') -ForegroundColor Green
    exit 0
}

Write-Host ('=== ' + $failed.Count + ' of ' + $required.Count + ' checks failed ===') -ForegroundColor Red
exit 1
