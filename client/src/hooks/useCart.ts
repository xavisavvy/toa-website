import { useState, useEffect, useCallback } from 'react';
import type { Cart, CartItem, CartSummary } from '@/types/cart';
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
import { analytics } from '@/lib/analytics';

export function useCart() {
  const [cart, setCart] = useState<Cart>(() => loadCart());

  useEffect(() => {
    if (isCartExpired(cart)) {
      const newCart = createEmptyCart();
      setCart(newCart);
      clearCartStorage();
    }
  }, [cart]);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addItem = useCallback((item: Omit<CartItem, 'addedAt'>) => {
    setCart((currentCart) => {
      const updatedCart = addToCartUtil(currentCart, item);
      
      analytics.addToCart(item.productName, item.productId, item.price, item.quantity);
      
      return updatedCart;
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart((currentCart) => {
      const item = currentCart.items.find((i) => i.id === itemId);
      if (item) {
        analytics.removeFromCart(item.productName, item.productId, item.price, item.quantity);
      }
      return removeFromCartUtil(currentCart, itemId);
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((currentCart) => updateCartItemQuantityUtil(currentCart, itemId, quantity));
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

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartSummary,
  };
}
