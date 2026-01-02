# Replit Production Fixes

## 🔧 Issues Fixed

### 1. Express Trust Proxy Error
**Error:** `ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false`

**Cause:** Replit runs behind a proxy, but Express wasn't configured to trust it.

**Fix Applied:**
```typescript
// server/index.ts
if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT) {
  app.set('trust proxy', 1);
}
```

```typescript
// server/rate-limiter.ts  
validate: { trustProxy: process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DEPLOYMENT }
```

### 2. YouTube API Referer Block
**Error:** `GaxiosError: Requests from referer are blocked`

**Cause:** Your YouTube API key has HTTP referrer restrictions that block server-side requests.

**Solutions:**

#### Option A: Remove Referrer Restrictions (Recommended for Replit)
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "API restrictions" → "Application restrictions"
4. Select "None" (or add Replit domains)
5. Save

#### Option B: Use Separate API Keys
Create two API keys:
- **Client-side key** (with referrer restrictions) → `VITE_YOUTUBE_API_KEY`
- **Server-side key** (no restrictions) → `YOUTUBE_API_KEY`

#### Option C: Use Replit YouTube Connector (Replit Only)
The code already falls back to Replit's OAuth connector if API key fails.
No changes needed - it should work automatically.

---

## 🚀 Deployment Steps

### 1. Update Replit Secrets
Add these environment variables in Replit:

```bash
# Required
NODE_ENV=production
VITE_YOUTUBE_CHANNEL_ID=UC7PTdudxJ43HMLJVv2QxVoQ

# YouTube API (choose one approach)
# Option A: Single key without restrictions
YOUTUBE_API_KEY=your_unrestricted_key

# Option B: Separate keys
YOUTUBE_API_KEY=your_server_key  # No restrictions
VITE_YOUTUBE_API_KEY=your_client_key  # With referrer restrictions
```

### 2. Redeploy
After updating secrets:
1. Stop the Repl
2. Clear cache (if needed)
3. Start the Repl
4. Check logs for errors

---

## ✅ Verification

### Check Trust Proxy
Look for this in logs:
```
Trust proxy enabled for production environment
```

### Check YouTube API
Test the channel endpoint:
```bash
curl https://your-repl.repl.co/api/youtube/channel/UC7PTdudxJ43HMLJVv2QxVoQ?maxResults=5
```

Should return video data, not an error.

### Check Rate Limiting
Should see no `ValidationError` in logs.

---

## 📝 Environment Variables Needed

```bash
# Production flag
NODE_ENV=production

# YouTube Configuration
VITE_YOUTUBE_CHANNEL_ID=UC7PTdudxJ43HMLJVv2QxVoQ
YOUTUBE_API_KEY=your_key_here

# Optional (existing)
VITE_PODCAST_FEED_URL=...
VITE_PODCAST_SPOTIFY_URL=...
VITE_PODCAST_APPLE_URL=...
VITE_PODCAST_YOUTUBE_MUSIC_URL=...
```

---

## 🐛 Still Having Issues?

### Debug YouTube API
Add to Replit console:
```bash
# Check if OAuth is available
env | grep REPLIT

# Test API key manually
curl "https://www.googleapis.com/youtube/v3/search?part=id&channelId=UC7PTdudxJ43HMLJVv2QxVoQ&order=date&type=video&maxResults=5&key=YOUR_KEY"
```

### Check Logs
Look for these messages:
```
✓ Trust proxy enabled
✓ Found X videos for channel
✓ Redis connected (if using Redis)
```

### Fallback to OAuth
If API key continues to fail, the system will automatically try Replit's YouTube OAuth connector. Make sure it's connected in Replit secrets.

---

## 🎯 Expected Behavior After Fix

1. ✅ No rate limiter validation errors
2. ✅ YouTube API calls succeed
3. ✅ Videos appear on homepage
4. ✅ Proper IP tracking for rate limiting
5. ✅ No "referer blocked" errors

---

**Commit these changes and redeploy to Replit!**
