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
            ) -join "`n"
        }
        'NotFound' {
            return @(
                'GET /api/search returned 404.'
                'Implement Story 1.4 search route in sg-search-service/server.js'
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
                'Search response did not match users.csv fixture.'
                'Check users.csv and README search matrix in sg-search-service/'
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

function Get-WebStatusCode {
    param($Exception)
    if ($Exception.Response -and $Exception.Response.StatusCode) {
        return [int]$Exception.Response.StatusCode
    }
    return $null
}

function Invoke-LabGet {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Uri
    )

    try {
        $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec $TimeoutSec
        return @{
            Ok = $true
            StatusCode = [int]$response.StatusCode
            Content = $response.Content
        }
    } catch {
        $code = Get-WebStatusCode -Exception $_.Exception
        $body = $null
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                try {
                    $body = $reader.ReadToEnd()
                } finally {
                    $reader.Dispose()
                }
            }
        }
        return @{
            Ok = $false
            StatusCode = $code
            Content = $body
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
