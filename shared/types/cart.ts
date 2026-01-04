import { z } from 'zod';

/**
 * Cart Item Schema with validation
 */
export const CartItemSchema = z.object({
  id: z.string().min(1, 'Cart item ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  variantName: z.string().min(1, 'Variant name is required'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be a positive integer').max(10, 'Maximum quantity is 10'),
  imageUrl: z.string().url('Invalid image URL'),
  inStock: z.boolean(),
  addedAt: z.number().positive('Invalid timestamp'),
  availableQuantity: z.number().int().positive().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

/**
 * Cart Schema with validation
 */
export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  createdAt: z.number().positive('Invalid created timestamp'),
  updatedAt: z.number().positive('Invalid updated timestamp'),
  expiresAt: z.number().positive('Invalid expiration timestamp'),
});

export type Cart = z.infer<typeof CartSchema>;

/**
 * Cart Summary Schema
 */
export const CartSummarySchema = z.object({
  itemCount: z.number().int().nonnegative(),
  totalItems: z.number().int().nonnegative(),
  subtotal: z.number().nonnegative(),
});

export type CartSummary = z.infer<typeof CartSummarySchema>;

/**
 * Shipping Rate Schema
 */
export const ShippingRateSchema = z.object({
  id: z.string(),
  name: z.string(),
  rate: z.union([z.string(), z.number()]),
  minDays: z.number().int().nonnegative(),
  maxDays: z.number().int().nonnegative(),
});

/**
 * Shipping Estimate Schema
 */
export const ShippingEstimateSchema = z.object({
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
  rates: z.array(ShippingRateSchema).optional(),
  freeShippingApplied: z.boolean().optional(),
});

export type ShippingEstimate = z.infer<typeof ShippingEstimateSchema>;

/**
 * Add to Cart Request Schema
 */
export const AddToCartRequestSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(10),
});

export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;

/**
 * Update Cart Item Request Schema
 */
export const UpdateCartItemRequestSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().nonnegative().max(10),
});

export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemRequestSchema>;

/**
 * Validation helper functions
 */
export function validateCartItem(data: unknown): CartItem {
  return CartItemSchema.parse(data);
}

export function validateCart(data: unknown): Cart {
  return CartSchema.parse(data);
}

export function validateCartSummary(data: unknown): CartSummary {
  return CartSummarySchema.parse(data);
}

export function safeValidateCartItem(data: unknown): { success: true; data: CartItem } | { success: false; error: z.ZodError } {
  const result = CartItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function safeValidateCart(data: unknown): { success: true; data: Cart } | { success: false; error: z.ZodError } {
  const result = CartSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
