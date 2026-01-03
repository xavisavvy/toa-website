import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '@/hooks/useCart';
import * as cartLib from '@/lib/cart';
import * as analytics from '@/lib/analytics';

// Mock the cart library
vi.mock('@/lib/cart', () => ({
  loadCart: vi.fn(),
  saveCart: vi.fn(),
  clearCart: vi.fn(),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateCartItemQuantity: vi.fn(),
  calculateCartTotal: vi.fn(),
  getTotalItemCount: vi.fn(),
  isCartExpired: vi.fn(),
  createEmptyCart: vi.fn(),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  analytics: {
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
  },
}));

describe('useCart Hook', () => {
  const mockEmptyCart = {
    items: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (cartLib.loadCart as any).mockReturnValue(mockEmptyCart);
    (cartLib.isCartExpired as any).mockReturnValue(false);
    (cartLib.createEmptyCart as any).mockReturnValue(mockEmptyCart);
    (cartLib.calculateCartTotal as any).mockReturnValue(0);
    (cartLib.getTotalItemCount as any).mockReturnValue(0);
  });

  it('should initialize with loaded cart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toEqual(mockEmptyCart);
    expect(cartLib.loadCart).toHaveBeenCalled();
  });

  it('should add item to cart and track analytics', () => {
    const updatedCart = {
      ...mockEmptyCart,
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
    };

    (cartLib.addToCart as any).mockReturnValue(updatedCart);

    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Test Product',
        variantName: 'Size L',
        price: 29.99,
        quantity: 2,
        imageUrl: 'https://example.com/image.jpg',
        inStock: true,
      });
    });

    expect(analytics.analytics.addToCart).toHaveBeenCalledWith(
      'Test Product',
      'prod-1',
      29.99,
      2
    );
    expect(cartLib.saveCart).toHaveBeenCalled();
  });

  it('should remove item from cart and track analytics', () => {
    const cartWithItem = {
      ...mockEmptyCart,
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
    };

    (cartLib.loadCart as any).mockReturnValue(cartWithItem);
    (cartLib.removeFromCart as any).mockReturnValue(mockEmptyCart);

    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.removeItem('1');
    });

    expect(analytics.analytics.removeFromCart).toHaveBeenCalledWith(
      'Test Product',
      'prod-1',
      29.99,
      2
    );
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.updateQuantity('1', 5);
    });

    expect(cartLib.updateCartItemQuantity).toHaveBeenCalledWith(
      expect.any(Object),
      '1',
      5
    );
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.clearCart();
    });

    expect(cartLib.clearCart).toHaveBeenCalled();
  });

  it('should provide cart summary', () => {
    (cartLib.calculateCartTotal as any).mockReturnValue(59.98);
    (cartLib.getTotalItemCount as any).mockReturnValue(3);

    const cartWithItems = {
      ...mockEmptyCart,
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
    };

    (cartLib.loadCart as any).mockReturnValue(cartWithItems);

    const { result } = renderHook(() => useCart());
    const summary = result.current.getCartSummary();

    expect(summary.itemCount).toBe(1);
    expect(summary.totalItems).toBe(3);
    expect(summary.subtotal).toBe(59.98);
  });

  it('should reset expired cart', () => {
    (cartLib.isCartExpired as any).mockReturnValue(true);

    renderHook(() => useCart());

    expect(cartLib.clearCart).toHaveBeenCalled();
  });
});
