# Google Analytics Integration - Quick Reference

## ✅ Setup Complete

Google Analytics 4 (GA4) is now configured with measurement ID: **G-J52BYG13XQ**

## What Was Added

1. **Analytics Utility** (`client/src/lib/analytics.ts`)
   - Core GA4 integration
   - Pre-built event tracking functions
   - TypeScript types

2. **Auto Page Tracking** (`client/src/App.tsx`)
   - Automatically tracks all route changes
   - No manual intervention needed

3. **Environment Variables**
   - Local: `.env` → `VITE_GA_MEASUREMENT_ID=G-J52BYG13XQ`
   - Production: Add `VITE_GA_MEASUREMENT_ID=G-J52BYG13XQ` to Replit Secrets

## Next Steps

### 1. Deploy to Production
```bash
git add -A
git commit -m "feat: add Google Analytics 4 integration"
git push
```

### 2. Add to Replit Secrets
In Replit → Tools → Secrets, add:
```
VITE_GA_MEASUREMENT_ID=G-J52BYG13XQ
```

### 3. Verify in GA Dashboard
- Go to [Google Analytics](https://analytics.google.com/)
- Select your property (G-J52BYG13XQ)
- Navigate to **Reports** → **Realtime** → **Overview**
- Visit your site and watch events appear!

## Quick Usage Examples

### Track Button Clicks
```typescript
import { analytics } from '@/lib/analytics';

<Button onClick={() => {
  analytics.buttonClick('Watch Episode', 'Hero Section');
  // ... your logic
}}>
  Watch Now
</Button>
```

### Track External Links
```typescript
<a 
  href="https://youtube.com/@talesofaneria"
  onClick={() => analytics.externalLinkClick(href, 'YouTube Channel')}
>
  Subscribe on YouTube
</a>
```

### Track Shop Events
```typescript
// When user views a product
analytics.viewItem('T-Shirt - Aneria Logo', 'item_123', 24.99);

// When user adds to cart
analytics.addToCart('T-Shirt - Aneria Logo', 'item_123', 24.99);

// When purchase completes
analytics.purchase('ORDER_123', 49.98, ['T-Shirt', 'Mug']);
```

### Track Video Plays
```typescript
analytics.videoPlay(video.id, video.title);
```

## Full Documentation

See `docs/GOOGLE_ANALYTICS_GUIDE.md` for:
- Complete event reference
- Implementation examples
- Privacy considerations
- Troubleshooting guide
- Best practices

## Testing

### Local Development
1. Run `npm run dev`
2. Open browser console
3. Look for GA initialization message
4. Navigate between pages - each route change logs a pageview

### Production
1. Deploy your changes
2. Visit your site
3. Check GA Realtime dashboard
4. Verify events are being tracked

---

**Status:** ✅ Ready to deploy
**Measurement ID:** G-J52BYG13XQ
**Auto-tracking:** Page views (all routes)
**Manual tracking:** Import `analytics` from `@/lib/analytics`
