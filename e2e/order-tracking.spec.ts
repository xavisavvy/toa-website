import { test, expect } from '@playwright/test';

test.describe('Order Tracking E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock database and notification services for E2E tests
    await page.route('**/api/stripe/webhook', async (route) => {
      // Allow webhook to proceed for testing
      await route.continue();
    });
  });

  test('should track order after successful checkout', async ({ page }) => {
    // This test verifies the order tracking integration
    // In production, this would be triggered by Stripe webhooks
    
    test.skip(true, 'Requires production Stripe integration - manual testing only');
    
    // Navigate to shop
    await page.goto('/shop');
    await expect(page).toHaveTitle(/Tales of Aneria/);

    // Select a product (assuming products are loaded)
    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible()) {
      await productCard.click();
    }
  });

  test('should display order confirmation information', async ({ page }) => {
    // Navigate to success page
    await page.goto('/checkout/success?session_id=test_session_123');

    // Verify success message is displayed
    await expect(page.locator('h1')).toContainText(/Thank you|Success|Order Confirmed/i);
  });

  test('should handle payment cancellation gracefully', async ({ page }) => {
    // Navigate to cancel page
    await page.goto('/checkout/cancel');

    // Verify page loads successfully (may redirect to home)
    await expect(page).toHaveTitle(/Tales of Aneria/);
  });

  test('should validate success page has order details section', async ({ page }) => {
    await page.goto('/checkout/success?session_id=test_session_123');

    // Check for common success page elements
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    
    // Should have some call-to-action or next steps
    const buttons = page.locator('button, a.btn, a[href*="/"]');
    await expect(buttons.first()).toBeVisible();
  });

  test('should have proper meta tags on success page', async ({ page }) => {
    await page.goto('/checkout/success?session_id=test_session_123');

    // Verify page title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Check for robots meta tag (should allow indexing of success page)
    const metaRobots = page.locator('meta[name="robots"]');
    if (await metaRobots.count() > 0) {
      const content = await metaRobots.getAttribute('content');
      expect(content).toBeTruthy();
    }
  });

  test('should handle missing session gracefully on success page', async ({ page }) => {
    await page.goto('/checkout/success');

    // Page loads successfully (may show generic message or redirect)
    await expect(page).toHaveTitle(/Tales of Aneria/);
  });

  test('should be accessible on success page', async ({ page }) => {
    await page.goto('/checkout/success?session_id=test_session_123');

    // Check heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(1); // Should only have one h1
  });

  test('should be accessible on cancel page', async ({ page }) => {
    await page.goto('/checkout/cancel');

    // Check heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(1);

    // Check for proper button labeling
    const buttons = page.locator('button, a[role="button"]');
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Button should have either visible text or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('should have working navigation from success page', async ({ page }) => {
    await page.goto('/checkout/success?session_id=test_session_123');

    // Look for navigation back to home or shop
    const navLinks = page.locator('a[href="/"], a[href="/shop"], a[href*="home"]');
    const linkCount = await navLinks.count();
    
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should have working navigation from cancel page', async ({ page }) => {
    await page.goto('/checkout/cancel');

    // Should have link back to shop or try again
    const tryAgainLink = page.locator('a[href*="/shop"], a[href*="/checkout"]');
    const linkCount = await tryAgainLink.count();
    
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should render success page without critical errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/checkout/success?session_id=test_session_123');
    await page.waitForLoadState('networkidle');

    // Filter out expected/non-critical errors
    const criticalErrors = consoleErrors.filter(
      (error) => 
        !error.includes('favicon') && 
        !error.includes('chunk') &&
        !error.includes('404') &&
        !error.includes('Failed to fetch session') && // Expected - test session doesn't exist
        !error.includes('Bad Request') // Expected - test session
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should render cancel page without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/checkout/cancel');
    await page.waitForLoadState('networkidle');

    const criticalErrors = consoleErrors.filter(
      (error) => 
        !error.includes('favicon') && 
        !error.includes('chunk') &&
        !error.includes('404')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have proper responsive design on success page', async ({ page }) => {
    await page.goto('/checkout/success?session_id=test_session_123');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const content = page.locator('main, [role="main"], body > div').first();
    await expect(content).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(content).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await expect(content).toBeVisible();
  });

  test('should have proper responsive design on cancel page', async ({ page }) => {
    await page.goto('/checkout/cancel');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const content = page.locator('main, [role="main"], body > div').first();
    await expect(content).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await expect(content).toBeVisible();
  });

  test('should handle missing session gracefully on success page', async ({ page }) => {
    await page.goto('/checkout/success');

    // Page loads successfully (may show generic message or redirect)
    await expect(page).toHaveTitle(/Tales of Aneria/);
  });

  test('should preserve session_id in URL on page load', async ({ page }) => {
    const sessionId = 'test_session_abc123';
    await page.goto(`/checkout/success?session_id=${sessionId}`);
    
    // Verify URL contains session_id
    expect(page.url()).toContain(sessionId);
  });
});

test.describe('Order Tracking - Database Integration', () => {
  test('database schema should support order tracking', async () => {
    // This is a meta-test to ensure schema exists
    // In production, this would verify database tables exist
    
    test.skip(true, 'Requires database connection - run during deployment');
    
    // Would verify:
    // - orders table exists
    // - order_items table exists  
    // - order_events table exists
    // - All indexes are created
  });
});

test.describe('Order Tracking - Email Notifications', () => {
  test('email templates should be well-formed', async () => {
    // This would test email template generation
    // For now, we verify the notification service exists
    
    test.skip(true, 'Requires email service integration');
    
    // Would verify:
    // - Order confirmation emails are sent
    // - Admin alerts are sent on failures
    // - Payment failure notifications are sent
  });
});
