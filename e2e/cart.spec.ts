import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should add item to cart from product modal', async ({ page }) => {
    await page.goto('/shop');

    // Wait for products to load
    await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

    // Click on first product
    const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
    await firstProduct.click();

    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click "Add to Cart" button
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    // Verify success feedback
    await expect(page.getByText(/added to cart/i)).toBeVisible({ timeout: 3000 });

    // Close modal
    await page.keyboard.press('Escape');

    // Verify cart badge shows 1 item
    const cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=1');
    await expect(cartBadge).toBeVisible();
  });

  test('should display cart items when clicking cart button', async ({ page }) => {
    await page.goto('/shop');

    // Add item to cart
    await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });
    const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
    await firstProduct.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');

    // Click cart button
    const cartButton = page.locator('[aria-label*="Shopping cart"]');
    await cartButton.click();

    // Verify cart panel opens
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible();

    // Verify item is in cart
    await expect(page.locator('[data-testid^="cart-item-"]')).toBeVisible();
  });

  test('should update item quantity in cart', async ({ page }) => {
    await page.goto('/shop');

    // Add item to cart
    await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });
    const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
    await firstProduct.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');

    // Open cart
    const cartButton = page.locator('[aria-label*="Shopping cart"]');
    await cartButton.click();

    // Click increase quantity button
    const increaseButton = page.getByRole('button', { name: /increase quantity/i });
    await increaseButton.click();

    // Verify quantity increased to 2
    await expect(page.locator('[data-testid^="cart-item-"]').getByText('2')).toBeVisible();

    // Verify cart badge shows 2 items
    await page.keyboard.press('Escape');
    const cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=2');
    await expect(cartBadge).toBeVisible();
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/shop');

    // Add item to cart
    await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });
    const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
    await firstProduct.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');

    // Open cart
    const cartButton = page.locator('[aria-label*="Shopping cart"]');
    await cartButton.click();

    // Click remove button
    const removeButton = page.getByRole('button', { name: /remove item/i }).first();
    await removeButton.click();

    // Verify "Your cart is empty" message
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();

    // Verify cart badge is gone
    await page.keyboard.press('Escape');
    const cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=1');
    await expect(cartBadge).not.toBeVisible();
  });

  test('should navigate to checkout page with items', async ({ page }) => {
    await page.goto('/shop');

    // Add item to cart
    await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });
    const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
    await firstProduct.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');

    // Open cart
    const cartButton = page.locator('[aria-label*="Shopping cart"]');
    await cartButton.click();

    // Click "Proceed to Checkout"
    const checkoutButton = page.getByRole('button', { name: /proceed to checkout/i });
    await checkoutButton.click();

    // Verify on checkout page
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();

    // Verify items are shown on checkout page
    await expect(page.getByRole('heading', { name: /order summary/i })).toBeVisible();
  });

  test('should persist cart across page reloads', async ({ page }) => {
    await page.goto('/shop');

    // Add item to cart
    await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });
    const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
    await firstProduct.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');

    // Verify cart badge shows 1
    let cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=1');
    await expect(cartBadge).toBeVisible();

    // Reload page
    await page.reload();

    // Verify cart badge still shows 1
    cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=1');
    await expect(cartBadge).toBeVisible();
  });

  test('should handle empty cart on checkout page', async ({ page }) => {
    await page.goto('/checkout');

    // Verify empty cart message
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /browse shop/i })).toBeVisible();
  });

  test('should add multiple different items to cart', async ({ page }) => {
    await page.goto('/shop');

    await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

    // Add first product
    const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
    await firstProduct.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /add to cart/i }).click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');

    // Add second product
    const secondProduct = page.locator('[data-testid^="card-printful-product-"]').nth(1);
    await secondProduct.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /add to cart/i }).click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');

    // Verify cart badge shows 2 items
    const cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=2');
    await expect(cartBadge).toBeVisible();

    // Open cart and verify 2 unique items
    const cartButton = page.locator('[aria-label*="Shopping cart"]');
    await cartButton.click();

    const cartItems = page.locator('[data-testid^="cart-item-"]');
    await expect(cartItems).toHaveCount(2);
  });
});
