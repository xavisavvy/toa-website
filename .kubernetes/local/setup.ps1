# Quick setup script for local Kubernetes development (PowerShell)

Write-Host "🚀 Setting up Tales of Aneria on local Kubernetes..." -ForegroundColor Cyan

# 1. Build the Docker image
Write-Host "📦 Building Docker image..." -ForegroundColor Yellow
docker build -t toa-website:local -f Dockerfile.dev .

# 2. Deploy to Kubernetes
Write-Host "☸️  Deploying to Kubernetes..." -ForegroundColor Yellow

# Create namespace first
kubectl apply -f .kubernetes/local/namespace.yaml
Start-Sleep -Seconds 3

# Then deploy infrastructure
kubectl apply -f .kubernetes/local/postgres.yaml
kubectl apply -f .kubernetes/local/redis.yaml
Start-Sleep -Seconds 2

# Prepare app deployment with volume mounts
$appDeploymentContent = Get-Content -Path .kubernetes/local/app-deployment.yaml -Raw
$currentPath = (Get-Location).Path -replace '\\', '/'
$appDeploymentContent = $appDeploymentContent -replace '\$\{PWD\}', $currentPath
$appDeploymentContent | kubectl apply -f -

# Deploy config and seed job
kubectl apply -f .kubernetes/local/app-config.yaml
kubectl apply -f .kubernetes/local/seed-job.yaml

# 3. Wait for pods
Write-Host "⏳ Waiting for pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres -n toa-local --timeout=60s
kubectl wait --for=condition=ready pod -l app=redis -n toa-local --timeout=60s

# 4. Push database schema
Write-Host "🗄️  Pushing database schema..." -ForegroundColor Yellow
$portForward = Start-Job -ScriptBlock { kubectl port-forward -n toa-local svc/postgres 5432:5432 }
Start-Sleep -Seconds 10

$env:DATABASE_URL = "postgresql://postgres:devpassword123@localhost:5432/toa_dev"

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
$retries = 0
$maxRetries = 5
while ($retries -lt $maxRetries) {
    try {
        npm run db:push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database schema pushed successfully!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "⚠️  Database not ready, retrying... ($retries/$maxRetries)" -ForegroundColor Yellow
        $retries++
        Start-Sleep -Seconds 5
    }
}

if ($retries -eq $maxRetries) {
    Write-Host "❌ Failed to push database schema after $maxRetries attempts" -ForegroundColor Red
    Stop-Job $portForward
    Remove-Job $portForward
    exit 1
}

Stop-Job $portForward
Remove-Job $portForward

# 5. Create admin user
Write-Host "👤 Creating admin user..." -ForegroundColor Yellow
$portForward = Start-Job -ScriptBlock { kubectl port-forward -n toa-local svc/postgres 5432:5432 }
Start-Sleep -Seconds 10
$env:DATABASE_URL = "postgresql://postgres:devpassword123@localhost:5432/toa_dev"

# Check if admin already exists, if not create it
Write-Host "🔍 Checking for existing admin user..." -ForegroundColor Yellow
npx tsx scripts/create-admin-direct.ts
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Admin user ready!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Admin user creation failed (may already exist)" -ForegroundColor Yellow
}

Stop-Job $portForward
Remove-Job $portForward

# 6. Wait for app to be ready
Write-Host "⏳ Waiting for application to be ready..." -ForegroundColor Yellow
$appReady = kubectl wait --for=condition=ready pod -l app=toa-website -n toa-local --timeout=120s 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Application pod not ready yet, checking status..." -ForegroundColor Yellow
    kubectl get pods -n toa-local -l app=toa-website
} else {
    Write-Host "✅ Application pod is ready!" -ForegroundColor Green
}

# 7. Run database seeding
Write-Host ""
Write-Host "🌱 Seeding database..." -ForegroundColor Cyan
Write-Host ""
& "$PSScriptRoot\seed.ps1"

# 8. Show status
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Status:" -ForegroundColor Cyan
kubectl get all -n toa-local
Write-Host ""
Write-Host "🌐 Access the application at:" -ForegroundColor Green
Write-Host "   http://localhost:30000" -ForegroundColor White
Write-Host ""
Write-Host "Or use port forwarding:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward -n toa-local svc/toa-website 5000:80" -ForegroundColor White
Write-Host "   http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "📝 View logs:" -ForegroundColor Yellow
Write-Host "   kubectl logs -n toa-local -l app=toa-website -f" -ForegroundColor White
