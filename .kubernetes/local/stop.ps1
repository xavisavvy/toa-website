#!/usr/bin/env pwsh
# Stop Tales of Aneria Kubernetes environment
# This preserves data in PersistentVolumes

Write-Host "🛑 Stopping Tales of Aneria Kubernetes environment..." -ForegroundColor Yellow
Write-Host "   (Data will be preserved)" -ForegroundColor Gray

kubectl delete namespace toa-local

Write-Host "`n✅ Environment stopped" -ForegroundColor Green
Write-Host "   Data is preserved in PersistentVolumes" -ForegroundColor Gray
Write-Host "`n   To start again: .\start.ps1" -ForegroundColor Cyan
Write-Host "   For fresh start: .\teardown.ps1 then .\setup.ps1" -ForegroundColor Cyan
