#!/usr/bin/env pwsh
# ArgoCD Installation Script for Windows
# Installs and configures ArgoCD for local Kubernetes development

Write-Host "🚀 Installing ArgoCD..." -ForegroundColor Cyan

# Create ArgoCD namespace
Write-Host "`n📦 Creating ArgoCD namespace..." -ForegroundColor Yellow
kubectl create namespace argocd 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Namespace created" -ForegroundColor Green
} else {
    Write-Host "   ✓ Namespace already exists" -ForegroundColor Green
}

# Install ArgoCD
Write-Host "`n📥 Installing ArgoCD components..." -ForegroundColor Yellow
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Failed to install ArgoCD" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ ArgoCD installed" -ForegroundColor Green

# Wait for ArgoCD to be ready
Write-Host "`n⏳ Waiting for ArgoCD to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Timeout waiting for ArgoCD" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ ArgoCD is ready" -ForegroundColor Green

# Get initial admin password
Write-Host "`n🔑 Retrieving admin password..." -ForegroundColor Yellow
$passwordBase64 = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Failed to retrieve password" -ForegroundColor Red
    exit 1
}
$password = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($passwordBase64))

# Start port forwarding in background
Write-Host "`n🌐 Starting port forwarding..." -ForegroundColor Yellow
$portForwardJob = Start-Job -ScriptBlock {
    kubectl port-forward svc/argocd-server -n argocd 8080:443
}
Start-Sleep -Seconds 3
Write-Host "   ✓ Port forwarding started" -ForegroundColor Green

# Display access information
Write-Host "`n✅ ArgoCD Installation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 ArgoCD Access Information" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 UI URL:      " -NoNewline -ForegroundColor Yellow
Write-Host "https://localhost:8080" -ForegroundColor White
Write-Host "👤 Username:    " -NoNewline -ForegroundColor Yellow
Write-Host "admin" -ForegroundColor White
Write-Host "🔐 Password:    " -NoNewline -ForegroundColor Yellow
Write-Host $password -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open https://localhost:8080 in your browser"
Write-Host "   2. Login with credentials above"
Write-Host "   3. Deploy ToA app:"
Write-Host "      kubectl apply -f .kubernetes\argocd\application.yaml"
Write-Host ""
Write-Host "   Or manually via UI/CLI (see README.md)"
Write-Host ""
Write-Host "⚠️  Note: Port forwarding is running in background job"
Write-Host "   Stop with: Stop-Job $($portForwardJob.Id); Remove-Job $($portForwardJob.Id)"
Write-Host ""
