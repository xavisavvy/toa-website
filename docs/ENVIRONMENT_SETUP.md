# Environment Setup Guide

## 🌐 Environment Structure

Tales of Aneria uses a multi-environment setup for development, staging, and production:

| Environment | URL | Purpose |
|------------|-----|---------|
| **Local** | `dev-local.talesofaneria.com` | Local development on your machine |
| **Development** | `dev.talesofaneria.com` | Development server for testing |
| **Staging** | `stg.talesofaneria.com` | Pre-production environment |
| **Production** | `talesofaneria.com` | Live production site |

---

## 🛠️ Local Development Setup

### Step 1: Configure Hosts File

To use the local development domain, you need to add an entry to your system's hosts file.

#### Windows

1. **Open Notepad as Administrator**
   - Press `Windows Key`
   - Type `notepad`
   - Right-click on Notepad
   - Select "Run as administrator"

2. **Open the hosts file**
   - In Notepad: File → Open
   - Navigate to: `C:\Windows\System32\drivers\etc`
   - Change file type filter to: "All Files (*.*)"
   - Select the file named: `hosts`
   - Click Open

3. **Add this line to the END of the file**
   ```
   # Tales of Aneria - Local Development
   127.0.0.1       dev-local.talesofaneria.com
   ```

4. **Save and close**
   - File → Save (or Ctrl+S)
   - Close Notepad

5. **Flush DNS cache**
   ```powershell
   ipconfig /flushdns
   ```

#### macOS / Linux

1. **Open Terminal**

2. **Edit the hosts file**
   ```bash
   sudo nano /etc/hosts
   ```

3. **Add this line to the END of the file**
   ```
   # Tales of Aneria - Local Development
   127.0.0.1       dev-local.talesofaneria.com
   ```

4. **Save and exit**
   - Press `Ctrl + O` to save
   - Press `Enter` to confirm
   - Press `Ctrl + X` to exit

5. **Flush DNS cache**
   
   **macOS:**
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```
   
   **Linux:**
   ```bash
   sudo systemd-resolve --flush-caches
   ```

---

### Step 2: Configure Environment Variables

1. **Copy the example environment file**
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file** with your local configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   APP_URL=http://dev-local.talesofaneria.com:5000
   VITE_APP_URL=http://dev-local.talesofaneria.com:5000
   ALLOWED_ORIGINS=http://localhost:5000,http://dev-local.talesofaneria.com:5000
   ```

3. **Add your API keys** (see `.env.example` for all required variables)

---

### Step 3: Test Your Setup

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://dev-local.talesofaneria.com:5000
   ```

3. **Verify it works**
   - You should see the Tales of Aneria website
   - Check the browser console for any errors
   - Verify API calls are working

---

## 🔧 Environment-Specific Configuration

### Local Development
- **URL:** `http://dev-local.talesofaneria.com:5000`
- **HTTPS:** No (use HTTP)
- **API Keys:** Test/Sandbox keys
- **Database:** Local PostgreSQL or Docker
- **Redis:** Local or Docker

### Development Server
- **URL:** `https://dev.talesofaneria.com`
- **HTTPS:** Yes
- **API Keys:** Test/Sandbox keys
- **Database:** Development database
- **Redis:** Development Redis instance

### Staging
- **URL:** `https://stg.talesofaneria.com`
- **HTTPS:** Yes
- **API Keys:** Test/Sandbox keys (or Production if testing payments)
- **Database:** Staging database (copy of production)
- **Redis:** Staging Redis instance

### Production
- **URL:** `https://talesofaneria.com`
- **HTTPS:** Yes (Required)
- **API Keys:** Production keys only
- **Database:** Production database
- **Redis:** Production Redis instance

---

## 📋 Environment Variables Checklist

### Required for All Environments
- [ ] `NODE_ENV`
- [ ] `PORT`
- [ ] `APP_URL`
- [ ] `VITE_APP_URL`
- [ ] `SESSION_SECRET`
- [ ] `ALLOWED_ORIGINS`

### API Keys
- [ ] `YOUTUBE_API_KEY`
- [ ] `VITE_YOUTUBE_API_KEY`
- [ ] `VITE_YOUTUBE_CHANNEL_ID`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `PRINTFUL_API_KEY`
- [ ] `ETSY_API_KEY` (optional)
- [ ] `ETSY_ACCESS_TOKEN` (optional)

### Database & Cache
- [ ] `DATABASE_URL`
- [ ] `REDIS_URL` (production/staging)

---

## 🚨 Security Notes

### ⚠️ NEVER commit `.env` to git
The `.env` file contains sensitive information and should **NEVER** be committed to version control.

### ✅ Always use `.env.example`
Update `.env.example` when adding new environment variables, but **never** include actual values.

### 🔒 Production Keys
- Use separate API keys for each environment
- Never use production keys in development
- Rotate keys regularly
- Use environment-specific webhook URLs

---

## 🧪 Testing Your Environment

### Verify DNS Resolution
```bash
# Windows
ping dev-local.talesofaneria.com

# macOS/Linux
ping -c 4 dev-local.talesofaneria.com
```

Should resolve to `127.0.0.1`

### Verify Port is Open
```bash
# Windows
netstat -an | findstr :5000

# macOS/Linux
lsof -i :5000
```

### Check Environment Variables
```bash
npm run dev
```

Look for console output showing:
- ✅ Server running on correct URL
- ✅ Database connected
- ✅ Redis connected (if applicable)

---

## 🐛 Troubleshooting

### "Cannot resolve dev-local.talesofaneria.com"
1. Check hosts file entry is correct
2. Flush DNS cache
3. Restart browser
4. Try using 127.0.0.1:5000 directly

### "CORS Error"
1. Verify `ALLOWED_ORIGINS` includes your development URL
2. Check browser console for the exact origin being blocked
3. Restart the dev server after changing `.env`

### "Port 5000 already in use"
1. Find and stop the process using port 5000
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   ```
2. Or change PORT in `.env` to a different port

---

## 📞 Need Help?

If you encounter issues:
1. Check this documentation first
2. Review error messages in console
3. Verify all environment variables are set
4. Ask the team on Discord/Slack

---

**Last Updated:** January 2026
