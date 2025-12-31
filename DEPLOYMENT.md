# Deploying Tales of Aneria to Vercel

> **⚠️ UPDATED GUIDE AVAILABLE:** This file contains older deployment instructions. For the **latest Vercel deployment setup** (updated January 2025 with Express framework support), see **`VERCEL_SETUP.md`**.

This guide walks you through deploying the Tales of Aneria website to Vercel with all necessary configurations.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Your code pushed to GitHub
3. **Database** - PostgreSQL database (Vercel Postgres, Neon, Supabase, or Railway)
4. **API Keys** - All third-party service credentials ready

---

## 🚀 Quick Start Deployment

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect the framework and settings

### Step 2: Configure Build Settings

Vercel should auto-detect these settings. Verify they match:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 3: Set Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

#### ✅ REQUIRED Variables

```bash
# Production Environment
NODE_ENV=production

# Database (use one of the providers below)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Security - CORS Allowed Origins
ALLOWED_ORIGINS=https://your-app.vercel.app,https://talesofaneria.com,https://www.talesofaneria.com

# Session Security
SESSION_SECRET=your-secure-random-32-char-string

# YouTube Integration
YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here  # Optional: for client-side API access
VITE_YOUTUBE_PLAYLIST_ID=your_playlist_id_here

# Podcast Feed
VITE_PODCAST_FEED_URL=https://your-podcast-feed-url/rss
```

#### ⚙️ OPTIONAL Variables

```bash
# Etsy Shop Integration (if using)
ETSY_API_KEY=your_etsy_api_key_here
ETSY_ACCESS_TOKEN=your_etsy_access_token_here
```

### Step 4: Deploy

Click **Deploy** and Vercel will build and deploy your site!

---

## 🗄️ Database Setup Options

Choose one of these PostgreSQL providers:

### Option 1: Vercel Postgres (Recommended)

**Pros:** Seamless integration, auto-configured, serverless
**Pricing:** Free tier available

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** → Select **Postgres**
3. Follow the setup wizard
4. Vercel automatically sets `DATABASE_URL` environment variable

### Option 2: Neon (Recommended Alternative)

**Pros:** Serverless, auto-scaling, generous free tier
**Website:** [neon.tech](https://neon.tech)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to Vercel as `DATABASE_URL`

### Option 3: Supabase

**Pros:** Full-featured, includes auth and storage
**Website:** [supabase.com](https://supabase.com)

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string
4. Use the "Connection pooling" URL for better performance
5. Add to Vercel as `DATABASE_URL`

### Option 4: Railway

**Pros:** Simple setup, good free tier
**Website:** [railway.app](https://railway.app)

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy PostgreSQL
3. Copy the connection URL from the Connect tab
4. Add to Vercel as `DATABASE_URL`

---

## 🔑 Getting API Keys

### YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**:
   - APIs & Services → Library → Search "YouTube Data API v3" → Enable
4. Create credentials:
   - APIs & Services → Credentials → Create Credentials → API Key
5. Restrict the API key:
   - Edit API key → API restrictions → Restrict key → Select "YouTube Data API v3"
6. Copy the API key
7. Add to Vercel as `YOUTUBE_API_KEY`

**Get Your Playlist ID:**
- Go to your YouTube playlist
- Copy the ID from the URL: `youtube.com/playlist?list=PLAYLIST_ID_HERE`
- Add to Vercel as `VITE_YOUTUBE_PLAYLIST_ID`

### Podcast RSS Feed

1. Find your podcast RSS feed URL from your hosting platform:
   - **Anchor:** https://anchor.fm/s/your-podcast/podcast/rss
   - **Buzzsprout:** Settings → Podcast Info → RSS Feed URL
   - **Libsyn:** Dashboard → Destinations → RSS Feed URL
   - **Podbean:** Settings → RSS Feed
2. Add to Vercel as `VITE_PODCAST_FEED_URL`

### Etsy API (Optional)

1. Go to [Etsy Developer Portal](https://www.etsy.com/developers/documentation/getting_started/register)
2. Register your app
3. Get your API Key (Keystring)
4. Set up OAuth 2.0 to get Access Token
5. Add both to Vercel:
   - `ETSY_API_KEY`
   - `ETSY_ACCESS_TOKEN`

---

## 🔒 Security Configuration

### Generate Session Secret

Run this command to generate a secure random string:

```bash
openssl rand -base64 32
```

Add the output to Vercel as `SESSION_SECRET`

### Configure CORS Origins

The `ALLOWED_ORIGINS` variable should include ALL domains where your app will be accessed:

```bash
# Include both your Vercel URL and custom domain
ALLOWED_ORIGINS=https://your-app.vercel.app,https://talesofaneria.com,https://www.talesofaneria.com
```

**Important:** Update this every time you:
- Add a custom domain
- Change your Vercel deployment URL
- Add a preview/staging environment

---

## 🌐 Custom Domain Setup

### Step 1: Add Domain in Vercel

1. Go to your project → Settings → Domains
2. Add your custom domain (e.g., `talesofaneria.com`)
3. Add www subdomain (e.g., `www.talesofaneria.com`)

### Step 2: Configure DNS

Add these DNS records with your domain registrar:

**For apex domain (talesofaneria.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Update Environment Variables

Update `ALLOWED_ORIGINS` to include your new domains:

```bash
ALLOWED_ORIGINS=https://your-app.vercel.app,https://talesofaneria.com,https://www.talesofaneria.com
```

### Step 4: Update SEO URLs

After your custom domain is active, update these files to use your domain:

- `client/index.html` - Update all meta tag URLs
- `client/public/sitemap.xml` - Update all `<loc>` URLs
- All page components using the SEO component

---

## 📦 Build Configuration

### Package.json Scripts

Ensure your `package.json` has these scripts (should already be present):

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "start": "cross-env NODE_ENV=production node dist/server/index.js"
  }
}
```

### Vercel Configuration (Optional)

Create `vercel.json` in the root directory for advanced configuration:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🧪 Testing Your Deployment

### 1. Check Environment Variables

After deployment, verify all environment variables are set:
- Vercel Dashboard → Settings → Environment Variables

### 2. Test Core Features

- ✅ Homepage loads correctly
- ✅ YouTube playlist displays videos
- ✅ Podcast feed shows episodes
- ✅ Character pages load with D&D Beyond data
- ✅ Navigation works across all pages
- ✅ Social media sharing shows correct preview

### 3. Verify SEO

Test these tools with your deployed URL:

- **Google Search Console:** [search.google.com/search-console](https://search.google.com/search-console)
- **Facebook Sharing Debugger:** [developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug)
- **Twitter Card Validator:** [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator)

### 4. Monitor Performance

- **Vercel Analytics:** Enable in project settings
- **PageSpeed Insights:** [pagespeed.web.dev](https://pagespeed.web.dev)
- **Lighthouse:** Run in Chrome DevTools

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your repository:

- **Production:** Pushes to `main` branch → Production deployment
- **Preview:** Pushes to other branches → Preview deployment
- **Pull Requests:** Automatic preview deployments for each PR

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "MODULE_NOT_FOUND"
- **Fix:** Run `npm install` locally, commit `package-lock.json`

**Error:** "TypeScript errors"
- **Fix:** Run `npm run build` locally to see errors, fix them

### Runtime Errors

**Error:** "Database connection failed"
- **Fix:** Verify `DATABASE_URL` is correct and includes `?sslmode=require`

**Error:** "CORS errors"
- **Fix:** Add your Vercel URL to `ALLOWED_ORIGINS`

**Error:** "YouTube API quota exceeded"
- **Fix:** Enable caching, increase quota in Google Cloud Console

### Environment Variables Not Working

**Issue:** Variables not available in production
- **Fix:** Redeploy after adding new environment variables

**Issue:** `VITE_` variables not working
- **Fix:** Ensure they're prefixed with `VITE_` and redeploy

---

## 📊 Post-Deployment Checklist

After successful deployment:

- [ ] All environment variables set correctly
- [ ] Database connected and accessible
- [ ] Custom domain configured (if applicable)
- [ ] ALLOWED_ORIGINS updated with all domains
- [ ] SSL/HTTPS working (Vercel provides this automatically)
- [ ] Sitemap submitted to Google Search Console
- [ ] Social media previews tested
- [ ] Analytics enabled (Vercel Analytics or Google Analytics)
- [ ] Error monitoring set up (Sentry, LogRocket, etc.)
- [ ] Backup strategy in place for database

---

## 🆘 Support Resources

- **Vercel Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community:** [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **YouTube API Docs:** [developers.google.com/youtube/v3](https://developers.google.com/youtube/v3)
- **PostgreSQL Docs:** [postgresql.org/docs](https://www.postgresql.org/docs/)

---

## 🎉 You're Live!

Congratulations! Your Tales of Aneria website is now live on Vercel. Share your adventure with the world! 🎲✨

**Next Steps:**
1. Share your URL on social media
2. Submit sitemap to Google Search Console
3. Monitor analytics and user feedback
4. Keep your content updated with new episodes and characters
