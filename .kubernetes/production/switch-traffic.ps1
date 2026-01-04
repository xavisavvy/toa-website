#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('blue', 'green')]
    [string]$Target
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Switching production traffic to: $Target" -ForegroundColor Cyan
Write-Host ""

# Get current version
$currentVersion = kubectl get service toa-website -n toa-production -o jsonpath='{.spec.selector.version}' 2>$null

if ($currentVersion -eq $Target) {
    Write-Host "ℹ️  Traffic is already pointing to $Target" -ForegroundColor Yellow
    exit 0
}

Write-Host "📊 Current version: $currentVersion" -ForegroundColor Yellow
Write-Host "📊 Target version: $Target" -ForegroundColor Green
Write-Host ""

# Confirm switch
$confirmation = Read-Host "Are you sure you want to switch production traffic? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 1
}

# Patch the service selector
Write-Host "🔧 Updating service selector..." -ForegroundColor Cyan
kubectl patch service toa-website -n toa-production -p "{`"spec`":{`"selector`":{`"version`":`"$Target`"}}}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to switch traffic!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Traffic switched to $Target!" -ForegroundColor Green
Write-Host ""

# Verify
$newVersion = kubectl get service toa-website -n toa-production -o jsonpath='{.spec.selector.version}'
Write-Host "📊 Verified: Traffic is now on $newVersion" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Monitor application metrics and logs" -ForegroundColor White
Write-Host "   2. If issues occur, switch back:" -ForegroundColor White
Write-Host "      .\.kubernetes\production\switch-traffic.ps1 -Target $currentVersion" -ForegroundColor White
Write-Host "   3. When stable, scale down old version:" -ForegroundColor White
Write-Host "      kubectl scale deployment/toa-website-$currentVersion --replicas=0 -n toa-production" -ForegroundColor White
