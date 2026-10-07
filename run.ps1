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
        Description  = "Authentication, Authorization & Users"
    }
    "api-gateway" = @{
        Dir          = "api-gateway"
        DefaultPort  = 8888
        PortEnvVar   = "GATEWAY_PORT"
        DbName       = $null
        DbPort       = $null
        HealthUrl    = "http://localhost:8888/api/v1/identity"
        Description  = "API Gateway Router"
    }
    "catalog-service" = @{
        Dir          = "catalog-service"
        DefaultPort  = 8082
        PortEnvVar   = "CATALOG_PORT"
        DbName       = "postgres-catalog"
        DbPort       = 5434
        HealthUrl    = "http://localhost:8082/catalog/categories/roots"
        Description  = "Service Catalog & Job Posts"
    }
    "order-service" = @{
        Dir          = "order-service"
        DefaultPort  = 8083
        PortEnvVar   = "ORDER_PORT"
        DbName       = "order_db"
        DbPort       = 5432
        HealthUrl    = "http://localhost:8083/order"
        Description  = "Orders & Job Proposals"
    }
    "payment-service" = @{
        Dir          = "payment-service"
        DefaultPort  = 8084
        PortEnvVar   = "PAYMENT_PORT"
        DbName       = "payment_db"
        DbPort       = 5432
        HealthUrl    = "http://localhost:8084/payment"
        Description  = "Wallet, Payments & Escrow"
    }
}

# 3. Helper Functions
function Get-TargetPort([hashtable]$cfg) {
    if ($cfg.PortEnvVar -and (Test-Path "Env:$($cfg.PortEnvVar)")) {
        $val = (Get-Item "Env:$($cfg.PortEnvVar)").Value
        if ($val -as [int]) {
            return [int]$val
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

function Test-ServiceHttp([string]$Url, [int]$TimeoutSec = 2) {
    if (-not $Url) { return $false }
    try {
        $null = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
        return $true
    } catch {
        if ($_.Exception.Response -ne $null) {
            return $true
        }
        return $false
    }
}

function Check-DockerDatabase([string]$ServiceName) {
    if ($ServiceName -eq "identity-service") {
        $dbPort = 5433
        $conn = Test-NetConnection -ComputerName "localhost" -Port $dbPort -WarningAction SilentlyContinue
        if (-not $conn.TcpTestSucceeded) {
            Write-Warning "[WorkGo] PostgreSQL database for Identity Service (port $dbPort) not reachable."
            Write-Host "[WorkGo] Auto-starting Docker container 'identity-postgres'..." -ForegroundColor Cyan
            try {
                docker compose up -d postgres-identity
                Start-Sleep -Seconds 3
            } catch {
                Write-Warning "[WorkGo] Unable to run docker compose. Please ensure Docker Desktop is running."
            }
        }
    } elseif ($ServiceName -eq "catalog-service") {
        $dbPort = 5434
        $conn = Test-NetConnection -ComputerName "localhost" -Port $dbPort -WarningAction SilentlyContinue
        if (-not $conn.TcpTestSucceeded) {
            Write-Warning "[WorkGo] PostgreSQL database for Catalog Service (port $dbPort) not reachable."
            Write-Host "[WorkGo] Auto-starting Docker container 'catalog-postgres'..." -ForegroundColor Cyan
            try {
                docker compose up -d postgres-catalog
                Start-Sleep -Seconds 3
            } catch {
                Write-Warning "[WorkGo] Unable to run docker compose. Please ensure Docker Desktop is running."
            }
        }
    }
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

        if ($isListening) {
            $alive = Test-ServiceHttp -Url $cfg.HealthUrl -TimeoutSec 1
            $healthStr = if ($alive) { "HEALTHY" } else { "UNRESPONSIVE" }
        }

        $rows += [PSCustomObject]@{
            Service     = $name
            Port        = $port
            PID         = $pidStr
            Process     = $procName
            Status      = $statusStr
            Health      = $healthStr
            Description = $cfg.Description
        }
    }

    $rows | Format-Table -Property Service, Port, PID, Process, Status, Health, Description -AutoSize
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
    foreach ($name in $ServicesConfig.Keys) {
        $cfg = $ServicesConfig[$name]
        $port = Get-TargetPort $cfg
        $target = Get-ProcessByPort -Port $port
        if ($target) {
            Write-Host "[WorkGo] Detected process $($target.ProcessName) (PID: $($target.ProcessId)) on port $port ($name)." -ForegroundColor Yellow
            if (Stop-PortProcess -Port $port -ServiceName $name) {
                $killedCount++
            }
        }
    }
    if ($killedCount -eq 0) {
        Write-Host "[WorkGo] All microservices ports are clean! No zombie processes found." -ForegroundColor Green
    } else {
        Write-Host "[WorkGo] Successfully cleaned $killedCount process(es)!" -ForegroundColor Green
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
    if ($doForce) {
        Write-Host "[WorkGo] Detected process PID $($occupant.ProcessId) ($($occupant.ProcessName)) on port $targetPort. Stopping old process (-Force)..." -ForegroundColor Yellow
        Stop-PortProcess -Port $targetPort -ServiceName $normalizedService
    } else {
        # Check if process is responding to HTTP
        $isAlive = Test-ServiceHttp -Url $cfg.HealthUrl
        if ($isAlive) {
            Write-Host ""
            Write-Host "=======================================================================" -ForegroundColor Green
            Write-Host " [WorkGo] SERVICE $normalizedService IS ALREADY ACTIVE!" -ForegroundColor Green
            Write-Host "=======================================================================" -ForegroundColor Green
            Write-Host " * Listening Port: $targetPort" -ForegroundColor Cyan
            Write-Host " * Process PID   : $($occupant.ProcessId) ($($occupant.ProcessName))" -ForegroundColor Cyan
            Write-Host " * Health Status : HEALTHY (HTTP responding OK)" -ForegroundColor Green
            Write-Host ""
            Write-Host " Hint: To restart this service, use the -Force flag:" -ForegroundColor Yellow
            Write-Host "       .\run.ps1 $normalizedService -Force" -ForegroundColor Cyan
            Write-Host ""
            exit 0
        } else {
            Write-Warning "[WorkGo] Port $targetPort is occupied by PID $($occupant.ProcessId) ($($occupant.ProcessName)) but not responding (Zombie Process)."
            Write-Host "[WorkGo] Auto-releasing port to avoid BUILD FAILURE..." -ForegroundColor Yellow
            Stop-PortProcess -Port $targetPort -ServiceName $normalizedService
        }
    }
}

# 8. Pre-flight checks (Docker Database)
Check-DockerDatabase -ServiceName $normalizedService

# 9. Start service with Maven Wrapper
Write-Host "[WorkGo] Starting service: $normalizedService (Port: $targetPort)..." -ForegroundColor Cyan
Push-Location $serviceDir
try {
    .\mvnw.cmd spring-boot:run
} finally {
    Pop-Location
}
