import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

test.describe('Characters Page', () => {
  test('loads characters list', async ({ page }) => {
    await page.goto('/characters');
    
    // Check page title
    await expect(page).toHaveTitle(/Characters.*Tales of Aneria/);
    
    // Check heading
    const heading = page.locator('h1', { hasText: /characters/i });
    await expect(heading).toBeVisible();
  });

  test('displays character cards', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    // Check for character cards (data from characters.json)
    const characterCards = page.locator('[data-testid^="card-character-"]');
    const count = await characterCards.count();
    
    // Should have at least some characters
    expect(count).toBeGreaterThan(0);
  });

  test('character card contains required information', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    await expect(firstCard).toBeVisible();
    
    // Check for character name
    const name = firstCard.locator('[data-testid^="text-character-name-"]');
    await expect(name).toBeVisible();

    // Check for class (race + class, e.g. "Changeling Wizard")
    const charClass = firstCard.locator('[data-testid^="text-character-class-"]');
    await expect(charClass).toBeVisible();
  });

  test('character card is clickable', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    
    // Click should navigate to character detail
    await firstCard.click();
    
    // URL should change to character detail page
    await expect(page).toHaveURL(/\/characters\/.+/);
  });

  test('can filter or search characters', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    // Check if there's a search or filter functionality
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeEnabled();
    }
  });
});

test.describe('Character Detail Page', () => {
  test('loads character detail page', async ({ page }) => {
    // First go to characters page
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    // Click first character
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    await firstCard.click();
    
    // Wait for detail page to load
    await page.waitForLoadState('networkidle');
    
    // Check character name is displayed
    const characterName = page.locator('h1').first();
    await expect(characterName).toBeVisible();
  });

  test('displays character statistics', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Check for stat display (if implemented)
    const stats = page.locator('[data-testid^="text-character-stat-"]');
    
    if (await stats.first().isVisible()) {
      const count = await stats.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('has back navigation to characters list', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Look for back button or breadcrumb
    const backButton = page.locator('button', { hasText: /back/i }).or(
      page.locator('a[href="/characters"]')
    );
    
    if (await backButton.first().isVisible()) {
      await expect(backButton.first()).toBeEnabled();
    }
  });

  test('displays character image', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Check for character image
    const image = page.locator('img[alt*="character" i], img[alt*="portrait" i]').first();
    
    if (await image.isVisible()) {
      await expect(image).toBeVisible();
    }
  });

  test('shows D&D Beyond link if available', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Look for D&D Beyond button
    const dndButton = page.getByTestId('button-dndbeyond');
    
    if (await dndButton.isVisible()) {
      await expect(dndButton).toBeEnabled();
      await expect(dndButton).toHaveAttribute('href', /dndbeyond\.com/);
    }
  });

  test('shows character playlist if available', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid^="card-character-"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Look for playlist card
    const playlistCard = page.getByTestId('card-playlist');
    
    if (await playlistCard.isVisible()) {
      const playlistButton = page.getByTestId('button-playlist');
      await expect(playlistButton).toBeVisible();
    }
  });
});

test.describe('Phase 2 enhancements', () => {
  test('character page renders extended-lore sections only when populated', async ({
    page,
  }) => {
    // wayne-archivist has backstory + personality but no motivations/arcSummary in v1
    await page.goto('/characters/wayne-archivist');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('card-backstory')).toBeVisible();
    await expect(page.getByTestId('card-personality')).toBeVisible();
    await expect(page.getByTestId('card-motivations')).toHaveCount(0);
    await expect(page.getByTestId('card-arc-summary')).toHaveCount(0);
  });

  test('AI badge is visible and accessible on AI-generated character art', async ({
    page,
  }) => {
    await page.goto('/characters/winifred-fred-blodbane');
    await page.waitForLoadState('networkidle');

    // Page-level legend is visible because at least one image is AI-generated
    await expect(page.getByTestId('text-ai-legend')).toBeVisible();

    // The AI corner badge has the documented aria-label
    const aiBadge = page.getByLabel('AI-generated image').first();
    await expect(aiBadge).toBeVisible();

    // Axe pass on this URL
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['svg-img-alt'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('character page emits parseable Person JSON-LD when playerId resolves', async ({
    page,
  }) => {
    await page.goto('/characters/wayne-archivist');
    await page.waitForLoadState('networkidle');

    const ldScript = page.locator('script[type="application/ld+json"]').first();
    const text = (await ldScript.textContent()) ?? '{}';
    const parsed = JSON.parse(text);
    expect(Array.isArray(parsed['@graph'])).toBe(true);
    const graph = parsed['@graph'] as Array<{
      '@type': string;
      name?: string;
      description?: string;
    }>;
    const person = graph.find((n) => n['@type'] === 'Person');
    expect(person).toBeDefined();
    expect(person!.name).toBe('Preston Farr');
    expect(person!.description).toContain('Wayne');
    expect(person!.description).toContain('Tales of Aneria');

    // Orphan playerId path: holiday-special-1 emits the @graph WITHOUT a Person node
    await page.goto('/characters/holiday-special-1');
    await page.waitForLoadState('networkidle');
    const ldScript2 = page
      .locator('script[type="application/ld+json"]')
      .first();
    const text2 = (await ldScript2.textContent()) ?? '{}';
    const parsed2 = JSON.parse(text2);
    const graph2 = parsed2['@graph'] as Array<{ '@type': string }>;
    expect(graph2.find((n) => n['@type'] === 'Person')).toBeUndefined();
    expect(graph2.find((n) => n['@type'] === 'CreativeWork')).toBeDefined();
    expect(graph2.find((n) => n['@type'] === 'BreadcrumbList')).toBeDefined();
  });

  test('og:image meta uses character featuredImage when present, site default when empty', async ({
    page,
  }) => {
    await page.goto('/characters/wayne-archivist');
    await page.waitForLoadState('networkidle');

    const ogWayne = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(ogWayne).toMatch(/\/characters\/wayne-archivist\.webp$/);

    // eve-faraque has featuredImage: "" — should fall back to site default
    await page.goto('/characters/eve-faraque');
    await page.waitForLoadState('networkidle');
    const ogEve = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(ogEve).toBe('https://talesofaneria.com/og-image.png');
  });
});

test.describe('Character Page Navigation', () => {
  test('navigation between characters works', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    // Get all character cards
    const characterCards = page.locator('[data-testid^="card-character-"]');
    const count = await characterCards.count();
    
    if (count > 1) {
      // Click first character
      await characterCards.first().click();
      await page.waitForLoadState('networkidle');
      const firstURL = page.url();
      
      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Click second character
      await characterCards.nth(1).click();
      await page.waitForLoadState('networkidle');
      const secondURL = page.url();
      
      // URLs should be different
      expect(firstURL).not.toBe(secondURL);
    }
  });
});
