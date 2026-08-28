<#
.SYNOPSIS
    Starts Capacitor Live-Reload for physical mobile devices over local Wi-Fi (no USB cable needed).
    Automatically checks installed APK on phone via ADB and redeploys if IP changed.

.DESCRIPTION
    This script:
    1. Automatically detects active LAN IPv4 address (WLAN / Ethernet) on Windows.
    2. Auto-launches local backend (port 3000) if not running.
    3. Checks via ADB if the app on the phone is configured for the current PC IP.
       If the IP changed or app is not installed, it automatically builds & deploys.
    4. Configures capacitor.config.json with server.url = http://<LAN_IP>:<PORT>.
    5. Starts Vite dev server (port 5173) and restores all configs cleanly on exit.

.PARAMETER Ip
    Custom IP address override (e.g. 192.168.1.100). If omitted, LAN IPv4 is auto-detected.

.PARAMETER Port
    Vite dev server port (default: 5173).

.PARAMETER Mode
    Vite build mode: 'devlocal' (default) or 'development' (Railway cloud dev backend).

.PARAMETER Connect
    Optional phone IP (or IP:port) to connect via Wireless ADB (e.g. 192.168.1.50:5555).

.PARAMETER Build
    Force builds the debug APK (assembleDebug) with the live-reload configuration.

.PARAMETER Launch
    Force deploys and launches the app on a connected ADB device.

.PARAMETER NoDeploy
    Disables automatic ADB APK deployment even if device IP mismatch is detected.

.PARAMETER ServerOnly
    Runs only the live-reload server without syncing or modifying Android files.

.EXAMPLE
    .\cap-live-remote.ps1
    .\cap-live-remote.ps1 -Connect 192.168.1.45:5555
    .\cap-live-remote.ps1 -Mode development
#>

param(
    [string]$Ip = '',
    [int]$Port = 5173,
    [string]$Mode = 'devlocal',
    [string]$Connect = '',
    [switch]$Build,
    [switch]$Launch,
    [switch]$NoDeploy,
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
$debugApkPath = Join-Path $androidDir 'app\build\outputs\apk\debug\app-debug.apk'

# -----------------------------------------------------------------------------
# 1. Helper Functions
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
                          $_.IPAddress -notlike "127.*" -and
                          $_.IPAddress -notlike "169.254.*" -and
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

function Get-DeviceInstalledLiveUrl {
    param([string]$PackageName = 'at.snagbite.app')
    try {
        $devicesOutput = & adb devices 2>$null | Out-String
        if ($devicesOutput -notmatch '(\S+)\s+device\b') { return $null }
        $pmOutput = & adb shell "pm path $PackageName" 2>$null | Out-String
        if ($pmOutput -match 'package:(.+?\.apk)') {
            $apkPathOnDevice = $Matches[1].Trim()
            $jsonStr = & adb shell "unzip -p $apkPathOnDevice assets/capacitor.config.json" 2>$null | Out-String
            if (-not [string]::IsNullOrWhiteSpace($jsonStr)) {
                $parsed = $jsonStr | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($parsed -and $parsed.server -and $parsed.server.url) {
                    return $parsed.server.url
                }
                return "[NO_LIVE_URL]"
            }
        }
        return "[NOT_INSTALLED]"
    } catch { return $null }
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
    } catch {
        Write-Warning "Failed to inject server URL into capacitor.config.json: $_"
    }
}

# -----------------------------------------------------------------------------
# 6. ADB Inspection & Auto-Deployment Check
# -----------------------------------------------------------------------------
$needsDeploy = $Build -or $Launch
$installedDeviceUrl = Get-DeviceInstalledLiveUrl

if ($installedDeviceUrl) {
    if ($installedDeviceUrl -eq $liveUrl) {
        Write-Host "  [PHONE] App Config: " -NoNewline; Write-Host "$installedDeviceUrl (Up to date - no reinstall needed!)" -ForegroundColor Green
    } elseif ($installedDeviceUrl -eq '[NOT_INSTALLED]') {
        Write-Host "  [PHONE] App Config: " -NoNewline; Write-Host "Not installed on phone. Auto-deploying..." -ForegroundColor Yellow
        if (-not $NoDeploy) { $needsDeploy = $true }
    } else {
        Write-Host "  [PHONE] App Config: " -NoNewline; Write-Host "$installedDeviceUrl (Target is $liveUrl - Auto-updating APK...)" -ForegroundColor Yellow
        if (-not $NoDeploy) { $needsDeploy = $true }
    }
} else {
    Write-Host "  [PHONE] ADB Device: " -NoNewline; Write-Host "No ADB device connected (Wireless ADB available via -Connect <IP:Port>)" -ForegroundColor DarkGray
}
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

if ($needsDeploy) {
    Write-Host "[BUILD] Building debug APK with live URL ($liveUrl)..." -ForegroundColor Yellow
    Push-Location $androidDir
    try {
        & .\gradlew.bat assembleDebug
        if ($LASTEXITCODE -eq 0 -and (Test-Path $debugApkPath)) {
            Write-Host "[OK] Debug APK built successfully." -ForegroundColor Green
            # If device is connected, install and launch
            $devicesOutput = & adb devices 2>$null | Out-String
            if ($devicesOutput -match '(\S+)\s+device\b') {
                Write-Host "[ADB] Installing updated APK on connected device..." -ForegroundColor Yellow
                & adb install -r $debugApkPath | Out-Null
                Write-Host "[ADB] Launching Snagbite..." -ForegroundColor Green
                & adb shell am start -n at.snagbite.app/.MainActivity | Out-Null
            }
        } else {
            Write-Warning "Gradle assembleDebug failed."
        }
    } finally { Pop-Location }
}

# -----------------------------------------------------------------------------
# 7. Start Frontend Dev Server & Wait with Safe Rollback
# -----------------------------------------------------------------------------
Write-Host "Mobile Phone Instructions:" -ForegroundColor White
Write-Host "  1. Make sure your phone is connected to the SAME Wi-Fi network." -ForegroundColor Gray
Write-Host "  2. Test in mobile browser: " -NoNewline; Write-Host $liveUrl -ForegroundColor Cyan
Write-Host "  3. Open the Snagbite App on your phone to start live-coding!" -ForegroundColor Gray
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
