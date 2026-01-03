#!/usr/bin/env pwsh
# Docker Development Helper Script
# Usage: .\scripts\docker-dev.ps1 [command]

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "rebuild", "logs", "shell", "clean")]
    [string]$Command = "start"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Show-Usage {
    Write-Host @"
Docker Development Helper

Usage: .\scripts\docker-dev.ps1 [command]

Commands:
  start    - Start development containers (default)
  stop     - Stop development containers
  restart  - Restart development containers
  rebuild  - Rebuild containers (when dependencies change)
  logs     - Follow container logs
  shell    - Open shell in app container
  clean    - Remove all containers and volumes

Examples:
  .\scripts\docker-dev.ps1 start      # Start dev environment
  .\scripts\docker-dev.ps1 rebuild    # Rebuild after package.json changes
  .\scripts\docker-dev.ps1 logs       # View logs
"@
}

switch ($Command) {
    "start" {
        Write-Host "🚀 Starting development environment..." -ForegroundColor Green
        docker compose -f docker-compose.dev.yml up -d
        Write-Host "✅ Development environment started!" -ForegroundColor Green
        Write-Host "   App: http://localhost:5000" -ForegroundColor Cyan
        Write-Host "   Vite HMR: http://localhost:5173" -ForegroundColor Cyan
        Write-Host "   Logs: docker compose -f docker-compose.dev.yml logs -f" -ForegroundColor Gray
    }
    "stop" {
        Write-Host "🛑 Stopping development environment..." -ForegroundColor Yellow
        docker compose -f docker-compose.dev.yml down
        Write-Host "✅ Development environment stopped!" -ForegroundColor Green
    }
    "restart" {
        Write-Host "🔄 Restarting development environment..." -ForegroundColor Yellow
        docker compose -f docker-compose.dev.yml restart
        Write-Host "✅ Development environment restarted!" -ForegroundColor Green
    }
    "rebuild" {
        Write-Host "🔨 Rebuilding development containers..." -ForegroundColor Yellow
        Write-Host "   This is needed when:" -ForegroundColor Gray
        Write-Host "   - package.json changes" -ForegroundColor Gray
        Write-Host "   - Dockerfile.dev changes" -ForegroundColor Gray
        docker compose -f docker-compose.dev.yml down
        docker compose -f docker-compose.dev.yml build --no-cache
        docker compose -f docker-compose.dev.yml up -d
        Write-Host "✅ Rebuild complete!" -ForegroundColor Green
    }
    "logs" {
        Write-Host "📋 Following logs (Ctrl+C to exit)..." -ForegroundColor Cyan
        docker compose -f docker-compose.dev.yml logs -f
    }
    "shell" {
        Write-Host "🐚 Opening shell in app container..." -ForegroundColor Cyan
        docker compose -f docker-compose.dev.yml exec app sh
    }
    "clean" {
        Write-Host "🧹 Cleaning up development environment..." -ForegroundColor Red
        $confirm = Read-Host "This will remove all containers and volumes. Continue? (y/N)"
        if ($confirm -eq "y") {
            docker compose -f docker-compose.dev.yml down -v
            Write-Host "✅ Cleanup complete!" -ForegroundColor Green
        } else {
            Write-Host "❌ Cleanup cancelled" -ForegroundColor Yellow
        }
    }
    default {
        Show-Usage
    }
}
