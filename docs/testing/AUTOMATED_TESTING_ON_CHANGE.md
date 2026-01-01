# Automated Testing on File Changes

This guide explains how the project automatically runs tests when you change files, ensuring nothing breaks before you commit.

## 🎯 What's Already Configured

Your project has **automatic test verification** on file changes using:
- ✅ **Husky** - Git hooks manager
- ✅ **lint-staged** - Runs commands on staged files
- ✅ **Vitest related** - Smart test detection for changed files

## 🚀 How It Works

### Pre-commit Hook Flow

```
You: git commit -m "feat: add feature"
  ↓
Husky triggers pre-commit hook
  ↓
lint-staged runs on *.ts and *.tsx files
  ↓
1. ESLint --fix (auto-format code)
  ↓
2. Vitest related --run (test affected files)
  ↓
✅ All pass → Commit succeeds
❌ Any fail → Commit blocked, shows errors
```

### What Gets Tested Automatically

When you change a file, Vitest intelligently finds and runs:

1. **Direct tests** - Tests that import your changed file
2. **Dependent tests** - Tests that depend on your changes
3. **Integration tests** - Tests that use the changed functionality
4. **Related E2E tests** - End-to-end tests affected by changes

### Example Scenarios

#### Scenario 1: Change a Component
```bash
# You modify: client/src/components/HeroSection.tsx

# Vitest automatically runs:
✓ test/components/hero-section.test.tsx      # Direct unit test
✓ test/pages/home.test.tsx                   # Page using component
✓ e2e/home-page.spec.ts                      # E2E test for home page
```

#### Scenario 2: Change an API Route
```bash
# You modify: server/routes/users.ts

# Vitest automatically runs:
✓ test/routes/users.test.ts                  # Route unit tests
✓ test/integration/api.test.ts               # API integration tests
✓ test/contract/user-api.pact.test.ts        # Contract tests
✓ e2e/user-registration.spec.ts              # User flow E2E tests
```

#### Scenario 3: Change Shared Types
```bash
# You modify: shared/types/user.ts

# Vitest automatically runs:
✓ All tests importing User type
✓ All components using User
✓ All API routes handling User data
```

## 📋 Testing Commands Reference

### Automatic (Pre-commit)
```bash
git add .
git commit -m "feat: new feature"
# Automatically runs: eslint --fix, vitest related --run
```

### Manual Testing

```bash
# Watch mode - tests rerun on file save
npm run test:watch

# Test only files changed since last commit
npm run test:changed

# Quick test run (no coverage)
npm run test:quick

# Full test suite with coverage
npm run test:coverage

# Full test suite (unit + E2E)
npm run test:all
```

### Specific Test Types

```bash
# Unit tests only
npm run test

# E2E tests only
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Mutation tests
npm run test:mutation

# Contract tests
npm run test:contract

# Security tests
npm run test:security

# Accessibility tests (part of E2E)
npm run test:e2e
```

## ⚙️ Configuration

### Current Setup (package.json)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",           // Auto-fix linting issues
      "vitest related --run"    // Run related tests
    ]
  }
}
```

### Customizing Pre-commit Tests

To modify what runs on commit, edit `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run --coverage",  // Add coverage
      "prettier --write"                   // Add prettier
    ],
    "*.{css,scss}": [
      "stylelint --fix"                    // Add style linting
    ]
  }
}
```

### Adding Type Checking to Pre-commit

Edit `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged (formatting + tests)
npx lint-staged

# Add TypeScript type checking
npx tsc --noEmit || {
  echo "❌ TypeScript type check failed!"
  exit 1
}
```

### Adding Security Scanning to Pre-commit

Edit `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Scan for secrets
if command -v gitleaks &> /dev/null; then
  gitleaks protect --staged --verbose || {
    echo "❌ Secrets detected in staged changes!"
    exit 1
  }
fi
```

## 🎯 Best Practices

### During Development

1. **Use watch mode:**
   ```bash
   npm run test:watch
   ```
   - Tests rerun automatically on file save
   - Fast feedback loop
   - No need to manually run tests

2. **Write tests alongside code:**
   - Create test file when creating component
   - Pre-commit hook ensures tests pass
   - Catch issues before commit

3. **Check coverage regularly:**
   ```bash
   npm run test:coverage
   ```
   - Ensure 80%+ coverage maintained
   - Identify untested code

### Before Committing

1. **Let pre-commit hook run:**
   - Don't use `--no-verify` unless emergency
   - Hooks prevent broken code from entering repo
   - Fast - only tests affected files

2. **Review test failures:**
   - If tests fail, fix before committing
   - Check error messages for root cause
   - Update tests if intentional breaking change

3. **Run full suite periodically:**
   ```bash
   npm run test:all
   ```
   - Before pushing to remote
   - Before creating PR
   - Ensures complete test coverage

### Before Pushing

1. **Run changed tests:**
   ```bash
   npm run test:changed
   ```
   - Tests files changed since last commit
   - Quick validation before push

2. **Run full CI locally:**
   ```bash
   npm run test:ci
   ```
   - Runs same tests as CI pipeline
   - Catches issues before CI

## 🔧 Troubleshooting

### Hook Not Running

```bash
# Reinstall Husky
npm run prepare

# Verify hook exists
ls -la .husky/pre-commit

# Make executable (Unix/Mac)
chmod +x .husky/pre-commit
```

### Tests Failing Unexpectedly

```bash
# Clear Vitest cache
npx vitest --clear-cache

# Run with verbose output
npx vitest --run --reporter=verbose

# Debug specific test
npx vitest --run path/to/test.ts
```

### Pre-commit Too Slow

```bash
# Option 1: Skip coverage in pre-commit
# Edit package.json lint-staged to remove --coverage

# Option 2: Test only staged files (already configured)
# lint-staged already does this

# Option 3: Use quick mode
"vitest related --run --reporter=dot"
```

### Need to Bypass Hook (Emergency)

```bash
# NOT RECOMMENDED - only for critical hotfixes
git commit --no-verify -m "hotfix: critical production bug"

# Then immediately run tests:
npm run test:all
```

## 📊 Performance Optimization

### Current Setup Performance

- **Pre-commit**: ~5-30 seconds (depends on # of changed files)
- **vitest related**: Only runs affected tests (~80% faster than full suite)
- **lint-staged**: Only runs on staged files (not entire repo)

### Making It Faster

1. **Parallel test execution (already enabled):**
   ```json
   // vitest.config.ts
   {
     "test": {
       "pool": "threads",
       "poolOptions": {
         "threads": {
           "singleThread": false
         }
       }
     }
   }
   ```

2. **Skip coverage in pre-commit:**
   ```json
   {
     "lint-staged": {
       "*.{ts,tsx}": [
         "eslint --fix",
         "vitest related --run --no-coverage"  // Skip coverage
       ]
     }
   }
   ```

3. **Use test sharding for large suites:**
   ```bash
   # Split tests across multiple workers
   vitest --shard=1/4
   ```

## 🎓 Understanding Vitest Related

### How It Works

Vitest `--related` uses module graph analysis to find:

```
Changed File: server/routes/users.ts
     ↓
Module Graph Analysis
     ↓
Finds all files that import it:
  - server/index.ts
  - server/routes/index.ts
     ↓
Finds tests for those files:
  - test/routes/users.test.ts (direct)
  - test/integration/api.test.ts (imports users route)
  - test/server.test.ts (imports server)
     ↓
Runs found tests
```

### Comparison: Related vs Full Suite

| Scenario | Related Tests | Full Suite | Time Saved |
|----------|--------------|------------|------------|
| Change 1 component | 3 tests | 150 tests | ~95% faster |
| Change 1 API route | 8 tests | 150 tests | ~90% faster |
| Change shared type | 25 tests | 150 tests | ~80% faster |
| Change config | 150 tests | 150 tests | 0% (runs all) |

## 🚀 Advanced Configurations

### Run Different Tests Based on File Type

```json
{
  "lint-staged": {
    "client/**/*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ],
    "server/**/*.ts": [
      "eslint --fix",
      "vitest related --run",
      "npm run test:contract"  // Also run contract tests
    ],
    "e2e/**/*.ts": [
      "eslint --fix",
      "playwright test --grep 'smoke'"  // Run smoke tests
    ]
  }
}
```

### Add Test Coverage Threshold Check

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run --coverage --coverage.thresholds.lines=80"
    ]
  }
}
```

### Run Security Tests on API Changes

```json
{
  "lint-staged": {
    "server/routes/**/*.ts": [
      "eslint --fix",
      "vitest related --run",
      "npm run test:security"  // Run security tests
    ]
  }
}
```

## 📈 Metrics & Monitoring

### Track Test Execution Time

```bash
# Add to package.json
{
  "scripts": {
    "test:timed": "time npm run test:related"
  }
}
```

### Monitor Test Failures

```bash
# Generate test report
npm run test:coverage

# View report
open coverage/index.html
```

### Pre-commit Performance Log

Add to `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "⏱️  Starting pre-commit checks..."
START_TIME=$(date +%s)

npx lint-staged

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "✅ Pre-commit checks completed in ${DURATION}s"
```

## 🎯 Summary

Your project **already has automated testing on file changes** configured!

**What happens automatically:**
1. You change a file and commit
2. ESLint fixes code formatting
3. Vitest runs tests for affected files
4. Commit only succeeds if all tests pass

**Commands you'll use:**
- `npm run test:watch` - Development (auto-reruns on save)
- `git commit` - Automatic test verification
- `npm run test:changed` - Before pushing
- `npm run test:all` - Before creating PR

**Result:** Never commit broken code! 🎉

---

For more information, see:
- [Testing Guide](../testing/TESTING.md)
- [Pre-commit Guide](.husky/PRE_COMMIT_GUIDE.md)
- [CI/CD Guide](../ci-cd/ENTERPRISE_CICD_GUIDE.md)
