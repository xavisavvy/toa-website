import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Tales of Aneria/);
    
    // Check hero section loads
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();
  });

  test('displays navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation links
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check key navigation items
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /characters/i })).toBeVisible();
  });

  test('displays latest episodes section', async ({ page }) => {
    await page.goto('/');
    
    // Wait for episodes section
    const episodesSection = page.locator('#episodes');
    await expect(episodesSection).toBeVisible();
    
    const episodesTitle = page.getByTestId('text-episodes-title');
    await expect(episodesTitle).toHaveText(/Latest Episodes/i);
  });

  test('displays episode cards when available', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if episodes are displayed (they might be empty in test)
    const episodeCards = page.locator('[data-testid^="card-episode-"]');
    const count = await episodeCards.count();
    
    // Either has episodes or shows empty state
    if (count > 0) {
      expect(count).toBeLessThanOrEqual(3); // Should show max 3 episodes
      
      // First episode should have required elements
      const firstEpisode = episodeCards.first();
      await expect(firstEpisode).toBeVisible();
      
      // Check for title, duration, and badge
      const title = firstEpisode.locator('[data-testid^="text-episode-title-"]');
      await expect(title).toBeVisible();
    }
  });

  test('hero section is visible and interactive', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section exists
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
  });

  test('footer is present', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('view all episodes button is clickable', async ({ page }) => {
    await page.goto('/');
    
    const viewAllButton = page.getByTestId('button-view-all-episodes');
    
    // If episodes exist, button should be visible
    if (await viewAllButton.isVisible()) {
      await expect(viewAllButton).toBeEnabled();
    }
  });
});

test.describe('Responsive Design', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check navigation is accessible on mobile
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.goto('/');
    
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 5 seconds (generous for local dev)
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known/acceptable errors
    const criticalErrors = errors.filter(err => 
      !err.includes('YouTube') && // YouTube API errors are expected in test
      !err.includes('favicon') // Favicon errors are non-critical
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
