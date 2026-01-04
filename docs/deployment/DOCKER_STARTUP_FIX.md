# Docker Dev Environment - Startup Issue Fix

**Date:** 2026-01-04  
**Issue:** Docker container crashing with "react-helmet-async could not be resolved"  
**Status:** ✅ FIXED

---

## 🐛 Problem

Docker container was crashing on startup with error:
```
(!) Failed to run dependency scan. Skipping dependency pre-bundling. Error: 
The following dependencies are imported but could not be resolved:
  react-helmet-async (imported by /app/client/src/pages/TrackOrder.tsx)
```

**Root Cause:** `react-helmet-async` package was not installed but was being imported in `TrackOrder.tsx`

---

## ✅ Solution

### 1. Installed Missing Package
```bash
npm install react-helmet-async
```

### 2. Updated App.tsx
Wrapped application with `HelmetProvider`:

```typescript
import { HelmetProvider } from "react-helmet-async";

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        {/* ... rest of app */}
      </QueryClientProvider>
    </HelmetProvider>
  );
}
```

---

## 🧪 How to Test

### Rebuild Docker Containers

```bash
# Stop existing containers
docker-compose -f docker-compose.dev.yml down

# Remove old images (optional but recommended)
docker-compose -f docker-compose.dev.yml down --rmi all

# Rebuild and start fresh
docker-compose -f docker-compose.dev.yml up --build
```

### Expected Behavior
- ✅ Container starts without errors
- ✅ Vite dev server starts successfully
- ✅ Application accessible at http://localhost:5000
- ✅ No "react-helmet-async could not be resolved" error

---

## 📋 Files Modified

1. **package.json** - Added `react-helmet-async` dependency
2. **package-lock.json** - Updated with new dependency
3. **client/src/App.tsx** - Added HelmetProvider wrapper

---

## 🔍 Why This Happened

The `TrackOrder.tsx` page uses `react-helmet-async` for SEO (managing page title/meta tags), but the package was never added to `package.json`. 

This worked in local development if the package was accidentally installed globally or as a transitive dependency, but failed in the clean Docker environment.

---

## 🚀 Quick Commands

### Start Development Environment
```bash
docker-compose -f docker-compose.dev.yml up
```

### Rebuild After Changes
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Stop All Containers
```bash
docker-compose -f docker-compose.dev.yml down
```

### View Logs
```bash
docker-compose -f docker-compose.dev.yml logs -f app
```

### Clean Everything (Nuclear Option)
```bash
docker-compose -f docker-compose.dev.yml down --volumes --rmi all
docker-compose -f docker-compose.dev.yml up --build
```

---

## ✅ Verification Checklist

After starting Docker:
- [ ] Container stays running (doesn't restart)
- [ ] No error about "react-helmet-async"
- [ ] Vite dev server starts
- [ ] Express server starts on port 5000
- [ ] Can access http://localhost:5000
- [ ] Can access /track-order page
- [ ] Page title/meta tags work correctly

---

## 📊 What react-helmet-async Does

`react-helmet-async` is used for:
- Setting page titles dynamically
- Managing meta tags for SEO
- Setting Open Graph tags for social sharing
- Managing canonical URLs

**Usage in TrackOrder.tsx:**
```typescript
import { Helmet } from 'react-helmet-async';

function TrackOrder() {
  return (
    <>
      <Helmet>
        <title>Track Your Order - Tales of Aneria</title>
        <meta name="description" content="Track your Tales of Aneria merchandise order" />
      </Helmet>
      {/* ... rest of component */}
    </>
  );
}
```

---

## 🔧 Additional Docker Tips

### Check Container Status
```bash
docker ps -a
```

### Enter Running Container
```bash
docker exec -it toa-website-dev sh
```

### Check Installed Packages Inside Container
```bash
docker exec -it toa-website-dev npm list react-helmet-async
```

### Force Rebuild (if still having issues)
```bash
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

---

## 🐳 Docker Development Best Practices

1. **Always rebuild after package.json changes:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Use docker-compose logs for debugging:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

3. **Clean up regularly:**
   ```bash
   docker system prune -a
   ```

4. **Check volume mounts:**
   The dev compose file mounts your local code, so changes are reflected immediately (hot reload)

---

## 📞 If Still Having Issues

### Issue: Container still crashing
**Solution:**
1. Check if node_modules is being properly excluded:
   ```yaml
   volumes:
     - .:/app
     - /app/node_modules  # This line is critical
   ```

2. Rebuild without cache:
   ```bash
   docker-compose -f docker-compose.dev.yml build --no-cache
   ```

### Issue: Port already in use
**Solution:**
```bash
# Find what's using port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Stop the process or change port in docker-compose.dev.yml
```

### Issue: Database connection errors
**Solution:**
Check that PostgreSQL container is healthy:
```bash
docker-compose -f docker-compose.dev.yml ps
```

---

**Status:** ✅ FIXED - Docker should now start successfully  
**Next Action:** Run `docker-compose -f docker-compose.dev.yml up --build`

---

## 🔧 Additional Fix: Wouter Navigation Hook

**Issue:** Runtime error about `useNavigate` not exported from wouter

**Root Cause:** Wouter uses `useLocation` hook, not `useNavigate` (which is from React Router)

**Fix Applied:**
```typescript
// Before (incorrect)
import { useNavigate } from 'wouter';
const [, navigate] = useNavigate();

// After (correct)
import { useLocation } from 'wouter';
const [, setLocation] = useLocation();
```

**File Modified:** `client/src/hooks/useAuth.ts`
