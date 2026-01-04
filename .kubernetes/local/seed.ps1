#!/usr/bin/env pwsh

Write-Host "🌱 Seeding Kubernetes database..." -ForegroundColor Cyan
Write-Host ""

# Apply the seed job
Write-Host "📦 Running seed job in Kubernetes..."
kubectl delete job toa-seed -n toa-local 2>$null | Out-Null
kubectl apply -f .kubernetes/local/seed-job.yaml

Write-Host ""
Write-Host "⏳ Waiting for seed job to complete..."
kubectl wait --for=condition=complete --timeout=60s job/toa-seed -n toa-local 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "📋 Seed job logs:" -ForegroundColor Cyan
    kubectl logs -n toa-local job/toa-seed
    Write-Host ""
    Write-Host "✅ Database seeding complete!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Seed job still running or failed. Check logs with:" -ForegroundColor Yellow
    Write-Host "   kubectl logs -n toa-local job/toa-seed -f"
}

Write-Host ""
Write-Host "📋 Test credentials:" -ForegroundColor Cyan
Write-Host "   Admin Email: admin@talesofaneria.com"
Write-Host "   Admin Password: (check ADMIN_PASSWORD in secrets)"
Write-Host "   Admin Login: http://localhost:5000/admin/login"
Write-Host "   Test Order: test-order-12345678"
Write-Host "   Track Order: http://localhost:5000/track-order"
Write-Host ""
Write-Host "🧹 Cleanup: The seed job will auto-delete after 5 minutes"
Write-Host ""
