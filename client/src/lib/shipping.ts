/**
 * Printful Shipping Constants
 * Based on Printful's flat-rate shipping model
 */

// Printful's standard flat rate shipping (US)
export const PRINTFUL_FLAT_RATE_SHIPPING = 4.39;

// Free shipping threshold (if applicable)
export const FREE_SHIPPING_THRESHOLD = 100;

export interface ShippingAddress {
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
}

export interface ShippingEstimate {
  shipping: number;
  tax: number;
  rates?: Array<{
    id: string;
    name: string;
    rate: string;
    currency: string;
    min_delivery_days: number;
    max_delivery_days: number;
  }>;
}

/**
 * Calculate shipping cost for multiple items using Printful API
 * This gives accurate shipping for the entire cart
 */
export async function calculateCartShipping(
  items: Array<{ variantId: string; quantity: number }>,
  recipient: ShippingAddress
): Promise<ShippingEstimate | null> {
  try {
    const response = await fetch('/api/printful/shipping-estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        recipient,
      }),
    });

    if (!response.ok) {
      console.error('Failed to calculate shipping:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return null;
  }
}

/**
 * Calculate shipping cost based on cart total (FALLBACK ONLY)
 * Printful uses flat-rate shipping, typically $4.39 for US
 * Some retailers offer free shipping above a threshold
 * 
 * NOTE: Use calculateCartShipping() instead for accurate multi-item shipping
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
