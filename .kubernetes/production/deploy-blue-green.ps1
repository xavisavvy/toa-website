#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('blue', 'green')]
    [string]$Target,
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Blue-Green Deployment to Production" -ForegroundColor Cyan
Write-Host "   Target: $Target" -ForegroundColor Yellow
Write-Host "   Image: toa-website:$ImageTag" -ForegroundColor Yellow
Write-Host ""

# Get current active version
$currentService = kubectl get service toa-website -n toa-production -o jsonpath='{.spec.selector.version}' 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No active service found, this appears to be initial deployment" -ForegroundColor Yellow
    $currentService = "none"
}

Write-Host "📊 Current active version: $currentService" -ForegroundColor Cyan

# Update image tag in deployment
Write-Host "🔧 Updating $Target deployment with image tag: $ImageTag" -ForegroundColor Cyan
kubectl set image deployment/toa-website-$Target toa-website=toa-website:$ImageTag -n toa-production

# Wait for rollout
Write-Host "⏳ Waiting for $Target deployment to be ready..." -ForegroundColor Yellow
kubectl rollout status deployment/toa-website-$Target -n toa-production --timeout=5m

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed! Rolling back..." -ForegroundColor Red
    kubectl rollout undo deployment/toa-website-$Target -n toa-production
    exit 1
}

Write-Host "✅ $Target deployment is ready!" -ForegroundColor Green
Write-Host ""

# Run health checks
Write-Host "🏥 Running health checks on $Target..." -ForegroundColor Cyan
$blueGreenPod = kubectl get pod -n toa-production -l "app=toa-website,version=$Target" -o jsonpath='{.items[0].metadata.name}' 2>$null

if ($blueGreenPod) {
    $healthCheck = kubectl exec -n toa-production $blueGreenPod -- wget -q -O- http://localhost:5000/api/alive 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Could not find pod for health check" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Ready to switch traffic to $Target" -ForegroundColor Yellow
Write-Host ""
Write-Host "To complete the deployment, run:" -ForegroundColor Cyan
Write-Host "   .\.kubernetes\production\switch-traffic.ps1 -Target $Target" -ForegroundColor White
Write-Host ""
Write-Host "Or to rollback:" -ForegroundColor Cyan
Write-Host "   kubectl rollout undo deployment/toa-website-$Target -n toa-production" -ForegroundColor White
