<#
.SYNOPSIS
    Orchestrator for merging develop to master, tagging, pushing (deploying backend on Railway),
    and building/releasing the mobile app to Google Play Store.

.DESCRIPTION
    This script can deploy the backend (by merging develop to master and pushing with version tags),
    deploy the mobile app to Google Play Console, or both.
    Supports both non-interactive CLI flags and interactive selection menu.

.PARAMETER Backend
    Switch to run the backend deploy flow (merge develop -> master, tag, push).

.PARAMETER App
    Switch to run the app release flow (build AAB and upload to Google Play).

.PARAMETER All
    Switch to run both backend and app release flows.

.PARAMETER Track
    Google Play release track: production (default), internal, beta, alpha.

.PARAMETER Bump
    versionName bump type: none (default), patch, minor, major.

.PARAMETER SkipBuild
    Skip building the AAB and just upload the newest existing AAB.

.PARAMETER KeyFile
    Path to the Google Play service account JSON key.

.PARAMETER Status
    Play release status: completed (default), draft, halted.

.EXAMPLE
    .\deploy.ps1                         # Launches interactive menu
    .\deploy.ps1 -Backend                # Deploy backend only
    .\deploy.ps1 -App -Track internal    # Deploy app to internal track
    .\deploy.ps1 -All -Bump patch        # Bump app version, deploy backend & app
#>

param(
    [switch]$Backend,
    [switch]$App,
    [switch]$All,
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

function Run-BackendDeploy {
    Write-Host ""
    Write-Host "+----------------------------------------------+" -ForegroundColor Cyan
    Write-Host "|  Deploying Backend (Develop -> Master)       |" -ForegroundColor Cyan
    Write-Host "+----------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""

    # Check git status
    $status = git status --porcelain
    if ($status) {
        Write-Error "Cannot deploy: you have uncommitted changes. Please commit or stash them first."
        exit 1
    }

    $originalBranch = (git branch --show-current).Trim()
    Write-Host "Current branch is: $originalBranch" -ForegroundColor White

    # Switch to master
    Write-Host "Switching to master..." -ForegroundColor Yellow
    git checkout master
    if ($LASTEXITCODE -ne 0) { throw "Failed to checkout master" }

    try {
        # Pull latest master
        Write-Host "Pulling latest master from remote..." -ForegroundColor Yellow
        git pull origin master

        # Merge develop
        Write-Host "Merging develop into master..." -ForegroundColor Yellow
        git merge develop --no-edit
        if ($LASTEXITCODE -ne 0) {
            throw "Merge conflicts occurred. Please resolve manually on master branch."
        }

        # Read version
        $versionFile = "frontend/android/version.properties"
        if (-not (Test-Path $versionFile)) {
            throw "version.properties not found at $versionFile"
        }
        $versionContent = Get-Content $versionFile -Raw
        $versionName = [regex]::Match($versionContent, 'VERSION_NAME=(.+)').Groups[1].Value.Trim()
        $versionCode = [regex]::Match($versionContent, 'VERSION_CODE=(\d+)').Groups[1].Value.Trim()

        Write-Host "Version detected: v$versionName (Code $versionCode)" -ForegroundColor Green

        # Re-tag if exists
        $tagExists = git tag -l "v$versionName"
        if ($tagExists) {
            Write-Host "Tag v$versionName already exists. Re-tagging..." -ForegroundColor Yellow
            git tag -d "v$versionName"
            git push origin --delete "v$versionName" 2>$null
        }

        Write-Host "Creating release tag v$versionName..." -ForegroundColor Yellow
        git tag -a "v$versionName" -m "Release v$versionName (Code $versionCode)"
        if ($LASTEXITCODE -ne 0) { throw "Failed to create tag" }

        # Push master & tags
        Write-Host "Pushing master branch and tags to origin..." -ForegroundColor Yellow
        git push origin master
        if ($LASTEXITCODE -ne 0) { throw "Failed to push master branch" }
        git push origin "v$versionName"
        if ($LASTEXITCODE -ne 0) { throw "Failed to push release tag" }

        Write-Host ""
        Write-Host "[OK] Backend deployment triggered successfully (pushed to origin/master with tag v$versionName)!" -ForegroundColor Green
        Write-Host ""
    }
    finally {
        # Checkout original branch
        Write-Host "Switching back to original branch: $originalBranch..." -ForegroundColor Yellow
        git checkout $originalBranch
    }
}

function Run-AppDeploy {
    Write-Host ""
    Write-Host "+----------------------------------------------+" -ForegroundColor Cyan
    Write-Host "|  Releasing App to Google Play Store          |" -ForegroundColor Cyan
    Write-Host "+----------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""

    $params = @{}
    $params["Track"] = $Track
    if ($Bump -ne 'none') { $params["Bump"] = $Bump }
    if ($SkipBuild) { $params["SkipBuild"] = $true }
    if ($KeyFile) { $params["KeyFile"] = $KeyFile }
    if ($Status -ne 'completed') { $params["Status"] = $Status }

    Write-Host "Calling frontend/scripts/deploy-playstore.ps1 with parameters:" -ForegroundColor Yellow
    $params.Keys | ForEach-Object { Write-Host "  $_ : $($params[$_])" -ForegroundColor DarkGray }

    & "frontend/scripts/deploy-playstore.ps1" @params
    if ($LASTEXITCODE -ne 0) { throw "App deployment script failed." }

    Write-Host ""
    Write-Host "[OK] App released to the $Track track successfully!" -ForegroundColor Green
    Write-Host ""
}

# --- Main Entry Point ---

# Determine flow based on parameters
$runBackend = $Backend -or $All
$runApp = $App -or $All

if (-not $runBackend -and -not $runApp) {
    # Interactive Menu
    Clear-Host
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host "       Snagbite Global Deploy & Release Orchestrator     " -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host "1) Deploy Backend (Merge develop to master, tag, and push)"
    Write-Host "2) Release App (Build & upload to Google Play Console)"
    Write-Host "3) Deploy Both (Backend & App)"
    Write-Host "4) Exit"
    Write-Host ""
    
    $choice = Read-Host "Select an option [1-4]"
    switch ($choice) {
        "1" { $runBackend = $true }
        "2" { $runApp = $true }
        "3" { $runBackend = $true; $runApp = $true }
        "4" { Write-Host "Exiting."; exit 0 }
        default { Write-Warning "Invalid choice. Exiting."; exit 1 }
    }
}

if ($runBackend) {
    Run-BackendDeploy
}

if ($runApp) {
    Run-AppDeploy
}
