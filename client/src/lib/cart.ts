import type { Cart, CartItem } from '@/types/cart';

const CART_STORAGE_KEY = 'toa_shopping_cart';
const CART_EXPIRATION_DAYS = 7;
const CART_EXPIRATION_MS = CART_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Create an empty cart with expiration
 */
export function createEmptyCart(): Cart {
  const now = Date.now();
  return {
    items: [],
    createdAt: now,
    updatedAt: now,
    expiresAt: now + CART_EXPIRATION_MS,
  };
}

/**
 * Load cart from localStorage with expiration check
 */
export function loadCart(): Cart {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return createEmptyCart();
    }

    const cart: Cart = JSON.parse(stored);
    const now = Date.now();

    if (now >= cart.expiresAt) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return createEmptyCart();
    }

    return cart;
  } catch (error) {
    console.error('Error loading cart:', error);
    return createEmptyCart();
  }
}

/**
 * Save cart to localStorage
 */
export function saveCart(cart: Cart): void {
  try {
    cart.updatedAt = Date.now();
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

/**
 * Clear cart from localStorage
 */
export function clearCart(): void {
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
}

/**
 * Add item to cart or update quantity if already exists
 * Respects availableQuantity limits if specified
 */
export function addToCart(cart: Cart, item: Omit<CartItem, 'addedAt'>): Cart {
  const existingIndex = cart.items.findIndex(
    (i) => i.productId === item.productId && i.variantId === item.variantId
  );

  const updatedItems = [...cart.items];

  if (existingIndex >= 0) {
    // eslint-disable-next-line security/detect-object-injection
    const existing = updatedItems[existingIndex];
    if (existing) {
      let newQuantity = existing.quantity + item.quantity;
      
      // Respect available quantity limit if specified
      if (item.availableQuantity !== undefined && newQuantity > item.availableQuantity) {
        newQuantity = item.availableQuantity;
      }
      
      // eslint-disable-next-line security/detect-object-injection
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        price: item.price,
        inStock: item.inStock,
        availableQuantity: item.availableQuantity,
      };
    }
  } else {
    let quantity = item.quantity;
    
    // Respect available quantity limit if specified
    if (item.availableQuantity !== undefined && quantity > item.availableQuantity) {
      quantity = item.availableQuantity;
    }
    
    updatedItems.push({
      ...item,
      quantity,
      addedAt: Date.now(),
    });
  }

  return {
    ...cart,
    items: updatedItems,
  };
}

/**
 * Update cart item quantity
 * Respects availableQuantity limits if specified
 */
export function updateCartItemQuantity(
  cart: Cart,
  itemId: string,
  quantity: number
): Cart {
  if (quantity <= 0) {
    return removeFromCart(cart, itemId);
  }

  const updatedItems = cart.items.map((item) => {
    if (item.id === itemId) {
      let newQuantity = quantity;
      
      // Respect available quantity limit if specified
      if (item.availableQuantity !== undefined && newQuantity > item.availableQuantity) {
        newQuantity = item.availableQuantity;
      }
      
      return { ...item, quantity: newQuantity };
    }
    return item;
  });

  return {
    ...cart,
    items: updatedItems,
  };
}

/**
 * Remove item from cart
 */
export function removeFromCart(cart: Cart, itemId: string): Cart {
  return {
    ...cart,
    items: cart.items.filter((item) => item.id !== itemId),
  };
}

/**
 * Calculate cart totals
 */
export function calculateCartTotal(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
}

/**
 * Get total number of items (sum of quantities)
 */
export function getTotalItemCount(cart: Cart): number {
  return cart.items.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Check if cart is expired
 */
export function isCartExpired(cart: Cart): boolean {
  return Date.now() >= cart.expiresAt;
}

/**
 * Get days until cart expires
 */
export function getDaysUntilExpiration(cart: Cart): number {
  const msRemaining = cart.expiresAt - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}

/**
 * Validate cart items (check stock status)
 */
export function validateCartItems(cart: Cart): {
  valid: boolean;
  outOfStockItems: CartItem[];
  quantityExceededItems: Array<{ item: CartItem; requested: number; available: number }>;
} {
  const outOfStockItems = cart.items.filter((item) => !item.inStock);
  const quantityExceededItems = cart.items
    .filter((item) => {
      if (!item.availableQuantity) {
        return false; // No quantity limit specified
      }
      return item.quantity > item.availableQuantity;
    })
    .map((item) => ({
      item,
      requested: item.quantity,
      available: item.availableQuantity || 0,
    }));

  return {
    valid: outOfStockItems.length === 0 && quantityExceededItems.length === 0,
    outOfStockItems,
    quantityExceededItems,
  };
}
