# Testing Infrastructure - Quick Reference

## 🚀 Quick Start

### Run E2E Tests Locally

```bash
# One-liner: Setup, test, and cleanup
npm run test:e2e:setup && npm run test:e2e && npm run test:e2e:teardown

# Or step-by-step:
npm run test:e2e:setup      # Start DB + Redis, run migrations
npm run test:e2e            # Run tests
npm run test:e2e:teardown   # Clean up
```

### Run All Tests with Coverage

```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests (requires setup above)
npm run test:e2e

# Contract tests (external APIs)
npm run test:contract

# Visual regression
npm run test:visual

# Security tests
npm run test:security
```

---

## 📁 Files Added/Modified

### New Files
- ✅ `docker-compose.test.yml` - Test services (PostgreSQL + Redis)
- ✅ `.env.test.example` - Test environment template
- ✅ `docs/E2E_TESTING_SETUP.md` - Complete E2E testing guide
- ✅ `docs/CI_DATABASE_STRATEGY.md` - CI/CD database strategy
- ✅ `docs/VERSION_WORKFLOW_SETUP.md` - Version workflow PAT setup

### Modified Files
- ✅ `.github/workflows/ci.yml` - Added Docker Compose for CI
- ✅ `e2e/global-setup.ts` - Updated database check logic
- ✅ `.gitignore` - Added `.env.test`
- ✅ `package.json` - Added `test:e2e:setup` and `test:e2e:teardown` scripts

---

## 🗄️ Test Database

**Connection String:**
```
postgresql://test_user:test_password@localhost:5432/toa_test
```

**Features:**
- PostgreSQL 16 (Alpine)
- In-memory storage (tmpfs) for speed
- Health checks
- Isolated from dev/prod

---

## 🔧 NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `test:e2e:setup` | Start DB/Redis containers + run migrations |
| `test:e2e:teardown` | Stop and remove test containers |
| `test:e2e` | Run E2E tests |
| `test:e2e:ui` | Run E2E tests in Playwright UI |
| `test:e2e:headed` | Run E2E tests with visible browser |
| `test:coverage` | Run unit tests with coverage |
| `test:contract` | Run API contract tests |
| `test:visual` | Run visual regression tests |
| `test:security` | Run security tests |

---

## ⚙️ CI/CD Behavior

### In GitHub Actions

The CI workflow **automatically**:
1. Starts PostgreSQL + Redis via Docker Compose
2. Waits for services to be healthy (~10 seconds)
3. Runs database migrations
4. Runs all tests (unit, E2E, contract, visual)
5. Cleans up containers

**No manual setup or secrets required!**

---

## 🔑 Secrets Setup (Version Workflow)

### Required: Add GH_PAT to Repository Secrets

1. **Create Fine-Grained PAT**:
   - Go to: https://github.com/settings/tokens?type=beta
   - Repository: `toa-website` only
   - Permissions: Contents (R/W) + Workflows (R/W)
   - Expiration: 90 days

2. **Add to Repository**:
   - Go to: https://github.com/xavisavvy/toa-website/settings/secrets/actions
   - Click "New repository secret"
   - Name: `GH_PAT`
   - Value: (paste PAT)

**Status**: ✅ Already added (confirmed by user)

---

## 📊 Test Coverage Targets

| Type | Current | Target |
|------|---------|--------|
| Unit Tests | ~95% | 80%+ |
| E2E Coverage | Full flows | Critical paths |
| Contract Tests | APIs | External services |
| Visual Tests | Key pages | UI components |

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Stop all test containers
npm run test:e2e:teardown

# Or nuclear option
docker stop $(docker ps -q)
```

### Database Connection Fails

```bash
# Check container status
docker-compose -f docker-compose.test.yml ps

# View logs
docker-compose -f docker-compose.test.yml logs postgres

# Restart services
npm run test:e2e:teardown
npm run test:e2e:setup
```

### Tests Fail with "Database not initialized"

```bash
# Run migrations manually
export DATABASE_URL=postgresql://test_user:test_password@localhost:5432/toa_test
npm run db:push
```

---

## 📚 Documentation

- **E2E Setup**: `docs/E2E_TESTING_SETUP.md`
- **CI Strategy**: `docs/CI_DATABASE_STRATEGY.md`
- **Version Workflow**: `docs/VERSION_WORKFLOW_SETUP.md`
- **Security Policy**: `SECURITY.md`

---

## ✅ Best Practices Applied

1. **Docker Compose** for test environment (NOT Kubernetes)
2. **In-memory database** for speed (tmpfs)
3. **Health checks** for reliability
4. **Automatic cleanup** in CI
5. **Fine-grained PAT** for version workflow
6. **Environment-specific configs** (.env.test.example)
7. **Comprehensive documentation**

---

**Last Updated**: 2026-01-05  
**Status**: Production-ready testing infrastructure ✅
