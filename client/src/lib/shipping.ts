/**
 * Printful Shipping Constants
 * Based on Printful's flat-rate shipping model
 */

// Printful's standard flat rate shipping (US)
export const PRINTFUL_FLAT_RATE_SHIPPING = 4.39;

// Free shipping threshold (if applicable)
export const FREE_SHIPPING_THRESHOLD = 100;

/**
 * Calculate shipping cost based on cart total
 * Printful uses flat-rate shipping, typically $4.39 for US
 * Some retailers offer free shipping above a threshold
 */
export function calculateShipping(subtotal: number, freeShippingThreshold = FREE_SHIPPING_THRESHOLD): number {
  if (subtotal >= freeShippingThreshold) {
    return 0;
  }
  return PRINTFUL_FLAT_RATE_SHIPPING;
}

/**
 * Calculate estimated tax (placeholder - actual tax calculated by Stripe/Printful)
 * This is just for display purposes
 */
export function calculateEstimatedTax(subtotal: number, taxRate = 0.0): number {
  return subtotal * taxRate;
}

/**
 * Calculate order total including shipping and tax
 */
export function calculateOrderTotal(
  subtotal: number,
  shipping?: number,
  tax?: number
): number {
  const shippingCost = shipping ?? calculateShipping(subtotal);
  const taxCost = tax ?? 0;
  return subtotal + shippingCost + taxCost;
}
