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
      // eslint-disable-next-line security/detect-object-injection
      updatedItems[existingIndex] = {
        ...existing,
        quantity: existing.quantity + item.quantity,
        price: item.price,
        inStock: item.inStock,
      };
    }
  } else {
    updatedItems.push({
      ...item,
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
 */
export function updateCartItemQuantity(
  cart: Cart,
  itemId: string,
  quantity: number
): Cart {
  if (quantity <= 0) {
    return removeFromCart(cart, itemId);
  }

  const updatedItems = cart.items.map((item) =>
    item.id === itemId ? { ...item, quantity } : item
  );

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
} {
  const outOfStockItems = cart.items.filter((item) => !item.inStock);
  return {
    valid: outOfStockItems.length === 0,
    outOfStockItems,
  };
}
