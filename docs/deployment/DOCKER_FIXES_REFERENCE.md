# Docker Development Issues - Quick Fix Reference

**Date:** 2026-01-04  
**Status:** ✅ ALL FIXED

---

## 🔧 Issues Fixed

### Issue #1: Missing Dependency - react-helmet-async

**Error:**
```
The following dependencies are imported but could not be resolved:
  react-helmet-async (imported by /app/client/src/pages/TrackOrder.tsx)
```

**Fix:**
```bash
npm install react-helmet-async
```

**Code Changes:**
```typescript
// client/src/App.tsx
import { HelmetProvider } from "react-helmet-async";

function App() {
  return (
    <HelmetProvider>
      {/* ... rest of app */}
    </HelmetProvider>
  );
}
```

**Files Modified:**
- `package.json`
- `client/src/App.tsx`

---

### Issue #2: Incorrect Wouter Import

**Error:**
```
The requested module does not provide an export named 'useNavigate'
```

**Root Cause:** Wouter uses `useLocation`, not `useNavigate` (which is from React Router)

**Fix:**
```typescript
// client/src/hooks/useAuth.ts

// ❌ WRONG (React Router API)
import { useNavigate } from 'wouter';
const [, navigate] = useNavigate();
navigate('/');

// ✅ CORRECT (Wouter API)
import { useLocation } from 'wouter';
const [, setLocation] = useLocation();
setLocation('/');
```

**Files Modified:**
- `client/src/hooks/useAuth.ts`

---

## 🚀 How to Apply Fixes

### If Docker is Already Running:
The volume mount should pick up changes automatically, but you may need to:

```bash
# Restart just the app container
docker-compose -f docker-compose.dev.yml restart app

# Or rebuild if that doesn't work
docker-compose -f docker-compose.dev.yml up --build
```

### Fresh Start:
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

---

## ✅ Verification

After applying fixes, you should see:
1. ✅ Container starts without restarting
2. ✅ Vite dev server ready
3. ✅ No "react-helmet-async" error
4. ✅ No "useNavigate" error
5. ✅ App loads in browser at http://localhost:5000
6. ✅ All pages navigate correctly
7. ✅ Admin logout works (uses navigation)

---

## 📚 Wouter vs React Router Cheat Sheet

This project uses **Wouter**, not React Router. Key differences:

| Feature | React Router | Wouter |
|---------|-------------|---------|
| Navigation Hook | `useNavigate()` | `useLocation()` |
| Navigate | `navigate('/path')` | `setLocation('/path')` |
| Current Route | `useLocation()` | `useLocation()[0]` |
| Link Component | `<Link>` | `<Link>` (same) |
| Route Params | `useParams()` | `useRoute('/path/:id')` |

**Wouter Documentation:** https://github.com/molefrog/wouter

---

## 🐛 Common Wouter Mistakes

### ❌ Wrong:
```typescript
import { useNavigate } from 'wouter';  // Doesn't exist!
import { useParams } from 'wouter';    // Doesn't exist!
import { Navigate } from 'wouter';     // Doesn't exist!
```

### ✅ Correct:
```typescript
import { useLocation, useRoute, Link, Redirect } from 'wouter';

// Navigation
const [location, setLocation] = useLocation();
setLocation('/new-path');

// Route params
const [match, params] = useRoute('/users/:id');
console.log(params.id);

// Redirect
<Redirect to="/home" />
```

---

## 📝 Summary of All Changes

### Dependencies Added:
- `react-helmet-async` - For SEO meta tags

### Files Modified:
1. `package.json` - Added dependency
2. `package-lock.json` - Updated lockfile
3. `client/src/App.tsx` - Added HelmetProvider
4. `client/src/hooks/useAuth.ts` - Fixed navigation hook
5. `docs/deployment/DOCKER_STARTUP_FIX.md` - Created guide

### Files Created:
- `docs/deployment/DOCKER_STARTUP_FIX.md` - Complete troubleshooting guide
- `docs/deployment/DOCKER_FIXES_REFERENCE.md` - This quick reference

---

## 🎯 Prevention

To avoid these issues in the future:

1. **Always install packages before importing:**
   ```bash
   npm install react-helmet-async
   # THEN import in code
   ```

2. **Check library documentation for correct API:**
   - Wouter is NOT React Router
   - Use `useLocation`, not `useNavigate`

3. **Test in Docker regularly:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. **Keep dependencies in sync:**
   - If package.json changes, rebuild Docker
   - Run `npm ci` in Docker to ensure clean install

---

**All Issues Resolved:** ✅  
**Docker Status:** Ready for development  
**Next Action:** Continue development with confidence!
