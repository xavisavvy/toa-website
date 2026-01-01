# GitHub Secrets Setup Guide

**Last Updated:** 2026-01-01

## Overview

This guide explains how to set up GitHub Secrets for CI/CD pipelines.

---

## 🔐 Required Secrets

### Critical (Required for Full Functionality)

None! The application works without any secrets. However, you can add these for enhanced features:

### Optional (Enhanced Features)

#### 1. YOUTUBE_API_KEY
**Purpose:** Enable YouTube playlist fetching  
**How to Get:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the API key

**Where to Use:** Server-side YouTube API calls

#### 2. ETSY_API_KEY
**Purpose:** Enable Etsy shop integration  
**How to Get:**
1. Go to [Etsy Developers](https://www.etsy.com/developers/)
2. Create an app
3. Copy the API key

**Status:** Optional - not required for core functionality

#### 3. ETSY_ACCESS_TOKEN
**Purpose:** Authenticate Etsy API requests  
**How to Get:**
1. After creating Etsy app
2. Generate OAuth access token
3. Copy the token

**Status:** Optional - not required for core functionality

### Deployment Secrets

#### 4. REPLIT_DEPLOY_WEBHOOK
**Purpose:** Enable automatic deployment to Replit from GitHub  
**How to Get:**
1. Open your Replit project
2. Go to **Deployments** (left sidebar)
3. Enable **Auto-deploy from GitHub**
4. Copy the webhook URL provided
5. Add to GitHub Secrets

**Where to Use:** GitHub Actions deploy workflow  
**Documentation:** See [REPLIT_DEPLOYMENT.md](./REPLIT_DEPLOYMENT.md) for complete setup

**Example value:**
```
https://api.replit.com/v1/deployments/YOUR_REPL_ID/deploy
```

#### 5. GITHUB_WEBHOOK_SECRET (Optional)
**Purpose:** Secure custom webhook endpoints  
**How to Get:**
1. Generate a random secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Use same value in both GitHub and Replit

**Where to Use:** Custom webhook verification (advanced setup only)

---

## 📝 How to Add Secrets in GitHub

### Step-by-Step Instructions

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click **Settings** (top menu)

2. **Access Secrets Section**
   - In left sidebar, click **Secrets and variables**
   - Click **Actions**

3. **Add New Secret**
   - Click **New repository secret** button
   - Enter the secret name (e.g., `YOUTUBE_API_KEY`)
   - Paste the secret value
   - Click **Add secret**

4. **Repeat for Each Secret**
   - Add all secrets you want to configure
   - Secrets are encrypted and hidden once saved

### Screenshot Guide

```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

---

## ✅ Secrets Added Successfully

Once added, you'll see:
- Secret name listed (value hidden)
- Last updated timestamp
- Option to update or delete

**Important:** You cannot view the secret value after saving!

---

## 🔄 Using Secrets in Workflows

Secrets are automatically available in GitHub Actions:

```yaml
- name: Run tests with API key
  run: npm test
  env:
    YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
    ETSY_API_KEY: ${{ secrets.ETSY_API_KEY }}
```

**Current Status:** CI/CD workflows already configured to use these secrets.

---

## 🧪 Testing Without Secrets

**Good News:** The application is designed to work without API keys!

### What Happens Without Secrets:

1. **YouTube Integration**
   - Falls back to cached data
   - Shows warning in logs (harmless)
   - Tests use mocked data

2. **Etsy Integration**
   - Falls back to cached/demo data
   - Shows warning in logs (harmless)
   - Tests use mocked data

3. **CI/CD Pipelines**
   - All tests pass (using mocks)
   - Build succeeds
   - Deployment works

### Warnings You'll See (Normal):

```
⚠️  Optional environment variables not configured:
  - YOUTUBE_API_KEY: YouTube Data API v3 key (server-side)
  - ETSY_API_KEY: Etsy API key
  - ETSY_ACCESS_TOKEN: Etsy access token

Some features may not work without these variables.
```

**These warnings are EXPECTED and NORMAL** when running in CI without secrets.

---

## 🎯 Recommended Setup

### For Development
```bash
# Create .env file (local only, not committed)
YOUTUBE_API_KEY=your_key_here
ETSY_API_KEY=your_key_here
ETSY_ACCESS_TOKEN=your_token_here
```

### For CI/CD
- Add secrets in GitHub Settings
- CI will pick them up automatically
- No code changes needed

### For Production
- Add secrets in your hosting platform:
  - **Vercel:** Settings → Environment Variables
  - **Railway:** Variables tab
  - **Render:** Environment → Add Variable
  - **Docker:** Pass via `-e` flag

---

## 🔍 Troubleshooting

### "Secret not found" Error

**Solution:**
1. Check secret name matches exactly (case-sensitive)
2. Verify secret is added in correct repository
3. Re-trigger workflow after adding secret

### Secrets Not Working in Forked Repos

**Explanation:** For security, secrets don't work in PRs from forks

**Solution:**
- Add secrets to your fork
- Or test locally with `.env` file

### "Invalid API Key" Errors

**Check:**
1. API key is correct and complete
2. API is enabled in provider dashboard
3. No extra spaces/newlines in secret value
4. API quota not exceeded

---

## 📊 Secret Usage Summary

| Secret | Required | Used In | Impact if Missing |
|--------|----------|---------|-------------------|
| YOUTUBE_API_KEY | No | API calls | Uses cached data |
| ETSY_API_KEY | No | Etsy integration | Uses demo data |
| ETSY_ACCESS_TOKEN | No | Etsy auth | Uses demo data |

**All secrets are optional!** The app works fine without them.

---

## 🔐 Security Best Practices

### ✅ Do:
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use minimum required permissions
- Delete unused secrets

### ❌ Don't:
- Commit secrets to git
- Share secrets publicly
- Use same secrets across environments
- Store secrets in code comments

---

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [YouTube API Setup](https://developers.google.com/youtube/v3/getting-started)
- [Etsy API Documentation](https://developers.etsy.com/documentation)

---

## ✅ Checklist

Before deploying to production:

- [ ] Review which secrets are needed
- [ ] Obtain API keys from providers
- [ ] Add secrets to GitHub
- [ ] Test CI/CD pipeline
- [ ] Add secrets to production hosting
- [ ] Document which features require which secrets
- [ ] Set up secret rotation schedule (optional)

---

**Status:** Optional secrets - not required for core functionality ✅

**CI/CD:** Works with or without secrets ✅

**Production:** Add secrets for full features ✅
