#!/usr/bin/env pwsh
# Stop Tales of Aneria Kubernetes environment
# This preserves data in PersistentVolumes by scaling down instead of deleting

Write-Host "🛑 Stopping Tales of Aneria Kubernetes environment..." -ForegroundColor Yellow
Write-Host "   (Data will be preserved)" -ForegroundColor Gray

# Scale down deployments to 0 replicas instead of deleting namespace
kubectl scale deployment -n toa-local --all --replicas=0

Write-Host "`n✅ Environment stopped" -ForegroundColor Green
Write-Host "   All pods stopped, data preserved in PersistentVolumes" -ForegroundColor Gray
Write-Host "`n   To start again: .\start.ps1" -ForegroundColor Cyan
Write-Host "   For fresh start: .\teardown.ps1 then .\setup.ps1" -ForegroundColor Cyan
