<#
.SYNOPSIS
    Builds a signed .aab and uploads it to the Google Play internal track.

.DESCRIPTION
    Hybrid build+upload flow (no local Ruby needed):
      1. Builds the signed .aab via release.ps1 (frontend build + cap sync +
         Gradle bundleRelease + copy to frontend/releases/). Skippable.
      2. Picks the newest .aab from frontend/releases/.
      3. Builds a small Ruby+Fastlane Docker image (cached after first run).
      4. Runs `fastlane internal` in the container to upload the .aab to the
         Google Play internal testing track.

    Requires:
      - Docker Desktop running.
      - A Google Play service-account JSON key at the path given by -KeyFile
        (default: frontend/android/fastlane/play-store-key.json). NEVER commit it.
      - The app already created in Play Console with its first release uploaded
        manually (Play requires the first AAB of a new app via the UI).
      See frontend/android/fastlane/README.md for one-time setup.

.PARAMETER Bump
    versionName bump passed through to release.ps1: none (default)/patch/minor/major.
    versionCode always auto-increments. Ignored when -SkipBuild is set.

.PARAMETER SkipBuild
    Skip building; just upload the newest existing .aab from frontend/releases/.

.PARAMETER KeyFile
    Path to the Google Play service-account JSON key.

.PARAMETER Status
    Play release status: completed (default) makes it available to internal
    testers immediately; draft creates an unreleased draft; halted pauses it.

.EXAMPLE
    .\deploy-internal.ps1                 # build (versionCode++) + upload
    .\deploy-internal.ps1 -Bump patch     # bump versionName, build + upload
    .\deploy-internal.ps1 -SkipBuild      # upload newest existing .aab
    .\deploy-internal.ps1 -Status draft   # upload as a draft release
#>

param(
    [ValidateSet('none', 'patch', 'minor', 'major')]
    [string]$Bump = 'none',
    [switch]$SkipBuild,
    [string]$KeyFile,
    [ValidateSet('completed', 'draft', 'halted')]
    [string]$Status = 'completed'
)

$ErrorActionPreference = 'Stop'

$frontendDir = Split-Path -Parent $PSScriptRoot
$androidDir  = Join-Path $frontendDir 'android'
$fastlaneDir = Join-Path $androidDir 'fastlane'
$releasesDir = Join-Path $frontendDir 'releases'
if (-not $KeyFile) { $KeyFile = Join-Path $fastlaneDir 'play-store-key.json' }

$imageTag = 'snagbite-fastlane'

# --- 1. Build (unless skipped) ---------------------------------------
if (-not $SkipBuild) {
    Write-Host "[1/4] Building signed AAB (release.ps1)..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot 'release.ps1') -Bump $Bump
    if ($LASTEXITCODE -ne 0) { throw "release.ps1 failed" }
} else {
    Write-Host "[1/4] Skipping build (-SkipBuild)." -ForegroundColor DarkGray
}

# --- 2. Locate newest AAB --------------------------------------------
Write-Host "[2/4] Locating newest .aab..." -ForegroundColor Yellow
if (-not (Test-Path $releasesDir)) { throw "Releases folder not found: $releasesDir" }
$aab = Get-ChildItem -Path (Join-Path $releasesDir '*.aab') |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $aab) { throw "No .aab found in $releasesDir. Build one first (omit -SkipBuild)." }
Write-Host "  -> $($aab.Name)" -ForegroundColor Green

# --- 3. Validate service-account key ---------------------------------
if (-not (Test-Path $KeyFile)) {
    throw "Google Play service-account key not found at '$KeyFile'.`n" +
          "Create one and place it there (see frontend/android/fastlane/README.md). Never commit it."
}

# --- 4. Build the Fastlane image (cached) ----------------------------
Write-Host "[3/4] Building Fastlane Docker image ($imageTag)..." -ForegroundColor Yellow
docker build -t $imageTag $fastlaneDir
if ($LASTEXITCODE -ne 0) { throw "docker build failed" }

# --- 5. Upload via Fastlane in Docker --------------------------------
Write-Host "[4/4] Uploading to Google Play internal track (status: $Status)..." -ForegroundColor Yellow
docker run --rm `
    -v "${fastlaneDir}:/fastlane" `
    -v "$($aab.FullName):/artifacts/release.aab:ro" `
    -v "${KeyFile}:/keys/play-store-key.json:ro" `
    -e AAB_PATH=/artifacts/release.aab `
    -e SUPPLY_JSON_KEY_FILE=/keys/play-store-key.json `
    -e RELEASE_STATUS=$Status `
    $imageTag internal
if ($LASTEXITCODE -ne 0) { throw "Fastlane upload failed" }

Write-Host ""
Write-Host "  [OK] Uploaded $($aab.Name) to the internal track." -ForegroundColor Green
Write-Host "  URL: https://play.google.com/console" -ForegroundColor DarkGray
Write-Host ""
