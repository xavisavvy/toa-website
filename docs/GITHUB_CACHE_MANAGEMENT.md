# GitHub Actions Cache Management

## Overview

GitHub Actions has a 10 GB cache storage limit per repository. When you approach this limit, least recently used (LRU) caches are automatically evicted. However, you can proactively manage caches to:

- Free up space before hitting the limit
- Remove stale/unused caches
- Keep only recent caches per branch
- Reduce cache-related costs

## Current Status

**Cache Limit:** 10 GB  
**Warning Threshold:** 9.95 GB  
**Auto-Eviction:** Enabled (LRU)

## Quick Cleanup

### Option 1: Using the Cleanup Script (Recommended)

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate with GitHub
gh auth login

# Delete caches older than 1 day (safe default)
node scripts/cleanup-github-caches.cjs

# Dry run to see what would be deleted
node scripts/cleanup-github-caches.cjs --dry-run

# Delete all caches except 2 most recent per branch
node scripts/cleanup-github-caches.cjs --all --keep-latest 2

# Delete caches from last 24 hours
node scripts/cleanup-github-caches.cjs --older-than-days 1

# Delete caches from specific branch only
node scripts/cleanup-github-caches.cjs --branch main --older-than-days 7
```

### Option 2: Using GitHub CLI Directly

```bash
# List all caches
gh cache list

# Delete specific cache by key
gh cache delete <cache-key>

# Delete all caches (requires confirmation for each)
gh cache delete --all
```

### Option 3: Using GitHub API

```bash
# Set your GitHub token
export GITHUB_TOKEN=ghp_your_token_here

# Use the cleanup script with API
node scripts/cleanup-github-caches.cjs
```

### Option 4: Manual Deletion (Web UI)

1. Go to `https://github.com/xavisavvy/toa-website/actions/caches`
2. Click the trash icon next to each cache
3. Confirm deletion

**Note:** Manual deletion is tedious for many caches!

## Cleanup Script Options

| Option | Description | Default |
|--------|-------------|---------|
| `--all` | Delete ALL caches (use with caution!) | false |
| `--older-than-days N` | Delete caches older than N days | 1 |
| `--branch NAME` | Delete caches from specific branch only | all branches |
| `--dry-run` | Show what would be deleted without deleting | false |
| `--keep-latest N` | Keep N most recent caches per branch | 2 |

## Common Scenarios

### Scenario 1: Approaching Cache Limit (9.95 GB / 10 GB)

**Goal:** Free up ~2-3 GB quickly while keeping recent caches

```bash
# Delete all caches older than 1 day, keep 2 most recent per branch
node scripts/cleanup-github-caches.cjs --older-than-days 1 --keep-latest 2
```

### Scenario 2: After Heavy Testing (last 24 hours)

**Goal:** Remove temporary test caches from recent testing

```bash
# Dry run first to see what would be deleted
node scripts/cleanup-github-caches.cjs --older-than-days 1 --dry-run

# Then delete (keep 3 most recent)
node scripts/cleanup-github-caches.cjs --older-than-days 1 --keep-latest 3
```

### Scenario 3: Clean Up Old Feature Branches

**Goal:** Remove caches from merged/deleted branches

```bash
# Get list of active branches
git branch -r

# Delete caches from specific old branch
node scripts/cleanup-github-caches.cjs --branch old-feature-branch
```

### Scenario 4: Fresh Start

**Goal:** Delete ALL caches and rebuild (use with caution!)

```bash
# Dry run to see everything
node scripts/cleanup-github-caches.cjs --all --keep-latest 0 --dry-run

# Delete all caches
node scripts/cleanup-github-caches.cjs --all --keep-latest 0
```

## Cache Types in This Repository

This repository uses caches for:

1. **Node.js Dependencies** (`node_modules`)
   - Key pattern: `node-modules-*`
   - Size: ~500-800 MB
   - Regenerates: On package.json/package-lock.json changes

2. **Playwright Browsers**
   - Key pattern: `playwright-browsers-*`
   - Size: ~500-700 MB
   - Regenerates: On Playwright version change

3. **Build Outputs** (`dist/`)
   - Key pattern: `build-*`
   - Size: ~50-100 MB
   - Regenerates: On every build

4. **Test Coverage Reports**
   - Key pattern: `coverage-*`
   - Size: ~10-50 MB
   - Regenerates: On test runs

## Best Practices

### 1. Regular Cleanup Schedule

```bash
# Weekly cleanup (can add to cron/scheduled task)
node scripts/cleanup-github-caches.cjs --older-than-days 7 --keep-latest 2
```

### 2. Before Major Changes

```bash
# Clean up before major dependency updates
node scripts/cleanup-github-caches.cjs --all --keep-latest 1
```

### 3. Monitor Cache Usage

Check cache usage regularly:
- GitHub UI: `https://github.com/xavisavvy/toa-website/actions/caches`
- CLI: `gh cache list`

### 4. Optimize Cache Keys

In `.github/workflows/*.yml`, ensure cache keys are specific:

```yaml
# Good - includes hash of lock file
- uses: actions/cache@v4
  with:
    path: node_modules
    key: node-modules-${{ hashFiles('package-lock.json') }}
    
# Bad - too generic, creates many redundant caches
- uses: actions/cache@v4
  with:
    path: node_modules
    key: node-modules-${{ github.run_id }}
```

## Automated Cleanup (Future Enhancement)

Consider adding a scheduled GitHub Action:

```yaml
# .github/workflows/cleanup-caches.yml
name: Cleanup Old Caches

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:  # Manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Cleanup old caches
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh cache delete --all --older-than 7d || true
```

**Note:** This requires `actions: write` permission.

## Troubleshooting

### Error: "GitHub CLI not found"

**Solution:**
```bash
# Install GitHub CLI
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux
# See https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# Authenticate
gh auth login
```

### Error: "GITHUB_TOKEN not set"

**Solution:**
```bash
# Create a Personal Access Token at:
# https://github.com/settings/tokens
# Required scopes: repo, workflow

export GITHUB_TOKEN=ghp_your_token_here
node scripts/cleanup-github-caches.js
```

### Error: "Could not determine repository info"

**Solution:**
```bash
# Make sure you're in the repository directory
cd /path/to/toa-website

# Check git remote
git remote -v
```

### Script runs but doesn't delete anything

**Causes:**
1. Using `--dry-run` flag (this is intentional)
2. No caches match the filter criteria
3. All caches are within `--keep-latest` threshold

**Solution:**
```bash
# Check what caches exist
gh cache list

# Try less restrictive filters
node scripts/cleanup-github-caches.js --older-than-days 0 --keep-latest 1 --dry-run
```

## FAQ

### Q: Will deleting caches break my workflows?

**A:** No! Workflows will still run, they'll just rebuild caches. This may increase workflow duration temporarily.

### Q: How much does cache storage cost?

**A:** Free tier includes 10 GB. Beyond that, it's ~$0.25/GB/month for private repos. Public repos get unlimited free cache storage.

### Q: What's the difference between this and manually deleting?

**A:** This script automates bulk deletion, supports filters, and preserves recent caches. Manual deletion requires clicking each cache individually.

### Q: Can I schedule automatic cleanup?

**A:** Yes! You can:
1. Add a cron job/scheduled task to run the script
2. Create a GitHub Actions workflow (shown above)
3. Use a GitHub App like [CacheCleaner](https://github.com/marketplace/actions/cache-cleaner)

### Q: What happens if I hit the 10 GB limit?

**A:** GitHub automatically evicts least recently used caches. Your workflows continue to work but may be slower as caches are rebuilt.

## References

- [GitHub Actions Cache Documentation](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [GitHub CLI Cache Commands](https://cli.github.com/manual/gh_cache)
- [GitHub API - Actions Caches](https://docs.github.com/en/rest/actions/cache)

## Support

If you encounter issues with cache cleanup:

1. Check this documentation first
2. Run with `--dry-run` to see what would happen
3. Check GitHub Actions logs
4. Open an issue with error details
