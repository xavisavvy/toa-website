import { test, expect } from '@playwright/test';

test.describe('Admin Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@talesofaneria.com');
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display analytics dashboard', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Analytics Dashboard');
    
    // Check key metrics cards are visible
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Avg Order Value')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Conversion Rate')).toBeVisible();
  });

  test('should display revenue chart', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    // Check for chart section
    await expect(page.locator('text=Revenue Trend')).toBeVisible();
    await expect(page.locator('text=Daily revenue and order count')).toBeVisible();
    
    // Chart should be rendered (Recharts uses SVG)
    const chart = page.locator('.recharts-responsive-container').first();
    await expect(chart).toBeVisible();
  });

  test('should allow time range selection', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    // Default should be 30 days
    const thirtyDayButton = page.locator('button:has-text("30 Days")');
    await expect(thirtyDayButton).toHaveClass(/bg-purple-600/);
    
    // Click 7 days
    await page.click('button:has-text("7 Days")');
    await expect(page.locator('button:has-text("7 Days")')).toHaveClass(/bg-purple-600/);
    
    // Click 90 days
    await page.click('button:has-text("90 Days")');
    await expect(page.locator('button:has-text("90 Days")')).toHaveClass(/bg-purple-600/);
  });

  test('should display top products chart', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    await expect(page.locator('text=Top Products')).toBeVisible();
    await expect(page.locator('text=Best sellers by revenue')).toBeVisible();
  });

  test('should display order status distribution', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    await expect(page.locator('text=Order Status Distribution')).toBeVisible();
    await expect(page.locator('text=Current order pipeline')).toBeVisible();
  });

  test('should display security events', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    await expect(page.locator('text=Security Events')).toBeVisible();
    await expect(page.locator('text=Failed Login Attempts')).toBeVisible();
    await expect(page.locator('text=Suspicious Activities')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept analytics API and return error
    await page.route('/api/admin/analytics*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/admin/analytics');
    
    // Should show error message
    await expect(page.locator('text=Error Loading Analytics')).toBeVisible();
    await expect(page.locator('text=Retry')).toBeVisible();
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Logout first
    await page.goto('/admin/dashboard');
    await page.click('button:has-text("Logout")');
    
    // Try to access analytics
    await page.goto('/admin/analytics');
    
    // Should redirect to login
    await expect(page).toHaveURL('/admin/login');
  });

  test('should have link from dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Should have Analytics button
    const analyticsButton = page.locator('button:has-text("Analytics")');
    await expect(analyticsButton).toBeVisible();
    
    // Click it
    await analyticsButton.click();
    await expect(page).toHaveURL('/admin/analytics');
  });

  test('should display correct metrics format', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    // Revenue should have $ sign
    const revenueCard = page.locator('text=Total Revenue').locator('..');
    await expect(revenueCard.locator('text=/\\$\\d+\\.\\d{2}/')).toBeVisible();
    
    // Conversion rate should have % sign
    const conversionCard = page.locator('text=Conversion Rate').locator('..');
    await expect(conversionCard.locator('text=/\\d+\\.\\d{2}%/')).toBeVisible();
  });
});
