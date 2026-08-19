# Replit Deployment Checklist

> **DEPRECATED - historical reference only.**
>
> **A live YouTube Data API key was committed in this file on 2026-01-01
> (commit `0c654e3`) and sat in a public repository until 2026-08-18.**
> It has been redacted here, but redaction does not remove it from git
> history - the key must be revoked and reissued in the Google Cloud
> Console.
>
> Tales of Aneria no longer deploys to Replit. Production runs on the shared
> AWS Lightsail VPS behind Nginx Proxy Manager; see
> [DEPLOYMENT.md](./DEPLOYMENT.md) for the current platform, pipeline and
> runbook. Nothing in this document is wired up any more - the webhook steps
> it describes were removed from `.github/workflows/deploy.yml`.

---

## 🚨 Current Issue: Old Code Still Running

Your Replit is still running **old code** without the trust proxy fix. The logs confirm this.

---

## ✅ Step-by-Step Fix

### 1. **Pull Latest Code in Replit**

In Replit Shell, run:
```bash
git pull origin main
```

You should see:
```
Updating...
 server/index.ts        | 7 +++++++
 server/rate-limiter.ts | 3 +++
```

### 2. **Clear YouTube Cache**

Run the cache cleaner:
```bash
node scripts/clear-cache.mjs
```

Or manually delete cache:
```bash
rm -rf server/cache/youtube-playlist.json
```

### 3. **Verify Environment Variables**

In Replit Secrets, make sure you have:

```bash
# REQUIRED - Without this, trust proxy won't work!
NODE_ENV=production

# YouTube Configuration
VITE_YOUTUBE_CHANNEL_ID=UC7PTdudxJ43HMLJVv2QxVoQ
YOUTUBE_API_KEY=AIza_REDACTED_ROTATE_THIS_KEY
```

⚠️ **CRITICAL:** The `NODE_ENV=production` must be set!

### 4. **Rebuild & Restart**

```bash
# Stop the current process (Ctrl+C if running)
npm run build
npm start
```

Or use Replit's "Stop" and "Run" buttons.

### 5. **Verify Trust Proxy is Enabled**

Check the logs for:
```
Trust proxy enabled for production environment
```

If you DON'T see this, the `NODE_ENV=production` is not set!

---

## 🐛 Why You're Seeing the Errors

### Error Still Appearing:
```
ValidationError: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
```

**Reason:** Replit is still running the OLD code without trust proxy configuration.

**Solution:** Pull latest code + restart (steps above)

### Using Wrong Endpoint:
```
playlistId=PLrmC8WonT9uaUoORXiAwGUo21Mp_N2u8v
```

**Reason:** Frontend is calling the old playlist endpoint, not the new channel endpoint.

**Solution:** Make sure these are set in Replit Secrets:
```bash
VITE_YOUTUBE_CHANNEL_ID=UC7PTdudxJ43HMLJVv2QxVoQ
```

Then rebuild the frontend:
```bash
npm run build
```

---

## 🔍 Verification Steps

### 1. Check Logs for Trust Proxy Message
```
✅ Trust proxy enabled for production environment
```

### 2. Check YouTube Endpoint Being Called
Should see:
```
Found X videos for channel UC7PTdudxJ43HMLJVv2QxVoQ
```

NOT:
```
playlistId=PLrmC8WonT9uaUoORXiAwGUo21Mp_N2u8v
```

### 3. Test Channel Endpoint
```bash
curl https://your-repl.repl.co/api/youtube/channel/UC7PTdudxJ43HMLJVv2QxVoQ?maxResults=5
```

Should return JSON with videos.

### 4. Check Homepage
Visit your site - should see 3 latest videos in "Latest Episodes" section.

---

## 🚀 Quick Command Sequence

Run these in Replit Shell:

```bash
# 1. Pull latest code
git pull origin main

# 2. Clear cache
rm -rf server/cache/youtube-playlist.json

# 3. Rebuild
npm run build

# 4. Restart (or use Replit Run button)
npm start
```

---

## ⚙️ Environment Variables Checklist

In Replit Secrets, verify:

- [ ] `NODE_ENV=production` ← **MUST HAVE THIS!**
- [ ] `VITE_YOUTUBE_CHANNEL_ID=UC7PTdudxJ43HMLJVv2QxVoQ`
- [ ] `YOUTUBE_API_KEY=AIza_REDACTED_ROTATE_THIS_KEY`

---

## 🎯 Expected Log Output After Fix

```
✅ Trust proxy enabled for production environment
✅ Found 50 videos for channel UC7PTdudxJ43HMLJVv2QxVoQ
✅ Cached 50 videos for channel UC7PTdudxJ43HMLJVv2QxVoQ
```

**NO** rate limiter errors!

---

## 📞 Still Not Working?

### Check Git Status
```bash
git log --oneline -5
```

Should see:
```
1d192e4 fix: resolve Replit production errors (trust proxy + rate limiter)
```

### Force Clean Rebuild
```bash
rm -rf dist node_modules/.vite
npm run build
```

### Check Current Code
```bash
grep "trust proxy" server/index.ts
```

Should output:
```typescript
app.set('trust proxy', 1);
```

---

**After following these steps, your Replit should work perfectly!** 🎉
