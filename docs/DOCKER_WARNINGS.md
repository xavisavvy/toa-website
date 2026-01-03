# Docker Warning: Swap Limit Capabilities

## The Warning

```
! redis Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.
! app Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.
```

## What It Means

This is a **harmless warning** on Windows with WSL2. It appears because:

1. **Docker on Windows/WSL2** doesn't support swap memory limits
2. Containers can use memory but **cannot swap to disk**
3. The memory limit is still enforced (just without swap)

## Is This a Problem?

**NO.** The warning is **informational only**:

- ✅ Containers still run normally
- ✅ Memory limits are still enforced (512M app, 256M Redis)
- ✅ No functionality is lost
- ⚠️ Containers **cannot** use swap space (disk-based memory)

## Impact on Your Application

**Minimal to None:**

- **Development**: No impact - containers have plenty of memory
- **Production**: Deploy to Linux (AWS, Azure, etc.) where swap works normally
- **Performance**: Containers use RAM efficiently within limits

## Why Can't We Fix It on Windows?

This is a **Docker Engine limitation** on Windows/WSL2:

1. Windows kernel doesn't support cgroup v2 swap limits
2. WSL2 uses a modified Linux kernel without full cgroup support
3. Docker Desktop for Windows cannot enable this feature

## How to Suppress (If Desired)

### Option 1: Ignore It (Recommended)
The warning doesn't affect functionality. Just let it show during `docker compose up`.

### Option 2: Remove Memory Limits (Not Recommended)
Remove the `deploy.resources.limits.memory` sections from `docker-compose.dev.yml` and `docker-compose.yml`:

```yaml
# Remove this section:
deploy:
  resources:
    limits:
      memory: 512M
```

**Downside**: Containers can use unlimited RAM, risking system instability.

### Option 3: Upgrade to Linux (Production Only)
Deploy to a Linux server where swap limits work:
- AWS EC2
- Azure VM
- DigitalOcean Droplet
- Any Linux VPS

## Docker Compose Settings We Added

We added `mem_swappiness: 0` to acknowledge we don't need swap:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
    mem_swappiness: 0  # Don't try to use swap
```

This doesn't suppress the warning but documents our intent.

## Testing

You can verify containers work despite the warning:

```powershell
# Check container health
docker ps

# Check memory usage
docker stats

# Check logs
docker compose -f docker-compose.dev.yml logs
```

All should show healthy, running containers.

## Bottom Line

**Ignore the warning.** Your Docker setup is correct and production-ready. The warning only appears on Windows/WSL2 development environments and won't appear when deployed to Linux servers.

## References

- [Docker Issue #4250](https://github.com/docker/for-win/issues/4250)
- [Docker Compose Memory Limits](https://docs.docker.com/compose/compose-file/deploy/#resources)
- [WSL2 Known Limitations](https://docs.microsoft.com/en-us/windows/wsl/compare-versions#exceptions-for-using-wsl-2-rather-than-wsl-1)
