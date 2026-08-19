# Replit Automatic Deployment Guide

> **DEPRECATED - historical reference only.**
>
> Tales of Aneria no longer deploys to Replit. Production runs on the shared
> AWS Lightsail VPS behind Nginx Proxy Manager; see
> [DEPLOYMENT.md](./DEPLOYMENT.md) for the current platform, pipeline and
> runbook. Nothing in this document is wired up any more - the webhook steps
> it describes were removed from `.github/workflows/deploy.yml`.

---

This guide explains how to set up automatic deployments from GitHub to Replit using webhooks.

## 🎯 Overview

When you push to the `main` branch on GitHub, the CI/CD pipeline will:
1. ✅ Run tests and build the application
2. ✅ Trigger a webhook to Replit
3. ✅ Replit automatically pulls the latest code and restarts

---

## 🔧 Setup Instructions

### Option 1: Replit Deployments (Recommended)

Replit has built-in GitHub integration for automatic deployments.

#### Step 1: Connect GitHub to Replit

1. Open your Replit project
2. Go to **Settings** (left sidebar)
3. Click **Version Control**
4. Click **Connect to GitHub**
5. Authorize Replit to access your repository
6. Select **xavisavvy/toa-website**

#### Step 2: Enable Auto-Deploy

1. In Replit, go to **Deployments** (left sidebar)
2. Click **Create Deployment**
3. Select **Production**
4. Enable **Auto-deploy from GitHub**
5. Select branch: **main**
6. Save settings

**That's it!** Replit will now automatically:
- Pull changes when you push to `main`
- Rebuild the application
- Restart the server
- Zero downtime deployment

---

### Option 2: Custom Webhook (Advanced)

If you need custom deployment logic or webhooks:

#### Step 1: Create Webhook Endpoint in Replit

Create a file `server/webhook.ts`:

```typescript
import express from 'express';
import { exec } from 'child_process';
import crypto from 'crypto';

const router = express.Router();

// Webhook secret for security (set in GitHub)
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// GitHub webhook endpoint
router.post('/api/webhook/github', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const payload = req.body.toString();
  
  // Verify signature
  if (!verifySignature(payload, signature)) {
    console.error('❌ Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = JSON.parse(payload);
  
  // Only deploy on push to main
  if (event.ref !== 'refs/heads/main') {
    return res.json({ message: 'Skipping - not main branch' });
  }
  
  console.log('🚀 Deploying from GitHub push...');
  console.log(`   Commit: ${event.after}`);
  console.log(`   Author: ${event.pusher.name}`);
  
  // Pull latest code and restart
  exec('git pull origin main && npm install && npm run build', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Deployment failed:', error);
      return res.status(500).json({ error: 'Deployment failed' });
    }
    
    console.log('✅ Deployment successful!');
    console.log(stdout);
    
    // Restart the server (Replit will auto-restart on file changes)
    res.json({ 
      success: true, 
      message: 'Deployment successful',
      commit: event.after 
    });
    
    // Exit to trigger Replit restart
    setTimeout(() => process.exit(0), 1000);
  });
});

export default router;
```

#### Step 2: Add Webhook to Server

Update `server/routes.ts`:

```typescript
import webhookRouter from './webhook';

// ... existing code ...

app.use(webhookRouter);
```

#### Step 3: Configure GitHub Webhook

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Set **Payload URL**: `https://your-repl-url.replit.dev/api/webhook/github`
4. Set **Content type**: `application/json`
5. Set **Secret**: Generate a random string (save in GitHub Secrets as `GITHUB_WEBHOOK_SECRET`)
6. Select **Just the push event**
7. Click **Add webhook**

#### Step 4: Add Secret to Replit

1. Open your Replit project
2. Go to **Secrets** (left sidebar, lock icon)
3. Add secret:
   - Key: `GITHUB_WEBHOOK_SECRET`
   - Value: (same secret you used in GitHub)

---

### Option 3: GitHub Actions with Replit API

Use the GitHub Actions deployment workflow with Replit's deployment API.

#### Step 1: Get Replit Deploy Token

1. Go to your Replit Account Settings
2. Generate a new **Deploy Token**
3. Copy the token

#### Step 2: Add Token to GitHub Secrets

1. Go to GitHub repository **Settings**
2. **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `REPLIT_DEPLOY_TOKEN`
5. Value: (paste your Replit token)
6. Save

#### Step 3: Update Deploy Workflow

The workflow is already configured! Just add the `REPLIT_DEPLOY_WEBHOOK` secret:

1. In your Replit, enable **Deployments**
2. Get your deployment webhook URL
3. Add to GitHub Secrets as `REPLIT_DEPLOY_WEBHOOK`

---

## 🔐 Security Best Practices

### GitHub Secrets Required

Add these secrets in GitHub: **Settings** → **Secrets and variables** → **Actions**

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `REPLIT_DEPLOY_WEBHOOK` | Replit deployment webhook URL | Yes (Option 1) |
| `GITHUB_WEBHOOK_SECRET` | Webhook signature verification | Yes (Option 2) |
| `REPLIT_DEPLOY_TOKEN` | Replit API token | Yes (Option 3) |

### Replit Secrets Required

Add these in Replit: **Secrets** (lock icon in sidebar)

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `GITHUB_WEBHOOK_SECRET` | Same as GitHub webhook secret | Yes (Option 2) |

---

## 🧪 Testing the Deployment

### Test Automatic Deployment

1. Make a small change to your code
2. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "test: trigger automatic deployment"
   git push origin main
   ```
3. Watch GitHub Actions run
4. Check Replit logs for deployment
5. Verify changes are live

### Manual Deployment Trigger

You can manually trigger deployment from GitHub:

1. Go to **Actions** tab
2. Select **Deploy** workflow
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**

---

## 📊 Deployment Flow

```
┌─────────────────┐
│  Git Push       │
│  to main        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│ - Run tests     │
│ - Build app     │
│ - Security scan │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trigger Webhook │
│ to Replit       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Replit          │
│ - Pull code     │
│ - npm install   │
│ - npm build     │
│ - Restart       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ✅ Deployed!    │
└─────────────────┘
```

---

## 🐛 Troubleshooting

### Webhook Not Triggering

**Check GitHub Webhook Logs:**
1. Go to GitHub repo **Settings** → **Webhooks**
2. Click on your webhook
3. Check **Recent Deliveries**
4. Look for errors or failed attempts

**Common Issues:**
- ❌ Webhook URL is incorrect
- ❌ Replit is sleeping (wake it up first)
- ❌ Secret mismatch
- ❌ Network firewall blocking webhooks

### Deployment Failing

**Check Replit Logs:**
1. Open Replit Console
2. Look for error messages
3. Check npm install errors
4. Verify build succeeds

**Common Issues:**
- ❌ Missing environment variables
- ❌ Dependencies not installed
- ❌ Build errors
- ❌ Port conflicts

### Changes Not Appearing

**Clear Cache:**
1. Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Check Replit is serving latest build
3. Verify `dist/` folder was updated
4. Check file timestamps

---

## 🎯 Best Practices

### 1. **Always Test Locally First**
```bash
npm run build
npm run dev
```

### 2. **Use Staging Branch**
- Push to `develop` for testing
- Merge to `main` for production
- Prevents broken deployments

### 3. **Monitor Deployments**
- Watch GitHub Actions logs
- Check Replit deployment status
- Verify app is running

### 4. **Rollback Plan**
If deployment fails:
```bash
# In Replit console
git log --oneline -5  # Find last good commit
git reset --hard <commit-hash>
npm install
npm run build
```

### 5. **Environment Variables**
Keep production secrets in Replit Secrets:
- `DATABASE_URL`
- `YOUTUBE_API_KEY`
- `SESSION_SECRET`
- `ALLOWED_ORIGINS`

---

## 📚 Additional Resources

- [Replit Deployments Documentation](https://docs.replit.com/hosting/deployments/about-deployments)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [Our Deployment Guide](./DEPLOYMENT.md)
- [Our CI/CD Guide](./ENTERPRISE_CICD_GUIDE.md)

---

## ✅ Quick Reference

### Recommended Setup: **Option 1 (Replit Deployments)**
- ✅ Easiest to set up
- ✅ No code changes needed
- ✅ Built-in to Replit
- ✅ Automatic zero-downtime deploys

### For Advanced Users: **Option 2 (Custom Webhook)**
- 🔧 Full control over deployment
- 🔧 Custom build steps
- 🔧 Pre/post deployment hooks
- 🔧 Requires coding

### For API Integration: **Option 3 (Replit API)**
- 🚀 Programmatic deployments
- 🚀 Multi-environment support
- 🚀 Integration with other tools
- 🚀 Requires API token management

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.

**Happy Deploying!** 🚀
