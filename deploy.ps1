<#
.SYNOPSIS
    Orchestrator for merging develop to master, tagging, pushing (deploying backend on Railway),
    and building/releasing the mobile app to Google Play Store.

.DESCRIPTION
    This script can deploy the backend (by merging develop to master and pushing with version tags),
    deploy the mobile app to Google Play Console, or both.
    Supports both non-interactive CLI flags and interactive selection menu.
    All operations are structured as a single transaction. If any step fails, all local branch
    modifications, commits, merges, and tags are rolled back automatically.

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

# --- Safe Git Wrappers (preventing stderr false-positives under Stop policy) ---

function Get-GitOutput {
    param(
        [string[]]$Arguments
    )
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & git $Arguments
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
            throw "Git command failed with exit code ${exitCode}: git $Arguments"
        }
        return $output
    } finally {
        $ErrorActionPreference = $oldEap
    }
}

function Run-Git {
    param(
        [string[]]$Arguments,
        [switch]$IgnoreError
    )
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & git $Arguments
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0 -and -not $IgnoreError) {
            throw "Git command failed with exit code ${exitCode}: git $Arguments"
        }
        return $exitCode
    } finally {
        $ErrorActionPreference = $oldEap
    }
}

# --- Transaction Helper ---

$global:originalBranch = $null
$global:originalMasterCommit = $null
$global:originalDevelopCommit = $null
$global:rollbackNeeded = $false
$global:rollbackTag = $null

function Initialize-GitState {
    # Check if working directory is clean
    $status = Get-GitOutput -Arguments @("status", "--porcelain")
    if ($status) {
        Write-Error "Cannot deploy: you have uncommitted changes. Please commit or stash them first."
        exit 1
    }

    $global:originalBranch = (Get-GitOutput -Arguments @("branch", "--show-current")).ToString().Trim()
    $global:originalMasterCommit = (Get-GitOutput -Arguments @("rev-parse", "master")).ToString().Trim()
    $global:originalDevelopCommit = (Get-GitOutput -Arguments @("rev-parse", "develop")).ToString().Trim()
    $global:rollbackNeeded = $true
}

function Undo-Transaction {
    if (-not $global:rollbackNeeded) { return }

    Write-Host ""
    Write-Host "==============================================" -ForegroundColor Red
    Write-Host "       DEPLOYMENT FAILED: ROLLING BACK        " -ForegroundColor Red
    Write-Host "==============================================" -ForegroundColor Red
    Write-Host ""

    # Restore version.properties if modified on disk
    if (Test-Path "frontend/android/version.properties") {
        Write-Host "Restoring version.properties..." -ForegroundColor Yellow
        Run-Git -Arguments @("checkout", "--", "frontend/android/version.properties") -IgnoreError
    }

    # Delete local tag if created
    if ($global:rollbackTag) {
        Write-Host "Deleting local tag v$global:rollbackTag..." -ForegroundColor Yellow
        Run-Git -Arguments @("tag", "-d", "v$global:rollbackTag") -IgnoreError
    }

    # Reset branches to their original states
    Write-Host "Resetting develop to $global:originalDevelopCommit..." -ForegroundColor Yellow
    Run-Git -Arguments @("checkout", "develop") -IgnoreError
    Run-Git -Arguments @("reset", "--hard", $global:originalDevelopCommit) -IgnoreError

    Write-Host "Resetting master to $global:originalMasterCommit..." -ForegroundColor Yellow
    Run-Git -Arguments @("checkout", "master") -IgnoreError
    Run-Git -Arguments @("reset", "--hard", $global:originalMasterCommit) -IgnoreError

    # Checkout original branch
    Write-Host "Returning to original branch: $global:originalBranch..." -ForegroundColor Yellow
    Run-Git -Arguments @("checkout", $global:originalBranch) -IgnoreError

    Write-Host ""
    Write-Host "Rollback completed. Repository is back to its clean starting state." -ForegroundColor Green
    Write-Host ""
}

# --- Deployment Tasks ---

function Build-AndUploadApp {
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

    # Run script and ensure it fails scripting-wise if exit code is non-zero
    & "frontend/scripts/deploy-playstore.ps1" @params
    if ($LASTEXITCODE -ne 0) { throw "App release script returned non-zero exit code $LASTEXITCODE" }
}

function Merge-AndDeployBackend {
    Write-Host ""
    Write-Host "+----------------------------------------------+" -ForegroundColor Cyan
    Write-Host "|  Deploying Backend (Develop -> Master)       |" -ForegroundColor Cyan
    Write-Host "+----------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""

    # Read version details
    $versionFile = "frontend/android/version.properties"
    if (-not (Test-Path $versionFile)) {
        throw "version.properties not found at $versionFile"
    }
    $versionContent = Get-Content $versionFile -Raw
    $versionName = [regex]::Match($versionContent, 'VERSION_NAME=(.+)').Groups[1].Value.Trim()
    $versionCode = [regex]::Match($versionContent, 'VERSION_CODE=(\d+)').Groups[1].Value.Trim()

    # Store version name for potential tag deletion in rollback
    $global:rollbackTag = $versionName

    # Commit version bump to develop if version was updated locally
    # Check if version.properties is modified
    $diff = Get-GitOutput -Arguments @("diff", "--name-only", "frontend/android/version.properties")
    if ($diff) {
        Write-Host "Committing version bump to develop branch..." -ForegroundColor Yellow
        Run-Git -Arguments @("add", "frontend/android/version.properties")
        Run-Git -Arguments @("commit", "-m", "chore(version): bump app version to $versionName ($versionCode)")
    }

    # Switch to master
    Write-Host "Switching to master branch..." -ForegroundColor Yellow
    Run-Git -Arguments @("checkout", "master")

    # Pull latest master
    Write-Host "Pulling latest master from remote..." -ForegroundColor Yellow
    Run-Git -Arguments @("pull", "origin", "master")

    # Merge develop into master
    Write-Host "Merging develop into master..." -ForegroundColor Yellow
    Run-Git -Arguments @("merge", "develop", "--no-edit")

    # Check and manage tag
    $tagExists = (Get-GitOutput -Arguments @("tag", "-l", "v$versionName"))
    if ($tagExists) {
        Write-Host "Tag v$versionName already exists locally/remotely. Re-tagging..." -ForegroundColor Yellow
        Run-Git -Arguments @("tag", "-d", "v$versionName")
        # Try to delete remote tag (best effort)
        Run-Git -Arguments @("push", "origin", "--delete", "v$versionName") -IgnoreError
    }

    # Create tag
    Write-Host "Creating release tag v$versionName..." -ForegroundColor Yellow
    Run-Git -Arguments @("tag", "-a", "v$versionName", "-m", "Release v$versionName (Code $versionCode)")

    # Push to origin (deploys backend on Railway)
    Write-Host "Pushing master branch and tags to origin..." -ForegroundColor Yellow
    Run-Git -Arguments @("push", "origin", "master")
    Run-Git -Arguments @("push", "origin", "v$versionName")

    # Switch back to original branch
    Write-Host "Switching back to original branch $global:originalBranch..." -ForegroundColor Yellow
    Run-Git -Arguments @("checkout", $global:originalBranch)
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

try {
    # Setup initial git tracking state
    Initialize-GitState

    # Reorder operations if All is specified: App first (more failure prone), then Backend
    if ($runApp) {
        Build-AndUploadApp
    }

    if ($runBackend) {
        Merge-AndDeployBackend
    }

    # If we reached here, deploy was completely successful, no rollback needed
    $global:rollbackNeeded = $false
    Write-Host ""
    Write-Host "[OK] Deploy and release completed successfully!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Undo-Transaction
    Write-Error "Deployment failed: $_"
    exit 1
}
