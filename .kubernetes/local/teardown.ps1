#!/usr/bin/env pwsh
# Teardown Kubernetes Local Environment
# Usage: .\.kubernetes\local\teardown.ps1

Write-Host "🧹 Tearing down Kubernetes environment..." -ForegroundColor Yellow

# Delete all resources in namespace
Write-Host "`n📦 Deleting all resources in toa-local namespace..."
kubectl delete all --all -n toa-local 2>$null

# Delete ConfigMaps and Secrets
Write-Host "🔧 Deleting ConfigMaps and Secrets..."
kubectl delete configmap --all -n toa-local 2>$null
kubectl delete secret --all -n toa-local 2>$null

# Delete PersistentVolumeClaims (this will delete data!)
Write-Host "💾 Deleting PersistentVolumeClaims (data will be lost)..."
kubectl delete pvc --all -n toa-local 2>$null

# Delete namespace
Write-Host "🗑️  Deleting namespace..."
kubectl delete namespace toa-local 2>$null

Write-Host "`n✅ Teardown complete!" -ForegroundColor Green
Write-Host "ℹ️  Run setup.ps1 to recreate the environment" -ForegroundColor Cyan
