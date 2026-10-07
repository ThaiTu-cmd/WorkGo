# ------------------------------------------------------------------------------
# Automated Test Suite for WorkGo Service Runner (run.ps1)
# ------------------------------------------------------------------------------

$rootDir = Split-Path -Parent $PSScriptRoot
$runScript = Join-Path $rootDir "run.ps1"

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "                TESTING WORKGO SERVICE RUNNER (run.ps1)                " -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Assert-Test([string]$TestName, [bool]$Condition, [string]$Details = "") {
    if ($Condition) {
        Write-Host "  [PASS] $TestName" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  [FAIL] $TestName" -ForegroundColor Red
        if ($Details) {
            Write-Host "         Reason: $Details" -ForegroundColor Yellow
        }
        $script:testsFailed++
    }
}

# ------------------------------------------------------------------------------
# Test 1: Status command
# ------------------------------------------------------------------------------
Write-Host "Test Group 1: Status Dashboard..." -ForegroundColor Yellow
$out1 = (& powershell.exe -ExecutionPolicy Bypass -File $runScript -Status) -join "`n"
$exit1 = $LASTEXITCODE

Assert-Test "run.ps1 -Status exits with code 0" ($exit1 -eq 0) "Exit code was $exit1"
Assert-Test "Output contains identity-service" ($out1 -match "identity-service")
Assert-Test "Output contains api-gateway" ($out1 -match "api-gateway")
Assert-Test "Output contains catalog-service" ($out1 -match "catalog-service")
Assert-Test "Output contains order-service" ($out1 -match "order-service")
Assert-Test "Output contains payment-service" ($out1 -match "payment-service")

# ------------------------------------------------------------------------------
# Test 2: Help command
# ------------------------------------------------------------------------------
Write-Host "`nTest Group 2: Help Guide..." -ForegroundColor Yellow
$out2 = (& powershell.exe -ExecutionPolicy Bypass -File $runScript -Help) -join "`n"
$exit2 = $LASTEXITCODE

Assert-Test "run.ps1 -Help exits with code 0" ($exit2 -eq 0) "Exit code was $exit2"
Assert-Test "Output contains Guide Title" ($out2 -match "WORKGO SERVICE RUNNER GUIDE")
Assert-Test "Output documents -Force flag" ($out2 -match "-Force")

# ------------------------------------------------------------------------------
# Test 3: Clean command
# ------------------------------------------------------------------------------
Write-Host "`nTest Group 3: Clean Command..." -ForegroundColor Yellow
$out3 = (& powershell.exe -ExecutionPolicy Bypass -File $runScript -Clean) -join "`n"
$exit3 = $LASTEXITCODE

Assert-Test "run.ps1 -Clean exits with code 0" ($exit3 -eq 0) "Exit code was $exit3"
Assert-Test "Output indicates clean ports status" ($out3 -match "All microservices ports are clean|Successfully cleaned")

# ------------------------------------------------------------------------------
# Test 4: Stop command on stopped service
# ------------------------------------------------------------------------------
Write-Host "`nTest Group 4: Stop Command..." -ForegroundColor Yellow
$out4 = (& powershell.exe -ExecutionPolicy Bypass -File $runScript identity-service -Stop) -join "`n"
$exit4 = $LASTEXITCODE

Assert-Test "run.ps1 identity-service -Stop exits with code 0" ($exit4 -eq 0) "Exit code was $exit4"

# ------------------------------------------------------------------------------
# Test 5: Validation Handling
# ------------------------------------------------------------------------------
Write-Host "`nTest Group 5: Validation Handling..." -ForegroundColor Yellow
$out5 = (& powershell.exe -ExecutionPolicy Bypass -File $runScript non-existent-service 2>&1) -join "`n"
$exit5 = $LASTEXITCODE

Assert-Test "run.ps1 with invalid service exits with code 1" ($exit5 -ne 0) "Exit code was $exit5"
Assert-Test "Error message reports invalid service" ($out5 -match "Invalid service name")

# ------------------------------------------------------------------------------
# Test 6: Alias & Short Service Name Normalization
# ------------------------------------------------------------------------------
Write-Host "`nTest Group 6: Service Alias Normalization..." -ForegroundColor Yellow
$out6a = (& powershell.exe -ExecutionPolicy Bypass -File $runScript identity -Stop) -join "`n"
$exit6a = $LASTEXITCODE
Assert-Test "run.ps1 identity -Stop normalizes alias to identity-service" ($exit6a -eq 0)

$out6b = (& powershell.exe -ExecutionPolicy Bypass -File $runScript gateway -Stop) -join "`n"
$exit6b = $LASTEXITCODE
Assert-Test "run.ps1 gateway -Stop normalizes alias to api-gateway" ($exit6b -eq 0)

$out6c = (& powershell.exe -ExecutionPolicy Bypass -File $runScript catalog -Stop) -join "`n"
$exit6c = $LASTEXITCODE
Assert-Test "run.ps1 catalog -Stop normalizes alias to catalog-service" ($exit6c -eq 0)

# ------------------------------------------------------------------------------
# Test 7: Pre-flight Database Docker Connectivity
# ------------------------------------------------------------------------------
Write-Host "`nTest Group 7: Database Pre-flight Checks..." -ForegroundColor Yellow
$connIdentityDb = Test-NetConnection -ComputerName "localhost" -Port 5433 -WarningAction SilentlyContinue
Assert-Test "PostgreSQL identity database port 5433 is listening" ($connIdentityDb.TcpTestSucceeded -eq $true)

$connCatalogDb = Test-NetConnection -ComputerName "localhost" -Port 5434 -WarningAction SilentlyContinue
Assert-Test "PostgreSQL catalog database port 5434 is listening" ($connCatalogDb.TcpTestSucceeded -eq $true)

# ------------------------------------------------------------------------------
# Test 8: Active Listener Detection & Clean Recovery
# ------------------------------------------------------------------------------
Write-Host "`nTest Group 8: Mock Listener Detection & Reclaim..." -ForegroundColor Yellow
$mockPort = 8084 # Payment service default port
$listenerJob = Start-Job -ScriptBlock {
    param($port)
    $ip = [System.Net.IPAddress]::Loopback
    $listener = New-Object System.Net.Sockets.TcpListener($ip, $port)
    $listener.Start()
    Start-Sleep -Seconds 15
    $listener.Stop()
} -ArgumentList $mockPort

# Wait for job to open port
Start-Sleep -Milliseconds 800

$statusWithMock = (& powershell.exe -ExecutionPolicy Bypass -File $runScript -Status) -join "`n"
Assert-Test "Status detects running process on port $mockPort" ($statusWithMock -match "payment-service\s+8084\s+\d+\s+\w+\s+RUNNING")

# Clean all zombie processes
$cleanResult = (& powershell.exe -ExecutionPolicy Bypass -File $runScript -Clean) -join "`n"
Assert-Test "Clean successfully reclaims occupied port" ($cleanResult -match "Freeing port 8084|All microservices ports are clean")

Stop-Job $listenerJob -ErrorAction SilentlyContinue | Out-Null
Remove-Job $listenerJob -Force -ErrorAction SilentlyContinue | Out-Null

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "RESULTS: $testsPassed Passed, $testsFailed Failed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

if ($testsFailed -gt 0) {
    exit 1
} else {
    exit 0
}
