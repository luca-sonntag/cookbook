<#
.SYNOPSIS
    Shared Git helper utilities for Snagbite deployment and release scripts.
#>

$ErrorActionPreference = 'Stop'

function Get-GitRepoRoot {
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $root = (& git rev-parse --show-toplevel 2>$null)
        if ($LASTEXITCODE -eq 0 -and $root) {
            return $root.Trim()
        }
    } finally {
        $ErrorActionPreference = $oldEap
    }
    return (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
}

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

function Assert-GitClean {
    if ($env:SNAGBITE_DEPLOY_ORCHESTRATOR -eq "true") {
        return
    }

    $repoRoot = Get-GitRepoRoot
    Push-Location $repoRoot
    try {
        while ($true) {
            $status = Get-GitOutput -Arguments @("status", "--porcelain")
            if (-not $status) {
                break
            }

            Write-Host ""
            Write-Host "WARNING: You have uncommitted changes in the repository:" -ForegroundColor Yellow
            & git status -s
            Write-Host ""
            Write-Host "Please commit or stash your changes in another terminal before continuing." -ForegroundColor Yellow
            Write-Host "Press Enter to check again, or type 'abort' to exit." -ForegroundColor Cyan
            
            $input = Read-Host "Choice"
            if ($input.Trim().ToLower() -eq "abort") {
                throw "Deployment aborted due to uncommitted changes."
            }
        }
    } finally {
        Pop-Location
    }
}

function Invoke-GitMasterMergeAndTag {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TagName,
        [Parameter(Mandatory = $true)]
        [string]$TagMessage,
        [string]$FileToCommit,
        [string]$CommitMessage
    )

    $repoRoot = Get-GitRepoRoot
    Push-Location $repoRoot
    try {
        $originalBranch = (Get-GitOutput -Arguments @("branch", "--show-current")).ToString().Trim()
        if ([string]::IsNullOrWhiteSpace($originalBranch)) { $originalBranch = "develop" }

        # 1. Commit specific file (e.g. version.properties) on source branch if requested & modified
        if ($FileToCommit -and $CommitMessage) {
            $diff = Get-GitOutput -Arguments @("diff", "--name-only", $FileToCommit)
            if ($diff) {
                Write-Host "Committing $FileToCommit on branch '$originalBranch'..." -ForegroundColor Yellow
                Run-Git -Arguments @("add", $FileToCommit)
                Run-Git -Arguments @("commit", "-m", $CommitMessage)
                
                Write-Host "Pushing version bump to origin $originalBranch..." -ForegroundColor Yellow
                Run-Git -Arguments @("push", "origin", $originalBranch)
            }
        }

        # 2. Switch to master
        Write-Host "Switching to master branch..." -ForegroundColor Yellow
        Run-Git -Arguments @("checkout", "master")

        # 3. Pull latest master
        Write-Host "Pulling latest master from remote..." -ForegroundColor Yellow
        Run-Git -Arguments @("pull", "origin", "master")

        # 4. Merge current branch (e.g. develop) into master
        $sourceBranch = if ($originalBranch -ne "master") { $originalBranch } else { "develop" }
        Write-Host "Merging $sourceBranch into master..." -ForegroundColor Yellow
        Run-Git -Arguments @("merge", $sourceBranch, "--no-edit")

        # 5. Handle Tag (re-tag if exists)
        $tagExists = (Get-GitOutput -Arguments @("tag", "-l", $TagName))
        if ($tagExists) {
            Write-Host "Tag $TagName already exists. Re-tagging..." -ForegroundColor Yellow
            Run-Git -Arguments @("tag", "-d", $TagName) -IgnoreError
            Run-Git -Arguments @("push", "origin", "--delete", $TagName) -IgnoreError
        }

        # 6. Create Tag
        Write-Host "Creating release tag $TagName..." -ForegroundColor Yellow
        Run-Git -Arguments @("tag", "-a", $TagName, "-m", $TagMessage)

        # 7. Push master branch and tag to origin
        Write-Host "Pushing master branch and tag $TagName to origin..." -ForegroundColor Yellow
        Run-Git -Arguments @("push", "origin", "master")
        Run-Git -Arguments @("push", "origin", $TagName)

        # 8. Switch back to original branch
        if ($originalBranch -ne "master") {
            Write-Host "Switching back to original branch '$originalBranch'..." -ForegroundColor Yellow
            Run-Git -Arguments @("checkout", $originalBranch)
        }

        Write-Host "  [OK] Successfully merged $sourceBranch -> master and pushed tag $TagName." -ForegroundColor Green
    } finally {
        Pop-Location
    }
}
