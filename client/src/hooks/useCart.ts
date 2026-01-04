import { useState, useEffect, useCallback, useMemo } from 'react';

import { analytics } from '@/lib/analytics';
import {
  loadCart,
  saveCart,
  clearCart as clearCartStorage,
  addToCart as addToCartUtil,
  removeFromCart as removeFromCartUtil,
  updateCartItemQuantity as updateCartItemQuantityUtil,
  calculateCartTotal,
  getTotalItemCount,
  isCartExpired,
  createEmptyCart,
} from '@/lib/cart';
import type { Cart, CartItem, CartSummary } from '@/types/cart';

// Custom event for cart updates within the same window
const CART_UPDATE_EVENT = 'cart-updated';

function dispatchCartUpdate() {
  window.dispatchEvent(new Event(CART_UPDATE_EVENT));
}

export function useCart() {
  const [cart, setCart] = useState<Cart>(() => loadCart());
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);

  // Listen for cart updates from same window (custom event)
  useEffect(() => {
    const handleCartUpdate = () => {
      if (!isUpdatingCart) {
        setCart(loadCart());
      }
    };

    window.addEventListener(CART_UPDATE_EVENT, handleCartUpdate);
    return () => {
      window.removeEventListener(CART_UPDATE_EVENT, handleCartUpdate);
    };
  }, [isUpdatingCart]);

  // Listen for localStorage changes from other tabs (not same window)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle changes from OTHER tabs/windows
      if (e.key === 'toa_shopping_cart' && e.newValue && !isUpdatingCart) {
        try {
          const updatedCart = JSON.parse(e.newValue) as Cart;
          setCart(updatedCart);
        } catch (error) {
          console.error('Error parsing cart from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isUpdatingCart]);

  useEffect(() => {
    if (isCartExpired(cart)) {
      const newCart = createEmptyCart();
      setCart(newCart);
      clearCartStorage();
    }
  }, [cart]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isUpdatingCart) {
      saveCart(cart);
    }
  }, [cart, isUpdatingCart]);

  const addItem = useCallback((item: Omit<CartItem, 'addedAt'>) => {
    setIsUpdatingCart(true);
    setCart((currentCart) => {
      const updatedCart = addToCartUtil(currentCart, item);
      
      analytics.addToCart(item.productName, item.productId, item.price, item.quantity);
      
      // Save immediately to ensure sync
      saveCart(updatedCart);
      
      return updatedCart;
    });
    // Reset flag and notify other components
    setTimeout(() => {
      setIsUpdatingCart(false);
      dispatchCartUpdate();
    }, 100);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setIsUpdatingCart(true);
    setCart((currentCart) => {
      const item = currentCart.items.find((i) => i.id === itemId);
      if (item) {
        analytics.removeFromCart(item.productName, item.productId, item.price, item.quantity);
      }
      const updatedCart = removeFromCartUtil(currentCart, itemId);
      saveCart(updatedCart);
      return updatedCart;
    });
    setTimeout(() => {
      setIsUpdatingCart(false);
      dispatchCartUpdate();
    }, 100);
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setIsUpdatingCart(true);
    setCart((currentCart) => {
      const updatedCart = updateCartItemQuantityUtil(currentCart, itemId, quantity);
      saveCart(updatedCart);
      return updatedCart;
    });
    setTimeout(() => {
      setIsUpdatingCart(false);
      dispatchCartUpdate();
    }, 100);
  }, []);

  const clearCart = useCallback(() => {
    setCart(createEmptyCart());
    clearCartStorage();
  }, []);

  const getCartSummary = useCallback((): CartSummary => {
    return {
      itemCount: cart.items.length,
      totalItems: getTotalItemCount(cart),
      subtotal: calculateCartTotal(cart),
    };
  }, [cart]);

  // Memoize cart summary to avoid recalculation on every render
  const cartSummary = useMemo(() => getCartSummary(), [getCartSummary]);

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartSummary,
    cartSummary, // Pre-calculated summary for performance
  };
}
