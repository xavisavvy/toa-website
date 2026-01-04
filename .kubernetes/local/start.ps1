#!/usr/bin/env pwsh
# Start Tales of Aneria Kubernetes environment
# Use this for daily development after initial setup

Write-Host "🚀 Starting Tales of Aneria Kubernetes environment..." -ForegroundColor Cyan

# Apply namespace first
kubectl apply -f .kubernetes/local/namespace.yaml

# Wait a moment for namespace to be fully ready
Start-Sleep -Seconds 2

# Apply remaining resources
kubectl apply -f .kubernetes/local/postgres-deployment.yaml
kubectl apply -f .kubernetes/local/redis-deployment.yaml
kubectl apply -f .kubernetes/local/app-config.yaml
kubectl apply -f .kubernetes/local/app-deployment.yaml

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
