<#
.SYNOPSIS
    Starts Capacitor Live-Reload for physical mobile devices over local Wi-Fi (no USB cable needed).

.DESCRIPTION
    This script:
    1. Automatically detects the active LAN IPv4 address (WLAN / Ethernet) on Windows.
    2. Configures android/app/src/main/assets/capacitor.config.json with server.url = http://<LAN_IP>:<PORT>
    3. Backs up the original configuration and safely restores it upon exit (Ctrl+C).
    4. Supports optional wireless ADB pairing/connection (adb connect <phone-ip>:<port>).
    5. Optionally builds the debug APK (assembleDebug) with the live-reload URL configured.
    6. Starts the Vite dev server bound to 0.0.0.0 so the mobile device can connect.

.PARAMETER Ip
    Custom IP address override (e.g. 192.168.1.100). If omitted, LAN IPv4 is auto-detected.

.PARAMETER Port
    Vite dev server port (default: 5173).

.PARAMETER Mode
    Vite build mode: 'development' (default, uses dev Railway backend) or 'devlocal' (local backend).

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
    .\cap-live-remote.ps1 -Mode devlocal
    .\cap-live-remote.ps1 -Ip 192.168.1.50 -Port 5173
    .\cap-live-remote.ps1 -Connect 192.168.1.45:5555 -Launch
    .\cap-live-remote.ps1 -Build
#>

param(
    [string]$Ip = '',
    [int]$Port = 5173,
    [string]$Mode = 'development',
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
$androidDir = Join-Path $frontendDir 'android'
$assetsConfigFile = Join-Path $androidDir 'app\src\main\assets\capacitor.config.json'
$backupConfigFile = Join-Path $androidDir 'app\src\main\assets\capacitor.config.json.live-backup'

# -----------------------------------------------------------------------------
# 1. LAN IPv4 Auto-Detection (Windows-optimized)
# -----------------------------------------------------------------------------
function Get-LocalLanIp {
    # Strategy A: Query default gateway route (fastest and most accurate for active network)
    try {
        $routes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Sort-Object RouteMetric
        foreach ($route in $routes) {
            $ipObj = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue |
                     Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
                     Select-Object -First 1
            if ($ipObj -and $ipObj.IPAddress) {
                return $ipObj.IPAddress
            }
        }
    } catch {}

    # Strategy B: Filter out virtual / container adapters (WSL, Hyper-V, Docker)
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

# -----------------------------------------------------------------------------
# 2. Port Check Helper
# -----------------------------------------------------------------------------
function Test-PortOpen {
    param([string]$HostAddress, [int]$PortNumber)
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $tcp.BeginConnect($HostAddress, $PortNumber, $null, $null)
        $wait = $async.AsyncWaitHandle.WaitOne(300, $false)
        if (-not $wait) { return $false }
        $tcp.EndConnect($async)
        return $true
    } catch {
        return $false
    } finally {
        $tcp.Close()
    }
}

# -----------------------------------------------------------------------------
# 3. Resolve Target IP & Dev Server URL
# -----------------------------------------------------------------------------
$targetIp = if ([string]::IsNullOrWhiteSpace($Ip)) { Get-LocalLanIp } else { $Ip.Trim() }
$liveUrl = "http://${targetIp}:${Port}"

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  >> Snagbite - Wireless Capacitor Live Reload" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  [LAN] Host IP   : " -NoNewline; Write-Host $targetIp -ForegroundColor Green
Write-Host "  [WEB] Live URL  : " -NoNewline; Write-Host $liveUrl -ForegroundColor Yellow
Write-Host "  [ENV] Vite Mode : " -NoNewline; Write-Host $Mode -ForegroundColor Magenta
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 4. Optional Wireless ADB Connection
# -----------------------------------------------------------------------------
if (-not [string]::IsNullOrWhiteSpace($Connect)) {
    Write-Host "[ADB] Connecting to Wireless ADB target: $Connect..." -ForegroundColor Yellow
    try {
        & adb connect $Connect
    } catch {
        Write-Warning "Could not run adb connect. Ensure Android SDK platform-tools are in PATH."
    }
}

# -----------------------------------------------------------------------------
# 5. Configure Capacitor Live-Reload URL in Android Assets
# -----------------------------------------------------------------------------
$didModifyConfig = $false

if (-not $ServerOnly -and (Test-Path $assetsConfigFile)) {
    try {
        # Create backup if not present
        if (-not (Test-Path $backupConfigFile)) {
            Copy-Item -Path $assetsConfigFile -Destination $backupConfigFile -Force
        }

        $rawJson = Get-Content $assetsConfigFile -Raw
        $config = $rawJson | ConvertFrom-Json

        # Set live reload server URL
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
# 6. Optional: Build Debug APK
# -----------------------------------------------------------------------------
if ($Build) {
    Write-Host "[BUILD] Building debug APK with live-reload server configuration..." -ForegroundColor Yellow
    Push-Location $androidDir
    try {
        & .\gradlew.bat assembleDebug
        if ($LASTEXITCODE -eq 0) {
            $apkPath = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"
            Write-Host "[OK] Debug APK built: $apkPath" -ForegroundColor Green
        } else {
            Write-Error "Gradle assembleDebug failed."
        }
    } finally {
        Pop-Location
    }
}

# -----------------------------------------------------------------------------
# 7. Optional: Launch on connected ADB device
# -----------------------------------------------------------------------------
if ($Launch) {
    try {
        $adbDevices = & adb devices | Out-String
        if ($adbDevices -match '(\S+)\s+device\b') {
            Write-Host "[ADB] Launching app on connected Android device..." -ForegroundColor Yellow
            Push-Location $frontendDir
            try {
                & npx.cmd cap run android --no-sync
            } finally {
                Pop-Location
            }
        } else {
            Write-Host "[INFO] No ADB device currently connected. Open the Snagbite app manually on your phone." -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "[INFO] ADB launch skipped. Open the Snagbite app manually on your phone." -ForegroundColor DarkGray
    }
}

# -----------------------------------------------------------------------------
# 8. Start Dev Server & Wait with Safe Rollback
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
    $isAlreadyRunning = Test-PortOpen -HostAddress "127.0.0.1" -PortNumber $Port
    if ($isAlreadyRunning) {
        Write-Host "[INFO] Vite dev server is already running on port $Port." -ForegroundColor Green
        Write-Host "Keeping live-reload configuration active. Press Ctrl+C to exit..." -ForegroundColor White
        while ($true) {
            Start-Sleep -Seconds 2
        }
    } else {
        Write-Host "[VITE] Starting Vite dev server bound to 0.0.0.0:$Port..." -ForegroundColor Green
        Push-Location $frontendDir
        try {
            & npx.cmd vite --host 0.0.0.0 --port $Port --mode $Mode
        } finally {
            Pop-Location
        }
    }
} finally {
    Write-Host ""
    Write-Host "[ROLLBACK] Restoring original capacitor.config.json..." -ForegroundColor Yellow
    if (Test-Path $backupConfigFile) {
        Copy-Item -Path $backupConfigFile -Destination $assetsConfigFile -Force
        Remove-Item -Path $backupConfigFile -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Android configuration restored to clean state." -ForegroundColor Green
    } elseif ($didModifyConfig -and (Test-Path $assetsConfigFile)) {
        # Fallback: remove server.url from capacitor.config.json
        try {
            $rawJson = Get-Content $assetsConfigFile -Raw
            $config = $rawJson | ConvertFrom-Json
            if ($config.server) {
                $config.PSObject.Properties.Remove('server')
                $updatedJson = $config | ConvertTo-Json -Depth 10
                Set-Content -Path $assetsConfigFile -Value $updatedJson -Encoding utf8
            }
            Write-Host "[OK] Server property removed from capacitor.config.json." -ForegroundColor Green
        } catch {}
    }
}
