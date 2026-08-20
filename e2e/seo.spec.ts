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

    // Check it has @type — the site emits a single "@graph"-wrapped bundle
    // per page rather than one @type per script, so check the first node
    // in the graph when there's no top-level @type.
    const firstNode = structuredData['@type']
      ? structuredData
      : structuredData['@graph']?.[0];
    expect(firstNode?.['@type']).toBeTruthy();
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

  test('structured data has no conflicting @context values', async ({ page }) => {
    await page.goto('/');

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();

    jsonLdScripts.forEach((script) => {
      const data = JSON.parse(script);
      const stringified = JSON.stringify(data);

      // Nodes combined into a single "@graph" bundle each carry their own
      // self-contained "@context" (so the same factory can also be used
      // standalone) — that's expected duplication, not a bug. What would be
      // a real bug is those values disagreeing with each other.
      const contextValues = [...stringified.matchAll(/"@context":"([^"]+)"/g)].map(
        (m) => m[1]
      );
      if (contextValues.length > 0) {
        expect(new Set(contextValues)).toEqual(new Set(['https://schema.org']));
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
      // A link's accessible name can also come from a contained image's alt
      // text (e.g. a logo-as-homepage-link) — matches how browsers/screen
      // readers compute it, and how axe-core's link-name rule treats it.
      // Check count() first: getAttribute() on a locator with no match
      // waits out its full timeout for the element to appear rather than
      // resolving empty, which — times dozens of plain-text links with no
      // image at all — blows the test's overall time budget.
      const innerImg = link.locator('img[alt]').first();
      const imgAlt = (await innerImg.count()) > 0
        ? await innerImg.getAttribute('alt')
        : null;

      // Link should have text, aria-label, or an alt-texted image
      expect(text?.trim() || ariaLabel || imgAlt).toBeTruthy();
    }
  });

  test('no broken internal links', async ({ page }) => {
    // Navigates up to 5 separate pages in sequence, each a first-time dev
    // server compile in a cold Vite cache — the default 30s test timeout
    // doesn't leave enough headroom for that many.
    test.setTimeout(90000);

    await page.goto('/');
    
    const internalLinks = await page.locator('a[href^="/"], a[href^="./"]').all();

    // Resolve hrefs to plain strings before navigating anywhere — the
    // Locators above go stale once page.goto() below reloads the DOM, so
    // reading their attributes later (mid-loop) hangs waiting for elements
    // that no longer exist in the post-navigation page.
    const hrefs = (
      await Promise.all(internalLinks.map((link) => link.getAttribute('href')))
    ).filter((href): href is string => !!href && !href.includes('#'));

    // Test first 5 internal links
    for (const href of hrefs.slice(0, 5)) {
      const response = await page.goto(href);
      expect(response?.status()).toBeLessThan(400);
      await page.goBack();
    }
  });

  test('page language is set', async ({ page }) => {
    await page.goto('/');
    
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
    // eslint-disable-next-line security/detect-unsafe-regex -- BCP-47 lang tag; anchored & bounded
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
  });
});
