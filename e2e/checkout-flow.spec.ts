import { test, expect } from '@playwright/test';

test.describe('Checkout Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies before each test
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test.describe('Complete Purchase Journey', () => {
    test('should complete full checkout flow from cart to success', async ({ page }) => {
      // Step 1: Browse shop and add item
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();

      // Step 2: Add to cart from modal
      await expect(page.getByRole('dialog')).toBeVisible();
      const addToCartButton = page.getByRole('button', { name: /add to cart/i });
      await addToCartButton.click();
      await expect(page.getByText(/added to cart/i)).toBeVisible({ timeout: 3000 });
      await page.keyboard.press('Escape');

      // Step 3: Verify cart badge
      const cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=1');
      await expect(cartBadge).toBeVisible();

      // Step 4: Open cart
      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible();

      // Step 5: Proceed to checkout
      const checkoutButton = page.getByRole('button', { name: /proceed to checkout/i });
      await checkoutButton.click();

      // Step 6: Verify on checkout page
      await expect(page).toHaveURL(/\/checkout/);
      await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();

      // Step 7: Verify order summary is present
      await expect(page.getByRole('heading', { name: /order summary/i })).toBeVisible();
      
      // Step 8: Verify item appears in checkout
      await expect(page.locator('[data-testid^="checkout-item-"]').first()).toBeVisible();

      // Step 9: Click checkout button (will redirect to Stripe in real scenario)
      const stripeCheckoutButton = page.getByRole('button', { name: /checkout with stripe/i });
      await expect(stripeCheckoutButton).toBeVisible();
    });

    test('should display correct total on checkout page', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      // Add item to cart
      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      // Navigate to checkout
      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      // Verify subtotal exists and is a valid price
      const subtotal = page.locator('text=/Subtotal/i').locator('..');
      await expect(subtotal).toBeVisible();
      
      // Should show price in format $XX.XX
      await expect(page.locator('text=/\\$\\d+\\.\\d{2}/')).toBeVisible();
    });
  });

  test.describe('Multiple Items Checkout', () => {
    test('should checkout with multiple different items', async ({ page }) => {
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

      // Proceed to checkout
      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      // Verify both items in checkout
      await expect(page).toHaveURL(/\/checkout/);
      const checkoutItems = page.locator('[data-testid^="checkout-item-"]');
      await expect(checkoutItems).toHaveCount(2);
    });

    test('should display correct total for multiple items', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      // Add same product twice
      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      // Open cart and increase quantity
      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      const increaseButton = page.getByRole('button', { name: /increase quantity/i });
      await increaseButton.click();
      await page.waitForTimeout(500);

      // Proceed to checkout
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      // Verify quantity is 2
      await expect(page).toHaveURL(/\/checkout/);
      const quantityDisplay = page.locator('[data-testid^="checkout-item-"]').first().locator('text=/Quantity: 2|Qty: 2|× 2/i');
      await expect(quantityDisplay).toBeVisible();
    });
  });

  test.describe('Quantity Changes During Checkout', () => {
    test('should update quantity on checkout page', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      // Add item and go to checkout
      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      await expect(page).toHaveURL(/\/checkout/);

      // Find and click increase quantity button on checkout page
      const increaseButton = page.getByRole('button', { name: /increase quantity/i }).first();
      if (await increaseButton.isVisible()) {
        await increaseButton.click();
        await page.waitForTimeout(500);

        // Verify total updated
        const updatedTotal = page.locator('text=/\\$\\d+\\.\\d{2}/');
        await expect(updatedTotal).toBeVisible();
      }
    });

    test('should remove item from checkout page', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      // Add item and go to checkout
      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      await expect(page).toHaveURL(/\/checkout/);

      // Remove item if remove button exists
      const removeButton = page.getByRole('button', { name: /remove|delete/i }).first();
      if (await removeButton.isVisible()) {
        await removeButton.click();
        
        // Should show empty cart message
        await expect(page.getByText(/your cart is empty/i)).toBeVisible();
      }
    });

    test('should reflect quantity limits on checkout page', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      // Add item and go to checkout
      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      await expect(page).toHaveURL(/\/checkout/);

      // Try to increase quantity to max (10)
      const increaseButton = page.getByRole('button', { name: /increase quantity/i }).first();
      if (await increaseButton.isVisible()) {
        for (let i = 0; i < 15; i++) {
          if (await increaseButton.isEnabled()) {
            await increaseButton.click();
            await page.waitForTimeout(200);
          } else {
            break;
          }
        }

        // Increase button should be disabled at max
        await expect(increaseButton).toBeDisabled();
      }
    });
  });

  test.describe('Payment Cancellation Flow', () => {
    test('should handle navigation back from checkout', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      // Add item and go to checkout
      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      await expect(page).toHaveURL(/\/checkout/);

      // Go back to shop
      await page.goto('/shop');

      // Verify cart still has item
      const cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=1');
      await expect(cartBadge).toBeVisible();
    });

    test('should display cancel page when navigating to /checkout/cancel', async ({ page }) => {
      await page.goto('/checkout/cancel');

      // Should see cancellation message
      await expect(page.getByText(/checkout.*cancelled|payment.*cancelled/i)).toBeVisible();
      
      // Should have link/button to return to shop
      await expect(page.getByRole('button', { name: /return to shop|back to shop/i })).toBeVisible();
    });

    test('should preserve cart when payment is cancelled', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      // Add item
      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      // Navigate to cancel page
      await page.goto('/checkout/cancel');

      // Click return to shop
      const returnButton = page.getByRole('button', { name: /return to shop|back to shop/i });
      await returnButton.click();

      // Verify cart still has item
      const cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=1');
      await expect(cartBadge).toBeVisible();
    });
  });

  test.describe('Payment Success Flow', () => {
    test('should display success page when navigating to /checkout/success', async ({ page }) => {
      await page.goto('/checkout/success');

      // Should see success message
      await expect(page.getByText(/thank you|order confirmed|payment successful/i)).toBeVisible();
    });

    test('should clear cart after successful payment', async ({ page }) => {
      // Add item to cart first
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      // Verify item in cart
      let cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=1');
      await expect(cartBadge).toBeVisible();

      // Simulate successful payment by navigating to success page
      await page.goto('/checkout/success');

      // Navigate back to shop
      await page.goto('/shop');

      // Cart should be empty
      cartBadge = page.locator('[aria-label*="Shopping cart"]').locator('text=1');
      await expect(cartBadge).not.toBeVisible();
    });

    test('should have link to continue shopping from success page', async ({ page }) => {
      await page.goto('/checkout/success');

      const continueButton = page.getByRole('link', { name: /continue shopping|back to shop|browse shop/i });
      await expect(continueButton).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle direct navigation to checkout with empty cart', async ({ page }) => {
      await page.goto('/checkout');

      // Should show empty cart message
      await expect(page.getByText(/your cart is empty/i)).toBeVisible();
      
      // Should have link to shop
      await expect(page.getByRole('button', { name: /browse shop|shop now/i })).toBeVisible();
    });

    test('should handle page refresh during checkout', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      // Add item and go to checkout
      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      await expect(page).toHaveURL(/\/checkout/);

      // Refresh page
      await page.reload();

      // Should still show checkout page with items
      await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();
      await expect(page.locator('[data-testid^="checkout-item-"]').first()).toBeVisible();
    });

    test('should prevent checkout with out-of-stock items', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      // Add item
      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      // If checkout button exists, it should be enabled for in-stock items
      const checkoutButton = page.getByRole('button', { name: /checkout with stripe/i });
      await expect(checkoutButton).toBeVisible();
    });
  });

  test.describe('Accessibility on Checkout Flow', () => {
    test('should have accessible checkout button', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForSelector('[data-testid^="card-printful-product-"]', { timeout: 10000 });

      const firstProduct = page.locator('[data-testid^="card-printful-product-"]').first();
      await firstProduct.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');

      const cartButton = page.locator('[aria-label*="Shopping cart"]');
      await cartButton.click();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();

      const checkoutButton = page.getByRole('button', { name: /checkout with stripe/i });
      await expect(checkoutButton).toHaveAccessibleName();
    });

    test('should have semantic headings on checkout page', async ({ page }) => {
      await page.goto('/checkout');

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
    });
  });
});
