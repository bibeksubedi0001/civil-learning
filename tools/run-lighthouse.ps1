# Run Lighthouse CI locally against the static site.
#
# Usage:
#   pwsh tools/run-lighthouse.ps1
#
# Requires Node.js. Installs @lhci/cli on demand.

$ErrorActionPreference = 'Stop'

Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    Write-Host '==> Checking for @lhci/cli...' -ForegroundColor Cyan
    $hasLhci = $false
    try { npx --no-install lhci --version *> $null; if ($LASTEXITCODE -eq 0) { $hasLhci = $true } } catch {}

    if (-not $hasLhci) {
        Write-Host '==> @lhci/cli not found locally; running via npx (will fetch latest).' -ForegroundColor Yellow
    }

    Write-Host '==> Running lhci autorun with tools/lighthouserc.cjs' -ForegroundColor Cyan
    npx --yes @lhci/cli@latest autorun --config=tools/lighthouserc.cjs

    if ($LASTEXITCODE -ne 0) {
        Write-Host '==> Lighthouse CI returned non-zero exit code.' -ForegroundColor Red
        exit $LASTEXITCODE
    }

    Write-Host '==> Reports written to .lighthouseci/' -ForegroundColor Green
}
finally {
    Pop-Location
}
