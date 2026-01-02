# Google Analytics Setup Guide

## Overview
Google Analytics 4 (GA4) is now integrated into Tales of Aneria website. This guide covers usage and best practices.

## Configuration

### Environment Variables
Add to your environment:
```bash
VITE_GA_MEASUREMENT_ID=G-J52BYG13XQ
```

**Important:** 
- ✅ Local development: GA will warn but not track (respects DNT headers)
- ✅ Production: Full tracking enabled

## Automatic Tracking

### Page Views
All route changes are automatically tracked via the `Analytics` component in `App.tsx`.

No additional code needed!

## Manual Event Tracking

### Import the analytics utility:
```typescript
import { analytics } from '@/lib/analytics';
```

### Common Events

**Button Clicks:**
```typescript
analytics.buttonClick('Watch Episode', 'Hero Section');
analytics.buttonClick('Shop Now', 'Navigation');
```

**External Links (Social Media, YouTube, etc.):**
```typescript
analytics.externalLinkClick('https://youtube.com/...', 'Watch on YouTube');
analytics.externalLinkClick('https://patreon.com/...', 'Support on Patreon');
```

**Video Plays:**
```typescript
analytics.videoPlay('VIDEO_ID', 'Episode 1 - The Beginning');
```

**Character Views:**
```typescript
analytics.characterView('Wayne', 'wayne-archivist');
```

**Shop Events:**
```typescript
// View product
analytics.viewItem('T-Shirt - Aneria Logo', 'item_123', 24.99);

// Add to cart
analytics.addToCart('T-Shirt - Aneria Logo', 'item_123', 24.99);

// Begin checkout
analytics.beginCheckout(49.98, ['T-Shirt', 'Mug']);

// Purchase completed
analytics.purchase('ORDER_123', 49.98, ['T-Shirt', 'Mug']);
```

**Podcast Plays:**
```typescript
analytics.podcastPlay('Spotify');
analytics.podcastPlay('Apple Podcasts');
```

**Social Shares:**
```typescript
analytics.socialShare('Twitter', 'character', 'wayne-archivist');
analytics.socialShare('Facebook', 'episode', 'episode-1');
```

**Form Submissions:**
```typescript
analytics.formSubmit('Sponsorship Form', true);
analytics.formSubmit('Newsletter Signup', false);
```

**Newsletter Signups:**
```typescript
analytics.newsletterSignup('Footer CTA');
```

**Search:**
```typescript
analytics.search('dragon campaign', 5);
```

## Implementation Examples

### Example 1: Track YouTube Video Plays
```typescript
// In LatestEpisodes.tsx
const handleVideoClick = (video: Video) => {
  analytics.videoPlay(video.id, video.title);
  // ... rest of logic
};
```

### Example 2: Track Shop Product Views
```typescript
// In Shop.tsx
const handleProductClick = (product: Product) => {
  analytics.viewItem(product.name, product.id, product.price);
};
```

### Example 3: Track Social Media Links
```typescript
// In Footer.tsx or social links component
<a 
  href={socialLink.url}
  onClick={() => analytics.externalLinkClick(socialLink.url, socialLink.name)}
>
  {socialLink.icon}
</a>
```

### Example 4: Track Character Page Views
```typescript
// In CharacterDetail.tsx
useEffect(() => {
  if (character) {
    analytics.characterView(character.name, character.id);
  }
}, [character]);
```

### Example 5: Track Sponsorship Form
```typescript
// In SponsorshipForm.tsx
const handleSubmit = async (data: FormData) => {
  try {
    await submitForm(data);
    analytics.formSubmit('Sponsorship Form', true);
  } catch (error) {
    analytics.formSubmit('Sponsorship Form', false);
  }
};
```

## Privacy Considerations

### Data Collection
GA4 automatically collects:
- Page views
- Geographic location (approximate)
- Device type, browser, OS
- Session duration
- Traffic source

### User Privacy
- Respects Do Not Track (DNT) browser settings
- No personally identifiable information (PII) is tracked
- Compliant with WCAG 2.1 AA and privacy regulations

### Privacy Policy
Ensure your Privacy Policy (`/legal/privacy`) mentions:
- Google Analytics usage
- What data is collected
- How users can opt-out
- Cookie usage

## Testing

### Development Testing
```bash
# Run dev server
npm run dev

# Open browser console
# Check for: "Google Analytics initialized" or warning message
```

### Production Testing
1. Deploy to production
2. Open Google Analytics dashboard
3. Go to **Realtime** → **Overview**
4. Navigate your site
5. Verify events appear in real-time

### Debug Mode
Add to URL for debugging:
```
?gtm_debug=true
```

View events in browser console.

## Google Analytics Dashboard

### Recommended Reports to Monitor

**1. Real-time Reports:**
- See active users on your site right now
- View which pages they're on

**2. Traffic Acquisition:**
- How users find your site (Google, social media, direct)
- Which campaigns drive the most traffic

**3. Engagement:**
- Most visited pages
- Average session duration
- Bounce rate

**4. Conversions:**
- Track custom events (video plays, shop views)
- Monitor goal completions

**5. E-commerce (if configured):**
- Product views
- Add to cart events
- Purchase completions

### Custom Dashboards
Create custom dashboards for:
- **Content Performance**: Track episode views, character page visits
- **Shop Performance**: Product views, cart additions, purchases
- **Social Engagement**: Social shares, external link clicks
- **User Journey**: Path from landing page to conversion

## Troubleshooting

### Events Not Appearing

**Check 1: Measurement ID**
```typescript
console.log(import.meta.env.VITE_GA_MEASUREMENT_ID);
// Should output: G-J52BYG13XQ
```

**Check 2: GA Initialized**
```typescript
console.log(window.gtag);
// Should be a function
```

**Check 3: Network Tab**
- Open DevTools → Network
- Filter by "google-analytics.com"
- Verify requests are being sent

**Check 4: Ad Blockers**
- Disable ad blockers during testing
- Many block Google Analytics

### Common Issues

**Issue: No data in GA dashboard**
- Wait 24-48 hours for data processing
- Check Real-time reports for immediate feedback

**Issue: Events not tracked**
- Verify measurement ID is correct
- Check browser console for errors
- Ensure `analytics.` calls are being executed

**Issue: Double page views**
- Check for duplicate `Analytics` components
- Verify `send_page_view: false` in config

## Best Practices

1. **Don't Over-Track**: Track meaningful user interactions, not every click
2. **Use Descriptive Names**: Use clear event names and parameters
3. **Test First**: Test events in development before deploying
4. **Respect Privacy**: Don't track PII or sensitive data
5. **Monitor Performance**: GA should not impact page load times

## Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GA4 Best Practices](https://support.google.com/analytics/answer/9267735)

---

**Last Updated:** 2026-01-02
**GA Measurement ID:** G-J52BYG13XQ
