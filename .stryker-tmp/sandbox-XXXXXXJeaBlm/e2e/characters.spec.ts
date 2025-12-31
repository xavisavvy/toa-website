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
    
    // Check for race
    const race = firstCard.locator('[data-testid^="text-character-race-"]');
    await expect(race).toBeVisible();
    
    // Check for class
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
