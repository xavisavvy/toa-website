# Pre-commit Hook Setup Guide

This guide explains how to enhance the pre-commit hooks with security scanning.

## Current Setup
The project uses Husky for Git hooks with lint-staged.

## Adding Gitleaks Secret Scanning

### Option 1: Using Docker (Recommended)
Add to `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Run Gitleaks to prevent secret commits
docker run -v $(pwd):/path ghcr.io/gitleaks/gitleaks:latest protect --staged --verbose --config=/path/.gitleaks.toml || {
  echo "❌ Gitleaks detected secrets in your staged changes!"
  echo "Please remove the secrets and try again."
  exit 1
}
```

### Option 2: Using Gitleaks CLI (if installed locally)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Run Gitleaks (requires gitleaks to be installed)
if command -v gitleaks &> /dev/null; then
  gitleaks protect --staged --verbose || {
    echo "❌ Gitleaks detected secrets in your staged changes!"
    exit 1
  }
else
  echo "⚠️  Gitleaks not installed. Install from: https://github.com/gitleaks/gitleaks"
fi
```

### Installing Gitleaks Locally

**macOS:**
```bash
brew install gitleaks
```

**Windows:**
```powershell
# Using chocolatey
choco install gitleaks

# Or download from GitHub releases
# https://github.com/gitleaks/gitleaks/releases
```

**Linux:**
```bash
# Download latest release
VERSION=$(curl -s https://api.github.com/repos/gitleaks/gitleaks/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
wget https://github.com/gitleaks/gitleaks/releases/download/${VERSION}/gitleaks_${VERSION#v}_linux_x64.tar.gz
tar -xzf gitleaks_${VERSION#v}_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

## Additional Pre-commit Checks

### TypeScript Type Checking
Add to `.husky/pre-commit`:
```bash
# Type check staged TypeScript files
npx tsc --noEmit
```

### Security Audit
Add to `.husky/pre-commit`:
```bash
# Run npm audit
npm audit --audit-level=high --production || {
  echo "⚠️  High severity vulnerabilities detected!"
  echo "Run 'npm audit fix' to resolve"
}
```

## Bypassing Hooks (Emergency Only)
```bash
# Use --no-verify flag (NOT RECOMMENDED)
git commit --no-verify -m "Emergency fix"
```

## Testing the Hook
```bash
# Test the pre-commit hook
git add .
git commit -m "Test commit"

# Should run:
# 1. lint-staged (formatting/linting)
# 2. Gitleaks (secret scanning)
# 3. TypeScript checking
```

## Troubleshooting

### Hook not running
```bash
# Reinstall husky
npm run prepare
```

### Permission issues
```bash
# Make hook executable
chmod +x .husky/pre-commit
```

### Docker issues on Windows
```powershell
# Ensure Docker Desktop is running
# Use Git Bash or WSL for running hooks
```
