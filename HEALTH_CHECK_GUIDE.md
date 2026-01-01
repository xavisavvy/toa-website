# Health Check & Monitoring Guide

**Tales of Aneria - Comprehensive Health Monitoring**

Last Updated: 2026-01-01

---

## 📊 Overview

This application includes enterprise-grade health checks with multiple endpoints for different monitoring scenarios (Kubernetes, Docker, load balancers).

### Health Check Endpoints

| Endpoint | Purpose | Use Case | Status Codes |
|----------|---------|----------|--------------|
| `/api/health` | Comprehensive system health | General monitoring, dashboards | 200 (OK), 503 (Unhealthy) |
| `/api/alive` | Liveness probe | Kubernetes pod restart trigger | 200 (Alive) |
| `/api/ready` | Readiness probe | Traffic routing decisions | 200 (Ready), 503 (Not Ready) |
| `/api/startup` | Startup probe | Slow-starting application detection | 200 (Started), 503 (Starting) |

---

## 🏥 Health Status Levels

### Overall Status

- **`healthy`** - All systems operational
- **`degraded`** - Some issues detected, but service functional
- **`unhealthy`** - Critical issues, service may be impaired

### Component Checks

Each health check monitors these components:

1. **Storage** - Database connectivity and response time
2. **Cache** - Cache hit rate and operational status
3. **Memory** - Heap usage and system memory
4. **Disk** - File system I/O performance
5. **CPU** - System load averages

---

## 🔍 Detailed Endpoint Documentation

### 1. `/api/health` - Comprehensive Health Check

**Purpose:** Provides detailed health status of all system components.

**Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-01T14:30:00.000Z",
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
      "responseTime": 2,
      "details": {
        "hitRate": "85.32%",
        "entries": 142
      }
    },
    "memory": {
      "status": "healthy",
      "message": "Memory usage normal",
      "responseTime": 1,
      "details": {
        "heapUsed": "128MB",
        "heapTotal": "256MB",
        "heapUsedPercent": "50.00%",
        "rss": "180MB"
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
      "responseTime": 1,
      "details": {
        "loadAvg1m": "0.45",
        "cpuCount": 4,
        "normalizedLoad": "0.11"
      }
    }
  }
}
```

**Status Codes:**
- `200` - System healthy or degraded
- `503` - System unhealthy

**When to use:**
- Monitoring dashboards
- Alerting systems
- Operational visibility
- Troubleshooting

---

### 2. `/api/alive` - Liveness Probe

**Purpose:** Determines if the application process is responsive.

**Response Example:**
```json
{
  "alive": true,
  "timestamp": "2026-01-01T14:30:00.000Z",
  "uptime": 3600
}
```

**Status Codes:**
- `200` - Application is alive and responding

**When to use:**
- Kubernetes liveness probe
- Docker health check
- Process monitoring

**Kubernetes Configuration:**
```yaml
livenessProbe:
  httpGet:
    path: /api/alive
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

---

### 3. `/api/ready` - Readiness Probe

**Purpose:** Determines if the application can handle traffic.

**Response Example (Ready):**
```json
{
  "ready": true,
  "timestamp": "2026-01-01T14:30:00.000Z"
}
```

**Response Example (Not Ready):**
```json
{
  "ready": false,
  "timestamp": "2026-01-01T14:30:00.000Z",
  "checks": {
    "storage": "unhealthy",
    "cache": "healthy"
  }
}
```

**Status Codes:**
- `200` - Ready to receive traffic
- `503` - Not ready (storage or cache unhealthy)

**When to use:**
- Kubernetes readiness probe
- Load balancer health checks
- Traffic routing decisions

**Kubernetes Configuration:**
```yaml
readinessProbe:
  httpGet:
    path: /api/ready
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

---

### 4. `/api/startup` - Startup Probe

**Purpose:** Determines if the application has finished initializing.

**Response Example (Started):**
```json
{
  "started": true,
  "timestamp": "2026-01-01T14:30:00.000Z",
  "uptime": 45
}
```

**Response Example (Starting):**
```json
{
  "started": false,
  "timestamp": "2026-01-01T14:30:00.000Z",
  "message": "Application still initializing"
}
```

**Status Codes:**
- `200` - Application started
- `503` - Still starting

**When to use:**
- Slow-starting applications
- Complex initialization processes
- Prevents premature liveness/readiness checks

**Kubernetes Configuration:**
```yaml
startupProbe:
  httpGet:
    path: /api/startup
    port: 5000
  initialDelaySeconds: 0
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 30  # 150 seconds total
```

---

## 🐳 Docker Integration

### Dockerfile Health Check

The Dockerfile includes automatic health checking:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/alive || exit 1
```

**Parameters:**
- `interval=30s` - Check every 30 seconds
- `timeout=3s` - Fail if check takes >3 seconds
- `start-period=10s` - Grace period on startup
- `retries=3` - Mark unhealthy after 3 failures

### docker-compose.yml Health Check

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Check status:**
```bash
docker ps
# Look for (healthy) or (unhealthy) in STATUS column

docker inspect --format='{{json .State.Health}}' container-name | jq
```

---

## ☸️ Kubernetes Integration

### Complete Pod Spec Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: toa-website
spec:
  containers:
  - name: app
    image: toa-website:latest
    ports:
    - containerPort: 5000
    
    # Startup probe - gives app time to initialize
    startupProbe:
      httpGet:
        path: /api/startup
        port: 5000
      initialDelaySeconds: 0
      periodSeconds: 5
      failureThreshold: 30  # 150 seconds max startup time
    
    # Liveness probe - restarts pod if failing
    livenessProbe:
      httpGet:
        path: /api/alive
        port: 5000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
    
    # Readiness probe - controls traffic routing
    readinessProbe:
      httpGet:
        path: /api/ready
        port: 5000
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
```

---

## 🎯 Component-Specific Thresholds

### Storage Check
- **Healthy:** Response time <1000ms
- **Degraded:** Response time ≥1000ms
- **Unhealthy:** Storage unavailable or error

### Cache Check
- **Healthy:** Hit rate ≥50% (when total requests >100)
- **Degraded:** Hit rate <50% (when total requests >100)
- **Unhealthy:** Cache check failed

### Memory Check
- **Healthy:** Heap usage <75%
- **Degraded:** Heap usage 75-90%
- **Unhealthy:** Heap usage >90%

### Disk Check
- **Healthy:** I/O response time <500ms
- **Degraded:** I/O response time ≥500ms
- **Unhealthy:** Cannot write to disk

### CPU Check
- **Healthy:** Normalized load <1.0
- **Degraded:** Normalized load 1.0-2.0
- **Unhealthy:** Normalized load >2.0

---

## 📈 Monitoring & Alerting

### Prometheus Integration Example

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'toa-website'
    metrics_path: '/api/health'
    scrape_interval: 30s
    static_configs:
      - targets: ['toa-website:5000']
```

### Alerting Rules Example

```yaml
groups:
  - name: toa-health
    rules:
      - alert: ServiceUnhealthy
        expr: health_status{job="toa-website"} == 503
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "TOA Website is unhealthy"
          
      - alert: ServiceDegraded
        expr: health_status_degraded{job="toa-website"} == 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "TOA Website is degraded"
```

---

## 🧪 Testing Health Checks

### Local Testing

```bash
# Start the application
npm run dev

# Test each endpoint
curl http://localhost:5000/api/health | jq
curl http://localhost:5000/api/alive | jq
curl http://localhost:5000/api/ready | jq
curl http://localhost:5000/api/startup | jq

# Check response time
time curl http://localhost:5000/api/health
```

### Docker Testing

```bash
# Build and run
docker build -t toa-website:test .
docker run -p 5000:5000 toa-website:test

# Watch health status
watch -n 2 'docker ps | grep toa-website'

# Inspect health
docker inspect --format='{{json .State.Health}}' container-id | jq
```

### Automated Tests

The project includes comprehensive health check tests in `test/integration/health.test.ts`:

```bash
# Run health check tests
npm test test/integration/health.test.ts

# Tests include:
# - All endpoint responses
# - Status code validation
# - Component check validation
# - Concurrent request handling
# - Response time verification
# - Kubernetes probe compatibility
```

---

## 🔧 Troubleshooting

### Health Check Failing

1. **Check logs:**
   ```bash
   docker logs container-name
   # or
   kubectl logs pod-name
   ```

2. **Test manually:**
   ```bash
   curl -v http://localhost:5000/api/health
   ```

3. **Check component details:**
   ```bash
   curl http://localhost:5000/api/health | jq '.checks'
   ```

### Common Issues

**Storage Unhealthy:**
- Check database connectivity
- Verify DATABASE_URL environment variable
- Ensure database is running

**Memory Degraded:**
- Review heap usage trends
- Consider increasing container memory limits
- Check for memory leaks

**Disk I/O Slow:**
- Check disk space: `df -h`
- Review I/O metrics
- Consider faster storage

**CPU Overloaded:**
- Review load averages
- Scale horizontally (more pods)
- Optimize expensive operations

---

## 📚 Best Practices

1. **Always use all three probe types in Kubernetes:**
   - Startup probe prevents premature checks
   - Liveness probe restarts failed pods
   - Readiness probe controls traffic

2. **Set appropriate thresholds:**
   - Don't make checks too sensitive
   - Allow time for temporary issues to resolve
   - Use `failureThreshold` wisely

3. **Monitor health check endpoints:**
   - Track response times
   - Alert on failures
   - Log degraded states

4. **Test health checks in CI/CD:**
   - Verify endpoints return correct status codes
   - Test degraded scenarios
   - Validate response schemas

5. **Document custom thresholds:**
   - If you modify thresholds, document why
   - Keep business context in mind
   - Review periodically

---

## 📖 Related Documentation

- [Enterprise CI/CD Guide](./ENTERPRISE_CICD_GUIDE.md) - Overall DevOps strategy
- [Docker Guide](./DOCKER.md) - Container best practices
- [Monitoring](./server/monitoring.ts) - Application metrics
- [Testing Guide](./TESTING.md) - Test coverage information

---

**Questions or Issues?**
- Check test suite: `test/integration/health.test.ts`
- Review implementation: `server/health.ts`
- See Dockerfile: `Dockerfile` (line 136-137)
