import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * 
 * These tests capture screenshots and compare them against baselines
 * to detect unintended visual changes in the UI.
 * 
 * Run: npm run test:visual
 * Update baselines: npm run test:visual:update
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to consistent size for screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Homepage Visual Tests', () => {
    test('homepage hero section matches baseline', async ({ page }) => {
      await page.goto('/');
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      
      // Wait for hero section
      const hero = page.locator('section').first();
      await expect(hero).toBeVisible();
      
      // Take screenshot and compare
      await expect(page).toHaveScreenshot('homepage-hero.png', {
        fullPage: false,
        maxDiffPixels: 100, // Allow minor differences
      });
    });

    test('homepage full page matches baseline', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Scroll to load lazy images
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, 0));
      
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01, // 1% difference allowed
      });
    });

    test('homepage mobile view matches baseline', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  });

  test.describe('Characters Page Visual Tests', () => {
    test('characters grid matches baseline', async ({ page }) => {
      await page.goto('/characters');
      await page.waitForLoadState('networkidle');
      
      // Wait for character cards to load
      await page.waitForSelector('[data-testid="character-card"]', { 
        state: 'visible',
        timeout: 10000 
      });
      
      await expect(page).toHaveScreenshot('characters-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.02, // Allow 2% for dynamic content
      });
    });

    test('character card hover state', async ({ page }) => {
      await page.goto('/characters');
      await page.waitForLoadState('networkidle');
      
      const firstCard = page.locator('[data-testid="character-card"]').first();
      await firstCard.waitFor({ state: 'visible' });
      
      // Hover over card
      await firstCard.hover();
      await page.waitForTimeout(500); // Wait for transition
      
      await expect(firstCard).toHaveScreenshot('character-card-hover.png', {
        maxDiffPixels: 50,
      });
    });
  });

  test.describe('Character Detail Visual Tests', () => {
    test('character detail page matches baseline', async ({ page }) => {
      await page.goto('/characters/1');
      await page.waitForLoadState('networkidle');
      
      // Wait for character data
      await page.waitForSelector('h1', { state: 'visible' });
      
      await expect(page).toHaveScreenshot('character-detail.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  });

  test.describe('Navigation Visual Tests', () => {
    test('header navigation matches baseline', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      
      await expect(header).toHaveScreenshot('header-nav.png', {
        maxDiffPixels: 50,
      });
    });

    test('mobile menu matches baseline', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Open mobile menu
      const menuButton = page.getByRole('button', { name: /menu/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500); // Wait for menu animation
        
        await expect(page).toHaveScreenshot('mobile-menu.png', {
          maxDiffPixels: 100,
        });
      }
    });
  });

  test.describe('Footer Visual Tests', () => {
    test('footer matches baseline', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible();
      
      await expect(footer).toHaveScreenshot('footer.png', {
        maxDiffPixels: 100,
      });
    });
  });

  test.describe('Responsive Design Tests', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'wide', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`homepage at ${viewport.name} resolution`, async ({ page }) => {
        await page.setViewportSize({ 
          width: viewport.width, 
          height: viewport.height 
        });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
          fullPage: false,
          maxDiffPixelRatio: 0.02,
        });
      });
    }
  });

  test.describe('Dark Mode Visual Tests', () => {
    test('homepage in dark mode', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Toggle dark mode if available
      const darkModeToggle = page.getByRole('button', { name: /dark mode|theme/i });
      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('homepage-dark.png', {
          fullPage: false,
          maxDiffPixelRatio: 0.02,
        });
      }
    });
  });

  test.describe('Interactive Component States', () => {
    test('button hover states', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const button = page.getByRole('button').first();
      if (await button.isVisible()) {
        await button.hover();
        await page.waitForTimeout(300);
        
        await expect(button).toHaveScreenshot('button-hover.png', {
          maxDiffPixels: 50,
        });
      }
    });

    test('link hover states', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const link = page.getByRole('link').first();
      await link.hover();
      await page.waitForTimeout(300);
      
      await expect(link).toHaveScreenshot('link-hover.png', {
        maxDiffPixels: 30,
      });
    });
  });

  test.describe('Loading States', () => {
    test('loading spinner appearance', async ({ page }) => {
      // Slow down network to capture loading state
      await page.route('**/*', route => {
        globalThis.setTimeout(() => route.continue(), 100);
      });
      
      const navigationPromise = page.goto('/characters');
      
      // Try to capture loading state
      await page.waitForTimeout(50);
      const loader = page.locator('[data-testid="loading"], .loading, .spinner');
      
      if (await loader.isVisible()) {
        await expect(loader).toHaveScreenshot('loading-spinner.png', {
          maxDiffPixels: 50,
        });
      }
      
      await navigationPromise;
    });
  });

  test.describe('Error States', () => {
    test('404 page matches baseline', async ({ page }) => {
      await page.goto('/this-page-does-not-exist');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('404-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  });
});
