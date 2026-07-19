<#
.SYNOPSIS
    Builds a signed .aab and uploads it to a Google Play track (e.g. production, internal).

.DESCRIPTION
    Hybrid build+upload flow (no local Ruby needed):
      1. Builds the signed .aab via release.ps1 (frontend build + cap sync +
         Gradle bundleRelease + copy to frontend/releases/). Skippable.
      2. Picks the newest .aab from frontend/releases/.
      3. Builds a small Ruby+Fastlane Docker image (cached after first run).
      4. Runs `fastlane [track]` in the container to upload the .aab to the
         Google Play track.

    Requires:
      - Docker Desktop running.
      - A Google Play service-account JSON key at the path given by -KeyFile
        (default: frontend/android/fastlane/play-store-key.json). NEVER commit it.
      - The app already created in Play Console with its first release uploaded
        manually (Play requires the first AAB of a new app via the UI).
      See frontend/android/fastlane/SETUP.md for one-time setup.

.PARAMETER Track
    Google Play release track: production (default), internal, beta, alpha

.PARAMETER Bump
    versionName bump passed through to release.ps1: none (default)/patch/minor/major.
    versionCode always auto-increments. Ignored when -SkipBuild is set.

.PARAMETER SkipBuild
    Skip building; just upload the newest existing .aab from frontend/releases/.

.PARAMETER KeyFile
    Path to the Google Play service-account JSON key.

.PARAMETER Status
    Play release status: completed (default) makes it available to users/testers
    immediately; draft creates an unreleased draft; halted pauses it.

.EXAMPLE
    .\deploy-playstore.ps1 -Track internal # build (versionCode++) + upload to internal
    .\deploy-playstore.ps1 -Track production -Bump patch # bump versionName, build + upload to production
    .\deploy-playstore.ps1 -Track production -SkipBuild # upload newest existing .aab to production
    .\deploy-playstore.ps1 -Status draft # upload to production as a draft release
#>

param(
    [ValidateSet('internal', 'alpha', 'beta', 'production')]
    [string]$Track = 'production',
    [ValidateSet('none', 'patch', 'minor', 'major')]
    [string]$Bump = 'none',
    [switch]$SkipBuild,
    [string]$KeyFile,
    [ValidateSet('completed', 'draft', 'halted')]
    [string]$Status = 'completed'
)

$ErrorActionPreference = 'Stop'

# --- Git Pre-flight checks (only if run standalone) ---
if ($env:SNAGBITE_DEPLOY_ORCHESTRATOR -ne "true") {
    $repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    Push-Location $repoRoot
    try {
        while ($true) {
            $status = & git status --porcelain
            if (-not $status) {
                break
            }

            Write-Host ""
            Write-Host "WARNING: You have uncommitted changes in the repository:" -ForegroundColor Yellow
            & git status -s
            Write-Host ""
            Write-Host "Select an option:" -ForegroundColor Cyan
            Write-Host "  1) Commit changes now (you will be prompted for a message)"
            Write-Host "  2) Stash changes"
            Write-Host "  3) Retry/Continue (Use this if you resolved/committed changes in another terminal)"
            Write-Host "  4) Abort"
            Write-Host ""
            
            $choice = Read-Host "Enter option [1-4]"
            switch ($choice) {
                "1" {
                    $msg = Read-Host "Enter commit message"
                    if (-not [string]::IsNullOrWhiteSpace($msg)) {
                        & git add -A
                        & git commit -m $msg
                        Write-Host "Changes committed successfully." -ForegroundColor Green
                    } else {
                        Write-Warning "Commit message cannot be empty."
                    }
                }
                "2" {
                    & git stash -u
                    Write-Host "Changes stashed." -ForegroundColor Green
                }
                "3" {
                    # Loop will re-check at the top
                    continue
                }
                "4" {
                    throw "Deployment aborted due to uncommitted changes."
                }
                default {
                    Write-Warning "Invalid option. Please choose 1, 2, 3, or 4."
                }
            }
        }
    } finally {
        Pop-Location
    }
}

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
          "Create one and place it there (see frontend/android/fastlane/SETUP.md). Never commit it."
}

# --- 4. Build the Fastlane image (cached) ----------------------------
Write-Host "[3/4] Building Fastlane Docker image ($imageTag)..." -ForegroundColor Yellow
docker build -t $imageTag $fastlaneDir
if ($LASTEXITCODE -ne 0) { throw "docker build failed" }

# --- 5. Upload via Fastlane in Docker --------------------------------
Write-Host "[4/4] Uploading to Google Play $Track track (status: $Status)..." -ForegroundColor Yellow
docker run --rm `
    -v "${fastlaneDir}:/fastlane" `
    -v "$($aab.FullName):/artifacts/release.aab:ro" `
    -v "${KeyFile}:/keys/play-store-key.json:ro" `
    -e AAB_PATH=/artifacts/release.aab `
    -e SUPPLY_JSON_KEY_FILE=/keys/play-store-key.json `
    -e RELEASE_STATUS=$Status `
    $imageTag $Track
if ($LASTEXITCODE -ne 0) { throw "Fastlane upload failed" }

Write-Host ""
Write-Host "  [OK] Uploaded $($aab.Name) to the $Track track." -ForegroundColor Green
Write-Host "  URL: https://play.google.com/console" -ForegroundColor DarkGray
Write-Host ""

# --- 6. Commit and Push version.properties (only if run standalone) ---
if ($env:SNAGBITE_DEPLOY_ORCHESTRATOR -ne "true" -and -not $SkipBuild) {
    $repoRoot = Split-Path -Parent $frontendDir
    Push-Location $repoRoot
    try {
        $versionFileRel = "frontend/android/version.properties"
        $diff = & git diff --name-only $versionFileRel
        if ($diff) {
            $versionContent = Get-Content $versionFileRel -Raw
            $versionName = [regex]::Match($versionContent, 'VERSION_NAME=(.+)').Groups[1].Value.Trim()
            $versionCode = [regex]::Match($versionContent, 'VERSION_CODE=(\d+)').Groups[1].Value.Trim()

            Write-Host "Committing version bump..." -ForegroundColor Yellow
            & git add $versionFileRel
            & git commit -m "chore(version): bump app version to $versionName ($versionCode)"
            
            $currentBranch = (& git branch --show-current).Trim()
            Write-Host "Pushing version bump to origin $currentBranch..." -ForegroundColor Yellow
            & git push origin $currentBranch
        }
    } finally {
        Pop-Location
    }
}
