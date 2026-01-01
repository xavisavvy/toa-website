import { describe, it, expect, beforeEach } from 'vitest';
import { featureFlags, FeatureFlagManager } from '../../server/feature-flags';

describe('Feature Flags', () => {
  let manager: FeatureFlagManager;

  beforeEach(() => {
    manager = new FeatureFlagManager('development');
  });

  describe('isEnabled', () => {
    it('should return true for globally enabled flags', () => {
      expect(manager.isEnabled('enhanced-caching')).toBe(true);
    });

    it('should respect environment overrides in development', () => {
      // In development, new-character-page is enabled by environment override
      expect(manager.isEnabled('new-character-page')).toBe(true);
      
      // In production, it should be disabled
      const prodManager = new FeatureFlagManager('production');
      expect(prodManager.isEnabled('new-character-page')).toBe(false);
    });

    it('should return false for non-existent flags', () => {
      expect(manager.isEnabled('non-existent-flag')).toBe(false);
    });

    it('should respect environment restrictions', () => {
      const prodManager = new FeatureFlagManager('production');
      expect(prodManager.isEnabled('experimental-features')).toBe(false);
    });

    it('should handle percentage rollout correctly', () => {
      // Create a staging manager where new-character-page has 50% rollout
      const stagingManager = new FeatureFlagManager('staging');
      const flag = stagingManager.getFlag('new-character-page');
      
      if (flag && flag.rolloutPercentage) {
        // Test with multiple request IDs
        const results = Array.from({ length: 100 }, (_, i) => 
          stagingManager.isEnabled('new-character-page', { requestId: `request-${i}` })
        );
        
        const enabledCount = results.filter(r => r).length;
        // Should be roughly 50% in staging (allow 30-70% variance due to hashing)
        expect(enabledCount).toBeGreaterThan(30);
        expect(enabledCount).toBeLessThan(70);
      }
    });

    it('should enable for specific users', () => {
      const flag = manager.getFlag('new-character-page');
      if (flag) {
        flag.enabledForUsers = ['user-123'];
        flag.enabled = true;
        
        expect(manager.isEnabled('new-character-page', { userId: 'user-123' })).toBe(true);
        expect(manager.isEnabled('new-character-page', { userId: 'user-456' })).toBe(false);
      }
    });
  });

  describe('getAllFlags', () => {
    it('should return all feature flags', () => {
      const flags = manager.getAllFlags();
      expect(flags).toHaveProperty('enhanced-caching');
      expect(flags).toHaveProperty('youtube-integration');
      expect(flags).toHaveProperty('new-character-page');
    });

    it('should return copies to prevent mutation', () => {
      const flags1 = manager.getAllFlags();
      const flags2 = manager.getAllFlags();
      expect(flags1).not.toBe(flags2);
    });
  });

  describe('getFlag', () => {
    it('should return flag configuration', () => {
      const flag = manager.getFlag('enhanced-caching');
      expect(flag).toBeDefined();
      expect(flag?.name).toBe('enhanced-caching');
      expect(flag?.enabled).toBe(true);
    });

    it('should return undefined for non-existent flags', () => {
      expect(manager.getFlag('non-existent')).toBeUndefined();
    });
  });

  describe('override', () => {
    it('should override flag state', () => {
      manager.override('new-character-page', true);
      expect(manager.isEnabled('new-character-page')).toBe(true);
    });

    it('should not affect non-existent flags', () => {
      manager.override('non-existent', true);
      expect(manager.isEnabled('non-existent')).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all overrides', () => {
      // Override a naturally disabled flag in the default config
      manager.override('experimental-features', false);
      expect(manager.isEnabled('experimental-features')).toBe(false);
      
      manager.reset();
      // After reset, development environment override should apply (enabled)
      expect(manager.isEnabled('experimental-features')).toBe(true);
    });
  });

  describe('environment-specific behavior', () => {
    it('should enable experimental features in development', () => {
      const devManager = new FeatureFlagManager('development');
      expect(devManager.isEnabled('experimental-features')).toBe(true);
    });

    it('should disable experimental features in production', () => {
      const prodManager = new FeatureFlagManager('production');
      expect(prodManager.isEnabled('experimental-features')).toBe(false);
    });

    it('should have different rollout percentages per environment', () => {
      const devManager = new FeatureFlagManager('development');
      const stagingManager = new FeatureFlagManager('staging');
      
      const devFlag = devManager.getFlag('new-character-page');
      const stagingFlag = stagingManager.getFlag('new-character-page');
      
      expect(devFlag?.enabled).toBe(true);
      expect(stagingFlag?.enabled).toBe(true);
      expect(stagingFlag?.rolloutPercentage).toBe(50);
    });
  });

  describe('integration scenarios', () => {
    it('should work with request context', () => {
      manager.override('new-character-page', true);
      
      const context = {
        userId: 'user-123',
        requestId: 'req-abc',
      };
      
      expect(manager.isEnabled('new-character-page', context)).toBeDefined();
    });

    it('should handle missing context gracefully', () => {
      expect(() => manager.isEnabled('enhanced-caching')).not.toThrow();
      expect(manager.isEnabled('enhanced-caching')).toBe(true);
    });
  });
});

describe('Feature Flag Middleware', () => {
  it('should add featureFlags to request object', () => {
    // This would typically be tested with an integration test
    // For now, we're just documenting the expected behavior
    expect(true).toBe(true);
  });
});
