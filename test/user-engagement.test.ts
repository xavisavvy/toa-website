import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { analytics } from '@/lib/analytics';
import { initScrollTracking, initRageClickDetection, initSessionTracking } from '@/lib/userEngagement';

vi.mock('@/lib/analytics', () => ({
  analytics: {
    scrollDepth: vi.fn(),
    rageClick: vi.fn(),
    sessionQuality: vi.fn(),
  },
}));

describe('User Engagement Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initScrollTracking', () => {
    it('should track scroll depth at 25% intervals', () => {
      // Mock DOM dimensions
      Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
      Object.defineProperty(window, 'scrollY', { value: 250, writable: true });
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 4000, writable: true });

      initScrollTracking();

      // Simulate scroll event
      window.dispatchEvent(new window.Event('scroll'));
      
      // Use requestAnimationFrame callback
      vi.runAllTimers();

      // At scrollY=250 with height=1000 and total=4000: (250+1000)/4000 = 31.25%
      // Should trigger 25% threshold
      expect(analytics.scrollDepth).toHaveBeenCalled();
    });
  });

  describe('initRageClickDetection', () => {
    it('should detect rage clicks after 3 rapid clicks', () => {
      initRageClickDetection();

      const button = document.createElement('button');
      button.className = 'test-button';
      document.body.appendChild(button);

      // Simulate 3 rapid clicks
      button.click();
      button.click();
      button.click();

      expect(analytics.rageClick).toHaveBeenCalledWith(expect.stringContaining('BUTTON'));

      document.body.removeChild(button);
    });

    it('should reset count if clicks are not rapid', () => {
      // Use fake timers for reliable time control
      vi.useFakeTimers();
      const baseTime = 1000000;
      vi.setSystemTime(baseTime);
      
      initRageClickDetection();

      const button = document.createElement('button');
      button.className = 'test-button';
      document.body.appendChild(button);

      // First click
      button.click();
      
      // Advance time more than 1 second (counter should reset)
      vi.setSystemTime(baseTime + 1100);
      
      // Second click (counter resets to 1)
      button.click();
      
      // Advance time again
      vi.setSystemTime(baseTime + 2200);
      
      // Third click (counter resets to 1 again)
      button.click();

      // Should not trigger rage click (counter never reached 3)
      expect(analytics.rageClick).not.toHaveBeenCalled();

      document.body.removeChild(button);
      vi.useRealTimers();
    });
  });

  describe('initSessionTracking', () => {
    it('should track session quality on page unload', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime);

      initSessionTracking();

      // Advance time by 60 seconds
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 60000);

      // Trigger beforeunload
      window.dispatchEvent(new window.Event('beforeunload'));

      expect(analytics.sessionQuality).toHaveBeenCalledWith(60000, 1);
    });
  });
});
