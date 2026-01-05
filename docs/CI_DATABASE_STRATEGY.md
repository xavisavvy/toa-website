# CI/CD Database Strategy Recommendation

## Current Problem
E2E tests fail when `DATABASE_URL` not configured. Tests need a real database for authentication.

## Recommended Solution: Docker Compose in CI

### Why Docker Compose?
✅ **Fast**: 10-20 second startup  
✅ **Simple**: Same config locally and in CI  
✅ **Cheap**: Minimal CI minutes consumed  
✅ **Debuggable**: Exact replication of CI environment locally  
✅ **Industry Standard**: Used by most Node.js projects  

### Implementation

#### 1. Create `docker-compose.test.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: toa_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user -d toa_test"]
      interval: 5s
      timeout: 5s
      retries: 5
    tmpfs:
      - /var/lib/postgresql/data  # In-memory for speed

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
```

#### 2. Update `.github/workflows/ci.yml`

```yaml
jobs:
  test:
    name: Tests & Coverage
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        env:
          HUSKY: 0
          
      - name: Start test services
        run: docker-compose -f docker-compose.test.yml up -d
        
      - name: Wait for services to be healthy
        run: |
          echo "Waiting for PostgreSQL..."
          timeout 30 bash -c 'until docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U test_user; do sleep 1; done'
          echo "✅ PostgreSQL ready"
          
      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/toa_test
          
      - name: TypeScript type checking
        run: npm run check
        
      - name: Build application
        run: npm run build
        
      - name: Run unit tests with coverage
        run: npm run test:coverage
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/toa_test
          NODE_ENV: test
        
      - name: Run contract tests
        run: npm run test:contract
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/toa_test
        
      - name: Run visual regression tests
        run: npm run test:visual
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/toa_test
        
      - name: Cleanup
        if: always()
        run: docker-compose -f docker-compose.test.yml down -v
        
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
            reports/
```

### Benefits

✅ **Real database** - Tests run against actual PostgreSQL  
✅ **Fast** - In-memory tmpfs for speed  
✅ **Clean state** - Fresh database per CI run  
✅ **No external dependencies** - Self-contained  
✅ **Cost-effective** - Minimal CI minutes  
✅ **Debuggable** - Run same setup locally  

### Local Testing

Developers can use the same setup:

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run tests
export DATABASE_URL=postgresql://test_user:test_password@localhost:5432/toa_test
npm run test:e2e

# Cleanup
docker-compose -f docker-compose.test.yml down -v
```

## Alternative: GitHub Services (Simpler)

If you want even simpler, use GitHub's built-in service containers:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: toa_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
```

**Pros:**
- ✅ Simplest to set up
- ✅ Managed by GitHub
- ✅ Fast startup

**Cons:**
- ❌ Can't replicate locally (not Docker Compose)
- ❌ Less control over configuration

## When to Use Kubernetes

Use Kubernetes **only if**:
- ✅ Running **integration tests** against full production-like environment
- ✅ Testing **multi-service dependencies** (10+ services)
- ✅ Testing **Kubernetes-specific features** (deployments, services, ingress)
- ✅ Running **performance tests** at scale
- ✅ Have **dedicated K8s cluster** for testing (expensive)

**For your project**: NOT needed. Docker Compose is perfect.

## Recommended Implementation Order

1. **Phase 1 (Now)**: Use GitHub Services
   - Simplest
   - Gets E2E tests working immediately
   - Zero local setup needed

2. **Phase 2 (Later)**: Add Docker Compose
   - When developers need local E2E testing
   - Better control and replicability
   - Easy migration from GitHub Services

3. **Phase 3 (Maybe Never)**: Kubernetes
   - Only if scaling to 50+ microservices
   - Only if testing K8s-specific features
   - Requires dedicated infrastructure

## Cost Analysis (GitHub Actions Minutes)

**Docker Compose approach:**
- Spin up: ~15 seconds
- Tests: ~3 minutes
- Cleanup: ~5 seconds
- **Total: ~3.5 minutes per run**

**Kubernetes approach:**
- Spin up K8s: ~60 seconds
- Deploy services: ~30 seconds
- Tests: ~3 minutes
- Cleanup: ~20 seconds
- **Total: ~5 minutes per run**

**Savings**: 40% faster with Docker Compose  
**Annual**: ~100 CI runs/month × 1.5 min savings = **150 minutes/month saved**

## Final Recommendation

### ✅ Use Docker Compose (Recommended)

**Best for:**
- Your current project size
- Fast CI execution
- Local development parity
- Cost efficiency
- Debugging ease

**Implementation:**
- Create `docker-compose.test.yml` (see above)
- Update CI workflow to use it
- Document for team

### ❌ Skip Kubernetes (For Now)

**Unless:**
- You're testing K8s-specific features
- You have 50+ microservices
- You need production-like orchestration testing

**Remember:** YAGNI (You Aren't Gonna Need It)
- Start simple (Docker Compose)
- Add complexity only when necessary
- Kubernetes is for production orchestration, not test environments

---

**Status**: Recommendation complete  
**Suggested Next Step**: Implement Docker Compose test environment  
**Estimated Work**: 1-2 hours  
**Benefit**: All E2E tests run with real database in CI ✅
