# Deployment Guide

**Last Updated:** 2026-01-01

## Overview

This guide explains the deployment process for Tales of Aneria website.

---

## 📚 Platform-Specific Guides

For detailed platform-specific deployment instructions:

- **🔄 [Replit Automatic Deployment](./REPLIT_DEPLOYMENT.md)** - Webhook-based auto-deploy from GitHub
- **☁️ Vercel** - See below
- **☁️ Netlify** - See below
- **🐳 Docker** - See [DOCKER.md](./DOCKER.md)

---

## 🚀 Automated Deployment

### Current Setup

**Trigger:** Push to `main` branch  
**Workflow:** `.github/workflows/deploy.yml`  
**Environment:** Production (manual approval required)

### Workflow Steps:

1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Run quick smoke tests
4. ✅ Build application
5. ✅ Verify build artifacts
6. ✅ Trigger Replit webhook (if configured)
7. 🔧 Deploy (placeholder - configure for your platform)
8. ✅ Notify deployment success

### How It Works:

```yaml
# Automatic on push to main
git push origin main

# Or manual trigger via GitHub Actions UI
# Actions → Deploy → Run workflow
```

---

## 🔧 Deployment Platforms

### Option 1: Replit (Current Platform)

**Automatic Deployment from GitHub**

See **[REPLIT_DEPLOYMENT.md](./REPLIT_DEPLOYMENT.md)** for complete setup guide.

**Quick Setup:**
1. Connect GitHub to Replit
2. Enable Auto-deploy from main branch
3. Add `REPLIT_DEPLOY_WEBHOOK` to GitHub Secrets
4. Push to main → Auto-deploy!

**Features:**
- ✅ Zero-downtime deployments
- ✅ Automatic restarts
- ✅ Built-in CI/CD integration
- ✅ Free tier available

---

### Option 2: Vercel (Recommended for Full-Stack)

**Setup:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy
vercel --prod
```

**Update workflow:**
```yaml
- name: Deploy to Vercel
  run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Required Secrets:**
- `VERCEL_TOKEN` - From Vercel dashboard
- `VERCEL_ORG_ID` - From project settings
- `VERCEL_PROJECT_ID` - From project settings

---

### Option 2: Railway (Easy Database + App)

**Setup:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

**Update workflow:**
```yaml
- name: Deploy to Railway
  run: railway up
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**Required Secrets:**
- `RAILWAY_TOKEN` - From Railway dashboard

---

### Option 3: Render (Simple & Free)

**Setup:**
1. Go to https://render.com
2. Create new "Web Service"
3. Connect GitHub repository
4. Configure:
   - Build: `npm run build`
   - Start: `npm start`
   - Environment: Node 20

**Auto-deploys on every push to main!**

---

### Option 4: Docker + AWS/GCP/Azure

**Build Docker image:**
```bash
# Build
DOCKER_BUILDKIT=1 docker build -t toa-website:latest .

# Test locally
docker run -p 5000:5000 \
  -e DATABASE_URL=your_db_url \
  -e SESSION_SECRET=your_secret \
  toa-website:latest
```

**Push to registry:**
```bash
# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
docker tag toa-website:latest YOUR_ECR_URL/toa-website:latest
docker push YOUR_ECR_URL/toa-website:latest

# Google Container Registry
gcloud auth configure-docker
docker tag toa-website:latest gcr.io/PROJECT_ID/toa-website:latest
docker push gcr.io/PROJECT_ID/toa-website:latest

# Azure Container Registry
az acr login --name YOUR_REGISTRY
docker tag toa-website:latest YOUR_REGISTRY.azurecr.io/toa-website:latest
docker push YOUR_REGISTRY.azurecr.io/toa-website:latest
```

---

### Option 5: Self-Hosted (VPS)

**Requirements:**
- Ubuntu 22.04+ or similar
- Node.js 20+
- PostgreSQL 16+
- nginx (reverse proxy)

**Setup:**
```bash
# On server
git clone https://github.com/your-org/toa-website.git
cd toa-website

# Install dependencies
npm ci --production

# Build
npm run build

# Setup PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name toa-website

# Setup nginx reverse proxy
sudo nano /etc/nginx/sites-available/toa-website

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/toa-website /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

### Code Quality
- [ ] All tests passing locally (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript checks pass (`npm run check`)
- [ ] No security vulnerabilities (`npm audit`)

### Configuration
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] Secrets rotated (if needed)
- [ ] CORS origins configured

### Testing
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Manual testing on staging
- [ ] Performance acceptable
- [ ] Security scan clean

### Documentation
- [ ] CHANGELOG.md updated
- [ ] Version bumped (if applicable)
- [ ] Deployment notes added
- [ ] Team notified

---

## 🔒 Environment Variables

Required for production:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security
SESSION_SECRET=your_long_random_secret_here
ALLOWED_ORIGINS=https://your-domain.com

# APIs
YOUTUBE_API_KEY=your_youtube_api_key
ETSY_API_KEY=your_etsy_api_key (optional)

# Node
NODE_ENV=production
PORT=5000
```

**Set in your platform:**
- Vercel: Settings → Environment Variables
- Railway: Settings → Variables
- Render: Environment → Add Variable
- Docker: Pass via `-e` flag or `.env` file

---

## 🐛 Troubleshooting

### Deployment fails with "vitest.config.ts not found"

**Solution:** The deploy workflow now uses `test:quick` instead of `test:coverage`. Update and push:
```yaml
- name: Run quick tests
  run: npm run test:quick
```

### Build succeeds but app crashes

**Check:**
1. Environment variables set correctly
2. Database connection working
3. Node version matches (20+)
4. All dependencies installed
5. Check logs: `docker logs` or platform logs

### Database connection fails

**Verify:**
```bash
# Test connection
psql $DATABASE_URL

# Check format
postgresql://user:password@host:5432/database
```

### Static files not loading

**Check:**
1. `dist/public` directory exists
2. File paths are absolute
3. CDN/cache cleared
4. CORS headers correct

---

## 📊 Monitoring Deployment

### Health Check

```bash
# Check if app is running
curl https://your-domain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "uptime": 1234
}
```

### Logs

```bash
# Vercel
vercel logs

# Railway
railway logs

# Docker
docker logs toa-website

# PM2
pm2 logs toa-website
```

### Rollback

If deployment fails:

```bash
# Vercel - automatic rollback to last working deployment
vercel rollback

# Railway - redeploy previous version
railway up --previous

# Docker - use previous image tag
docker run previous-tag

# Git - revert commit
git revert HEAD
git push origin main
```

---

## 🔄 CI/CD Pipeline

### Full Pipeline Flow:

```
1. Push to main
   ↓
2. CI Workflow runs (security scans, tests)
   ↓
3. Deploy Workflow triggered
   ↓
4. Quick smoke tests
   ↓
5. Build application
   ↓
6. Verify artifacts
   ↓
7. Deploy to platform
   ↓
8. Health check
   ↓
9. Notify team
```

### Workflow Files:
- `.github/workflows/ci.yml` - Full CI pipeline with security
- `.github/workflows/deploy.yml` - Production deployment
- `.github/workflows/sbom.yml` - SBOM generation

---

## 🎯 Next Steps

1. **Choose a deployment platform** from options above
2. **Configure secrets** in GitHub repository settings
3. **Update deploy.yml** with platform-specific commands
4. **Test deployment** on staging first
5. **Monitor** first production deployment
6. **Set up alerts** for errors/downtime

---

## 📞 Support

- Deployment issues: Check workflow logs in Actions tab
- Platform issues: Refer to platform documentation
- App crashes: Check application logs
- Database: Verify connection and migrations

---

**Need Help?**

See documentation:
- [ENTERPRISE_CICD_GUIDE.md](./ENTERPRISE_CICD_GUIDE.md)
- [BUILD_PERFORMANCE.md](./BUILD_PERFORMANCE.md)
- [DOCKER.md](./DOCKER.md)
