<#
.SYNOPSIS
    Starts Capacitor Live-Reload for physical mobile devices over local Wi-Fi (no USB cable needed).
    Automatically starts local backend and frontend if they are not already running.

.DESCRIPTION
    This script:
    1. Automatically detects the active LAN IPv4 address (WLAN / Ethernet) on Windows.
    2. Checks and automatically launches local backend (port 3000) if not running.
    3. Configures android/app/src/main/assets/capacitor.config.json with server.url = http://<LAN_IP>:<PORT>
    4. Backs up the original configuration and safely restores it upon exit (Ctrl+C).
    5. Starts Vite dev server (port 5173) if not already running.
    6. Stops any background processes it spawned and restores all config on exit.

.PARAMETER Ip
    Custom IP address override (e.g. 192.168.1.100). If omitted, LAN IPv4 is auto-detected.

.PARAMETER Port
    Vite dev server port (default: 5173).

.PARAMETER Mode
    Vite build mode: 'devlocal' (default, local frontend + local backend via proxy) or 'development' (Railway cloud dev backend).

.PARAMETER Connect
    Optional phone IP (or IP:port) to connect via Wireless ADB (e.g. 192.168.1.50:5555).

.PARAMETER Build
    Builds the debug APK (assembleDebug) with the live-reload configuration before starting.

.PARAMETER Launch
    Attempts to deploy and launch the app on a connected ADB device.

.PARAMETER ServerOnly
    Runs only the live-reload server without syncing or modifying Android files.

.EXAMPLE
    .\cap-live-remote.ps1
    .\cap-live-remote.ps1 -Mode development
    .\cap-live-remote.ps1 -Connect 192.168.1.45:5555 -Launch
    .\cap-live-remote.ps1 -Build
#>

param(
    [string]$Ip = '',
    [int]$Port = 5173,
    [string]$Mode = 'devlocal',
    [string]$Connect = '',
    [switch]$Build,
    [switch]$Launch,
    [switch]$ServerOnly,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Detailed
    exit 0
}

$frontendDir = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $frontendDir
$backendDir = Join-Path $repoRoot 'backend'
$androidDir = Join-Path $frontendDir 'android'
$assetsConfigFile = Join-Path $androidDir 'app\src\main\assets\capacitor.config.json'
$backupConfigFile = Join-Path $androidDir 'app\src\main\assets\capacitor.config.json.live-backup'

# -----------------------------------------------------------------------------
# 1. Helpers: IP Detection & Port Check
# -----------------------------------------------------------------------------
function Get-LocalLanIp {
    try {
        $routes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Sort-Object RouteMetric
        foreach ($route in $routes) {
            $ipObj = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue |
                     Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
                     Select-Object -First 1
            if ($ipObj -and $ipObj.IPAddress) { return $ipObj.IPAddress }
        }
    } catch {}

    try {
        $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
                      Where-Object {
                          $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and
                          $_.InterfaceAlias -notmatch "vEthernet|WSL|Virtual|Docker|Loopback|Hyper-V"
                      }
        if ($candidates) {
            $wifi = $candidates | Where-Object { $_.InterfaceAlias -match "WLAN|Wi-Fi|WiFi|Wireless" } | Select-Object -First 1
            if ($wifi) { return $wifi.IPAddress }
            return $candidates[0].IPAddress
        }
    } catch {}

    return "127.0.0.1"
}

function Test-PortOpen {
    param([string]$HostAddress, [int]$PortNumber)
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $tcp.BeginConnect($HostAddress, $PortNumber, $null, $null)
        $wait = $async.AsyncWaitHandle.WaitOne(300, $false)
        if (-not $wait) { return $false }
        $tcp.EndConnect($async)
        return $true
    } catch { return $false }
    finally { $tcp.Close() }
}

# -----------------------------------------------------------------------------
# 2. Resolve Target IP & Dev Server URL
# -----------------------------------------------------------------------------
$targetIp = if ([string]::IsNullOrWhiteSpace($Ip)) { Get-LocalLanIp } else { $Ip.Trim() }
$liveUrl = "http://${targetIp}:${Port}"
$backendProcess = $null
$didModifyConfig = $false

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  >> Snagbite - Wireless Capacitor Live Reload" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  [LAN] Host IP   : " -NoNewline; Write-Host $targetIp -ForegroundColor Green
Write-Host "  [WEB] Live URL  : " -NoNewline; Write-Host $liveUrl -ForegroundColor Yellow
Write-Host "  [ENV] Vite Mode : " -NoNewline; Write-Host $Mode -ForegroundColor Magenta

# -----------------------------------------------------------------------------
# 3. Auto-start Local Backend if needed (Mode: devlocal)
# -----------------------------------------------------------------------------
if ($Mode -eq 'devlocal') {
    $isBackendRunning = Test-PortOpen -HostAddress "127.0.0.1" -PortNumber 3000
    if ($isBackendRunning) {
        Write-Host "  [API] Backend   : " -NoNewline; Write-Host "http://127.0.0.1:3000 (Already running)" -ForegroundColor Green
    } else {
        Write-Host "  [API] Backend   : " -NoNewline; Write-Host "Starting local backend on port 3000..." -ForegroundColor Yellow
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "cmd.exe"
        $psi.Arguments = "/c npm run dev"
        $psi.WorkingDirectory = $backendDir
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $backendProcess = [System.Diagnostics.Process]::Start($psi)

        $waited = 0
        while (-not (Test-PortOpen -HostAddress "127.0.0.1" -PortNumber 3000) -and ($waited -lt 15)) {
            Start-Sleep -Milliseconds 500
            $waited += 0.5
        }
        if (Test-PortOpen -HostAddress "127.0.0.1" -PortNumber 3000) {
            Write-Host "  [API] Backend   : " -NoNewline; Write-Host "http://127.0.0.1:3000 (Ready, PID: $($backendProcess.Id))" -ForegroundColor Green
        } else {
            Write-Warning "Backend process started, waiting for port 3000..."
        }
    }
} else {
    Write-Host "  [API] Backend   : " -NoNewline; Write-Host "Railway Cloud Dev (development mode)" -ForegroundColor Cyan
}
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 4. Optional Wireless ADB Connection
# -----------------------------------------------------------------------------
if (-not [string]::IsNullOrWhiteSpace($Connect)) {
    Write-Host "[ADB] Connecting to Wireless ADB target: $Connect..." -ForegroundColor Yellow
    try { & adb connect $Connect } catch { Write-Warning "Could not run adb connect." }
}

# -----------------------------------------------------------------------------
# 5. Configure Live-Reload URL in Android Assets
# -----------------------------------------------------------------------------
if (-not $ServerOnly -and (Test-Path $assetsConfigFile)) {
    try {
        if (-not (Test-Path $backupConfigFile)) {
            Copy-Item -Path $assetsConfigFile -Destination $backupConfigFile -Force
        }
        $rawJson = Get-Content $assetsConfigFile -Raw
        $config = $rawJson | ConvertFrom-Json
        if (-not $config.server) {
            $config | Add-Member -NotePropertyName "server" -NotePropertyValue (New-Object PSObject) -Force
        }
        $config.server | Add-Member -NotePropertyName "url" -NotePropertyValue $liveUrl -Force
        $config.server | Add-Member -NotePropertyName "cleartext" -NotePropertyValue $true -Force

        $updatedJson = $config | ConvertTo-Json -Depth 10
        Set-Content -Path $assetsConfigFile -Value $updatedJson -Encoding utf8
        $didModifyConfig = $true
        Write-Host "[OK] Injected live server URL into Android assets (capacitor.config.json)." -ForegroundColor Green
    } catch {
        Write-Warning "Failed to inject server URL into capacitor.config.json: $_"
    }
}

# -----------------------------------------------------------------------------
# 6. Optional: Build Debug APK or Launch on ADB
# -----------------------------------------------------------------------------
if ($Build) {
    Write-Host "[BUILD] Building debug APK with live-reload server configuration..." -ForegroundColor Yellow
    Push-Location $androidDir
    try {
        & .\gradlew.bat assembleDebug
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Debug APK built: $androidDir\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Green
        } else {
            Write-Error "Gradle assembleDebug failed."
        }
    } finally { Pop-Location }
}

if ($Launch) {
    try {
        $adbDevices = & adb devices | Out-String
        if ($adbDevices -match '(\S+)\s+device\b') {
            Write-Host "[ADB] Launching app on connected Android device..." -ForegroundColor Yellow
            Push-Location $frontendDir
            try { & npx.cmd cap run android --no-sync } finally { Pop-Location }
        } else {
            Write-Host "[INFO] No ADB device connected. Open Snagbite manually on your phone." -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "[INFO] ADB launch skipped. Open Snagbite manually on your phone." -ForegroundColor DarkGray
    }
}

# -----------------------------------------------------------------------------
# 7. Start Frontend Dev Server & Wait with Safe Rollback
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "Mobile Phone Instructions:" -ForegroundColor White
Write-Host "  1. Make sure your phone is connected to the SAME Wi-Fi network." -ForegroundColor Gray
Write-Host "  2. Test in mobile browser: " -NoNewline; Write-Host $liveUrl -ForegroundColor Cyan
Write-Host "  3. Open the installed Snagbite Debug App on your phone." -ForegroundColor Gray
Write-Host "  4. Changes in code will live-reload instantly without any USB cable!" -ForegroundColor Gray
Write-Host ""
Write-Host "[!] Press Ctrl+C to stop live-reload and restore original Android config." -ForegroundColor DarkYellow
Write-Host ""

try {
    $isFrontendRunning = Test-PortOpen -HostAddress "127.0.0.1" -PortNumber $Port
    if ($isFrontendRunning) {
        Write-Host "[INFO] Vite dev server is already running on port $Port." -ForegroundColor Green
        Write-Host "Keeping live-reload configuration active. Press Ctrl+C to exit..." -ForegroundColor White
        while ($true) { Start-Sleep -Seconds 2 }
    } else {
        Write-Host "[VITE] Starting Vite dev server bound to 0.0.0.0:$Port..." -ForegroundColor Green
        Push-Location $frontendDir
        try {
            & npx.cmd vite --host 0.0.0.0 --port $Port --mode $Mode
        } finally { Pop-Location }
    }
} finally {
    Write-Host ""
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Write-Host "[CLEANUP] Stopping background backend process..." -ForegroundColor Yellow
        try { & taskkill /PID $backendProcess.Id /T /F 2>$null | Out-Null } catch { try { $backendProcess.Kill() } catch {} }
        Write-Host "[OK] Background backend process stopped." -ForegroundColor Green
    }

    Write-Host "[ROLLBACK] Restoring original capacitor.config.json..." -ForegroundColor Yellow
    if (Test-Path $backupConfigFile) {
        Copy-Item -Path $backupConfigFile -Destination $assetsConfigFile -Force
        Remove-Item -Path $backupConfigFile -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Android configuration restored to clean state." -ForegroundColor Green
    } elseif ($didModifyConfig -and (Test-Path $assetsConfigFile)) {
        try {
            $rawJson = Get-Content $assetsConfigFile -Raw
            $config = $rawJson | ConvertFrom-Json
            if ($config.server) {
                $config.PSObject.Properties.Remove('server')
                Set-Content -Path $assetsConfigFile -Value ($config | ConvertTo-Json -Depth 10) -Encoding utf8
            }
            Write-Host "[OK] Server property removed from capacitor.config.json." -ForegroundColor Green
        } catch {}
    }
}
