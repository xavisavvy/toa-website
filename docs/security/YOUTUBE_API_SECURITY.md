# Securing Your YouTube API Key

## 🔒 Current Situation

You removed HTTP referrer restrictions to fix the Replit error, but now your API key is **unrestricted** - anyone who finds it could use it and consume your quota.

---

## ✅ **Best Solution: Separate Client & Server Keys**

Use **two different API keys** with different restrictions:

### **Server-Side Key** (for backend API calls)
- **Name:** `YouTube API - Server (Replit)`
- **Restrictions:** IP address restrictions
- **Usage:** Server-side API calls only
- **Environment Variable:** `YOUTUBE_API_KEY`

### **Client-Side Key** (for browser/frontend)
- **Name:** `YouTube API - Client (Website)`
- **Restrictions:** HTTP referrer restrictions
- **Usage:** Direct browser API calls (if needed)
- **Environment Variable:** `VITE_YOUTUBE_API_KEY`

---

## 🚀 **Step-by-Step Setup**

### **1. Create Server-Side Key (IP Restricted)**

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**Create new API key:**
1. Click "CREATE CREDENTIALS" → "API key"
2. Copy the key immediately
3. Click "Edit API key"
4. Name: `YouTube API - Server (Replit)`
5. **Application restrictions:**
   - Select "IP addresses (web servers, cron jobs, etc.)"
   - Click "ADD AN ITEM"
   - Add Replit's IP ranges:
     ```
     You'll need to find your Replit deployment's outbound IP
     ```

**To find your Replit IP:**
```bash
# Run in Replit Shell:
curl -s https://api.ipify.org
```

Add that IP to the restrictions.

⚠️ **Note:** Replit IPs can change, so you may need to update this occasionally.

**API restrictions:**
- Select "Restrict key"
- Check only: "YouTube Data API v3"
- Save

---

### **2. Alternative: Use Replit Secrets for IP Restriction**

Since Replit IPs can change, a better approach:

**Use Application Restrictions: None**

But add these **extra security layers**:

#### **A. API Quota Limits** (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)
2. Set daily quota limit:
   - Default: 10,000 units/day
   - Recommended: 5,000 units/day (plenty for your site)
3. Set up quota alerts

#### **B. Rate Limiting** (Already Implemented ✅)
Your code already has rate limiting:
- General API: 100 requests per 15 min
- Expensive ops: 10 requests per hour

#### **C. Caching** (Already Implemented ✅)
Your YouTube data is cached for 24 hours, minimizing API usage.

#### **D. API Key Rotation**
- Rotate your API key every 30-90 days
- Keep old key active for 24 hours during rotation
- Update Replit secrets

---

## 🛡️ **Enhanced Security Measures**

### **1. Hide API Key in Logs**

Add to `server/youtube.ts`:

```typescript
// Redact API key from error logs
function redactApiKey(url: string): string {
  return url.replace(/key=[^&]+/, 'key=REDACTED');
}

// Use in error logging:
console.error('YouTube API error:', redactApiKey(url.toString()));
```

### **2. Monitor API Usage**

Set up alerts in Google Cloud Console:
1. Go to [Monitoring](https://console.cloud.google.com/monitoring)
2. Create alert for:
   - Daily quota > 80%
   - Unusual traffic spikes
   - Error rates > 10%

### **3. Environment-Specific Keys**

Use different keys for different environments:

```bash
# Development (.env)
YOUTUBE_API_KEY=dev_key_with_no_restrictions

# Production (Replit Secrets)
YOUTUBE_API_KEY=prod_key_with_restrictions

# Staging
YOUTUBE_API_KEY=staging_key_with_restrictions
```

### **4. Secret Scanning Protection**

Add to `.gitignore` (already done):
```
.env
.env.*
!.env.example
```

Add to `.env.example` (template without real keys):
```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_YOUTUBE_CHANNEL_ID=UC_your_channel_id
```

---

## 🎯 **Recommended Configuration for Replit**

Since Replit has dynamic IPs, here's the **most practical secure setup**:

### **Option A: No Referrer Restrictions + Other Security**

**API Key Setup:**
```
Application restrictions: None
API restrictions: YouTube Data API v3 only
```

**Additional Security:**
✅ Quota limits (5,000/day)
✅ Rate limiting (already implemented)
✅ 24-hour caching (already implemented)
✅ API key in Replit Secrets (not in code)
✅ Monitoring alerts
✅ Regular key rotation (every 90 days)

**Pros:**
- Works with Replit's dynamic IPs
- Simple to maintain
- Already secure enough for most use cases

**Cons:**
- If key leaks, anyone can use it until you rotate

---

### **Option B: Replit OAuth Connector** (Most Secure)

Use Replit's built-in YouTube OAuth:

1. In Replit Secrets, connect "YouTube Data API"
2. Remove `YOUTUBE_API_KEY` from secrets
3. Code will automatically use OAuth (fallback is already implemented)

**Pros:**
- No API key to steal
- Replit manages authentication
- Automatic token refresh

**Cons:**
- Replit-specific (not portable)
- Requires Replit's OAuth connector

---

## 📊 **Monitor Your API Usage**

### **Daily Monitoring**
```bash
# Check quota usage
https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
```

**Your current usage estimate:**
- Channel search: ~100 quota units
- Cache: 24 hours
- Requests/day: ~2-5 (very low)
- Daily quota used: ~200-500 units (out of 10,000)

You're using **less than 5% of your quota** with caching!

---

## 🔄 **API Key Rotation Plan**

**Every 90 days:**

1. **Create new API key** in Google Cloud Console
2. **Add to Replit Secrets** as `YOUTUBE_API_KEY_NEW`
3. **Update code** to try new key first:
   ```typescript
   const apiKey = process.env.YOUTUBE_API_KEY_NEW || process.env.YOUTUBE_API_KEY;
   ```
4. **Deploy and test**
5. **After 24 hours**, delete old key from Google Cloud
6. **Rename** `YOUTUBE_API_KEY_NEW` → `YOUTUBE_API_KEY`
7. **Revert code changes**

---

## ⚠️ **What to Do If Key Leaks**

1. **Immediately delete the key** in Google Cloud Console
2. **Create new key** with same restrictions
3. **Update Replit Secrets**
4. **Restart Replit**
5. **Clear cache** to force refresh
6. **Check quota usage** for unauthorized use

---

## 🎯 **Recommended Setup for You**

Given your current setup, I recommend:

### **Quick Security Checklist**

- [x] API key in Replit Secrets (not in code) ✅
- [x] Rate limiting enabled ✅
- [x] 24-hour caching ✅
- [ ] **Add: Set daily quota to 5,000 units**
- [ ] **Add: Set up quota alerts at 80%**
- [ ] **Add: API key rotation schedule (90 days)**
- [ ] **Add: Monitor API usage weekly**
- [ ] **Optional: Implement API key redaction in logs**

---

## 💡 **Best Practice: Defense in Depth**

Since you can't use IP restrictions on Replit, use **multiple layers**:

1. ✅ **Secrets management** - Replit Secrets
2. ✅ **Caching** - 24 hours
3. ✅ **Rate limiting** - Express rate limiter
4. 🆕 **Quota limits** - Google Cloud Console
5. 🆕 **Monitoring** - Google Cloud alerts
6. 🆕 **Key rotation** - Every 90 days
7. 🆕 **API restrictions** - YouTube Data API v3 only

---

## 📝 **Action Items**

**Do this now (5 minutes):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)
2. Set daily quota limit: **5,000 units**
3. Set up alert at **80% (4,000 units)**
4. Restrict API key to **YouTube Data API v3 only**

**Schedule (ongoing):**
- Weekly: Check quota usage
- Monthly: Review error logs
- Every 90 days: Rotate API key

---

**Your setup is already pretty secure with caching and rate limiting. Just add quota limits and you're golden!** 🔒
