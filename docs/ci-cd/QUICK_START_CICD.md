# CI/CD Quick Start Guide - Free Tier Optimized

**Last Updated:** 2026-01-01  
**Status:** ✅ Optimized for GitHub Free Tier

---

## 🎯 What This Guide Covers

This document explains the CI/CD configuration optimized for **GitHub Free tier** (personal accounts).

---

## ✅ What's Currently Running

Your CI/CD pipeline is fully functional and includes:

### 1. Tests & Coverage (Core)
- **Unit Tests:** 351 tests (Vitest)
- **E2E Tests:** 91 tests (Playwright)
- **Coverage:** 42.3% (exceeds 40% threshold)
- **Type Checking:** TypeScript validation
- **Duration:** ~6-10 minutes

### 2. Security Scanning (5 Tools)
- **Container Security:** Trivy (JSON reports)
- **Dependency Scanning:** npm audit + Snyk
- **Secret Scanning:** Gitleaks
- **Security Tests:** OWASP Top 10
- **Mutation Testing:** Code quality (PRs only)

### 3. Code Quality
- **Linting:** ESLint
- **Type Safety:** TypeScript compiler
- **Format:** Prettier (via lint-staged)

---

## ❌ What's Disabled (Free Tier Limitations)

### CodeQL SAST Analysis
**Status:** Disabled (commented out)  
**Reason:** Requires GitHub Advanced Security (paid feature)  
**Impact:** None - 5 other security tools still active

### SARIF Upload to Security Tab
**Status:** Disabled  
**Reason:** Requires GitHub Advanced Security  
**Impact:** None - JSON reports available as artifacts

---

## 🔧 Recent Fixes Applied

### Fix #1: Playwright Browsers
**Problem:** E2E tests failing - browsers not installed  
**Solution:** Added `npx playwright install --with-deps chromium`  
**Status:** ✅ Fixed

### Fix #2: CodeQL Errors
**Problem:** CodeQL failing without Advanced Security  
**Solution:** Commented out CodeQL job  
**Status:** ✅ Fixed

### Fix #3: SARIF Upload Errors
**Problem:** Trivy SARIF upload failing  
**Solution:** Switched to JSON-only format  
**Status:** ✅ Fixed

---

## 🚀 How to Use

### Running Tests Locally

```bash
# All unit tests (fast - 6 seconds)
npm test

# With coverage report
npm run test:coverage

# E2E tests (slower - requires browsers)
npm run test:e2e

# Security tests only
npm run test:security

# Contract tests
npm run test:contract
```

### Viewing CI Results in GitHub

1. Go to **Actions** tab
2. Click on the latest workflow run
3. View results for each job:
   - **Tests & Coverage** - Test results
   - **Container Security** - Trivy scan results
   - **Dependency Scan** - npm audit results
   - **Secret Scan** - Gitleaks results
   - **Security Audit** - OWASP tests

### Downloading Security Reports

1. Go to workflow run
2. Scroll to **Artifacts** section
3. Download:
   - `trivy-results` - Container vulnerabilities (JSON)
   - `npm-audit-results` - Dependency vulnerabilities (JSON)
   - `snyk-results` - Advanced dependency scan (JSON)
   - `test-results` - Coverage reports (HTML)

---

## 📊 CI/CD Workflow Overview

```
Push to main/develop
    ↓
┌───────────────────────────────────┐
│  Tests & Coverage                 │
│  - TypeScript check               │
│  - Unit tests (351)               │
│  - E2E tests (91)                 │
│  - Contract tests                 │
│  - Visual regression              │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Container Security (Trivy)       │
│  - Build Docker image             │
│  - Scan for vulnerabilities       │
│  - Upload JSON report             │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Dependency Scan                  │
│  - npm audit                      │
│  - Snyk scan                      │
│  - Upload results                 │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Secret Scan (Gitleaks)           │
│  - Scan git history               │
│  - Detect leaked credentials      │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Security Tests                   │
│  - OWASP Top 10                   │
│  - Input validation               │
│  - Injection tests                │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Code Quality                     │
│  - TypeScript compilation         │
│  - Linting                        │
└───────────────────────────────────┘
    ↓
✅ All Passed → Ready for Deploy
```

---

## 🔐 GitHub Secrets Setup (Optional)

These are **optional** - your CI works without them:

### How to Add:
1. Repository → **Settings**
2. **Secrets and variables** → **Actions**
3. **New repository secret**

### Recommended Secrets:
```
YOUTUBE_API_KEY          # YouTube Data API v3
ETSY_API_KEY            # Etsy integration (optional)
ETSY_ACCESS_TOKEN       # Etsy auth (optional)
SNYK_TOKEN              # Snyk Pro features (optional)
```

**See:** [GITHUB_SECRETS_GUIDE.md](./GITHUB_SECRETS_GUIDE.md) for details

---

## 📈 Coverage Thresholds

Your project enforces these thresholds:

### Global
- **All metrics:** 40% minimum
- **Current:** 42.3% ✅

### Critical Files
| File | Threshold | Current |
|------|-----------|---------|
| `server/routes.ts` | 80% | 82%+ ✅ |
| `server/security.ts` | Custom | Pass ✅ |
| `server/env-validator.ts` | Custom | Pass ✅ |

---

## 🛠️ Troubleshooting

### Tests Failing Locally?

```bash
# Clear caches
npm run clean
npm ci

# Reinstall Playwright browsers
npx playwright install --with-deps

# Run specific test file
npm test -- routes.test.ts
```

### CI Taking Too Long?

**Current average:** 10-15 minutes

**To speed up:**
- E2E tests run in parallel (already optimized)
- Container scan uses layer caching
- Dependencies cached between runs

### Coverage Dropping?

```bash
# Check what's not covered
npm run test:coverage

# Open HTML report
npm run coverage:view
```

### Security Scan Failing?

**Check the artifacts:**
1. Download `trivy-results` JSON
2. Review vulnerabilities
3. Update dependencies: `npm audit fix`

---

## 🔄 When You Upgrade to GitHub Team

### To Enable CodeQL:

1. **In Repository Settings:**
   - Security → Code scanning
   - Enable CodeQL

2. **In `.github/workflows/ci.yml`:**
   ```yaml
   # Uncomment lines 120-150 (CodeQL job)
   # Uncomment lines 99-104 (SARIF upload)
   ```

3. **Push changes:**
   ```bash
   git add .github/workflows/ci.yml
   git commit -m "feat: enable CodeQL scanning"
   git push
   ```

### Benefits You'll Get:
- Deep SAST code analysis
- GitHub Security tab integration
- Automated security alerts
- Dependency graph insights

---

## 📚 Related Documentation

| Document | Purpose |
|----------|---------|
| [TESTING.md](./TESTING.md) | Testing guide and best practices |
| [SECURITY_SCANNING.md](./SECURITY_SCANNING.md) | Security tools configuration |
| [GITHUB_SECRETS_GUIDE.md](./GITHUB_SECRETS_GUIDE.md) | API keys setup guide |
| [TEST_COVERAGE_SUMMARY.md](./TEST_COVERAGE_SUMMARY.md) | Coverage details |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide |

---

## ✅ Quick Checklist

Before pushing code:

- [ ] All tests pass locally (`npm test`)
- [ ] Coverage meets thresholds (`npm run test:coverage`)
- [ ] TypeScript compiles (`npm run check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Security tests pass (`npm run test:security`)

---

## 🎯 Summary

**Your CI/CD Pipeline:**
- ✅ Fully functional on GitHub Free tier
- ✅ 442+ tests running
- ✅ 5 security scanning tools active
- ✅ Coverage thresholds enforced
- ✅ Fast feedback (~10 min)
- ✅ Production ready

**No Action Required:**
- Everything works out of the box
- No paid features required
- Enterprise-grade quality
- Easy to upgrade later

---

## 💡 Pro Tips

### Speed Up Local Development
```bash
# Run only changed tests
npm test -- --changed

# Run tests in watch mode
npm test -- --watch

# Skip slow tests
npm test -- --exclude e2e
```

### Debug CI Failures
```bash
# Download artifact from GitHub Actions
# Extract and view reports locally
unzip test-results.zip
open coverage/index.html
```

### Monitor Security
```bash
# Check for vulnerabilities weekly
npm audit

# Update dependencies
npm update

# Fix security issues
npm audit fix
```

---

**Everything is configured and ready to go!** 🚀

---

**Questions?** Check the related documentation or open an issue.

**Need help?** See [TESTING.md](./TESTING.md) for detailed testing guide.
