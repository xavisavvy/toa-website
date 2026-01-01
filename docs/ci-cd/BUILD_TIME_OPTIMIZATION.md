# CI/CD Build Time Optimization Guide

## Current State Analysis

**Current CI duration: ~10 minutes**

### Time Breakdown (estimated):
- Dependencies install: ~1-2 min
- Build: ~1 min
- Unit tests: ~1 min
- E2E tests: ~3-4 min
- Visual regression: ~2 min
- Security scans: ~2 min (parallel)
- Uploads: ~30 sec

## 🚀 Optimization Strategies

### 1. **Parallel Job Execution** (Biggest Impact: ~50% faster)

**Current:** Sequential execution
**Optimized:** Run independent jobs in parallel

```yaml
jobs:
  # Split into parallel jobs
  unit-tests:
    runs-on: ubuntu-latest
    # Only unit tests
    
  e2e-tests:
    runs-on: ubuntu-latest
    # Only E2E tests
    
  security:
    runs-on: ubuntu-latest
    # Security scans (already parallel)
```

**Time savings: 5-6 minutes → 3-4 minutes**

### 2. **Selective Test Execution** (Smart Testing)

Run only affected tests based on changed files:

```yaml
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v41
  
- name: Run affected unit tests only
  if: steps.changed-files.outputs.any_changed == 'true'
  run: npm run test:changed
```

**Time savings: ~50% on PRs with small changes**

### 3. **Dependency Caching** (Already implemented ✅)

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # ✅ Already doing this
```

### 4. **Build Caching**

Cache the build output between runs:

```yaml
- name: Cache build
  uses: actions/cache@v4
  with:
    path: dist/
    key: build-${{ hashFiles('client/**', 'server/**') }}
    
- name: Build (if needed)
  if: steps.cache-build.outputs.cache-hit != 'true'
  run: npm run build
```

**Time savings: ~1 minute on cache hit**

### 5. **Playwright Browser Caching**

Cache Playwright browsers (they're large ~300MB):

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
    
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
```

**Time savings: ~30-60 seconds**

### 6. **Skip Redundant Jobs**

Skip jobs that don't need to run:

```yaml
mutation:
  if: github.event_name == 'pull_request'  # ✅ Already doing this
  
visual-regression:
  if: contains(github.event.head_commit.message, 'feat:') || contains(github.event.head_commit.message, 'fix:')
```

### 7. **Optimize Test Execution**

**Playwright optimizations:**
```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : undefined,  // Increase from 1
  fullyParallel: true,  // ✅ Already enabled
  retries: process.env.CI ? 1 : 0,  // Reduce from 2
});
```

**Time savings: ~1-2 minutes**

### 8. **Conditional Visual Regression**

Only run visual tests when UI changes:

```yaml
- name: Check for UI changes
  id: ui-changes
  run: |
    if git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -E 'client/|components/'; then
      echo "changed=true" >> $GITHUB_OUTPUT
    fi
    
- name: Run visual regression tests
  if: steps.ui-changes.outputs.changed == 'true'
  run: npm run test:visual
```

**Time savings: ~2 minutes when no UI changes**

### 9. **Faster npm install**

Use `npm ci --prefer-offline`:

```yaml
- name: Install dependencies
  run: npm ci --prefer-offline --no-audit
```

**Time savings: ~30 seconds**

### 10. **Matrix Strategy for E2E**

Split E2E tests across multiple runners:

```yaml
e2e-tests:
  strategy:
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - run: npx playwright test --shard=${{ matrix.shard }}/4
```

**Time savings: ~75% (4 shards = 3 min → 45 sec)**

## 📊 Optimized CI Workflow

Here's the complete optimized version:

```yaml
name: CI Pipeline (Optimized)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

permissions:
  contents: read
  pull-requests: write

jobs:
  # Job 1: Fast checks (lint, type-check)
  quick-checks:
    name: Quick Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci --prefer-offline --no-audit
      
      - name: TypeScript & Lint
        run: |
          npm run check
          npm run lint
  
  # Job 2: Unit tests (parallel)
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci --prefer-offline --no-audit
      
      - name: Run unit tests with coverage
        run: npm run test:coverage
      
      - uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./coverage/coverage-final.json
  
  # Job 3: E2E tests (sharded for speed)
  e2e-tests:
    name: E2E Tests (Shard ${{ matrix.shard }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2]  # Split into 2 shards
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      
      - run: npm ci --prefer-offline --no-audit
      
      - run: npx playwright install --with-deps chromium
      
      - name: Cache build
        uses: actions/cache@v4
        with:
          path: dist/
          key: build-${{ hashFiles('client/**', 'server/**', 'package-lock.json') }}
      
      - name: Build application
        if: steps.cache-build.outputs.cache-hit != 'true'
        run: npm run build
      
      - name: Run E2E tests (sharded)
        run: npx playwright test --shard=${{ matrix.shard }}/2
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report/
  
  # Job 4: Security scans (already parallel)
  security:
    name: Security Scans
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci --prefer-offline --no-audit
      
      - run: npm audit --production
        continue-on-error: true
      
      - run: npm run test:security
```

## 🎯 Expected Results

| Optimization | Time Saved | Effort |
|--------------|-----------|--------|
| Parallel jobs | 3-4 min | Medium |
| E2E sharding | 2-3 min | Easy |
| Build caching | 1 min | Easy |
| Playwright cache | 30-60 sec | Easy |
| Selective tests | 2-3 min (on PRs) | Medium |
| npm ci --prefer-offline | 30 sec | Easy |
| Skip visual on non-UI | 2 min | Easy |

**Total potential savings: 5-8 minutes**

**New CI time: 2-5 minutes** (down from 10 minutes)

## 🚀 Implementation Priority

### Phase 1: Quick Wins (30 minutes)
1. ✅ Add `--prefer-offline --no-audit` to npm ci
2. ✅ Cache Playwright browsers
3. ✅ Increase Playwright workers to 2
4. ✅ Reduce retries from 2 to 1

**Expected savings: ~2 minutes**

### Phase 2: Parallel Jobs (1 hour)
1. Split into separate jobs (unit, e2e, security)
2. Add build caching
3. Run jobs in parallel

**Expected savings: ~3 minutes**

### Phase 3: Advanced (2-3 hours)
1. E2E test sharding
2. Conditional visual regression
3. Selective test execution

**Expected savings: ~3-4 minutes**

## 📝 Configuration Files to Update

### 1. `.github/workflows/ci.yml` (optimized version)
### 2. `playwright.config.ts` (increase workers)
### 3. `package.json` (add test:changed script)

## 🔍 Monitoring

Track build times with GitHub Actions insights:
- Repository → Actions → Workflows → CI Pipeline
- Check average duration trends
- Identify slow steps

## ⚠️ Trade-offs

**Faster builds vs. completeness:**
- Sharding can hide some test failures
- Skipping tests might miss issues
- More complexity in CI config

**Recommendations:**
- Always run full suite on `main` branch
- Allow selective/sharded tests on PRs
- Keep mutation testing as optional/manual

---

**Next steps:** Would you like me to implement Phase 1 (quick wins) or create the full optimized CI workflow?
