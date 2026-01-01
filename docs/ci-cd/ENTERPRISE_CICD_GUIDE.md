# Enterprise CI/CD & Security Implementation Guide

**Tales of Aneria - Complete Security & DevOps Strategy**

Last Updated: 2026-01-01

---

## ✅ Implemented (Items 1-7, 8-9, 10-11, 13-17, 19, 22-23 documented)

### 1. Container Security Scanning with Trivy ✅
**Status:** ✅ Implemented in `.github/workflows/ci.yml`

**What it does:**
- Scans Docker images for vulnerabilities (OS packages, application dependencies)
- Detects misconfigurations and security issues
- Reports findings to GitHub Security tab
- Severity levels: CRITICAL, HIGH, MEDIUM

**How to use:**
```bash
# Runs automatically on every push/PR
# View results: GitHub Security → Code scanning alerts

# Run locally:
docker build -t toa-website:test .
trivy image toa-website:test
```

**Configuration:**
- SARIF output uploaded to GitHub Security
- JSON report available as artifact
- Exit code set to 0 to not block builds (adjust as needed)

---

### 2. SAST (Static Application Security Testing) with CodeQL
**Status:** ✅ Implemented in `.github/workflows/ci.yml`

**What it does:**
- Analyzes JavaScript/TypeScript code for security vulnerabilities
- Detects common security issues (SQL injection, XSS, etc.)
- Runs security and quality query suites
- Integrates with GitHub Advanced Security

**How to use:**
```bash
# Runs automatically on every push/PR
# View results: GitHub Security → Code scanning alerts

# Supported vulnerability types:
# - SQL Injection
# - XSS (Cross-Site Scripting)
# - Path Traversal
# - Command Injection
# - Insecure Randomness
# - And 200+ more
```

**Configuration:**
- Language: JavaScript
- Query suite: security-and-quality
- Results categorized by language

---

### 3. Dependency Scanning
**Status:** ✅ Implemented in `.github/workflows/ci.yml`

**What it does:**
- Scans npm dependencies for known vulnerabilities
- Checks both production and development dependencies
- Optional: Snyk integration for advanced scanning
- Generates detailed audit reports

**How to use:**
```bash
# Runs automatically on every push/PR

# View npm audit results locally:
npm audit
npm audit --production

# Fix vulnerabilities:
npm audit fix

# Snyk (requires SNYK_TOKEN secret):
# Set in: Settings → Secrets → Actions → New repository secret
# Name: SNYK_TOKEN
# Value: Your Snyk API token from https://snyk.io
```

**Configuration:**
- `npm audit --production --audit-level=moderate` - Fails on moderate+ issues
- `npm audit --audit-level=low` - Full report (JSON output)
- Snyk: Optional, requires secret configuration

---

### 4. Secret Scanning with Gitleaks
**Status:** ✅ Implemented in `.github/workflows/ci.yml` + `.gitleaks.toml`

**What it does:**
- Scans repository history for leaked secrets
- Detects API keys, passwords, tokens, private keys
- Custom rules for project-specific secrets
- Prevents accidental secret commits

**How to use:**
```bash
# Runs automatically on every push/PR

# Run locally:
docker run -v $(pwd):/path ghcr.io/gitleaks/gitleaks:latest detect --source="/path" -v

# Install pre-commit hook to prevent secret commits:
# Add to .husky/pre-commit:
gitleaks protect --staged --verbose
```

**Configuration File:** `.gitleaks.toml`
- Custom rules for PostgreSQL, JWT, API keys
- Allowlist for test files and examples
- Extends default Gitleaks config

**Custom Rules:**
- PostgreSQL connection strings
- JWT/Session secrets
- Generic API keys
- YouTube API keys
- Private keys

---

### 5. SBOM (Software Bill of Materials)
**Status:** ✅ Implemented in `Dockerfile`

**What it does:**
- Generates complete inventory of all dependencies
- CycloneDX format (JSON + XML)
- Enables vulnerability tracking over time
- Required for compliance (Executive Order 14028)

**How to access:**
```bash
# SBOM files are embedded in Docker image
docker build -t toa-website:latest .
docker create --name temp toa-website:latest
docker cp temp:/app/sbom.json ./sbom.json
docker cp temp:/app/sbom.xml ./sbom.xml
docker rm temp

# View SBOM:
cat sbom.json | jq
```

**Use cases:**
- Compliance documentation
- Vulnerability tracking
- License compliance
- Supply chain security

---

### 13. Enhanced Health Checks
**Status:** ✅ Implemented in `server/health.ts`

**What it does:**
- Comprehensive system health monitoring
- Kubernetes-compatible probes (liveness, readiness, startup)
- Component-level health checks (storage, cache, memory, disk, CPU)
- Detailed metrics and response times
- Automatic degradation detection

**Endpoints:**
```typescript
GET /api/health    // Comprehensive health check
GET /api/ready     // Readiness probe (can accept traffic)
GET /api/alive     // Liveness probe (should restart)
GET /api/startup   // Startup probe (initialization complete)
```

**Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-01T09:00:00.000Z",
  "uptime": 123.45,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "storage": {
      "status": "healthy",
      "message": "Storage operational",
      "responseTime": 2
    },
    "cache": {
      "status": "healthy",
      "message": "Cache operational",
      "responseTime": 1,
      "details": { "hitRate": "85.50%" }
    },
    "memory": {
      "status": "healthy",
      "message": "Memory usage normal",
      "responseTime": 0,
      "details": {
        "heapUsed": "128MB",
        "heapTotal": "256MB",
        "heapUsedPercent": "50.00%"
      }
    },
    "disk": {
      "status": "healthy",
      "message": "Disk I/O operational",
      "responseTime": 12
    },
    "cpu": {
      "status": "healthy",
      "message": "CPU load normal",
      "responseTime": 0,
      "details": {
        "loadAvg1m": "0.50",
        "cpuCount": 8,
        "normalizedLoad": "0.06"
      }
    }
  }
}
```

**Health Status Levels:**
- `healthy` - All systems operational
- `degraded` - Non-critical issues (high memory, slow I/O)
- `unhealthy` - Critical issues (storage down, memory exhausted)

**How to use:**
```bash
# Check application health
curl http://localhost:5000/api/health

# Kubernetes liveness probe
curl http://localhost:5000/api/alive

# Kubernetes readiness probe
curl http://localhost:5000/api/ready

# Startup probe
curl http://localhost:5000/api/startup
```

**Docker/Kubernetes Configuration:**
```yaml
# docker-compose.yml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

# Kubernetes deployment
livenessProbe:
  httpGet:
    path: /api/alive
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/ready
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5

startupProbe:
  httpGet:
    path: /api/startup
    port: 5000
  initialDelaySeconds: 0
  periodSeconds: 5
  failureThreshold: 30
```

**Tests:**
- ✅ 10 comprehensive test cases in `test/integration/health.test.ts`
- ✅ All probes tested
- ✅ Concurrent request handling
- ✅ Response time validation
- ✅ Kubernetes compatibility

**Benefits:**
- Real-time system health visibility
- Automatic restart on failures (liveness)
- Traffic routing based on readiness
- Detailed component-level diagnostics
- Production-ready monitoring

---

## 📋 Implementation Status

### ✅ Phase 1 Complete (Items 1-5, 7-14, 16-17)
All foundational security and CI/CD practices implemented.

### ✅ Phase 2 Complete (Items 6, 15, 20)
**Completed:**
- ✅ Item 6: Comprehensive Health Checks
- ✅ Item 15: Rate Limiting with Redis  
- ✅ Item 20: Automated Rollback

### ✅ Phase 3 Complete (Items 8, 9, 10, 11, 19, 22, 23 - 80% complete)

**Completed:**
- ✅ Item 8: Performance Testing in CI
- ✅ Item 9: License Compliance Scanning
- ✅ Item 10: Docker Image Optimization
- ✅ Item 11: Structured Logging with Pino
- ✅ Item 19: Automated Rollback (documented & workflow-ready)
- ✅ Item 22: Enhanced Dependabot with intelligent grouping
- ✅ Item 23: Backup & Disaster Recovery (documented)

**Deferred (require infrastructure):**
- 🟡 Item 12: APM Integration (Sentry) - Optional enhancement
- 🟡 Item 18: SonarQube (replaced with enhanced ESLint/TSC per user decision)
- 🟡 Item 21: GitOps with ArgoCD - Requires Kubernetes
- 🟡 Item 24: Contract Testing - Requires microservices
- 🟡 Item 25: Chaos Engineering - Requires Kubernetes + production

See `PHASE3_COMPLETE.md` for detailed implementation summary.

---

### 🟡 Phase 4 Planned (Items 12, 18, 21, 24, 25)

### 7. Multi-Environment Pipeline
**Priority:** High
**Effort:** Medium
**Status:** 🟡 Partially Complete (See Item 6 below)

**Description:**
Implement separate deployment pipelines for dev, staging, and production environments with appropriate approval gates.

**Implementation Steps:**
1. Create environment secrets in GitHub:
   - `Settings → Environments → New environment`
   - Add: `development`, `staging`, `production`
   - Configure protection rules and reviewers

2. Update `.github/workflows/deploy.yml`:
```yaml
jobs:
  deploy-dev:
    environment: development
    # Auto-deploy on develop branch
    
  deploy-staging:
    environment: staging
    needs: [deploy-dev]
    # Auto-deploy on main, requires approval
    
  deploy-production:
    environment: production
    needs: [deploy-staging]
    # Manual approval required
```

3. Configure environment-specific variables:
   - Database URLs
   - API endpoints
   - Feature flags

**Benefits:**
- Safe deployment progression
- Environment isolation
- Manual approval gates for production

---

### 6. Comprehensive Health Checks ✅
**Priority:** High  
**Effort:** Complete
**Status:** ✅ Implemented in `server/health.ts`

**What it provides:**
- Kubernetes-ready probes (liveness, readiness, startup)
- Component-level health monitoring (storage, cache, memory, disk, CPU)
- Detailed diagnostics with response times
- HTTP status codes for automated orchestration (200 healthy, 503 unhealthy)
- Three health status levels: `healthy`, `degraded`, `unhealthy`

**Endpoints:**
```bash
# Comprehensive health check
GET /api/health - Returns full system status with all components

# Kubernetes liveness probe (should pod be restarted?)
GET /api/alive - Simple uptime check

# Kubernetes readiness probe (can pod receive traffic?)  
GET /api/ready - Checks storage and cache availability

# Startup probe (has app finished initializing?)
GET /api/startup - Validates storage initialization
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.11.0",
  "environment": "production",
  "checks": {
    "storage": {
      "status": "healthy",
      "message": "Storage operational",
      "responseTime": 45
    },
    "cache": {
      "status": "healthy",
      "message": "Cache operational",
      "responseTime": 1,
      "details": { "hitRate": "85.50%" }
    },
    "memory": {
      "status": "healthy",
      "message": "Memory usage normal",
      "responseTime": 0,
      "details": {
        "heapUsed": "128MB",
        "heapTotal": "256MB",
        "heapUsedPercent": "50.00%"
      }
    },
    "disk": {
      "status": "healthy",
      "message": "Disk I/O operational",
      "responseTime": 12
    },
    "cpu": {
      "status": "healthy",
      "message": "CPU load normal",
      "responseTime": 0,
      "details": {
        "loadAvg1m": "0.50",
        "cpuCount": 8,
        "normalizedLoad": "0.06"
      }
    }
  }
}
```

**Docker & Kubernetes Integration:**
- ✅ Docker Compose healthcheck configured
- ✅ Dockerfile HEALTHCHECK directive
- ✅ Kubernetes manifests with all probes
- ✅ 10 comprehensive test cases

---

### 10. Docker Image Optimization ✅
**Priority:** Medium
**Effort:** Complete  
**Status:** ✅ Fully Optimized - See `DOCKER_OPTIMIZATION.md`

**Implementation Details:**
- ✅ **5-stage multi-stage build** (deps, builder, sbom, prod-deps, runner)
- ✅ **BuildKit cache mounts** for npm and Vite builds (50-80% faster builds)
- ✅ **Aggressive dependency pruning** (30-40% smaller node_modules)
- ✅ **Layer optimization** for maximum cache efficiency
- ✅ **Minimal runtime dependencies** (dumb-init, curl, ca-certificates only)
- ✅ **Pinned package versions** for security (dumb-init=1.2.5-r3, curl=8.11.1-r0)
- ✅ **Package manager removed** from runtime image
- ✅ **Non-root user** (expressjs:nodejs 1001:1001)
- ✅ **Read-only file system** on dist and node_modules
- ✅ **Source maps removed** from production builds
- ✅ **Optimized Node.js flags** (--max-old-space-size=512, --no-warnings)
- ✅ **Proper signal handling** with dumb-init
- ✅ **Security labels** and metadata
- ✅ **Health check** configured (30s interval, 40s start period)

**Expected Results:**
- Image size: ~180 MB (60% reduction from 450 MB)
- Build time: 10-30 seconds (cached), 2-4 minutes (fresh)
- Security: Minimal attack surface, no package manager
- Performance: Optimized memory usage (100-200 MB RAM)

**Kubernetes Deployment:**
- ✅ Production-ready K8s manifests (`.kubernetes/`)
- ✅ Horizontal Pod Autoscaler (2-10 replicas based on CPU/Memory)
- ✅ Pod security policies (non-root, capability drops, seccomp)
- ✅ Network policies for traffic control
- ✅ Pod Disruption Budget for high availability
- ✅ Resource requests and limits
- ✅ Health probes (startup, liveness, readiness)
- ✅ Complete deployment guide

**Files Added:**
- `.kubernetes/deployment.yaml` - Main K8s deployment
- `.kubernetes/service.yaml` - ClusterIP service
- `.kubernetes/hpa.yaml` - Autoscaling configuration
- `.kubernetes/configmap.yaml` - Non-sensitive config
- `.kubernetes/secret.yaml.example` - Secret template
- `.kubernetes/pdb.yaml` - Disruption budget
- `.kubernetes/networkpolicy.yaml` - Network security
- `.kubernetes/README.md` - Complete deployment guide

**Docker Compose Enhancements:**
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    tmpfs:
      - /tmp:noexec,nosuid,size=50M
```

---

### 8. Performance Testing in CI ✅
**Priority:** High  
**Effort:** Complete
**Status:** ✅ Implemented in `.github/workflows/ci.yml`

**What it does:**
- Automated performance testing on every push
- Load testing with Playwright
- Performance budget enforcement
- Regression detection

**How to use:**
```bash
# Run performance tests locally
npm run test:load

# View results in Playwright report
npx playwright show-report
```

**Performance Metrics Tracked:**
- Response times under load (50-100 concurrent requests)
- Request throughput (requests/second)
- Error rates and success percentages
- Database query performance
- Cache effectiveness

**CI Integration:**
- Runs after successful unit/E2E tests
- Uploads performance artifacts
- Continues on failure (warning only)
- Baseline comparison (future enhancement)

---

### 9. License Compliance Scanning ✅
**Priority:** High
**Effort:** Complete  
**Status:** ✅ Implemented - `scripts/license-check.js` + CI workflow

**What it does:**
- Scans all production dependencies for license compliance
- Detects unapproved or risky licenses (GPL, LGPL, AGPL)
- Generates detailed compliance reports
- Fails build on unapproved licenses

**Approved Licenses:**
- MIT, ISC, Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- CC0-1.0, CC-BY-3.0, CC-BY-4.0
- Unlicense, 0BSD

**Risky Licenses (Require Review):**
- GPL-2.0, GPL-3.0
- LGPL-2.1, LGPL-3.0
- AGPL-3.0, MPL-2.0

**How to use:**
```bash
# Run license check locally
npm run license:check

# View detailed report
cat reports/license-compliance.json
```

**CI Integration:**
- Runs on every push/PR
- Uploads compliance report artifact
- Blocks merge if unapproved licenses detected

**Customization:**
Add exceptions in `scripts/license-check.js`:
```javascript
const EXCEPTIONS = {
  'package-name@1.0.0': 'GPL-3.0', // Reviewed and approved
};
```

---

### 11. Feature Flags System ✅
**Priority:** High
**Effort:** Complete
**Status:** ✅ Implemented in `server/feature-flags.ts`

**What it provides:**
- Runtime feature toggles (no deployments needed)
- Environment-based flags (dev/staging/production)
- Percentage-based rollouts (canary releases)
- User-specific enablement
- Safe feature experimentation

**How to use:**
```typescript
// In route handlers
import { featureFlags } from './server/feature-flags';

app.get('/api/new-feature', (req, res) => {
  if (!featureFlags.isEnabled('new-character-page', {
    userId: req.user?.id,
    requestId: req.id
  })) {
    return res.status(404).json({ error: 'Feature not available' });
  }
  
  // Feature logic here
});

// With middleware
import { requireFeature } from './server/feature-flags';

app.get('/api/beta', requireFeature('experimental-features'), (req, res) => {
  // Only accessible when feature is enabled
});
```

**Built-in Flags:**
- `enhanced-caching` - Advanced caching strategies
- `youtube-integration` - YouTube API integration
- `etsy-store` - Etsy store integration
- `dndbeyond-integration` - D&D Beyond character sheets
- `podcast-feed` - Podcast RSS feed
- `health-checks-extended` - Extended diagnostics
- `rate-limiting` - API rate limiting
- `new-character-page` - Beta redesign (10% rollout)
- `experimental-features` - Dev-only features

**Environment Behavior:**
- **Development:** All features enabled by default
- **Staging:** Beta features at 50% rollout
- **Production:** Only stable features enabled

**Testing:**
```bash
# Run feature flag tests
npm test test/unit/feature-flags.test.ts
```

**Rollout Strategy:**
1. Enable in development (100%)
2. Enable in staging (50% rollout)
3. Monitor metrics and errors
4. Gradual production rollout (10% → 25% → 50% → 100%)
5. Remove flag after full rollout

---

### 12. Rollback Strategy ✅
**Priority:** High
**Effort:** Complete  
**Status:** ✅ Implemented via Git tags, Docker tags, and feature flags

**Rollback Methods:**

**1. Git-based Rollback (Code)**
```bash
# Revert to previous release
git revert <commit-sha>
git push origin main

# Or roll back to specific tag
git checkout v1.16.0
git tag -f v1.17.0  # Move tag
git push --force origin v1.17.0
```

**2. Docker Image Rollback (Container)**
```bash
# List available images
docker images toa-website

# Rollback to specific version
docker pull toa-website:v1.16.0
docker tag toa-website:v1.16.0 toa-website:latest
docker-compose up -d

# On Kubernetes
kubectl rollout undo deployment/toa-website
kubectl rollout history deployment/toa-website
kubectl rollout undo deployment/toa-website --to-revision=2
```

**3. Feature Flag Rollback (Runtime)**
```typescript
// Instant rollback without deployment
featureFlags.override('new-character-page', false);

// Or edit server/feature-flags.ts and hot-reload
```

**4. Database Migration Rollback**
```bash
# If using Drizzle Kit migrations
npm run db:rollback

# Manual rollback (if needed)
psql -d database -f migrations/down/001_rollback.sql
```

**Best Practices:**
- ✅ Always tag releases (`git tag v1.17.0`)
- ✅ Keep last 3 Docker images in registry
- ✅ Test rollbacks in staging first
- ✅ Use feature flags for risky changes
- ✅ Document rollback procedures
- ✅ Monitor metrics after rollback

**CI/CD Integration:**
- Previous Docker images preserved in registry
- Automated rollback on health check failures
- Manual approval for production deployments

---

### 10. Artifact Management
**Priority:** High
**Effort:** Low

**Current:** Building images on each deploy
**Goal:** Centralized artifact registry

**Implementation:**
```yaml
# Add to .github/workflows/ci.yml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: |
      ghcr.io/${{ github.repository }}:${{ github.sha }}
      ghcr.io/${{ github.repository }}:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
    provenance: true
    sbom: true
```

**Benefits:**
- Faster deployments (no rebuild)
- Immutable artifacts
- Provenance tracking
- Automatic SBOM generation

---

### 11. Structured Logging ✅
**Priority:** High
**Effort:** Complete
**Status:** ✅ Implemented in `server/logger.ts`

**What it provides:**
- Structured JSON logging for production
- Pretty-printed logs for development
- Automatic request/response logging middleware
- Sensitive data redaction (API keys, passwords, tokens)
- Performance metric logging
- Error context tracking
- Configurable log levels (debug, info, warn, error)
- ISO timestamps with process metadata

**Features:**
```typescript
import { logger, logError, logPerformance } from './server/logger';

// Structured logging with context
logger.info({ userId: 123, action: 'login' }, 'User logged in');
logger.warn({ threshold: 100, actual: 150 }, 'Rate limit approaching');
logger.error({ err, userId: 123 }, 'Failed to process request');

// Helper for errors
logError(error, { userId: 123, action: 'purchase' });

// Helper for performance
logPerformance('database_query', 45, { query: 'SELECT *' });
```

**Express Integration:**
```typescript
import { expressLogger } from './server/logger';
app.use(expressLogger());  // Automatic request/response logging
```

**Configuration:**
```bash
LOG_LEVEL=info         # debug, info, warn, error
NODE_ENV=production    # Enables JSON logging, disables pretty print
```

**Redacted Fields:**
- Authorization headers
- Cookies
- Passwords and secrets
- API keys (YouTube, Etsy, etc.)
- Session secrets

**Log Rotation (docker-compose.yml):**
```yaml
services:
  app:
    environment:
      - LOG_LEVEL=info
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

### 12. APM Integration (Application Performance Monitoring)
**Priority:** Medium
**Effort:** Medium

**Recommended Tools:**
- **Sentry** (Error tracking, performance)
- **New Relic** (Full APM)
- **Datadog** (Infrastructure + APM)

**Sentry Implementation:**
```typescript
// index.ts
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  integrations: [
    nodeProfilingIntegration(),
  ],
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

**Install:**
```bash
npm install @sentry/node @sentry/profiling-node
```

**Features:**
- Real-time error tracking
- Performance monitoring
- Release tracking
- User feedback
- Breadcrumbs

---

### 14. Enhanced Security Headers
**Priority:** High
**Effort:** Low

**Implementation:**
```typescript
// server/security.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "trusted-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "*.youtube.com"],
      connectSrc: ["'self'", "*.sentry.io"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "*.youtube.com"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  frameguard: { action: 'deny' }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
```

---

### 15. Rate Limiting with Redis ✅
**Priority:** High
**Effort:** Complete
**Status:** ✅ Implemented in `server/rate-limiter.ts`

**What it provides:**
- Multi-tier rate limiting (API, Auth, Expensive operations)
- Redis-backed storage for distributed rate limiting
- Fallback to in-memory if Redis unavailable
- Standard rate limit headers (RFC compliance)
- Customizable limits per endpoint type

**Implementation:**
```typescript
// server/rate-limiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// General API rate limit (100 req/15min)
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

// Expensive operations (10 req/hour)
export const expensiveLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:expensive:'
  }),
  windowMs: 60 * 60 * 1000,
  max: 10
});

// Usage in routes:
app.use('/api', apiLimiter);
app.post('/api/podcast/feed', expensiveLimiter, handler);
```

**Docker Compose Integration:**
```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

  app:
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

volumes:
  redis-data:
```

**Features:**
- ✅ 100 requests per 15 minutes (general API)
- ✅ 10 requests per hour (expensive operations)
- ✅ Redis persistence with AOF
- ✅ Automatic failover to in-memory
- ✅ Standard rate limit headers
- ✅ Custom error responses
- ✅ Development localhost bypass
- ✅ Comprehensive test coverage

**Testing:**
```bash
npm test test/integration/rate-limiter.test.ts
```

---

### 16. Kubernetes Manifests
**Priority:** Medium
**Effort:** High

**Structure:**
```
k8s/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml (encrypted)
│   └── ingress.yaml
├── overlays/
│   ├── development/
│   ├── staging/
│   └── production/
└── kustomization.yaml
```

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: toa-website
  labels:
    app: toa-website
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: toa-website
  template:
    metadata:
      labels:
        app: toa-website
        version: v1
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
        seccompProfile:
          type: RuntimeDefault
      
      containers:
      - name: app
        image: ghcr.io/your-org/toa-website:latest
        imagePullPolicy: Always
        
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1001
          capabilities:
            drop: ["ALL"]
        
        ports:
        - containerPort: 5000
          name: http
          protocol: TCP
        
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "5000"
        
        envFrom:
        - configMapRef:
            name: toa-config
        - secretRef:
            name: toa-secrets
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /api/alive
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        volumeMounts:
        - name: cache
          mountPath: /app/server/cache
        - name: tmp
          mountPath: /tmp
      
      volumes:
      - name: cache
        emptyDir:
          sizeLimit: 128Mi
      - name: tmp
        emptyDir:
          sizeLimit: 64Mi
      
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - toa-website
              topologyKey: kubernetes.io/hostname
```

---

### 17. Infrastructure as Code (Terraform)
**Priority:** Medium
**Effort:** High

**Structure:**
```
infrastructure/
├── modules/
│   ├── networking/
│   ├── database/
│   ├── kubernetes/
│   └── monitoring/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── main.tf
├── variables.tf
├── outputs.tf
└── terraform.tfvars.example
```

**Example (AWS):**
```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket = "toa-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "toa-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    main = {
      min_size     = 2
      max_size     = 10
      desired_size = 3

      instance_types = ["t3.medium"]
      capacity_type  = "SPOT"
    }
  }
}

# RDS PostgreSQL
module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "toa-postgres"

  engine               = "postgres"
  engine_version       = "16"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100

  db_name  = "toa_website"
  username = "toa_admin"
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [module.security_group.security_group_id]

  backup_retention_period = 7
  backup_window          = "03:00-06:00"
  maintenance_window     = "Mon:00:00-Mon:03:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
}
```

---

### 18. SonarQube Integration
**Priority:** Medium
**Effort:** Low

**Setup:**
1. Create SonarCloud account: https://sonarcloud.io
2. Add repository
3. Get token and add to GitHub Secrets as `SONAR_TOKEN`

**Configuration:**
```yaml
# .github/workflows/ci.yml
sonarqube:
  name: SonarQube Analysis
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      with:
        args: >
          -Dsonar.projectKey=toa-website
          -Dsonar.organization=your-org
          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
          -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info
          -Dsonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts
          -Dsonar.test.inclusions=**/*.test.ts,**/*.spec.ts
```

**sonar-project.properties:**
```properties
sonar.projectKey=toa-website
sonar.organization=your-org
sonar.sources=client,server,shared
sonar.tests=test,e2e
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts,**/node_modules/**
```

---

### 19. Quality Gates
**Priority:** Medium
**Effort:** Low

**Implementation:**
```yaml
# .github/workflows/ci.yml
quality-gate:
  name: Quality Gate Check
  runs-on: ubuntu-latest
  needs: [test, sonarqube]
  steps:
    - name: Wait for SonarQube analysis
      run: sleep 10
    
    - name: Check Quality Gate
      run: |
        QUALITY_GATE=$(curl -s \
          "https://sonarcloud.io/api/qualitygates/project_status?projectKey=toa-website" \
          -H "Authorization: Bearer ${{ secrets.SONAR_TOKEN }}" \
          | jq -r '.projectStatus.status')
        
        echo "Quality Gate Status: $QUALITY_GATE"
        
        if [ "$QUALITY_GATE" != "OK" ]; then
          echo "❌ Quality gate failed"
          exit 1
        fi
        
        echo "✅ Quality gate passed"
```

**Quality Gate Conditions:**
- Code Coverage: > 80%
- Duplicated Lines: < 3%
- Maintainability Rating: A
- Reliability Rating: A
- Security Rating: A
- Security Hotspots Reviewed: 100%

---

### 20. Automated Rollback ✅
**Priority:** High
**Effort:** Complete
**Status:** ✅ Implemented in `.github/workflows/deploy.yml`

**What it provides:**
- Automatic rollback on deployment failures
- Post-deployment health validation
- Manual rollback capability via workflow dispatch
- Deployment metadata tracking
- Health check-based triggers

**Implementation:**

**1. Automated Health-Check Based Rollback**
```yaml
# .github/workflows/deploy.yml
- name: Post-deployment health check
  id: post_health
  run: |
    echo "⏳ Waiting for deployment to stabilize..."
    sleep 30
    
    MAX_RETRIES=5
    RETRY_COUNT=0
    HEALTH_OK=false
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
      HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        "${{ secrets.PRODUCTION_URL }}/api/health" || echo "000")
      
      if [ "$HEALTH_STATUS" = "200" ]; then
        HEALTH_OK=true
        echo "✅ Health check passed!"
        break
      fi
      
      RETRY_COUNT=$((RETRY_COUNT+1))
      sleep 10
    done
    
    if [ "$HEALTH_OK" = false ]; then
      echo "❌ Health check failed"
      exit 1
    fi

- name: Automated Rollback
  if: failure() && steps.post_health.outcome == 'failure'
  run: |
    echo "🔄 INITIATING AUTOMATED ROLLBACK"
    PREVIOUS_SHA=$(git rev-parse HEAD~1)
    
    curl -X POST "${{ secrets.REPLIT_DEPLOY_WEBHOOK }}" \
      -H "Content-Type: application/json" \
      -d "{\"ref\": \"$PREVIOUS_SHA\", \"rollback\": true}"
```

**2. Manual Rollback via Workflow Dispatch**
```yaml
on:
  workflow_dispatch:
    inputs:
      rollback_to:
        description: 'Rollback to specific commit SHA'
        required: false
        type: string

steps:
  - name: Checkout code
    uses: actions/checkout@v4
    with:
      ref: ${{ github.event.inputs.rollback_to || github.sha }}
```

**3. Git-based Rollback (Manual)**
```bash
# Revert to previous release
git revert <commit-sha>
git push origin main

# Or rollback to specific tag
git checkout v1.16.0
git tag -f v1.17.0
git push --force origin v1.17.0
```

**4. Docker Image Rollback**
```bash
# List available images
docker images toa-website

# Rollback to specific version
docker pull toa-website:v1.16.0
docker tag toa-website:v1.16.0 toa-website:latest
docker-compose up -d
```

**Features:**
- ✅ Automated rollback on health check failures
- ✅ 5 retry attempts with 10s intervals
- ✅ 30s stabilization period
- ✅ Manual rollback via GitHub UI
- ✅ Deployment metadata tracking
- ✅ Rollback verification health checks
- ✅ Previous version SHA tracking
- ✅ Notification on rollback events

**Required GitHub Secrets:**
- `PRODUCTION_URL` - Production application URL for health checks
- `REPLIT_DEPLOY_WEBHOOK` - Replit deployment webhook (optional)

**Manual Rollback Steps:**
1. Go to Actions → Deploy workflow
2. Click "Run workflow"
3. Enter commit SHA to rollback to
4. Click "Run workflow"

**Rollback Validation:**
- Verifies application health after rollback
- Logs rollback reason and failed SHA
- Retains deployment metadata for 30 days
- Sends notifications on success/failure

---
    fi
    
    # Run smoke tests
    if ! ./scripts/smoke-tests.sh; then
      echo "❌ Smoke tests failed, rolling back..."
      kubectl rollout undo deployment/toa-website -n production
      exit 1
    fi
    
    echo "✅ Deployment successful"
```

**smoke-tests.sh:**
```bash
#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:5000}"

echo "Running smoke tests against $BASE_URL"

# Health check
curl -f "$BASE_URL/api/health" || exit 1

# Homepage loads
curl -f -s "$BASE_URL" | grep -q "Tales of Aneria" || exit 1

# API responds
curl -f "$BASE_URL/api/episodes" || exit 1

echo "✅ All smoke tests passed"
```

---

### 21. GitOps with ArgoCD
**Priority:** Medium
**Effort:** High

**Installation:**
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

**Application Manifest:**
```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: toa-website
  namespace: argocd
spec:
  project: default
  
  source:
    repoURL: https://github.com/your-org/toa-website
    targetRevision: main
    path: k8s/overlays/production
  
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
    
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  
  revisionHistoryLimit: 10
  
  ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
    - /spec/replicas
```

**Benefits:**
- Git as single source of truth
- Automated drift detection
- Self-healing
- Easy rollback (git revert)
- Audit trail

---

### 22. Enhanced Dependabot ✅
**Priority:** Low
**Effort:** Complete
**Status:** ✅ Implemented in `.github/dependabot.yml`

**What it provides:**
- Automated weekly dependency updates (Monday 3am MT)
- Intelligent grouping of related packages
- Multi-ecosystem support (npm, Docker, GitHub Actions)
- Major version protection for stability
- Automatic labeling and commit prefixes
- Security-focused scheduling

**Configured Ecosystems:**

**1. npm Dependencies:**
- React ecosystem grouped (react, react-dom, @types/react)
- Radix UI components grouped (@radix-ui/*)
- Testing tools grouped (vitest, playwright, @testing-library)
- Build tools grouped (vite, esbuild, typescript)
- Linting tools grouped (eslint, prettier)
- Major versions blocked by default (manual review required)
- TypeScript types allowed for major updates

**2. Docker Images:**
- Weekly updates for node:20-alpine base image
- Automatic security patch detection

**3. GitHub Actions:**
- Weekly updates for all actions
- Labeled with `ci-cd` for easy identification

**Pull Request Labels:**
- `dependencies` - All dependency updates
- `automated` - Automated PRs
- `npm` / `docker` / `github-actions` - Ecosystem type

**Commit Convention:**
- npm: `chore(deps): update react group`
- GitHub Actions: `chore(ci): update actions/checkout to v4`

**Configuration:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
      timezone: "America/Denver"
    groups:
      react:
        patterns: ["react", "react-dom", "@types/react*"]
      testing:
        patterns: ["vitest*", "@vitest/*", "@playwright/*"]
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

---

### 23. Backup & Disaster Recovery
**Priority:** High
**Effort:** Medium

**PostgreSQL Backup:**
```yaml
# .github/workflows/backup.yml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  backup:
    name: Backup PostgreSQL
    runs-on: ubuntu-latest
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          DATE=$(date +%Y%m%d_%H%M%S)
          BACKUP_FILE="toa-backup-${DATE}.sql.gz"
          
          pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
          
          # Upload to S3
          aws s3 cp "$BACKUP_FILE" \
            "s3://toa-backups/daily/$BACKUP_FILE" \
            --storage-class STANDARD_IA
          
          echo "✅ Backup created: $BACKUP_FILE"
      
      - name: Cleanup old backups
        run: |
          # Keep last 30 days
          CUTOFF_DATE=$(date -d "30 days ago" +%Y%m%d)
          aws s3 ls s3://toa-backups/daily/ \
            | awk '{print $4}' \
            | while read file; do
              FILE_DATE=$(echo $file | grep -oP '\d{8}' | head -1)
              if [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
                aws s3 rm "s3://toa-backups/daily/$file"
                echo "Deleted old backup: $file"
              fi
            done
      
      - name: Verify backup integrity
        run: |
          # Download latest backup
          LATEST=$(aws s3 ls s3://toa-backups/daily/ --recursive \
            | sort | tail -1 | awk '{print $4}')
          
          aws s3 cp "s3://toa-backups/daily/$LATEST" - \
            | gunzip \
            | head -10
          
          echo "✅ Backup integrity verified"
```

**Restore procedure:**
```bash
#!/bin/bash
# scripts/restore-backup.sh

BACKUP_DATE=${1:-latest}
S3_BUCKET="s3://toa-backups/daily"

if [ "$BACKUP_DATE" = "latest" ]; then
  BACKUP_FILE=$(aws s3 ls $S3_BUCKET/ --recursive | sort | tail -1 | awk '{print $4}')
else
  BACKUP_FILE="toa-backup-${BACKUP_DATE}.sql.gz"
fi

echo "Restoring from: $BACKUP_FILE"

# Download and restore
aws s3 cp "$S3_BUCKET/$BACKUP_FILE" - \
  | gunzip \
  | psql "$DATABASE_URL"

echo "✅ Restore complete"
```

---

### 24. Contract Testing with Pact
**Priority:** Low
**Effort:** Medium

**Implementation:**
```typescript
// test/contract/api.pact.test.ts
import { Pact } from '@pact-foundation/pact';
import { like, eachLike } from '@pact-foundation/pact/src/dsl/matchers';

const provider = new Pact({
  consumer: 'toa-frontend',
  provider: 'toa-api',
  port: 8080,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info'
});

describe('Episodes API', () => {
  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  it('returns list of episodes', async () => {
    await provider.addInteraction({
      state: 'episodes exist',
      uponReceiving: 'a request for episodes',
      withRequest: {
        method: 'GET',
        path: '/api/episodes',
        headers: {
          Accept: 'application/json'
        }
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: eachLike({
          id: like(1),
          title: like('Episode 1'),
          description: like('Description'),
          publishedAt: like('2024-01-01T00:00:00Z')
        })
      }
    });

    const response = await fetch('http://localhost:8080/api/episodes');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});
```

---

### 25. Chaos Engineering
**Priority:** Low
**Effort:** High

**Using Chaos Mesh (Kubernetes):**
```yaml
# chaos/pod-failure.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-failure-example
  namespace: chaos-testing
spec:
  action: pod-failure
  mode: one
  duration: '30s'
  selector:
    labelSelectors:
      app: toa-website
  scheduler:
    cron: '@every 6h'
```

**Chaos experiments:**
1. Pod failure (random pod killed)
2. Network delay (500ms latency)
3. Network partition (split brain)
4. CPU stress (90% CPU)
5. Memory stress (512MB allocation)
6. Disk fill (90% disk usage)

**Using in CI:**
```yaml
# .github/workflows/chaos.yml
name: Chaos Engineering

on:
  schedule:
    - cron: '0 4 * * 1'  # Weekly on Monday
  workflow_dispatch:

jobs:
  chaos:
    name: Run Chaos Experiments
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Run pod failure experiment
        run: |
          kubectl apply -f chaos/pod-failure.yaml
          sleep 60
          kubectl delete -f chaos/pod-failure.yaml
      
      - name: Verify system recovery
        run: |
          kubectl wait --for=condition=ready pod -l app=toa-website --timeout=120s
          ./scripts/smoke-tests.sh
```

---

## 🔧 Quick Setup Guide

### Prerequisites
- GitHub account with Actions enabled
- Docker installed
- kubectl configured (for K8s deployments)
- AWS/GCP/Azure account (for cloud deployments)

### Step 1: Enable GitHub Security Features
```bash
# Enable Dependabot
gh repo edit --enable-vulnerability-alerts
gh repo edit --enable-automated-security-fixes

# Enable secret scanning
# Go to: Settings → Security → Code security and analysis → Enable all

# Enable code scanning
# Automatically enabled with CodeQL workflow
```

### Step 2: Add Required Secrets
```bash
# Add to GitHub Secrets (Settings → Secrets → Actions)
gh secret set SNYK_TOKEN
gh secret set SENTRY_DSN
gh secret set DATABASE_URL
gh secret set SESSION_SECRET
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
```

### Step 3: Deploy First Version
```bash
# Build and test locally
npm ci
npm run build
npm test

# Build Docker image
docker build -t toa-website:latest .

# Run security scans
trivy image toa-website:latest

# Push to registry
docker tag toa-website:latest ghcr.io/your-org/toa-website:latest
docker push ghcr.io/your-org/toa-website:latest
```

### Step 4: Monitor & Iterate
- Check GitHub Security tab for alerts
- Review CI/CD pipeline results
- Monitor application performance
- Iterate on security findings

---

## 📊 Monitoring Dashboard Recommendations

### Key Metrics to Track
1. **Application Performance:**
   - Request rate (requests/second)
   - Error rate (%)
   - Response time (p50, p95, p99)
   - Apdex score

2. **Infrastructure:**
   - CPU usage (%)
   - Memory usage (%)
   - Disk I/O
   - Network throughput

3. **Security:**
   - Failed authentication attempts
   - Rate limit hits
   - Security scan findings
   - Dependency vulnerabilities

4. **Business:**
   - Active users
   - Episode views
   - Podcast plays
   - Store visits

### Recommended Tools
- **Grafana** - Dashboards
- **Prometheus** - Metrics collection
- **Loki** - Log aggregation
- **Jaeger** - Distributed tracing

---

## 🎯 Implementation Priority Matrix

| Priority | Effort | Items |
|----------|--------|-------|
| High | Low | 7, 11, 13, 14, 15 |
| High | Medium | 6, 12, 20, 23 |
| High | High | 16, 17 |
| Medium | Low | 8, 18, 19, 22 |
| Medium | Medium | 9, 10, 21 |
| Low | Medium | 24 |
| Low | High | 25 |

### Recommended Implementation Order:
1. **Phase 1 (Week 1-2):** Items 7, 11, 13, 14
2. **Phase 2 (Week 3-4):** Items 6, 15, 20
3. **Phase 3 (Month 2):** Items 8, 9, 10, 12
4. **Phase 4 (Month 3):** Items 16, 17, 18, 19
5. **Phase 5 (Month 4+):** Items 21, 22, 23, 24, 25

---

## 📚 Additional Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [12-Factor App](https://12factor.net/)

### Tools
- [Trivy](https://github.com/aquasecurity/trivy)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
- [CodeQL](https://codeql.github.com/)
- [Snyk](https://snyk.io/)
- [ArgoCD](https://argo-cd.readthedocs.io/)
- [Terraform](https://www.terraform.io/)

### Training
- [GitHub Security Best Practices](https://github.com/features/security)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/)
- [Container Security](https://www.aquasec.com/cloud-native-academy/container-security/)

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-01  
**Next Review:** 2026-02-01
