# Security Incident Report

**Date**: 2026-01-05  
**Severity**: Medium  
**Status**: Remediated (Keys removed from current files, rotation required)

## Incident Summary

Stripe test API keys were accidentally committed to git history in documentation file.

## Timeline

- **2024-12** (approx): Commit `2d33721` added real Stripe test keys to `STRIPE_INTEGRATION.md`
- **Later**: Keys removed from current files during docs reorganization (commit `053b0a1`)
- **2026-01-05**: Exposure discovered via secret scanning
- **2026-01-05**: Incident documented, key rotation initiated

## Exposure Details

### What Was Exposed
- Stripe Publishable Test Key: `pk_test_51SkxsyKIWXnqSsOfO...`
- Stripe Secret Test Key: `sk_test_51SkxsyKIWXnqSsOfz...`

### Where
- **File**: `STRIPE_INTEGRATION.md` (now at `docs/integration/STRIPE_INTEGRATION.md`)
- **Commits**: `2d33721`, `9f34ded`, `41255e6`, `3051d80` (git history)
- **Repository**: Public GitHub repository

### Impact Assessment
- ✅ **Test keys only** (not production)
- ✅ **Keys removed from current files**
- ❌ **Keys still in git history** (immutable)
- ⚠️ **Public repository** - keys accessible to anyone

## Remediation Actions

### Completed ✅
1. Keys removed from all current tracked files
2. `.env` properly gitignored
3. Gitleaks scanning configured
4. Security policy (SECURITY.md) published
5. Incident documented

### Required ⚠️
1. **Rotate Stripe test keys** (IMMEDIATE)
   - Delete exposed keys in Stripe Dashboard
   - Generate new test keys
   - Update local `.env` file
   - Verify no other systems use old keys

2. **Verify Production Keys Safe**
   - Confirm no production keys ever committed
   - Audit production key access logs

### Recommended 💡
1. **Git History Cleanup** (Optional)
   - Use `git filter-repo` or BFG Repo-Cleaner to remove from history
   - Requires force-push and coordination with all contributors
   - May break existing forks/clones

2. **Enhanced Monitoring**
   - Enable GitHub secret scanning alerts
   - Add Stripe webhook logging
   - Monitor Stripe dashboard for unusual activity

## Lessons Learned

### What Went Wrong
1. Documentation file accidentally included real keys as examples
2. Pre-commit hooks didn't catch it (possibly not enabled then)
3. Code review didn't flag the exposure

### Prevention Measures Implemented
1. ✅ Gitleaks pre-commit hooks now active
2. ✅ `.env` files properly gitignored
3. ✅ Template files use obvious placeholders
4. ✅ SECURITY.md published with reporting process
5. ✅ Secret scanning in CI/CD pipeline

### Additional Recommendations
1. **Never use real keys in documentation** - always use placeholders like:
   - `pk_test_your_key_here`
   - `sk_test_xxx...xxx`
   - `pk_test_EXAMPLE_KEY_DO_NOT_USE`

2. **Pre-commit checklist** for contributors:
   ```bash
   grep -r "sk_test_51" . --exclude-dir=node_modules
   grep -r "sk_live_" . --exclude-dir=node_modules
   ```

3. **Periodic key rotation** - rotate test keys quarterly

## Verification Steps

After key rotation, verify:

```bash
# 1. Old keys no longer work
curl https://api.stripe.com/v1/charges \
  -u sk_test_51SkxsyKIWXnqSsOfz...: \
  # Should return 401 Unauthorized

# 2. New keys work
npm run dev
# Test checkout flow

# 3. Git history check
git log --all -S "sk_test_51Skxsy" --oneline
# Shows historical commits (expected)

# 4. Current files check
git grep "sk_test_51"
# Should return nothing
```

## References

- [Stripe Security Best Practices](https://stripe.com/docs/security/best-practices)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP: Using Components with Known Vulnerabilities](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)

## Sign-off

**Reported by**: GitHub Secret Scanning / Security Audit  
**Investigated by**: Security Team  
**Date**: 2026-01-05  
**Next Review**: 2026-01-12 (verify key rotation completed)

---

**Status**: ⚠️ AWAITING KEY ROTATION  
**Follow-up**: Verify in Stripe Dashboard that old keys are deleted
