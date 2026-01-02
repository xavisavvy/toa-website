#!/usr/bin/env pwsh
# Test script for local development domain setup

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧪 TESTING LOCAL DEVELOPMENT DOMAIN" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check hosts file entry
Write-Host "Test 1: Checking hosts file entry..." -ForegroundColor Yellow
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue

if ($hostsContent -match "dev-local\.talesofaneria\.com") {
    Write-Host "  ✅ Hosts file entry found" -ForegroundColor Green
} else {
    Write-Host "  ❌ Hosts file entry NOT found" -ForegroundColor Red
    Write-Host "     Please add: 127.0.0.1    dev-local.talesofaneria.com" -ForegroundColor Yellow
}

# Test 2: DNS Resolution
Write-Host ""
Write-Host "Test 2: Testing DNS resolution..." -ForegroundColor Yellow
try {
    $dns = Resolve-DnsName "dev-local.talesofaneria.com" -ErrorAction Stop
    if ($dns.IPAddress -contains "127.0.0.1") {
        Write-Host "  ✅ DNS resolves to 127.0.0.1" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DNS resolves to: $($dns.IPAddress)" -ForegroundColor Yellow
        Write-Host "     Expected: 127.0.0.1" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ DNS resolution failed" -ForegroundColor Red
    Write-Host "     Try: ipconfig /flushdns" -ForegroundColor Yellow
}

# Test 3: Check .env file
Write-Host ""
Write-Host "Test 3: Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    
    if ($envContent -match "dev-local\.talesofaneria\.com") {
        Write-Host "  ✅ .env file configured with dev-local domain" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  .env file missing dev-local domain" -ForegroundColor Yellow
        Write-Host "     Add: APP_URL=http://dev-local.talesofaneria.com:5000" -ForegroundColor Gray
    }
    
    if ($envContent -match "ALLOWED_ORIGINS.*dev-local") {
        Write-Host "  ✅ CORS configured for dev-local domain" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  ALLOWED_ORIGINS missing dev-local domain" -ForegroundColor Yellow
        Write-Host "     Update ALLOWED_ORIGINS to include: http://dev-local.talesofaneria.com:5000" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ .env file not found" -ForegroundColor Red
    Write-Host "     Create .env from .env.example" -ForegroundColor Yellow
}

# Test 4: Check if port 5000 is available
Write-Host ""
Write-Host "Test 4: Checking port 5000 availability..." -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    Write-Host "  ✅ Port 5000 is in use (server likely running)" -ForegroundColor Green
    
    # Test 5: HTTP Request
    Write-Host ""
    Write-Host "Test 5: Testing HTTP connection..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://dev-local.talesofaneria.com:5000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ Website responds successfully!" -ForegroundColor Green
            Write-Host "     Status: $($response.StatusCode)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ❌ Connection failed" -ForegroundColor Red
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️  Port 5000 is not in use" -ForegroundColor Yellow
    Write-Host "     Start the dev server with: npm run dev" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests pass, you can access the site at:" -ForegroundColor White
Write-Host "  🌐 http://dev-local.talesofaneria.com:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "If any tests failed, see: docs/ENVIRONMENT_SETUP.md" -ForegroundColor Gray
Write-Host ""
