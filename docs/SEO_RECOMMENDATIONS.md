# SEO Recommendations for Tales of Aneria

## ✅ Current SEO Strengths

1. **Dynamic SEO Component** - Meta tags update per page
2. **Structured Data (JSON-LD)** - Organization & Website schemas
3. **Open Graph & Twitter Cards** - Social media optimization
4. **Canonical URLs** - Prevent duplicate content issues
5. **robots.txt** - Properly configured crawl directives
6. **Sitemap.xml** - XML sitemap for search engines

## 🔧 Immediate Actions Taken

### Sitemap Updates (2026-01-02)
- ✅ Added `/shop` page (priority: 0.8)
- ✅ Updated all lastmod dates to 2026-01-02
- ✅ Adjusted character page priorities from 0.8 to 0.7

## 🎯 Additional SEO Improvements Needed

### 1. **Add More Structured Data**

**Product Schema for Shop Items:**
```typescript
// In client/src/lib/structuredData.ts
export function getProductSchema(product: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": "Tales of Aneria"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://talesofaneria.com/shop`,
      "priceCurrency": "USD",
      "price": product.price,
      "availability": "https://schema.org/InStock"
    }
  };
}
```

**Video Schema for Episodes:**
```typescript
export function getVideoSchema(video: any) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description,
    "thumbnailUrl": video.thumbnail,
    "uploadDate": video.publishedAt,
    "contentUrl": `https://www.youtube.com/watch?v=${video.id}`,
    "embedUrl": `https://www.youtube.com/embed/${video.id}`,
    "duration": video.duration
  };
}
```

**Person Schema for Characters:**
```typescript
export function getCharacterSchema(character: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": character.name,
    "description": character.description,
    "image": character.image,
    "memberOf": {
      "@type": "Organization",
      "name": "Tales of Aneria"
    }
  };
}
```

### 2. **Improve Page Load Performance**

**Image Optimization:**
- Use WebP format with fallbacks
- Implement lazy loading for below-fold images
- Add responsive images with srcset
- Optimize og-image.png (currently should be 1200x630px)

**Code Splitting:**
```typescript
// In App.tsx - lazy load routes
const Shop = lazy(() => import('@/pages/Shop'));
const Characters = lazy(() => import('@/pages/Characters'));
// ... etc
```

### 3. **Add Missing Meta Tags**

**In index.html, add:**
```html
<!-- Theme color for mobile browsers -->
<meta name="theme-color" content="#8B4513" />

<!-- App capability -->
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

<!-- Content language -->
<meta http-equiv="content-language" content="en-US" />

<!-- Geographic targeting (if relevant) -->
<meta name="geo.region" content="US" />
```

### 4. **Create Additional SEO Content**

**Blog/News Section:**
- Add a `/blog` or `/news` section for episode recaps
- Provides fresh content for search engines
- Increases keyword opportunities

**FAQ Page:**
- Common TTRPG/campaign questions
- "What is Tales of Aneria?"
- "How do I watch/listen?"
- Rich snippet opportunity

### 5. **Technical SEO Enhancements**

**Add Breadcrumbs:**
```typescript
// BreadcrumbList schema for character pages
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://talesofaneria.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Characters",
      "item": "https://talesofaneria.com/characters"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": character.name,
      "item": `https://talesofaneria.com/characters/${character.id}`
    }
  ]
}
```

**Add hreflang tags (if multi-language in future):**
```html
<link rel="alternate" hreflang="en" href="https://talesofaneria.com/" />
```

### 6. **Content Optimization**

**Keyword Research & Implementation:**
- Target long-tail keywords: "D&D actual play podcast"
- Add location-based keywords if relevant
- Include trending TTRPG terms

**Internal Linking:**
- Link from homepage to character pages
- Cross-link between related characters
- Link to shop from character pages

**Alt Text for Images:**
- Ensure all character images have descriptive alt text
- Include character name and relevant keywords
- Example: "Wayne the Archivist - Human Wizard from Tales of Aneria D&D Campaign"

### 7. **Social Media Integration**

**Add Social Proof:**
```html
<!-- In index.html -->
<meta property="fb:app_id" content="YOUR_FB_APP_ID" />
<meta name="twitter:site" content="@talesofaneria" />
<meta name="twitter:creator" content="@talesofaneria" />
```

**Rich Pins for Pinterest (if applicable):**
```html
<meta property="og:type" content="article" />
<meta property="article:author" content="Tales of Aneria" />
```

### 8. **Analytics & Monitoring**

**Install Analytics:**
- Google Analytics 4 (GA4)
- Google Search Console
- Bing Webmaster Tools

**Track Key Metrics:**
- Organic traffic by page
- Keyword rankings
- Core Web Vitals
- Conversion tracking (shop purchases, Patreon signups)

**Monitor:**
```bash
# Submit sitemap to Google Search Console
# Check index coverage
# Monitor mobile usability
# Track click-through rates (CTR)
```

### 9. **Local SEO (if applicable)**

If you have a physical location or target specific regions:
```json
{
  "@type": "LocalBusiness",
  "name": "Tales of Aneria",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "City",
    "addressRegion": "State",
    "addressCountry": "US"
  }
}
```

### 10. **Accessibility = SEO**

Your WCAG 2.1 AA compliance helps SEO:
- ✅ Semantic HTML improves crawlability
- ✅ Alt text helps image search
- ✅ Clear headings structure content
- ✅ Keyboard navigation signals quality

## 📊 SEO Checklist

### Pre-Launch
- [x] Sitemap.xml created and submitted
- [x] robots.txt configured
- [x] Meta tags on all pages
- [x] Canonical URLs set
- [x] Open Graph tags
- [x] Basic structured data
- [ ] Google Search Console setup
- [ ] Google Analytics installed
- [ ] Performance optimization (Lighthouse score 90+)

### Post-Launch Monitoring
- [ ] Submit sitemap to Google/Bing
- [ ] Monitor Search Console for errors
- [ ] Track Core Web Vitals
- [ ] Review keyword rankings monthly
- [ ] Update sitemap when adding content
- [ ] Check for broken links quarterly
- [ ] Review and update meta descriptions based on CTR

### Content Strategy
- [ ] Create episode recap blog posts
- [ ] Add FAQ section
- [ ] Build internal linking structure
- [ ] Optimize character descriptions with keywords
- [ ] Create shareable social media content
- [ ] Guest blog on TTRPG sites for backlinks

## 🎯 Priority Order

### High Priority (Do First)
1. **Add Google Analytics & Search Console** - Essential for tracking
2. **Optimize images** - Biggest performance win
3. **Add Product/Video structured data** - Rich snippets
4. **Submit sitemap** - Get indexed faster

### Medium Priority (Next Quarter)
5. Add blog/news section for fresh content
6. Implement breadcrumbs
7. Build internal linking strategy
8. Create FAQ page

### Low Priority (Future Enhancement)
9. Multi-language support
10. Advanced schema markup
11. Video transcripts for accessibility/SEO
12. Podcast episode transcripts

## 📈 Expected Results

With these improvements, expect:
- **20-30% increase** in organic traffic (3-6 months)
- **Higher rankings** for "TTRPG actual play" keywords
- **Better CTR** from rich snippets
- **Improved social shares** from OG optimization
- **Faster indexing** of new content

## 🔗 Useful Resources

- [Google Search Console](https://search.google.com/search-console)
- [Schema.org Documentation](https://schema.org/)
- [Google's Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**Last Updated:** 2026-01-02
**Status:** Sitemap updated, additional improvements recommended
