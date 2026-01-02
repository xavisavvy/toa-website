# Docker Development Guide

This guide explains how to use Docker for local development with hot-reload capabilities.

## Quick Start

### Development Mode (Hot Reload)
```powershell
# Start development environment
.\scripts\docker-dev.ps1 start

# View logs
.\scripts\docker-dev.ps1 logs

# Stop when done
.\scripts\docker-dev.ps1 stop
```

### Production Mode (Testing Production Build)
```powershell
# Build and start production containers
docker compose up --build

# Stop
docker compose down
```

## When to Use Each Mode

### Use Development Mode (`docker-compose.dev.yml`) When:
- ✅ Actively developing features
- ✅ Need hot-reload for fast iteration
- ✅ Want to see changes immediately without rebuilding
- ✅ Working on frontend (React) or backend (Express) code

**What gets hot-reloaded:**
- React components (instant)
- TypeScript/JavaScript files (instant)
- CSS/Tailwind styles (instant)
- Server routes (requires server restart - automatic)

**What requires rebuild:**
- Changes to `package.json` (new dependencies)
- Changes to `Dockerfile.dev`
- Changes to Docker Compose configuration

### Use Production Mode (`docker-compose.yml`) When:
- ✅ Testing the full production build
- ✅ Verifying optimizations work correctly
- ✅ Testing before deployment
- ✅ Debugging production-only issues

## Development Workflow

### 1. Initial Setup
```powershell
# First time setup
.\scripts\docker-dev.ps1 start
```

### 2. Daily Development
```powershell
# Start containers (if not running)
.\scripts\docker-dev.ps1 start

# Make code changes - they auto-reload!
# Edit files in client/, server/, shared/

# View logs if needed
.\scripts\docker-dev.ps1 logs

# Stop when done
.\scripts\docker-dev.ps1 stop
```

### 3. When You Add Dependencies
```powershell
# Added/updated packages in package.json
.\scripts\docker-dev.ps1 rebuild
```

### 4. Troubleshooting
```powershell
# Clean restart
.\scripts\docker-dev.ps1 clean
.\scripts\docker-dev.ps1 start

# Open shell to debug
.\scripts\docker-dev.ps1 shell
```

## Understanding the Setup

### Volume Mounts (Development)
The dev setup mounts your local code into the container:
```yaml
volumes:
  - .:/app              # Your code (hot-reload)
  - /app/node_modules   # Exclude node_modules (use container's)
```

This means:
- Changes to files = instant reload ✅
- Changes to dependencies = need rebuild ❌

### No Volume Mounts (Production)
Production copies code into image:
```dockerfile
COPY --from=builder /app/dist ./dist
```

This means:
- Changes to files = need rebuild ❌
- Optimized and minified ✅
- Production-ready ✅

## Helper Script Commands

### `.\scripts\docker-dev.ps1 start`
Starts development environment with hot-reload

### `.\scripts\docker-dev.ps1 stop`
Stops development environment

### `.\scripts\docker-dev.ps1 restart`
Quick restart (keeps volumes)

### `.\scripts\docker-dev.ps1 rebuild`
Full rebuild - use when:
- You added dependencies to package.json
- You changed Dockerfile.dev
- Things are acting weird

### `.\scripts\docker-dev.ps1 logs`
Follow container logs (Ctrl+C to exit)

### `.\scripts\docker-dev.ps1 shell`
Open shell in app container for debugging

### `.\scripts\docker-dev.ps1 clean`
Nuclear option - removes everything and starts fresh

## Comparison Table

| Feature | Development Mode | Production Mode |
|---------|-----------------|-----------------|
| **Hot Reload** | ✅ Yes | ❌ No |
| **Build Speed** | Fast (initial), Instant (changes) | Slow (every change) |
| **Image Size** | Larger (dev deps) | Optimized |
| **Use Case** | Active development | Testing/deployment |
| **Command** | `docker-dev.ps1 start` | `docker compose up --build` |
| **Rebuild Needed** | Only for deps | Every code change |

## Port Mappings

### Development
- `5000` - Express server
- `5173` - Vite HMR (hot module replacement)
- `5432` - PostgreSQL
- `6379` - Redis

### Production
- `5000` - Express server (serving built static files)
- `5432` - PostgreSQL
- `6379` - Redis

## Tips & Tricks

### Faster Development
1. Keep dev containers running between sessions
2. Only rebuild when you change dependencies
3. Use `logs` command to monitor changes

### Clean Slate
If things get weird:
```powershell
.\scripts\docker-dev.ps1 clean
.\scripts\docker-dev.ps1 start
```

### Checking What's Running
```powershell
docker compose -f docker-compose.dev.yml ps
```

### Manual Commands
If you prefer manual control:
```powershell
# Start
docker compose -f docker-compose.dev.yml up -d

# Logs
docker compose -f docker-compose.dev.yml logs -f app

# Stop
docker compose -f docker-compose.dev.yml down
```

## Environment Variables

Both modes use the same environment variables:
- Development: reads from `.env`
- Production: reads from `.env.docker`

Make sure both files are in sync using:
```powershell
npm run validate:env
```

## Next Steps

- **Active Development?** → Use `docker-dev.ps1 start`
- **Testing Production?** → Use `docker compose up --build`
- **Problems?** → Try `docker-dev.ps1 rebuild` or `docker-dev.ps1 clean`
