# E2E Testing Setup Guide

## Quick Start (Local)

### 1. Start Test Services

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready (should be ~10 seconds)
docker-compose -f docker-compose.test.yml ps
```

### 2. Set Up Environment

```bash
# Copy test environment template
cp .env.test.example .env.test

# Load environment variables (or use dotenv)
export DATABASE_URL=postgresql://test_user:test_password@localhost:5432/toa_test
export REDIS_URL=redis://localhost:6379
export NODE_ENV=test
```

### 3. Run Database Migrations

```bash
# Push schema to test database
npm run db:push
```

### 4. Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode for debugging
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### 5. Cleanup

```bash
# Stop and remove test services
docker-compose -f docker-compose.test.yml down -v
```

---

## CI/CD Setup (Automatic)

The CI workflow automatically:

1. ✅ Starts PostgreSQL and Redis via Docker Compose
2. ✅ Waits for services to be healthy
3. ✅ Runs database migrations
4. ✅ Runs all E2E, contract, and visual tests
5. ✅ Cleans up containers after tests

**No manual setup needed in CI!**

---

## Test Database Details

**Connection:**
- Host: `localhost`
- Port: `5432`
- Database: `toa_test`
- User: `test_user`
- Password: `test_password`
- URL: `postgresql://test_user:test_password@localhost:5432/toa_test`

**Features:**
- ✅ PostgreSQL 16 (Alpine - minimal size)
- ✅ In-memory storage (tmpfs) for speed
- ✅ Health checks for reliability
- ✅ Isolated from production/development

---

## Redis Details

**Connection:**
- Host: `localhost`
- Port: `6379`
- URL: `redis://localhost:6379`

**Features:**
- ✅ Redis 7 (Alpine)
- ✅ No persistence (test data only)
- ✅ Health checks

---

## Troubleshooting

### Services Won't Start

```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Stop conflicting services
docker-compose -f docker-compose.test.yml down -v

# Or stop all Docker containers
docker stop $(docker ps -q)
```

### Database Connection Fails

```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.test.yml logs postgres

# Manually test connection
docker-compose -f docker-compose.test.yml exec postgres psql -U test_user -d toa_test

# Verify health
docker-compose -f docker-compose.test.yml ps
```

### Tests Fail with "Database not initialized"

```bash
# Make sure migrations ran
npm run db:push

# Verify tables exist
docker-compose -f docker-compose.test.yml exec postgres psql -U test_user -d toa_test -c "\dt"
```

### Clean Start

```bash
# Nuclear option: remove everything and start fresh
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
npm run db:push
npm run test:e2e
```

---

## Best Practices

### ✅ DO:
- Start fresh containers for each test session
- Use `docker-compose down -v` to remove volumes
- Run migrations before E2E tests
- Keep test database isolated from dev/prod

### ❌ DON'T:
- Use production database for tests
- Share test database between CI runs
- Commit `.env.test` file (use `.env.test.example`)
- Forget to clean up containers after testing

---

## Performance Tips

### Speed Up Tests

1. **Use tmpfs (already configured)**:
   - Database runs in memory
   - ~2-3x faster than disk

2. **Parallel Execution**:
   ```bash
   # Already configured in playwright.config.ts
   workers: process.env.CI ? 2 : undefined
   ```

3. **Selective Testing**:
   ```bash
   # Run specific test file
   npm run test:e2e -- order-tracking.spec.ts
   
   # Run tests matching pattern
   npm run test:e2e -- --grep "checkout"
   ```

4. **Skip Slow Tests Locally**:
   ```typescript
   // In test file
   test.skip('slow test', async () => {
     // Only runs in CI
   });
   ```

---

## Integration with Development

### Development Database vs Test Database

| Aspect | Development | Test |
|--------|-------------|------|
| **File** | `docker-compose.yml` | `docker-compose.test.yml` |
| **Database** | `toa_dev` | `toa_test` |
| **Persistence** | ✅ Volumes | ❌ Tmpfs (in-memory) |
| **Port** | 5432 | 5432 (same, but different container) |
| **Purpose** | Local development | Automated testing |

**Note:** Cannot run both simultaneously (port conflict). Stop dev containers before running tests.

---

## Adding New Test Services

If you need additional services (e.g., S3 mock, email service):

```yaml
# docker-compose.test.yml
services:
  # ... existing services ...
  
  localstack:  # AWS services mock
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,ses
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

## CI/CD Environment Variables

The CI workflow sets these automatically:

```yaml
env:
  DATABASE_URL: postgresql://test_user:test_password@localhost:5432/toa_test
  REDIS_URL: redis://localhost:6379
  NODE_ENV: test
```

**No GitHub secrets needed for test database!** Test credentials are safe to commit.

---

## Summary

✅ **Local Setup**: 3 commands  
✅ **CI Setup**: Automatic  
✅ **Database**: PostgreSQL 16 in-memory  
✅ **Cache**: Redis 7  
✅ **Speed**: ~10-20 seconds startup  
✅ **Isolation**: Fresh database per run  

**Next Steps:**
1. Run `docker-compose -f docker-compose.test.yml up -d`
2. Run `npm run db:push`
3. Run `npm run test:e2e`
4. Enjoy fully automated E2E testing! 🚀
