# Dynamic Social Media Images Implementation

## Overview

Dynamic social media sharing images are now implemented! Each page can display a custom Open Graph image that appears when shared on social platforms like Facebook, Twitter, LinkedIn, etc.

## How It Works

### Character Pages
When a character page is shared (e.g., `/characters/wayne-archivist`):
- Uses the character's featured image
- Displays character-specific title and description
- Shows character portrait with proper formatting
- Includes character name, race, and class in alt text

### Technical Implementation

**Enhanced SEO Component** (`client/src/components/SEO.tsx`):
- Automatically converts relative URLs to absolute URLs
- Adds proper Open Graph meta tags
- Includes image dimensions and alt text
- Sets up Twitter Card metadata

**New Meta Tags Added:**
```html
<!-- Open Graph -->
<meta property="og:image" content="https://talesofaneria.com/characters/wayne-archivist.webp" />
<meta property="og:image:secure_url" content="https://talesofaneria.com/characters/wayne-archivist.webp" />
<meta property="og:image:alt" content="Wayne Archivist - Changeling Wizard character portrait" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="profile" />
<meta property="og:site_name" content="Tales of Aneria" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://talesofaneria.com/characters/wayne-archivist.webp" />
<meta name="twitter:image:alt" content="Wayne Archivist - Changeling Wizard character portrait" />
```

## Usage in Pages

### Character Detail Pages
```typescript
<SEO
  title={`${character.name} - ${character.race} ${character.class} | Tales of Aneria`}
  description={metaDescription}
  canonical={`https://talesofaneria.com/characters/${character.id}`}
  ogImage={character.featuredImage}
  ogImageAlt={`${character.name} - ${character.race} ${character.class} character portrait`}
  ogType="profile"
  twitterCard="summary_large_image"
/>
```

### Other Pages (Shop, Episodes, etc.)
```typescript
<SEO
  title="Custom Page Title"
  description="Custom description"
  ogImage="/custom-image.png"
  ogImageAlt="Custom alt text"
  ogType="website"
/>
```

## Image Requirements

### Recommended Sizes
- **Open Graph (Facebook, LinkedIn):** 1200x630px
- **Twitter Large Card:** 1200x675px
- **Minimum:** 600x315px
- **Maximum:** 5MB file size

### Current Character Images
Character images are stored in `/client/public/characters/`:
- Format: WebP (modern, efficient)
- Location: `/characters/[character-id].webp`
- Automatically converted to absolute URLs

### Image Optimization Tips
1. **Use 1200x630px** for best compatibility
2. **Keep file size under 1MB** for fast loading
3. **Use high-quality images** - they represent your brand
4. **Include important content in center** - edges may be cropped on some platforms

## Testing Social Shares

### Facebook Debugger
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter URL: `https://talesofaneria.com/characters/wayne-archivist`
3. Click "Scrape Again" to refresh cache
4. Verify image appears correctly

### Twitter Card Validator
1. Go to: https://cards-dev.twitter.com/validator
2. Enter URL: `https://talesofaneria.com/characters/wayne-archivist`
3. Preview how card will look
4. Note: May require Twitter developer account

### LinkedIn Post Inspector
1. Go to: https://www.linkedin.com/post-inspector/
2. Enter URL: `https://talesofaneria.com/characters/wayne-archivist`
3. Click "Inspect"
4. View preview and clear cache if needed

### Manual Testing
Share a link on:
- Facebook (personal page or test group)
- Twitter
- Discord
- LinkedIn
- Reddit

## Social Platform Specific Notes

### Facebook
- Prefers 1200x630px
- Caches aggressively (use debugger to clear)
- Shows og:description
- Supports video thumbnails

### Twitter
- Use `summary_large_image` card type for big images
- Use `summary` for smaller square images
- Image must be under 5MB
- Supports multiple image sizes

### LinkedIn
- Prefers 1200x627px
- Shows og:title and og:description
- Image aspect ratio: 1.91:1

### Discord
- Uses Open Graph tags
- Shows large preview by default
- Excellent support for dynamic images

### WhatsApp
- Uses Open Graph tags
- Caches for 7 days
- Smaller preview size

## Extending to Other Pages

### Shop Products
```typescript
<SEO
  ogImage={product.image}
  ogImageAlt={`${product.name} - Tales of Aneria Merchandise`}
  ogType="product"
  title={product.name}
  description={product.description}
/>
```

### Blog Posts (if added)
```typescript
<SEO
  ogImage={post.featuredImage}
  ogImageAlt={post.imageAlt}
  ogType="article"
  title={post.title}
  description={post.excerpt}
/>
```

### Episode Pages
```typescript
<SEO
  ogImage={episode.thumbnail}
  ogImageAlt={`${episode.title} - Tales of Aneria Episode`}
  ogType="video.episode"
  title={episode.title}
  description={episode.description}
/>
```

## Advanced: Dynamic Image Generation

For even better social sharing, you could generate custom OG images on-the-fly:

### Option 1: Server-Side Image Generation (Recommended)
Create an API endpoint that generates images with:
- Character portrait
- Character name overlaid
- Stats (race, class, level)
- Branded border/background

**Example endpoint:**
```
/api/og-image/character/:id
```

### Option 2: Use a Service
- **Cloudinary:** On-the-fly image transformations
- **Imgix:** Real-time image processing
- **Vercel OG Image Generation:** Built-in if using Vercel

### Option 3: Pre-generate Images
Script to create social-optimized versions:
```bash
# Create 1200x630 versions of all character images
for img in characters/*.webp; do
  convert $img -resize 1200x630^ -gravity center -extent 1200x630 "og-$img"
done
```

## Current Page Types with Dynamic Images

✅ **Character Pages** - Uses character featured image
- `/characters/wayne-archivist`
- `/characters/carine-sol`
- etc.

🔄 **Homepage** - Uses default og-image.png
- Could use rotating hero images

🔄 **Shop** - Uses default og-image.png  
- Could use product images

🔄 **Characters List** - Uses default og-image.png
- Could use collage of character images

## Troubleshooting

### Image Not Showing on Social Media
1. **Check absolute URL:** Must start with `https://`
2. **Clear platform cache:** Use platform-specific debuggers
3. **Verify image exists:** Visit URL directly in browser
4. **Check file size:** Must be under 5MB
5. **Check dimensions:** Minimum 600x315px

### Image Shows Wrong Content
1. **Clear social media cache:** Use debugger tools
2. **Wait 24 hours:** Some platforms cache for extended periods
3. **Check SEO component:** Ensure ogImage prop is correct
4. **Verify character data:** Check characters.json

### Image Appears Cropped
1. **Use 1200x630px:** Optimal for all platforms
2. **Center important content:** Edges may be cropped
3. **Test aspect ratios:** Different platforms crop differently
4. **Avoid text near edges:** Keep 20px safe zone

## Best Practices

✅ **Do:**
- Use high-quality images (1200x630px)
- Include descriptive alt text
- Test on multiple platforms
- Use absolute URLs
- Compress images for fast loading

❌ **Don't:**
- Use images smaller than 600x315px
- Include important text near edges
- Use images over 5MB
- Forget to test social shares
- Use generic images for every page

## Monitoring

Track social shares in Google Analytics:
```typescript
// Already implemented!
analytics.socialShare('Facebook', 'character', character.id);
```

Monitor which characters get shared most:
- Check GA4 → Events → `share` event
- Filter by `content_type: character`
- View `content_id` dimension

## Future Enhancements

### Phase 1 (Current) ✅
- Dynamic character images
- Proper Open Graph tags
- Twitter Card support
- Image alt text

### Phase 2 (Recommended)
- [ ] Generate optimized 1200x630px versions of all character images
- [ ] Add overlay with character name/stats
- [ ] Create product-specific OG images for shop
- [ ] Episode-specific images with thumbnails

### Phase 3 (Advanced)
- [ ] Server-side OG image generation API
- [ ] A/B test different image styles
- [ ] Animated GIF support (Twitter)
- [ ] Video thumbnail support

---

**Implementation Date:** 2026-01-02
**Status:** ✅ Live in production
**Coverage:** Character pages, extensible to all content types
