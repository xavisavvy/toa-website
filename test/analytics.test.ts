import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analytics, trackEvent, trackPageView } from '@/lib/analytics';

describe('Analytics Library', () => {
  beforeEach(() => {
    // Reset window.gtag mock
    delete (window as any).gtag;
    delete (window as any).dataLayer;
  });

  describe('trackEvent', () => {
    it('should not throw if gtag is not initialized', () => {
      expect(() => trackEvent('test_event', { param: 'value' })).not.toThrow();
    });

    it('should call gtag when initialized', () => {
      const mockGtag = vi.fn();
      (window as any).gtag = mockGtag;
      
      trackEvent('test_event', { param: 'value' });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { param: 'value' });
    });
  });

  describe('trackPageView', () => {
    it('should not throw if gtag is not initialized', () => {
      expect(() => trackPageView('/test')).not.toThrow();
    });

    it('should call gtag config when initialized', () => {
      const mockGtag = vi.fn();
      (window as any).gtag = mockGtag;
      
      trackPageView('/test', 'Test Page');
      
      expect(mockGtag).toHaveBeenCalledWith('config', expect.any(String), {
        page_path: '/test',
        page_title: 'Test Page',
      });
    });
  });

  describe('E-commerce Events', () => {
    beforeEach(() => {
      (window as any).gtag = vi.fn();
    });

    it('should track viewItemList', () => {
      const items = [{ id: '1', name: 'Product 1' }];
      analytics.viewItemList(items, 'Featured');
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'view_item_list', {
        item_list_name: 'Featured',
        items,
      });
    });

    it('should track selectItem', () => {
      analytics.selectItem('T-Shirt', 'prod_123', 'Featured');
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'select_item', {
        item_name: 'T-Shirt',
        item_id: 'prod_123',
        item_list_name: 'Featured',
      });
    });

    it('should track viewCart', () => {
      const items = [{ id: '1', name: 'Product' }];
      analytics.viewCart(25.99, items);
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'view_cart', {
        currency: 'USD',
        value: 25.99,
        items,
      });
    });

    it('should track addShippingInfo', () => {
      analytics.addShippingInfo(30.00, 'Standard');
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'add_shipping_info', {
        currency: 'USD',
        value: 30.00,
        shipping_tier: 'Standard',
      });
    });

    it('should track addPaymentInfo', () => {
      analytics.addPaymentInfo(30.00, 'stripe');
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'add_payment_info', {
        currency: 'USD',
        value: 30.00,
        payment_type: 'stripe',
      });
    });
  });

  describe('User Engagement Events', () => {
    beforeEach(() => {
      (window as any).gtag = vi.fn();
    });

    it('should track scrollDepth', () => {
      analytics.scrollDepth(50);
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'scroll', {
        percent_scrolled: 50,
      });
    });

    it('should track rageClick', () => {
      analytics.rageClick('BUTTON.submit');
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'rage_click', {
        element: 'BUTTON.submit',
        frustration: true,
      });
    });

    it('should track sessionQuality', () => {
      analytics.sessionQuality(120000, 5);
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'session_quality', {
        duration_seconds: 120,
        pages_viewed: 5,
      });
    });
  });

  describe('Social & Content Events', () => {
    beforeEach(() => {
      (window as any).gtag = vi.fn();
    });

    it('should track socialShare', () => {
      analytics.socialShare('twitter', 'episode', 'ep-1');
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'share', {
        method: 'twitter',
        content_type: 'episode',
        content_id: 'ep-1',
      });
    });

    it('should track characterView', () => {
      analytics.characterView('Taebrin', 'char-1');
      
      expect((window as any).gtag).toHaveBeenCalledWith('event', 'character_view', {
        character_name: 'Taebrin',
        character_id: 'char-1',
      });
    });
  });
});
