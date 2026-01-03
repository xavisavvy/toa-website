import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createEmptyCart,
  loadCart,
  saveCart,
  clearCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  calculateCartTotal,
  getTotalItemCount,
  isCartExpired,
  getDaysUntilExpiration,
  validateCartItems,
} from '@/lib/cart';
import type { Cart, CartItem } from '@/types/cart';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => {
      // eslint-disable-next-line security/detect-object-injection
      const value = store[key];
      return value || null;
    },
    setItem: (key: string, value: string) => {
      // eslint-disable-next-line security/detect-object-injection
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      const keys = Object.keys(store);
      const filteredStore: Record<string, string> = {};
      keys.forEach((k) => {
        // eslint-disable-next-line security/detect-object-injection
        const val = store[k];
        if (k !== key && val) {
          // eslint-disable-next-line security/detect-object-injection
          filteredStore[k] = val;
        }
      });
      store = filteredStore;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Cart Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('createEmptyCart', () => {
    it('should create a cart with empty items and proper timestamps', () => {
      const cart = createEmptyCart();

      expect(cart.items).toEqual([]);
      expect(cart.createdAt).toBeTypeOf('number');
      expect(cart.updatedAt).toBeTypeOf('number');
      expect(cart.expiresAt).toBeGreaterThan(cart.createdAt);
    });

    it('should set expiration to 7 days in the future', () => {
      const cart = createEmptyCart();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const expectedExpiration = cart.createdAt + sevenDaysMs;

      expect(cart.expiresAt).toBe(expectedExpiration);
    });
  });

  describe('loadCart and saveCart', () => {
    it('should return empty cart when localStorage is empty', () => {
      const cart = loadCart();

      expect(cart.items).toEqual([]);
      expect(cart.createdAt).toBeTypeOf('number');
    });

    it('should save and load cart from localStorage', () => {
      const cart = createEmptyCart();
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 2,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };
      
      cart.items.push(item);
      saveCart(cart);

      const loadedCart = loadCart();
      expect(loadedCart.items).toHaveLength(1);
      expect(loadedCart.items[0]?.productName).toBe('Test Product');
    });

    it('should return empty cart if stored cart is expired', () => {
      const expiredCart: Cart = {
        items: [],
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // Expired 3 days ago
      };

      window.localStorage.setItem('toa_shopping_cart', JSON.stringify(expiredCart));

      const cart = loadCart();
      expect(cart.items).toEqual([]);
      expect(window.localStorage.getItem('toa_shopping_cart')).toBeNull();
    });
  });

  describe('clearCart', () => {
    it('should remove cart from localStorage', () => {
      const cart = createEmptyCart();
      saveCart(cart);
      expect(window.localStorage.getItem('toa_shopping_cart')).not.toBeNull();

      clearCart();
      expect(window.localStorage.getItem('toa_shopping_cart')).toBeNull();
    });
  });

  describe('addToCart', () => {
    it('should add new item to empty cart', () => {
      const cart = createEmptyCart();
      const item: Omit<CartItem, 'addedAt'> = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
      };

      const updatedCart = addToCart(cart, item);

      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0].productName).toBe('Test Product');
      expect(updatedCart.items[0].addedAt).toBeTypeOf('number');
    });

    it('should increase quantity if item already exists', () => {
      const cart = createEmptyCart();
      const item: Omit<CartItem, 'addedAt'> = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 2,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
      };

      let updatedCart = addToCart(cart, item);
      updatedCart = addToCart(updatedCart, { ...item, quantity: 3 });

      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0].quantity).toBe(5);
    });

    it('should update price and stock status when adding existing item', () => {
      const cart = createEmptyCart();
      const item: Omit<CartItem, 'addedAt'> = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
      };

      let updatedCart = addToCart(cart, item);
      updatedCart = addToCart(updatedCart, { ...item, price: 24.99, inStock: false });

      expect(updatedCart.items[0].price).toBe(24.99);
      expect(updatedCart.items[0].inStock).toBe(false);
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update item quantity', () => {
      const cart = createEmptyCart();
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 2,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };
      
      cart.items.push(item);
      const updatedCart = updateCartItemQuantity(cart, '1', 5);

      expect(updatedCart.items[0].quantity).toBe(5);
    });

    it('should remove item if quantity is 0 or less', () => {
      const cart = createEmptyCart();
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 2,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };
      
      cart.items.push(item);
      const updatedCart = updateCartItemQuantity(cart, '1', 0);

      expect(updatedCart.items).toHaveLength(0);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', () => {
      const cart = createEmptyCart();
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 2,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };
      
      cart.items.push(item);
      const updatedCart = removeFromCart(cart, '1');

      expect(updatedCart.items).toHaveLength(0);
    });

    it('should not affect other items', () => {
      const cart = createEmptyCart();
      const item1: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product 1',
        variantName: 'Size L',
        price: 29.99,
        quantity: 2,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };
      const item2: CartItem = {
        id: '2',
        productId: 'prod-2',
        variantId: 'var-2',
        productName: 'Test Product 2',
        variantName: 'Size M',
        price: 19.99,
        quantity: 1,
        imageUrl: 'https://example.com/image2.jpg',
        inStock: true,
        addedAt: Date.now(),
      };
      
      cart.items.push(item1, item2);
      const updatedCart = removeFromCart(cart, '1');

      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0].id).toBe('2');
    });
  });

  describe('calculateCartTotal', () => {
    it('should return 0 for empty cart', () => {
      const cart = createEmptyCart();
      expect(calculateCartTotal(cart)).toBe(0);
    });

    it('should calculate total correctly', () => {
      const cart = createEmptyCart();
      cart.items = [
        {
          id: '1',
          productId: 'prod-1',
          variantId: 'var-1',
          productName: 'Product 1',
          variantName: 'Variant 1',
          price: 29.99,
          quantity: 2,
          imageUrl: '',
          inStock: true,
          addedAt: Date.now(),
        },
        {
          id: '2',
          productId: 'prod-2',
          variantId: 'var-2',
          productName: 'Product 2',
          variantName: 'Variant 2',
          price: 19.99,
          quantity: 1,
          imageUrl: '',
          inStock: true,
          addedAt: Date.now(),
        },
      ];

      const total = calculateCartTotal(cart);
      expect(total).toBeCloseTo(79.97, 2);
    });
  });

  describe('getTotalItemCount', () => {
    it('should return 0 for empty cart', () => {
      const cart = createEmptyCart();
      expect(getTotalItemCount(cart)).toBe(0);
    });

    it('should sum all item quantities', () => {
      const cart = createEmptyCart();
      cart.items = [
        {
          id: '1',
          productId: 'prod-1',
          variantId: 'var-1',
          productName: 'Product 1',
          variantName: 'Variant 1',
          price: 29.99,
          quantity: 2,
          imageUrl: '',
          inStock: true,
          addedAt: Date.now(),
        },
        {
          id: '2',
          productId: 'prod-2',
          variantId: 'var-2',
          productName: 'Product 2',
          variantName: 'Variant 2',
          price: 19.99,
          quantity: 3,
          imageUrl: '',
          inStock: true,
          addedAt: Date.now(),
        },
      ];

      expect(getTotalItemCount(cart)).toBe(5);
    });
  });

  describe('isCartExpired', () => {
    it('should return false for non-expired cart', () => {
      const cart = createEmptyCart();
      expect(isCartExpired(cart)).toBe(false);
    });

    it('should return true for expired cart', () => {
      const cart: Cart = {
        items: [],
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      expect(isCartExpired(cart)).toBe(true);
    });
  });

  describe('getDaysUntilExpiration', () => {
    it('should return approximately 7 days for new cart', () => {
      const cart = createEmptyCart();
      const days = getDaysUntilExpiration(cart);

      expect(days).toBeGreaterThanOrEqual(6);
      expect(days).toBeLessThanOrEqual(7);
    });

    it('should return 0 for expired cart', () => {
      const cart: Cart = {
        items: [],
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 1000,
      };

      expect(getDaysUntilExpiration(cart)).toBe(0);
    });
  });

  describe('validateCartItems', () => {
    it('should return valid for cart with all in-stock items', () => {
      const cart = createEmptyCart();
      cart.items = [
        {
          id: '1',
          productId: 'prod-1',
          variantId: 'var-1',
          productName: 'Product 1',
          variantName: 'Variant 1',
          price: 29.99,
          quantity: 2,
          imageUrl: '',
          inStock: true,
          addedAt: Date.now(),
        },
      ];

      const validation = validateCartItems(cart);
      expect(validation.valid).toBe(true);
      expect(validation.outOfStockItems).toHaveLength(0);
    });

    it('should return invalid for cart with out-of-stock items', () => {
      const cart = createEmptyCart();
      const outOfStockItem: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Product 1',
        variantName: 'Variant 1',
        price: 29.99,
        quantity: 2,
        imageUrl: '',
        inStock: false,
        addedAt: Date.now(),
      };
      cart.items = [outOfStockItem];

      const validation = validateCartItems(cart);
      expect(validation.valid).toBe(false);
      expect(validation.outOfStockItems).toHaveLength(1);
      expect(validation.outOfStockItems[0]).toEqual(outOfStockItem);
    });

    it('should identify multiple out-of-stock items', () => {
      const cart = createEmptyCart();
      cart.items = [
        {
          id: '1',
          productId: 'prod-1',
          variantId: 'var-1',
          productName: 'Product 1',
          variantName: 'Variant 1',
          price: 29.99,
          quantity: 2,
          imageUrl: '',
          inStock: false,
          addedAt: Date.now(),
        },
        {
          id: '2',
          productId: 'prod-2',
          variantId: 'var-2',
          productName: 'Product 2',
          variantName: 'Variant 2',
          price: 19.99,
          quantity: 1,
          imageUrl: '',
          inStock: true,
          addedAt: Date.now(),
        },
        {
          id: '3',
          productId: 'prod-3',
          variantId: 'var-3',
          productName: 'Product 3',
          variantName: 'Variant 3',
          price: 39.99,
          quantity: 1,
          imageUrl: '',
          inStock: false,
          addedAt: Date.now(),
        },
      ];

      const validation = validateCartItems(cart);
      expect(validation.valid).toBe(false);
      expect(validation.outOfStockItems).toHaveLength(2);
    });
  });
});
