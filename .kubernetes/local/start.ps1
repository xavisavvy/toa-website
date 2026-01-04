#!/usr/bin/env pwsh
# Start Tales of Aneria Kubernetes environment
# Use this for daily development after initial setup

Write-Host "🚀 Starting Tales of Aneria Kubernetes environment..." -ForegroundColor Cyan

# Check if namespace exists
$namespaceExists = kubectl get namespace toa-local 2>&1 | Select-String -Pattern "toa-local" -Quiet

if ($namespaceExists) {
    Write-Host "   Namespace exists, scaling up deployments..." -ForegroundColor Gray
    # Scale deployments back up
    kubectl scale deployment postgres -n toa-local --replicas=1
    kubectl scale deployment redis -n toa-local --replicas=1
    kubectl scale deployment toa-website -n toa-local --replicas=1
} else {
    Write-Host "   Creating new environment..." -ForegroundColor Gray
    # Apply namespace first
    kubectl apply -f .kubernetes/local/namespace.yaml
    
    # Wait a moment for namespace to be fully ready
    Start-Sleep -Seconds 2
    
    # Apply infrastructure
    kubectl apply -f .kubernetes/local/postgres.yaml
    kubectl apply -f .kubernetes/local/redis.yaml
    kubectl apply -f .kubernetes/local/app-config.yaml
    
    # Prepare app deployment with volume mounts
    $appDeploymentContent = Get-Content -Path .kubernetes/local/app-deployment.yaml -Raw
    $currentPath = (Get-Location).Path -replace '\\', '/'
    $appDeploymentContent = $appDeploymentContent -replace '\$\{PWD\}', $currentPath
    $appDeploymentContent | kubectl apply -f -
}

Write-Host "`n⏳ Waiting for pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres -n toa-local --timeout=60s
kubectl wait --for=condition=ready pod -l app=redis -n toa-local --timeout=60s
kubectl wait --for=condition=ready pod -l app=toa-website -n toa-local --timeout=120s

Write-Host "`n✅ Environment started successfully!" -ForegroundColor Green
Write-Host "`n🌐 Access the application:" -ForegroundColor Cyan
Write-Host "   NodePort: http://localhost:30000"
Write-Host "   Port Forward: kubectl port-forward -n toa-local svc/toa-website 5000:80"
Write-Host "`n📝 View logs:" -ForegroundColor Cyan
Write-Host "   kubectl logs -n toa-local -l app=toa-website -f"
