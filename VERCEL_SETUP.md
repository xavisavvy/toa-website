# Vercel Deployment Setup Guide

## ✅ What's Been Configured

I've created the following files to make your app Vercel-compatible:

1. **`index.ts`** - Root-level Express entry point (Vercel requirement)
2. **Updated `vercel.json`** - Correct framework and output directory settings

## 🔧 Required Manual Steps

### Step 1: Update Build Command

You need to update the build script to build from the new `index.ts` entry point:

**Current build script:**
```json
"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

**New build script (for Vercel):**
```json
"build": "vite build && esbuild index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

**How to update:**
1. Open `package.json`
2. Find the `"build"` line under `"scripts"`
3. Change `server/index.ts` to `index.ts`
4. Save the file

### Step 2: Vercel Dashboard Settings

In your Vercel project settings (from the screenshot you provided):

#### Framework Settings:
- **Framework Preset**: `Express` ✅ (already correct)
- **Build Command**: `npm run build` ✅ (already correct)
- **Output Directory**: Leave **blank** or set to `dist/public`
- **Install Command**: Default is fine ✅
- **Development Command**: `npm run dev` ✅
- **Node.js Version**: `22.x` ✅ (already correct)

#### Root Directory:
- Leave **blank** ✅ (already correct)

### Step 3: Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

#### Required Variables:
```bash
# Production URLs (Vercel will auto-provide these)
NODE_ENV=production

# Your custom domain (if using one)
ALLOWED_ORIGINS=https://talesofaneria.com,https://www.talesofaneria.com,https://your-vercel-app.vercel.app

# YouTube API
YOUTUBE_API_KEY=your_key_here

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret

# Database (use Vercel Postgres or Neon)
DATABASE_URL=your_postgres_connection_string
```

#### Platform-Specific Variables:
Vercel automatically provides:
- `VERCEL=1` (detects Vercel environment)
- `VERCEL_URL` (your deployment URL)
- `VERCEL_ENV` (production/preview/development)

### Step 4: Database Setup

Your app uses PostgreSQL. Choose one:

#### Option A: Vercel Postgres (Recommended for Vercel)
1. In Vercel Dashboard → Storage → Create Database → Postgres
2. Connect to your project
3. `DATABASE_URL` is automatically added to environment variables

#### Option B: Neon (Serverless Postgres)
1. Already using `@neondatabase/serverless` ✅
2. Get connection string from [neon.tech](https://neon.tech)
3. Add `DATABASE_URL` to Vercel environment variables

## 🚀 Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects settings from `vercel.json`
   - Add environment variables
   - Click "Deploy"

3. **Auto-deploys:**
   - Every push to `main` = production deploy
   - Every PR = preview deploy with unique URL

### Option 2: Deploy via CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # Preview deployment
   vercel
   
   # Production deployment
   vercel --prod
   ```

## 📋 Deployment Checklist

- [ ] Update `package.json` build script (change `server/index.ts` to `index.ts`)
- [ ] Verify Vercel Dashboard settings match Step 2 above
- [ ] Add all environment variables in Vercel Dashboard
- [ ] Set up database (Vercel Postgres or Neon)
- [ ] Push to GitHub or use CLI to deploy
- [ ] Test deployment URL
- [ ] Configure custom domain (optional)
- [ ] Update `ALLOWED_ORIGINS` with final production URL

## 🔍 Verifying Your Deployment

After deployment:

1. **Check API Routes:**
   - Visit: `https://your-app.vercel.app/api/youtube/playlist/YOUR_PLAYLIST_ID`
   - Should return YouTube data

2. **Check Frontend:**
   - Visit: `https://your-app.vercel.app`
   - Should load your full website

3. **Check Logs:**
   - Vercel Dashboard → Deployments → [Your Deployment] → Logs
   - Look for errors or warnings

## ⚠️ Important Notes

### What Works on Vercel:
- ✅ Express app as a serverless function
- ✅ All API routes
- ✅ Static file serving from CDN
- ✅ Environment variables
- ✅ PostgreSQL databases (Vercel Postgres or Neon)
- ✅ Auto-scaling based on traffic

### What's Different from Other Platforms:
- ❌ No WebSocket support (WS connections won't work)
- ❌ No long-running background jobs
- ❌ Function timeout limits (10s Hobby, 60s Pro)
- ❌ Cold starts (first request after inactivity is slower)

### If You Need WebSockets:
Consider **Render**, **Railway**, or **Fly.io** instead - they support full Node.js servers with WebSocket connections.

## 🐛 Troubleshooting

### Build Fails:
- Check build logs in Vercel Dashboard
- Ensure `package.json` build script is updated correctly
- Verify all dependencies are in `dependencies`, not `devDependencies`

### 404 Errors:
- Check that `index.ts` exists at root level
- Verify `export default app;` is in `index.ts`
- Check Vercel function logs

### API Routes Not Working:
- Ensure environment variables are set in Vercel Dashboard
- Check CORS settings in `server/security.ts`
- Verify `ALLOWED_ORIGINS` includes your Vercel URL

### Database Connection Issues:
- Use connection pooling for serverless (Neon has this built-in)
- Check `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs

## 📚 Resources

- [Vercel Express Documentation](https://vercel.com/docs/frameworks/backend/express)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Neon Serverless](https://neon.tech/docs/guides/vercel)

## 🎯 Summary

Your app is **now configured for Vercel**, but you need to:
1. Update one line in `package.json` (build script)
2. Add environment variables in Vercel Dashboard
3. Deploy via GitHub or CLI

After these steps, your Tales of Aneria website will be live on Vercel! 🎲✨
