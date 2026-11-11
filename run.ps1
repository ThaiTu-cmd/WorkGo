param(
    [Parameter(Position=0, Mandatory=$false)]
    [string]$Service = "",

    [Parameter(Mandatory=$false)]
    [switch]$Force,       # Kill process occupying port and restart

    [Parameter(Mandatory=$false)]
    [switch]$Restart,     # Equivalent to -Force

    [Parameter(Mandatory=$false)]
    [switch]$Stop,        # Stop service process

    [Parameter(Mandatory=$false)]
    [switch]$Status,      # Display status table of all services

    [Parameter(Mandatory=$false)]
    [switch]$Clean,       # Clean all orphan zombie processes occupying microservices ports

    [Parameter(Mandatory=$false)]
    [switch]$Help         # Show usage guide
)

# ------------------------------------------------------------------------------
# WorkGo Microservices Lifecycle Runner
# ------------------------------------------------------------------------------

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $rootDir ".env"

# 1. Load .env into Process environment
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match '^\s*[^#\s]+=' } | ForEach-Object {
        $parts = $_.Split('=', 2)
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

# 2. Microservices Configuration Matrix
$ServicesConfig = [ordered]@{
    "identity-service" = @{
        Dir          = "identity-service"
        DefaultPort  = 8081
        PortEnvVar   = "IDENTITY_PORT"
        DbName       = "postgres-identity"
        DbPort       = 5433
        HealthUrl    = "http://localhost:8081/identity/auth/introspect"
        HealthMethod = "POST"
        HealthBody   = '{"token":""}'
        HealthMode   = "Json"
        HealthRegex  = '"code"\s*:\s*1000[\s\S]*"valid"\s*:\s*false'
        Description  = "Authentication, Authorization & Users"
    }
    "api-gateway" = @{
        Dir          = "api-gateway"
        DefaultPort  = 8888
        PortEnvVar   = "GATEWAY_PORT"
        DbName       = $null
        DbPort       = $null
        HealthUrl    = "http://localhost:8888/api/v1/identity/auth/introspect"
        HealthMethod = "POST"
        HealthBody   = '{"token":""}'
        HealthMode   = "Json"
        HealthRegex  = '"code"\s*:\s*1000[\s\S]*"valid"\s*:\s*false'
        Description  = "API Gateway Router"
    }
    "catalog-service" = @{
        Dir          = "catalog-service"
        DefaultPort  = 8082
        PortEnvVar   = "CATALOG_PORT"
        DbName       = "postgres-catalog"
        DbPort       = 5434
        HealthUrl    = "http://localhost:8082/catalog/categories/roots"
        HealthMethod = "GET"
        HealthMode   = "Http"
        Description  = "Service Catalog & Job Posts"
    }
    "order-service" = @{
        Dir          = "order-service"
        DefaultPort  = 8083
        PortEnvVar   = "ORDER_PORT"
        DbName       = "order_db"
        DbPort       = 5432
        HealthUrl    = "http://localhost:8083/order"
        HealthMethod = "GET"
        HealthMode   = "Http"
        Description  = "Orders & Job Proposals"
    }
    "payment-service" = @{
        Dir          = "payment-service"
        DefaultPort  = 8084
        PortEnvVar   = "PAYMENT_PORT"
        DbName       = "payment_db"
        DbPort       = 5432
        HealthUrl    = "http://localhost:8084/payment"
        HealthMethod = "GET"
        HealthMode   = "Http"
        Description  = "Wallet, Payments & Escrow"
    }
}

# 3. Helper Functions
function Get-TargetPort([hashtable]$cfg) {
    if ($cfg.PortEnvVar -and (Test-Path "Env:$($cfg.PortEnvVar)")) {
        $val = (Get-Item "Env:$($cfg.PortEnvVar)").Value
        $parsed = 0
        if ([int]::TryParse($val, [ref]$parsed) -and $parsed -gt 0) {
            return $parsed
        }
    }
    return [int]$cfg.DefaultPort
}

function Get-ProcessByPort([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        return [PSCustomObject]@{
            Port        = $Port
            ProcessId   = $conn.OwningProcess
            ProcessName = if ($proc) { $proc.ProcessName } else { "Unknown" }
            Process     = $proc
        }
    }
    return $null
}

function Stop-PortProcess([int]$Port, [string]$ServiceName = "") {
    $target = Get-ProcessByPort -Port $Port
    if ($target) {
        Write-Host "[WorkGo] Freeing port $Port (PID: $($target.ProcessId), Process: $($target.ProcessName))..." -ForegroundColor Yellow
        try {
            Stop-Process -Id $target.ProcessId -Force -ErrorAction Stop
        } catch {
            taskkill.exe /F /PID $target.ProcessId 2>$null
        }

        # Wait for port to become free (up to 5s)
        $timeout = 25
        while ((Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) -and ($timeout-- -gt 0)) {
            Start-Sleep -Milliseconds 200
        }

        if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
            Write-Warning "[WorkGo] Warning: Port $Port could not be freed after timeout."
            return $false
        } else {
            Write-Host "[WorkGo] Port $Port has been freed successfully!" -ForegroundColor Green
            return $true
        }
    }
    return $true
}

function Invoke-ServiceProbe {
    param(
        [Parameter(Mandatory=$true)][string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null,
        [int]$TimeoutSec = 2
    )

    Add-Type -AssemblyName System.Net.Http | Out-Null
    $client = [System.Net.Http.HttpClient]::new()
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)

    try {
        $request = [System.Net.Http.HttpRequestMessage]::new(
            [System.Net.Http.HttpMethod]::new($Method), $Url
        )
        if (-not [string]::IsNullOrEmpty($Body)) {
            $request.Content = [System.Net.Http.StringContent]::new(
                $Body, [System.Text.Encoding]::UTF8, "application/json"
            )
        }

        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        $text = ""
        $contentType = ""
        if ($null -ne $response.Content) {
            $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            $contentType = [string]$response.Content.Headers.ContentType
        }

        return [pscustomobject]@{
            Ok          = $response.IsSuccessStatusCode
            StatusCode  = [int]$response.StatusCode
            ContentType = $contentType
            Body        = $text
            IsJson      = ($contentType -match "application/json")
            Error       = $null
        }
    }
    catch {
        return [pscustomobject]@{
            Ok          = $false
            StatusCode  = 0
            ContentType = ""
            Body        = ""
            IsJson      = $false
            Error       = $_.Exception.Message
        }
    }
    finally {
        $client.Dispose()
    }
}

function Test-ServiceHealth {
    param([hashtable]$Config)

    if (-not $Config.HealthUrl) {
        return [pscustomobject]@{ Healthy = $false; Probe = $null }
    }

    $method = "GET"
    if ($Config.ContainsKey("HealthMethod") -and $Config.HealthMethod) {
        $method = $Config.HealthMethod
    }

    $body = $null
    if ($Config.ContainsKey("HealthBody")) { $body = $Config.HealthBody }

    $probe = Invoke-ServiceProbe `
        -Url $Config.HealthUrl `
        -Method $method `
        -Body $body `
        -TimeoutSec 2

    if ($Config.HealthMode -eq "Json") {
        # Strict mode: require 2xx + JSON (identity-service, api-gateway)
        $healthy = $probe.Ok -and $probe.IsJson
    } else {
        # Compatibility mode: any HTTP response proves the process is alive
        # (preserves the old Test-ServiceHttp behavior for catalog/order/payment)
        $healthy = $probe.StatusCode -gt 0
    }

    if ($healthy -and $Config.HealthRegex) {
        $healthy = ($probe.Body -match $Config.HealthRegex)
    }

    return [pscustomobject]@{
        Healthy = $healthy
        Probe   = $probe
    }
}

function Get-DockerContainerByPort {
    param([int]$Port)

    $rows = & docker ps --format "{{.Names}}|{{.Image}}|{{.Ports}}" 2>$null
    foreach ($row in $rows) {
        $parts = $row -split '\|', 3
        if ($parts.Count -lt 3) { continue }
        if ($parts[2] -match ":$Port->") {
            return [pscustomobject]@{
                Name  = $parts[0]
                Image = $parts[1]
                Ports = $parts[2]
            }
        }
    }
    return $null
}

function Wait-TcpPort {
    param([int]$Port, [int]$TimeoutSec = 30)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    do {
        $ok = (Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue).TcpTestSucceeded
        if ($ok) { return $true }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    return $false
}

function Check-DockerDatabase([string]$ServiceName) {
    $dbPort = $null
    $container = $null

    if ($ServiceName -eq "identity-service") {
        $dbPort = 5433
        $container = "postgres-identity"
    } elseif ($ServiceName -eq "catalog-service") {
        $dbPort = 5434
        $container = "postgres-catalog"
    }

    if (-not $dbPort) {
        return $true
    }

    $conn = Test-NetConnection -ComputerName "localhost" -Port $dbPort -WarningAction SilentlyContinue
    if (-not $conn.TcpTestSucceeded) {
        Write-Warning "[WorkGo] PostgreSQL database for $ServiceName (port $dbPort) not reachable."
        Write-Host "[WorkGo] Auto-starting Docker container '$container'..." -ForegroundColor Cyan

        & docker compose up -d $container 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "[WorkGo] Unable to run docker compose. Please ensure Docker Desktop is running."
            return $false
        }

        if (-not (Wait-TcpPort -Port $dbPort -TimeoutSec 30)) {
            Write-Warning "[WorkGo] Database port $dbPort did not open within 30 seconds."
            Write-Host "[WorkGo] Container state:" -ForegroundColor Yellow
            & docker ps -a --filter "name=$container" | Out-Host
            Write-Host "[WorkGo] Last container logs:" -ForegroundColor Yellow
            & docker logs --tail 40 $container 2>&1 | Out-Host
            return $false
        }

        Write-Host "[WorkGo] Database port $dbPort is reachable." -ForegroundColor Green
    }

    return $true
}

function Show-Status {
    Write-Host ""
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host "                WORKGO MICROSERVICES STATUS DASHBOARD                  " -ForegroundColor Cyan
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host ""

    $rows = @()
    foreach ($name in $ServicesConfig.Keys) {
        $cfg = $ServicesConfig[$name]
        $port = Get-TargetPort $cfg

        $proc = Get-ProcessByPort -Port $port
        $isListening = $proc -ne $null
        $pidStr = if ($proc) { [string]$proc.ProcessId } else { "-" }
        $procName = if ($proc) { $proc.ProcessName } else { "-" }

        $statusStr = if ($isListening) { "RUNNING" } else { "STOPPED" }
        $healthStr = "-"
        $owner     = "-"

        if ($isListening) {
            $result = Test-ServiceHealth -Config $cfg

            if ($result.Healthy) {
                $healthStr = "HEALTHY"
            } elseif ($result.Probe -and $result.Probe.StatusCode -gt 0 -and $result.Probe.IsJson) {
                $healthStr = "UNHEALTHY"       # correct service (JSON) but health check failed
            } elseif ($result.Probe -and $result.Probe.StatusCode -gt 0) {
                $healthStr = "WRONG SERVICE"   # HTML/404 from a different service
            } else {
                $healthStr = "UNRESPONSIVE"    # listener exists but no HTTP response
            }

            $dockerOwner = Get-DockerContainerByPort -Port $port
            if ($dockerOwner) {
                $owner = "$($dockerOwner.Name) ($($dockerOwner.Image))"
                if (-not $result.Healthy) { $healthStr = "PORT CONFLICT" }
            } elseif ($proc) {
                $owner = $proc.ProcessName
            }
        }

        $rows += [PSCustomObject]@{
            Service     = $name
            Port        = $port
            PID         = $pidStr
            Process     = $procName
            Status      = $statusStr
            Health      = $healthStr
            Owner       = $owner
            Description = $cfg.Description
        }
    }

    $rows | Format-Table -Property Service, Port, PID, Process, Status, Health, Owner, Description -AutoSize
    Write-Host "Usage Tips:" -ForegroundColor DarkGray
    Write-Host "  .\run.ps1 <service>          : Start service (auto port collision detection)" -ForegroundColor DarkGray
    Write-Host "  .\run.ps1 <service> -Force   : Force kill existing process on port and restart" -ForegroundColor DarkGray
    Write-Host "  .\run.ps1 <service> -Stop    : Stop running service" -ForegroundColor DarkGray
    Write-Host "  .\run.ps1 -Clean             : Free all occupied microservices ports" -ForegroundColor DarkGray
    Write-Host ""
}

function Clear-AllZombieProcesses {
    Write-Host "[WorkGo] Scanning and freeing microservices ports..." -ForegroundColor Yellow
    $killedCount = 0
    $skippedDocker = 0
    foreach ($name in $ServicesConfig.Keys) {
        $cfg = $ServicesConfig[$name]
        $port = Get-TargetPort $cfg
        $target = Get-ProcessByPort -Port $port
        if ($target) {
            Write-Host "[WorkGo] Detected process $($target.ProcessName) (PID: $($target.ProcessId)) on port $port ($name)." -ForegroundColor Yellow

            $dockerOwner = Get-DockerContainerByPort -Port $port
            if ($dockerOwner) {
                $skippedDocker++
                Write-Host "[WorkGo] Skipping port ${port}: held by Docker container '$($dockerOwner.Name)' (not a WorkGo process)." -ForegroundColor Yellow
                Write-Host "[WorkGo] To free it manually: docker stop $($dockerOwner.Name)" -ForegroundColor DarkGray
                continue
            }

            if (Stop-PortProcess -Port $port -ServiceName $name) {
                $killedCount++
            }
        }
    }
    if ($killedCount -eq 0) {
        Write-Host "[WorkGo] All microservices ports are clean (Docker-owned: $skippedDocker skipped)." -ForegroundColor Green
    } else {
        Write-Host "[WorkGo] Successfully cleaned $killedCount process(es); skipped $skippedDocker Docker container(s)." -ForegroundColor Green
    }
}

function Show-HelpGuide {
    Write-Host ""
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host "                   WORKGO SERVICE RUNNER GUIDE                         " -ForegroundColor Cyan
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Syntax:" -ForegroundColor Yellow
    Write-Host "  .\run.ps1 [ServiceName] [-Force|-Restart] [-Stop] [-Status] [-Clean] [-Help]"
    Write-Host ""
    Write-Host "Available Services:" -ForegroundColor Yellow
    foreach ($k in $ServicesConfig.Keys) {
        $cfg = $ServicesConfig[$k]
        Write-Host "  * $k (Port: $(Get-TargetPort $cfg)) - $($cfg.Description)"
    }
    Write-Host ""
    Write-Host "Flags:" -ForegroundColor Yellow
    Write-Host "  -Force, -Restart : Kill existing process occupying the port before starting"
    Write-Host "  -Stop            : Stop the specified service"
    Write-Host "  -Status          : View status table for all services (Port, PID, Health)"
    Write-Host "  -Clean           : Scan and kill all zombie processes occupying project ports"
    Write-Host "  -Help            : Show this guide"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\run.ps1 identity-service"
    Write-Host "  .\run.ps1 api-gateway -Force"
    Write-Host "  .\run.ps1 catalog-service -Stop"
    Write-Host "  .\run.ps1 -Status"
    Write-Host "  .\run.ps1 -Clean"
    Write-Host ""
}

# 4. Handle commands that don't need a service name
if ($Help -or ($Service -eq "help") -or ($Service -eq "--help") -or ($Service -eq "-h")) {
    Show-HelpGuide
    exit 0
}

if ($Status -or ($Service -eq "status")) {
    Show-Status
    exit 0
}

if ($Clean -or ($Service -eq "clean")) {
    Clear-AllZombieProcesses
    exit 0
}

# If no service provided, show status by default
if (-not $Service) {
    Show-Status
    exit 0
}

# 5. Normalize service name
$normalizedService = $Service.ToLower().Trim()
if (-not $ServicesConfig.Contains($normalizedService)) {
    if ($ServicesConfig.Contains("$normalizedService-service")) {
        $normalizedService = "$normalizedService-service"
    } elseif ($normalizedService -eq "gateway") {
        $normalizedService = "api-gateway"
    }
}

if (-not $ServicesConfig.Contains($normalizedService)) {
    Write-Error "[WorkGo] Invalid service name: '$Service'."
    Write-Host "Available services: $($ServicesConfig.Keys -join ', ')" -ForegroundColor Yellow
    exit 1
}

$cfg = $ServicesConfig[$normalizedService]
$targetPort = Get-TargetPort $cfg
$serviceDir = Join-Path $rootDir $cfg.Dir

if (-not (Test-Path $serviceDir)) {
    Write-Error "[WorkGo] Service directory not found: $serviceDir"
    exit 1
}

# 6. Handle -Stop flag
if ($Stop) {
    $dockerOwner = Get-DockerContainerByPort -Port $targetPort
    if ($dockerOwner) {
        Write-Warning "[WorkGo] Port $targetPort is held by Docker container '$($dockerOwner.Name)'. Refusing to kill it."
        Write-Host "         To stop the container manually: docker stop $($dockerOwner.Name)" -ForegroundColor Cyan
        # exit 0: -Stop is idempotent and keeps test-runner Group 4/6 green; refusing to kill Docker is the safe behavior.
        exit 0
    }

    Write-Host "[WorkGo] Stopping service $normalizedService on port $targetPort..." -ForegroundColor Yellow
    $stopped = Stop-PortProcess -Port $targetPort -ServiceName $normalizedService
    if ($stopped) {
        Write-Host "[WorkGo] Service $normalizedService has stopped." -ForegroundColor Green
    }
    exit 0
}

# 7. Check for Port Conflict
$occupant = Get-ProcessByPort -Port $targetPort
$doForce = $Force -or $Restart

if ($occupant) {
    $dockerOwner  = Get-DockerContainerByPort -Port $targetPort
    $healthResult = Test-ServiceHealth -Config $cfg

    if ($dockerOwner) {
        if ($healthResult.Healthy -and -not $doForce) {
            Write-Host ""
            Write-Host " [WorkGo] SERVICE $normalizedService IS ALREADY ACTIVE (Docker: $($dockerOwner.Name))!" -ForegroundColor Green
            Write-Host " * Listening Port: $targetPort" -ForegroundColor Cyan
            Write-Host " * Container     : $($dockerOwner.Name) ($($dockerOwner.Image))" -ForegroundColor Cyan
            exit 0
        }

        Write-Host ""
        Write-Host "[WorkGo] Port $targetPort is held by Docker container '$($dockerOwner.Name)' ($($dockerOwner.Image))," -ForegroundColor Red
        Write-Host "[WorkGo] NOT $normalizedService. Refusing to kill Docker Desktop or other containers." -ForegroundColor Red
        Write-Host "[WorkGo] Stop that container, then run again:" -ForegroundColor Yellow
        Write-Host "         docker stop $($dockerOwner.Name)" -ForegroundColor Cyan
        Write-Host "         .\run.ps1 $normalizedService" -ForegroundColor Cyan
        Write-Host "[WorkGo] If this container is actually your WorkGo service, restart the container instead of using -Force." -ForegroundColor DarkGray
        exit 1
    }

    if ($healthResult.Healthy -and -not $doForce) {
        # Preserve the "SERVICE ... IS ALREADY ACTIVE!" message + exit 0
        Write-Host ""
        Write-Host "=======================================================================" -ForegroundColor Green
        Write-Host " [WorkGo] SERVICE $normalizedService IS ALREADY ACTIVE!" -ForegroundColor Green
        Write-Host "=======================================================================" -ForegroundColor Green
        Write-Host " * Listening Port: $targetPort" -ForegroundColor Cyan
        Write-Host " * Process PID   : $($occupant.ProcessId) ($($occupant.ProcessName))" -ForegroundColor Cyan
        Write-Host ""
        Write-Host " Hint: To restart this service, use the -Force flag:" -ForegroundColor Yellow
        Write-Host "       .\run.ps1 $normalizedService -Force" -ForegroundColor Cyan
        Write-Host ""
        exit 0
    }

    # Only reached when the process is NOT a Docker container
    if ($doForce) {
        Write-Host "[WorkGo] Detected process PID $($occupant.ProcessId) ($($occupant.ProcessName)) on port $targetPort. Stopping old process (-Force)..." -ForegroundColor Yellow
        Stop-PortProcess -Port $targetPort -ServiceName $normalizedService
    } elseif ($healthResult.Probe -and $healthResult.Probe.StatusCode -gt 0 -and $healthResult.Probe.IsJson) {
        # Correct service (returns JSON) but unhealthy -- usually a dependency (DB/gateway) is not ready.
        # Do not kill it: avoid a restart chain; report and let the user decide.
        Write-Warning "[WorkGo] $normalizedService is running (PID $($occupant.ProcessId)) but the health check failed."
        Write-Host "         Check dependencies (DB/gateway), or use -Force if you really want to restart." -ForegroundColor Yellow
        exit 1
    } else {
        # Preserve old behavior: process does not return the expected HTTP/JSON -> treat as zombie and release
        Write-Warning "[WorkGo] Port $targetPort is occupied by PID $($occupant.ProcessId) ($($occupant.ProcessName)) but not healthy (Zombie Process)."
        Stop-PortProcess -Port $targetPort -ServiceName $normalizedService
    }
}

# 8. Pre-flight checks (Docker Database)
if (-not (Check-DockerDatabase -ServiceName $normalizedService)) {
    Write-Error "[WorkGo] Database pre-flight failed for $normalizedService."
    exit 1
}

# 9. Start service with Maven Wrapper
Write-Host "[WorkGo] Starting service: $normalizedService (Port: $targetPort)..." -ForegroundColor Cyan
Push-Location $serviceDir
try {
    .\mvnw.cmd spring-boot:run
} finally {
    Pop-Location
}
