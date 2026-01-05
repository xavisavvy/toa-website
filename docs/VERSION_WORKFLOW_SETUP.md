# Version Workflow Setup

## Issue

The version workflow fails to push due to branch protection rules:

```
remote: error: GH013: Repository rule violations found for refs/heads/main
remote: - Cannot update this protected ref
remote: - Missing successful active Production deployment
remote: - Changes must be made through a pull request
remote: - 5 of 5 required status checks are expected
```

## Root Cause

`GITHUB_TOKEN` provided by GitHub Actions **cannot bypass branch protection rules**. The version workflow needs to push commits and tags directly to the protected `main` branch.

## Solution

Use a Personal Access Token (PAT) with bypass permissions.

### Option 1: Create a Personal Access Token (Recommended)

1. **Create PAT**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name: `GH_PAT_VERSION_WORKFLOW`
   - Expiration: Choose appropriate duration
   - Scopes required:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)

2. **Add to Repository Secrets**:
   - Go to Repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `GH_PAT`
   - Value: Paste the token
   - Click "Add secret"

3. **Verify Workflow**:
   - The workflow already checks for `secrets.GH_PAT` and falls back to `secrets.GITHUB_TOKEN`
   - Once PAT is added, it will be used automatically
   - Version commits/tags will bypass protection rules

### Option 2: Adjust Branch Protection Rules

If you don't want to use a PAT, adjust branch protection:

1. Go to Repository Settings → Rules → Rulesets
2. Edit the ruleset for `main` branch
3. Add bypass for:
   - `github-actions[bot]` user
   OR
   - Specific workflow: `Versioning`

**Note**: This is less secure as it allows the bot to bypass all rules.

### Option 3: Disable Auto-Versioning (Not Recommended)

Disable `.github/workflows/version.yml` and version manually:

```bash
npm run release
git push --follow-tags origin main
```

**Cons**: Requires manual intervention, defeats CI/CD automation.

## Current Workflow Changes

Updated `version.yml`:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}  # Uses PAT if available

- name: Push changes
  run: git push --follow-tags origin main
  env:
    GITHUB_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}
```

## Verification

After adding `GH_PAT` secret, the next push to main should:

1. ✅ Detect version-worthy commits
2. ✅ Run `standard-version`
3. ✅ Create version commit (e.g., `chore(release): 2.1.0`)
4. ✅ Create git tag (e.g., `v2.1.0`)
5. ✅ Push commit and tag to main (bypassing protection)

## Recommended: Option 1 (PAT)

This is the cleanest solution:
- Secure (token can be rotated)
- Explicit (clearly shows version bot has special permissions)
- Minimal changes to branch protection
- Industry standard practice

---

**Status**: Workflow updated to use `GH_PAT` when available.  
**Action Required**: Add `GH_PAT` secret with `repo` and `workflow` scopes.
