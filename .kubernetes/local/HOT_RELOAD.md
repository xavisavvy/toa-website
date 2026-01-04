# Kubernetes Local Development - Hot Reload

## Overview

The local Kubernetes deployment now supports **hot-reload** for rapid development. Changes to your source code are automatically detected and reflected in the running application without requiring pod restarts or image rebuilds.

## How It Works

### Volume Mounts
Your local source code directories are mounted into the running container:

```yaml
volumeMounts:
- name: source-code
  mountPath: /app/client/src      # Frontend code
- name: source-code
  mountPath: /app/server           # Backend code
- name: source-code
  mountPath: /app/shared           # Shared types
```

### File Watching
Environment variables enable container-compatible file watching:

- `CHOKIDAR_USEPOLLING=true` - Enables polling for file changes (required in containers)
- `WATCHPACK_POLLING=true` - Webpack/Vite polling support

### Ports Exposed
- **5000** - Express application (standard access)
- **5173** - Vite HMR (Hot Module Replacement) WebSocket

## Usage

### Making Code Changes

1. **Start the environment:**
   ```powershell
   # Windows
   .\.kubernetes\local\start.ps1
   
   # Mac/Linux
   ./kubernetes/local/start.sh
   ```

2. **Edit files in your IDE:**
   - Edit files in `client/src/`, `server/`, or `shared/`
   - Changes are automatically synced to the container
   - Vite/Nodemon will detect changes and hot-reload

3. **View changes:**
   - Frontend changes: Instant via Vite HMR
   - Backend changes: ~2-5 seconds (Nodemon restart)

### When You Need a Full Rebuild

Hot-reload **DOES NOT** apply to:
- `package.json` changes (new dependencies)
- `Dockerfile.dev` changes
- Build configuration changes (`vite.config.ts`, `tsconfig.json`)
- Environment variable changes (ConfigMap/Secret)

**For these changes, rebuild:**
```powershell
# Windows
.\.kubernetes\local\teardown.ps1
.\.kubernetes\local\setup.ps1

# Mac/Linux
./.kubernetes/local/teardown.sh
./.kubernetes/local/setup.sh
```

## Performance Optimizations

### Init Containers
Before the app starts, init containers verify dependencies are ready:

```yaml
initContainers:
- name: wait-for-postgres   # Waits for PostgreSQL
- name: wait-for-redis       # Waits for Redis
```

This prevents crashes during startup and improves reliability.

### Resource Allocation

**Development Profile:**
```yaml
resources:
  requests:
    cpu: 250m       # 0.25 cores reserved
    memory: 512Mi   # 512 MB reserved
  limits:
    cpu: 2000m      # Up to 2 cores
    memory: 1Gi     # Up to 1 GB
```

These are optimized for local development on most machines.

### Node Modules Cache

Build artifacts are cached separately to avoid conflicts:
```yaml
- name: node-modules-cache
  mountPath: /app/node_modules/.cache
```

## Troubleshooting

### Changes Not Reflecting

1. **Check pod logs:**
   ```bash
   kubectl logs -n toa-local -l app=toa-website -f
   ```

2. **Verify volume mount:**
   ```bash
   kubectl exec -n toa-local deployment/toa-website -- ls -la /app/client/src
   ```

3. **Check file permissions:**
   Ensure your source files are readable by the container user.

### Port 5173 Connection Issues

If Vite HMR isn't working:

1. **Expose port 5173:**
   ```bash
   kubectl port-forward -n toa-local svc/toa-website 5173:5173
   ```

2. **Check browser console** for WebSocket errors

### Slow File Watching

Polling can be CPU-intensive. If performance suffers:

1. **Reduce polling interval** in `vite.config.ts`:
   ```typescript
   server: {
     watch: {
       usePolling: true,
       interval: 1000  // Increase from 100ms to 1000ms
     }
   }
   ```

2. **Ignore large directories:**
   Ensure `node_modules` and `dist` are in `.dockerignore`

## Comparison: Hot-Reload vs Full Rebuild

| Scenario | Hot-Reload Time | Full Rebuild Time |
|----------|----------------|-------------------|
| Change React component | ~500ms | ~2-3 minutes |
| Change Express route | ~3 seconds | ~2-3 minutes |
| Change shared type | ~1 second | ~2-3 minutes |
| Add npm package | ❌ Not supported | ~3-5 minutes |
| Change env vars | ❌ Not supported | ~1-2 minutes |

## Architecture

```
┌─────────────────────────────────────────┐
│ Your Local Machine                      │
│                                         │
│  ┌───────────────┐                     │
│  │ IDE (VSCode)  │                     │
│  │  - Edit files │                     │
│  └───────┬───────┘                     │
│          │                             │
│          ▼                             │
│  ┌───────────────────────────┐        │
│  │ Source Code Directories   │        │
│  │  - client/src/            │◄───────┼─── Volume Mount
│  │  - server/                │        │
│  │  - shared/                │        │
│  └───────────────────────────┘        │
└─────────────────┬───────────────────────┘
                  │
                  │ Kubernetes Volume
                  ▼
┌─────────────────────────────────────────┐
│ Kubernetes Pod (toa-website)            │
│                                         │
│  ┌─────────────────────────┐           │
│  │ Vite (Port 5173)        │           │
│  │  - Watches /app/client  │           │
│  │  - Hot Module Replace   │           │
│  └─────────────────────────┘           │
│                                         │
│  ┌─────────────────────────┐           │
│  │ Nodemon (Port 5000)     │           │
│  │  - Watches /app/server  │           │
│  │  - Auto-restart         │           │
│  └─────────────────────────┘           │
└─────────────────────────────────────────┘
```

## Best Practices

1. **Use hot-reload for rapid iteration**
   - Quick bug fixes
   - UI tweaks
   - Logic changes

2. **Full rebuild when needed**
   - Dependency updates
   - Configuration changes
   - Infrastructure changes

3. **Monitor resource usage**
   - `kubectl top pods -n toa-local`
   - Adjust limits if needed

4. **Keep volumes clean**
   - Teardown periodically to clear cached data
   - Use `./teardown.sh` then `./setup.sh`

## Security Note

Hot-reload with volume mounts is **ONLY for local development**. Production deployments use:
- Immutable container images
- No volume mounts to host filesystem
- Proper secrets management
- Multi-replica deployments

Never use hot-reload in production environments.
