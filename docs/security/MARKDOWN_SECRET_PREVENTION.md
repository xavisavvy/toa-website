# Markdown Secret Prevention Guide

<!-- 
  NOTE: This file contains EXAMPLE patterns for documentation purposes.
  All keys shown are placeholders and safe to commit.
  This file is allowlisted in .gitleaks.toml to prevent false positives.
-->

## Overview

This repository has **automated secret scanning** for markdown files to prevent accidental exposure of API keys, tokens, and credentials in documentation.

## Why This Matters

Documentation files (`.md`) often include code examples with API keys. Accidentally committing **real keys** instead of placeholders can expose them in git history forever, even if later removed.

## Automated Protection

### Pre-Commit Hook

Every time you commit markdown files, the system automatically scans for:

- ✅ Real Stripe API keys (test and live)
- ✅ AWS access keys
- ✅ Google API keys
- ✅ GitHub tokens
- ✅ Private keys
- ✅ Webhook secrets

**The commit will be BLOCKED if real secrets are detected.**

### How It Works

```bash
# Automatic scan on every commit
git commit -m "Update docs"
# → 🔍 Checking for common mistakes...
# → 🔒 Scanning markdown files for secrets...
# → ✅ No secrets found in markdown files
```

## Safe Documentation Practices

### ✅ DO: Use Obvious Placeholders

```markdown
# Good Examples

## Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

## Or use redaction
STRIPE_SECRET_KEY=sk_test_EXAMPLE_DO_NOT_USE
API_KEY=xxx...xxx
AWS_KEY=AKIA................

## Or use variables
STRIPE_SECRET_KEY={YOUR_SECRET_KEY}
API_KEY=[REDACTED]
TOKEN=[YOUR_TOKEN_HERE]
```

### ❌ DON'T: Use Real Keys

```markdown
# Bad Examples - WILL BE BLOCKED!

## Real test keys (even if rotated)
STRIPE_SECRET_KEY=sk_test_51SkxsyKIWXnqSsOf...
# ❌ Blocked: Real Stripe Test Key

## Live keys (CRITICAL!)
STRIPE_SECRET_KEY=sk_live_abc123xyz...
# ❌ BLOCKED: NEVER commit live keys!

## Real AWS keys
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
# ❌ BLOCKED: AWS Access Key
```

## Manual Scanning

You can manually scan markdown files before committing:

```bash
# Scan all markdown files in the repository
npm run check:markdown-secrets

# Scan specific file
node scripts/check-markdown-secrets.mjs docs/my-file.md
```

## Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **CRITICAL** | Never commit under any circumstances | Live API keys, private keys, GitHub tokens |
| **HIGH** | Should never be in documentation | Live publishable keys, webhook secrets |
| **MEDIUM** | Use placeholders instead | Real test keys (even if rotated) |

## What Happens If Secrets Are Found

```bash
❌ SECRET EXPOSURE DETECTED IN MARKDOWN FILES!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 CRITICAL VIOLATIONS (NEVER commit these!):

  docs/api.md:42
  ⚠️  Stripe Live Secret Key: sk_live_abc123xyz...
  💡 NEVER commit live Stripe keys to documentation!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️  HOW TO FIX:

1. Replace real keys with placeholders:
   ❌ sk_test_51SkxsyKIWXn...
   ✅ sk_test_your_key_here

2. Use obvious fake values:
   ✅ sk_test_EXAMPLE_DO_NOT_USE
   ✅ pk_test_xxx...xxx

3. Mark as redacted:
   ✅ [REDACTED]
   ✅ {YOUR_API_KEY_HERE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Commit blocked to prevent secret exposure!
```

## Allowed Placeholder Patterns

These patterns are recognized as safe placeholders and allowed:

- `sk_test_your_key_here`
- `pk_test_your_publishable_key_here`
- `sk_live_...`
- `pk_live_...`
- `whsec_your_secret_here`
- `AKIA................` (redacted AWS key)
- `xxx...xxx`
- `{YOUR_KEY}`
- `[REDACTED]`
- `your_api_key_here`
- `example_key`
- `placeholder`

## Bypassing the Check (Emergency Only)

If you absolutely must commit a file with what looks like a secret (e.g., for security testing documentation):

```bash
# Skip pre-commit hooks (USE WITH CAUTION!)
git commit --no-verify -m "Security test documentation"
```

**⚠️ WARNING**: Only use `--no-verify` if:
1. You've confirmed it's a placeholder or already-rotated test key
2. You've documented it as a controlled security test
3. You have approval from security team

## Supported File Types

Currently scans:
- `.md` files (markdown documentation)

Future support planned:
- `.txt` files
- `.rst` files (reStructuredText)
- Code comments with `@example` or `@usage` tags

## Testing the Scanner

You can test the scanner with a safe test file:

```bash
# Create a test file with a fake secret
echo 'API_KEY=sk_test_51SkxsyKIWXnqSsOf1234567890' > test.md

# Stage it
git add test.md

# Try to commit (will be blocked)
git commit -m "Test"
# → ❌ SECRET EXPOSURE DETECTED!

# Fix it
echo 'API_KEY=sk_test_your_key_here' > test.md
git add test.md

# Try again (will succeed)
git commit -m "Test"
# → ✅ No secrets found in markdown files
```

## Related Security Measures

This markdown scanner is part of a defense-in-depth strategy:

1. **Gitleaks** - Scans all files for secrets (pre-commit)
2. **Markdown Scanner** - Additional protection for documentation
3. **GitHub Secret Scanning** - Cloud-based detection
4. **`.gitignore`** - Prevents `.env` files from being committed
5. **SECURITY.md** - Vulnerability reporting policy

## Troubleshooting

### False Positives

If the scanner blocks a legitimate placeholder:

1. Make the placeholder more obvious:
   ```markdown
   # Instead of:
   API_KEY=sk_test_a1b2c3d4e5f6g7h8

   # Use:
   API_KEY=sk_test_your_key_here
   API_KEY=sk_test_PLACEHOLDER_NOT_REAL
   ```

2. Report the false positive:
   - Open an issue with the pattern
   - We'll add it to the allowlist

### Scanner Not Running

If the pre-commit hook doesn't run:

```bash
# Reinstall husky hooks
npm run prepare

# Verify hook is installed
ls -la .git/hooks/pre-commit

# Test manually
npm run check:markdown-secrets
```

## Contributing

When adding documentation:

1. **Always use placeholders** for API keys
2. **Test before committing**: `npm run check:markdown-secrets`
3. **Make it obvious**: Use `your_key_here`, `xxx...xxx`, or `[REDACTED]`
4. **Follow examples**: Look at existing docs for patterns

## Security Test Documentation

If documenting a controlled security test:

1. Use placeholder keys in examples
2. Document the test clearly
3. Note that keys were rotated before exposure
4. Reference this guide

Example:
```markdown
# Security Test - Controlled Exercise

**NOTE**: This was a controlled security test. All keys shown below
were rotated BEFORE the repository was made public.

Example (keys already rotated):
- Test key pattern: `sk_test_[50+ characters]`
- Placeholder for docs: `sk_test_your_key_here`
```

## Questions?

- **Security concerns**: security@talesofaneria.com
- **False positives**: Open a GitHub issue
- **Feature requests**: Open a GitHub issue

---

**Last Updated**: 2026-01-05  
**Script**: `scripts/check-markdown-secrets.mjs`  
**Hook**: `.husky/pre-commit`
