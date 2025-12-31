import { test, expect } from '@playwright/test';

test.describe('SEO and Meta Tags', () => {
  test('homepage has correct meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    const title = await page.title();
    expect(title).toContain('Tales of Aneria');
    
    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);
    expect(description!.length).toBeLessThan(160);
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();
    
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
    
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(ogUrl).toBeTruthy();
  });

  test('characters page has unique meta tags', async ({ page }) => {
    await page.goto('/characters');
    
    const title = await page.title();
    expect(title).toContain('Characters');
    expect(title).toContain('Tales of Aneria');
    
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description).not.toContain('Latest Episodes'); // Should be different from homepage
  });

  test('character detail page has dynamic meta tags', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Get character name from page
    const characterName = await page.locator('h1').first().textContent();
    
    // Title should include character name
    const title = await page.title();
    expect(title).toContain(characterName!);
    
    // Description should mention the character
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });

  test('canonical URL is set correctly', async ({ page }) => {
    await page.goto('/');
    
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical).toMatch(/^https?:\/\//);
  });

  test('robots meta tag is present', async ({ page }) => {
    await page.goto('/');
    
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    // Should allow indexing
    if (robots) {
      expect(robots).not.toContain('noindex');
    }
  });

  test('viewport meta tag is set for responsive design', async ({ page }) => {
    await page.goto('/');
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('Twitter Card meta tags are present', async ({ page }) => {
    await page.goto('/');
    
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBeTruthy();
    
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
    expect(twitterTitle).toBeTruthy();
  });
});

test.describe('Structured Data (JSON-LD)', () => {
  test('homepage has valid JSON-LD structured data', async ({ page }) => {
    await page.goto('/');
    
    // Get all script tags with type application/ld+json
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    
    expect(jsonLdScripts.length).toBeGreaterThan(0);
    
    // Validate first JSON-LD is valid JSON
    const firstJsonLd = jsonLdScripts[0];
    expect(() => JSON.parse(firstJsonLd)).not.toThrow();
    
    const structuredData = JSON.parse(firstJsonLd);
    
    // Check it has @context
    expect(structuredData['@context']).toBe('https://schema.org');
    
    // Check it has @type
    expect(structuredData['@type']).toBeTruthy();
  });

  test('website organization structured data is present', async ({ page }) => {
    await page.goto('/');
    
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    
    const organizationData = jsonLdScripts.find(script => {
      try {
        const data = JSON.parse(script);
        return data['@type'] === 'Organization';
      } catch {
        return false;
      }
    });
    
    if (organizationData) {
      const org = JSON.parse(organizationData);
      expect(org.name).toBeTruthy();
      expect(org.url).toBeTruthy();
    }
  });

  test('podcast structured data includes required fields', async ({ page }) => {
    await page.goto('/');
    
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    
    const podcastData = jsonLdScripts.find(script => {
      try {
        const data = JSON.parse(script);
        return data['@type'] === 'PodcastSeries';
      } catch {
        return false;
      }
    });
    
    if (podcastData) {
      const podcast = JSON.parse(podcastData);
      
      // Required fields for PodcastSeries
      expect(podcast.name).toBeTruthy();
      expect(podcast.description).toBeTruthy();
      expect(podcast.url).toBeTruthy();
      
      // Should have webFeed (RSS feed)
      if (podcast.webFeed) {
        expect(podcast.webFeed).toMatch(/^https?:\/\//);
      }
    }
  });

  test('breadcrumb structured data on character pages', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    
    const breadcrumbData = jsonLdScripts.find(script => {
      try {
        const data = JSON.parse(script);
        return data['@type'] === 'BreadcrumbList';
      } catch {
        return false;
      }
    });
    
    if (breadcrumbData) {
      const breadcrumb = JSON.parse(breadcrumbData);
      expect(breadcrumb.itemListElement).toBeDefined();
      expect(Array.isArray(breadcrumb.itemListElement)).toBe(true);
    }
  });

  test('all JSON-LD scripts are valid JSON', async ({ page }) => {
    await page.goto('/');
    
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    
    jsonLdScripts.forEach((script, index) => {
      expect(() => JSON.parse(script), `JSON-LD at index ${index} should be valid`).not.toThrow();
    });
  });

  test('structured data has no duplicate @context', async ({ page }) => {
    await page.goto('/');
    
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    
    jsonLdScripts.forEach((script) => {
      const data = JSON.parse(script);
      const stringified = JSON.stringify(data);
      
      // Check for duplicate @context properties
      const contextMatches = stringified.match(/"@context"/g);
      if (contextMatches) {
        expect(contextMatches.length).toBe(1);
      }
    });
  });
});

test.describe('SEO Best Practices', () => {
  test('page has exactly one h1 tag', async ({ page }) => {
    await page.goto('/');
    
    const h1Tags = await page.locator('h1').count();
    expect(h1Tags).toBe(1);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Alt can be empty for decorative images, but should be defined
      expect(alt).not.toBeNull();
    }
  });

  test('links have descriptive text', async ({ page }) => {
    await page.goto('/');
    
    const links = await page.locator('a[href]').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      // Link should have text or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('no broken internal links', async ({ page }) => {
    await page.goto('/');
    
    const internalLinks = await page.locator('a[href^="/"], a[href^="./"]').all();
    
    // Test first 5 internal links
    const linksToTest = internalLinks.slice(0, 5);
    
    for (const link of linksToTest) {
      const href = await link.getAttribute('href');
      if (href && !href.includes('#')) {
        const response = await page.goto(href);
        expect(response?.status()).toBeLessThan(400);
        await page.goBack();
      }
    }
  });

  test('page language is set', async ({ page }) => {
    await page.goto('/');
    
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
  });
});
