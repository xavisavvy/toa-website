# Docker Image Optimization Guide

**Tales of Aneria - Enterprise Docker Best Practices**

Last Updated: 2026-01-01

---

## 🎯 Optimization Goals

- ✅ **Minimize image size** - Reduce attack surface and storage costs
- ✅ **Maximize build cache efficiency** - Faster CI/CD pipelines
- ✅ **Security hardening** - Minimal runtime dependencies
- ✅ **Layer optimization** - Efficient layer caching and reuse

---

## 📊 Image Size Reduction Strategies

### 1. Multi-Stage Build Architecture

**5 Optimized Stages:**

```
┌─────────────────────────────────────────────┐
│ Stage 1: deps (Production Dependencies)    │ ← Cache layer
├─────────────────────────────────────────────┤
│ Stage 2: builder (Build Application)       │ ← Build artifacts
├─────────────────────────────────────────────┤
│ Stage 3: sbom (Generate SBOM)              │ ← Security docs
├─────────────────────────────────────────────┤
│ Stage 4: prod-deps (Pruned Dependencies)   │ ← Optimized deps
├─────────────────────────────────────────────┤
│ Stage 5: runner (Final Runtime)            │ ← Minimal runtime
└─────────────────────────────────────────────┘
```

### 2. BuildKit Cache Mounts

**Leverage Docker BuildKit for faster builds:**

```dockerfile
# Cache npm downloads across builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
    
# Cache Vite build artifacts
RUN --mount=type=cache,target=/app/.vite \
    npm run build
```

**Benefits:**
- 50-80% faster subsequent builds
- Reduced network bandwidth
- Shared cache across builds

### 3. Dependency Pruning

**Aggressive node_modules cleanup:**

```bash
# Remove unnecessary files (saves 20-40% space)
find node_modules -name "*.md" -delete           # Documentation
find node_modules -name "*.ts" ! -name "*.d.ts" -delete  # Source files
find node_modules -name "LICENSE*" -delete       # License files
find node_modules -name "*.map" -delete          # Source maps
find node_modules -name "test*" -type d -exec rm -rf {} +  # Tests
```

**Expected Savings:**
- node_modules: ~30-40% size reduction
- Total image: ~15-25% smaller

### 4. Minimal Base Image

**Using Alpine Linux:**
- Base size: ~5MB (vs 900MB for full Node.js)
- Security: Smaller attack surface
- Performance: Faster container startup

### 5. Layer Optimization

**Best Practices:**

```dockerfile
# ✅ Good: Separate layers for better caching
COPY package*.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# ❌ Bad: Single layer invalidates cache
COPY . .
RUN npm ci && npm run build
```

---

## 🔒 Security Hardening

### 1. Non-Root User

```dockerfile
# Create dedicated user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

USER expressjs
```

### 2. Read-Only File System

```dockerfile
# Make application files immutable
RUN chmod -R 555 /app/node_modules /app/dist
```

### 3. Minimal Runtime Dependencies

```dockerfile
# Only install critical packages with pinned versions
RUN apk add --no-cache \
    dumb-init=1.2.5-r3 \
    curl=8.11.1-r0 \
    ca-certificates
```

### 4. Remove Package Manager

```dockerfile
# Prevent runtime modifications
RUN apk del apk-tools
```

---

## 📈 Performance Optimizations

### 1. Node.js Flags

```bash
NODE_OPTIONS="
  --max-old-space-size=512      # Limit memory usage
  --max-http-header-size=16384  # Security limit
  --no-warnings                  # Reduce log noise
"
```

### 2. Health Check Configuration

```dockerfile
HEALTHCHECK \
  --interval=30s      # Check every 30 seconds
  --timeout=10s       # Allow 10s for response
  --start-period=40s  # Wait 40s for app startup
  --retries=3         # Fail after 3 attempts
  CMD curl -f http://localhost:5000/api/health || exit 1
```

### 3. Init System (dumb-init)

**Why use dumb-init:**
- Proper signal handling (SIGTERM, SIGINT)
- Zombie process reaping
- Graceful shutdown support

```dockerfile
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

---

## 🚀 Build Commands

### Standard Build

```bash
# Build with BuildKit
DOCKER_BUILDKIT=1 docker build -t toa-website:latest .

# Build with cache
DOCKER_BUILDKIT=1 docker build \
  --cache-from toa-website:latest \
  -t toa-website:latest .
```

### CI/CD Build

```bash
# GitHub Actions with BuildKit
- name: Build Docker image
  env:
    DOCKER_BUILDKIT: 1
  run: |
    docker build \
      --cache-from ghcr.io/${{ github.repository }}:latest \
      --tag ghcr.io/${{ github.repository }}:${{ github.sha }} \
      --tag ghcr.io/${{ github.repository }}:latest \
      .
```

### Inspect Image Size

```bash
# Check image layers
docker history toa-website:latest

# Analyze image contents
docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive:latest toa-website:latest
```

---

## 📊 Expected Results

### Before Optimization

```
REPOSITORY          TAG       SIZE
toa-website         old       450 MB
```

### After Optimization

```
REPOSITORY          TAG       SIZE       IMPROVEMENT
toa-website         new       180 MB     60% smaller
```

**Layer Breakdown:**
- Base Alpine: ~5 MB
- Node.js runtime: ~50 MB
- Production node_modules: ~80 MB
- Application code: ~40 MB
- System packages: ~5 MB

---

## 🔍 Monitoring & Validation

### 1. Build Time Metrics

```bash
# Measure build time
time DOCKER_BUILDKIT=1 docker build -t toa-website .

# Expected results:
# - First build: 2-4 minutes
# - Cached build: 10-30 seconds
```

### 2. Runtime Metrics

```bash
# Check memory usage
docker stats toa-website

# Expected: 100-200 MB RAM usage
```

### 3. Security Scanning

```bash
# Scan for vulnerabilities
trivy image toa-website:latest

# Expected: 0 CRITICAL, minimal HIGH
```

---

## 🎯 Best Practices Checklist

- [x] Multi-stage build with 5 optimized stages
- [x] BuildKit cache mounts for npm and Vite
- [x] Aggressive dependency pruning
- [x] Non-root user (expressjs:nodejs)
- [x] Read-only file system where possible
- [x] Minimal runtime dependencies (dumb-init, curl)
- [x] Pinned package versions for security
- [x] Removed package manager from runtime
- [x] Health check endpoint configured
- [x] Source maps removed from production
- [x] SBOM generation for compliance
- [x] Proper signal handling with dumb-init
- [x] Optimized Node.js memory settings
- [x] Comprehensive .dockerignore file

---

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [Dive - Docker Image Analyzer](https://github.com/wagoodman/dive)

---

## 🔄 Continuous Improvement

**Next Steps:**
1. Monitor image size trends over time
2. Benchmark build times in CI/CD
3. Track vulnerability scan results
4. Optimize for specific deployment targets (AWS ECS, Kubernetes, etc.)
5. Consider distroless images for even smaller size
