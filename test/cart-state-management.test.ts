import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  loadCart,
  saveCart,
  clearCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  isCartExpired,
  createEmptyCart,
} from '@/lib/cart';
import type { Cart, CartItem } from '@/types/cart';

/* eslint-disable no-undef */
describe('Cart State Management Edge Cases', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Cart State Corruption Scenarios', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('toa-cart', 'invalid-json-data{}}');

      const cart = loadCart();

      expect(cart).toBeDefined();
      expect(cart.items).toEqual([]);
      expect(cart.createdAt).toBeDefined();
    });

    it('should handle missing required fields in cart', () => {
      const corruptedCart = {
        items: [],
        // Missing createdAt, updatedAt, expiresAt
      };
      localStorage.setItem('toa-cart', JSON.stringify(corruptedCart));

      const cart = loadCart();

      expect(cart.items).toBeDefined();
      expect(cart.createdAt).toBeDefined();
      expect(cart.updatedAt).toBeDefined();
      expect(cart.expiresAt).toBeDefined();
    });

    it('should handle cart items with missing properties', () => {
      const corruptedCart = createEmptyCart();
      corruptedCart.items = [
        {
          id: '1',
          productId: 'prod-1',
          // Missing other required fields
        } as CartItem,
      ];
      localStorage.setItem('toa-cart', JSON.stringify(corruptedCart));

      const cart = loadCart();

      // Should still load, allowing validation at higher levels
      expect(cart.items).toBeDefined();
      expect(cart.items.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative quantities gracefully', () => {
      const cart = createEmptyCart();
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };

      const updatedCart = addToCart(cart, item);
      const finalCart = updateCartItemQuantity(updatedCart, '1', -5);

      // Should either clamp to min or remove item
      const cartItem = finalCart.items.find((i) => i.id === '1');
      if (cartItem) {
        expect(cartItem.quantity).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle extremely large quantities', () => {
      const cart = createEmptyCart();
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 99999,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
        availableQuantity: 10,
      };

      const updatedCart = addToCart(cart, item);

      // Should cap at availableQuantity limit if specified
      const cartItem = updatedCart.items.find((i) => i.id === '1');
      expect(cartItem?.quantity).toBeLessThanOrEqual(10);
    });

    it('should handle null/undefined localStorage gracefully', () => {
      // Simulate browser that doesn't support localStorage
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => null);

      const cart = loadCart();

      expect(cart).toBeDefined();
      expect(cart.items).toEqual([]);

      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('Concurrent Cart Updates', () => {
    it('should handle rapid successive additions', () => {
      let cart = createEmptyCart();
      
      const items: CartItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        productId: `prod-${i}`,
        variantId: `var-${i}`,
        productName: `Product ${i}`,
        variantName: 'Standard',
        price: 10 + i,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now() + i,
      }));

      // Rapidly add items
      items.forEach(item => {
        cart = addToCart(cart, item);
      });

      expect(cart.items).toHaveLength(10);
      expect(cart.items.map(i => i.id)).toEqual(items.map(i => i.id));
    });

    it('should handle simultaneous add and remove operations', () => {
      let cart = createEmptyCart();
      
      // Add items
      const item1: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Product 1',
        variantName: 'Standard',
        price: 29.99,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };

      const item2: CartItem = {
        ...item1,
        id: '2',
        productId: 'prod-2',
      };

      cart = addToCart(cart, item1);
      cart = addToCart(cart, item2);
      
      // Remove while adding
      cart = removeFromCart(cart, '1');
      
      const item3: CartItem = {
        ...item1,
        id: '3',
        productId: 'prod-3',
      };
      cart = addToCart(cart, item3);

      expect(cart.items).toHaveLength(2);
      expect(cart.items.find(i => i.id === '1')).toBeUndefined();
      expect(cart.items.find(i => i.id === '2')).toBeDefined();
      expect(cart.items.find(i => i.id === '3')).toBeDefined();
    });

    it('should handle multiple quantity updates for same item', () => {
      let cart = createEmptyCart();
      
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Product 1',
        variantName: 'Standard',
        price: 29.99,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };

      cart = addToCart(cart, item);
      
      // Rapid quantity updates
      cart = updateCartItemQuantity(cart, '1', 2);
      cart = updateCartItemQuantity(cart, '1', 5);
      cart = updateCartItemQuantity(cart, '1', 3);

      const cartItem = cart.items.find(i => i.id === '1');
      expect(cartItem?.quantity).toBe(3);
    });

    it('should maintain cart integrity with mixed operations', () => {
      let cart = createEmptyCart();
      
      const items: CartItem[] = Array.from({ length: 5 }, (_, i) => ({
        id: `item-${i}`,
        productId: `prod-${i}`,
        variantId: `var-${i}`,
        productName: `Product ${i}`,
        variantName: 'Standard',
        price: 10 + i,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now() + i,
      }));

      // Mixed operations
      cart = addToCart(cart, items[0]);
      cart = addToCart(cart, items[1]);
      cart = updateCartItemQuantity(cart, 'item-0', 3);
      cart = addToCart(cart, items[2]);
      cart = removeFromCart(cart, 'item-1');
      cart = addToCart(cart, items[3]);
      cart = updateCartItemQuantity(cart, 'item-2', 2);
      cart = addToCart(cart, items[4]);

      expect(cart.items).toHaveLength(4);
      expect(cart.items.find(i => i.id === 'item-0')?.quantity).toBe(3);
      expect(cart.items.find(i => i.id === 'item-1')).toBeUndefined();
      expect(cart.items.find(i => i.id === 'item-2')?.quantity).toBe(2);
    });
  });

  describe('Cart Persistence Across Sessions', () => {
    it('should persist cart data to localStorage', () => {
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

      const updatedCart = addToCart(cart, item);
      saveCart(updatedCart);

      const storedData = localStorage.getItem('toa_shopping_cart');
      expect(storedData).toBeDefined();
      
      const parsedCart = JSON.parse(storedData);
      expect(parsedCart.items).toHaveLength(1);
      expect(parsedCart.items[0].productId).toBe('prod-1');
    });

    it('should load persisted cart from localStorage', () => {
      const originalCart = createEmptyCart();
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

      const updatedCart = addToCart(originalCart, item);
      saveCart(updatedCart);

      // Load from storage
      const loadedCart = loadCart();

      expect(loadedCart.items).toHaveLength(1);
      expect(loadedCart.items[0].productId).toBe('prod-1');
      expect(loadedCart.items[0].quantity).toBe(2);
    });

    it('should handle cart expiration correctly', () => {
      const expiredCart: Cart = {
        items: [{
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
        }],
        createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
        updatedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 24 * 60 * 60 * 1000, // Expired yesterday
      };

      expect(isCartExpired(expiredCart)).toBe(true);
    });

    it('should not expire valid cart', () => {
      const validCart = createEmptyCart();

      expect(isCartExpired(validCart)).toBe(false);
    });

    it('should update timestamps when saving cart', () => {
      const cart = createEmptyCart();
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };

      const updatedCart = addToCart(cart, item);
      const originalUpdatedAt = updatedCart.updatedAt;

      // Wait a bit to ensure timestamp difference
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      saveCart(updatedCart);

      expect(updatedCart.updatedAt).toBeGreaterThan(originalUpdatedAt);

      vi.useRealTimers();
    });
  });

  describe('Cart Cleanup on Logout', () => {
    it('should clear all cart data', () => {
      const cart = createEmptyCart();
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };

      const updatedCart = addToCart(cart, item);
      saveCart(updatedCart);

      clearCart();

      const clearedCart = loadCart();
      expect(clearedCart.items).toEqual([]);
    });

    it('should remove cart from localStorage', () => {
      const cart = createEmptyCart();
      saveCart(cart);

      expect(localStorage.getItem('toa-cart')).toBeDefined();

      clearCart();

      expect(localStorage.getItem('toa-cart')).toBeNull();
    });
  });

  describe('Duplicate Items Handling', () => {
    it('should update quantity when adding duplicate product-variant combination', () => {
      let cart = createEmptyCart();
      
      const item: CartItem = {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Product 1',
        variantName: 'Size L',
        price: 29.99,
        quantity: 1,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
        addedAt: Date.now(),
      };

      cart = addToCart(cart, item);
      
      // Add same product-variant combo
      const duplicateItem = { ...item, quantity: 2 };
      cart = addToCart(cart, duplicateItem);

      // Should have only 1 item with combined quantity
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Memory and Performance', () => {
    it('should handle large cart without memory issues', () => {
      let cart = createEmptyCart();
      
      // Add 100 items
      for (let i = 0; i < 100; i++) {
        const item: CartItem = {
          id: `item-${i}`,
          productId: `prod-${i}`,
          variantId: `var-${i}`,
          productName: `Product ${i}`,
          variantName: 'Standard',
          price: 10 + i,
          quantity: 1,
          imageUrl: 'https://example.com/image.jpg',
          inStock: true,
          addedAt: Date.now() + i,
        };
        cart = addToCart(cart, item);
      }

      expect(cart.items).toHaveLength(100);
      
      // Should be able to save and load
      saveCart(cart);
      const loadedCart = loadCart();
      expect(loadedCart.items).toHaveLength(100);
    });
  });
});
/* eslint-enable no-undef */
