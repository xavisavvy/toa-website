/**
 * Feature Flag System
 * 
 * Enables safe rollout of new features with runtime toggles.
 * Supports environment-based, percentage-based, and user-based flags.
 */

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number; // 0-100
  enabledForUsers?: string[]; // User IDs
  enabledEnvironments?: string[]; // ['development', 'staging', 'production']
}

export interface FeatureFlagConfig {
  [key: string]: FeatureFlag;
}

// Default feature flags configuration
const defaultFlags: FeatureFlagConfig = {
  'enhanced-caching': {
    name: 'enhanced-caching',
    enabled: true,
    description: 'Enable advanced caching strategies',
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  'youtube-integration': {
    name: 'youtube-integration',
    enabled: true,
    description: 'Enable YouTube API integration',
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  'etsy-store': {
    name: 'etsy-store',
    enabled: true,
    description: 'Enable Etsy store integration',
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  'dndbeyond-integration': {
    name: 'dndbeyond-integration',
    enabled: true,
    description: 'Enable D&D Beyond character sheet integration',
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  'podcast-feed': {
    name: 'podcast-feed',
    enabled: true,
    description: 'Enable podcast RSS feed',
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  'health-checks-extended': {
    name: 'health-checks-extended',
    enabled: true,
    description: 'Enable extended health check diagnostics',
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  'rate-limiting': {
    name: 'rate-limiting',
    enabled: true,
    description: 'Enable API rate limiting',
    enabledEnvironments: ['staging', 'production'],
  },
  'new-character-page': {
    name: 'new-character-page',
    enabled: false,
    description: 'Enable redesigned character page (beta)',
    rolloutPercentage: 10, // 10% rollout
    enabledEnvironments: ['development', 'staging'],
  },
  'experimental-features': {
    name: 'experimental-features',
    enabled: false,
    description: 'Enable experimental features for testing',
    enabledEnvironments: ['development'],
  },
};

// Environment-based configuration overrides
const environmentOverrides: { [env: string]: Partial<FeatureFlagConfig> } = {
  production: {
    'experimental-features': { ...defaultFlags['experimental-features'], enabled: false },
    'new-character-page': { ...defaultFlags['new-character-page'], enabled: false },
  },
  staging: {
    'new-character-page': { ...defaultFlags['new-character-page'], enabled: true, rolloutPercentage: 50 },
  },
  development: {
    'experimental-features': { ...defaultFlags['experimental-features'], enabled: true },
    'new-character-page': { ...defaultFlags['new-character-page'], enabled: true },
  },
};

/**
 * Feature Flag Manager
 */
export class FeatureFlagManager {
  private flags: FeatureFlagConfig;
  private environment: string;

  constructor(environment: string = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.flags = { ...defaultFlags };

    // Apply environment overrides
    const overrides = environmentOverrides[environment];
    if (overrides) {
      Object.entries(overrides).forEach(([key, override]) => {
        if (this.flags[key]) {
          this.flags[key] = { ...this.flags[key], ...override };
        }
      });
    }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagName: string, context?: { userId?: string; requestId?: string }): boolean {
    const flag = this.flags[flagName];
    
    if (!flag) {
      console.warn(`Feature flag "${flagName}" not found, defaulting to false`);
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check environment restrictions
    if (flag.enabledEnvironments && !flag.enabledEnvironments.includes(this.environment)) {
      return false;
    }

    // Check user-specific enablement
    if (context?.userId && flag.enabledForUsers) {
      return flag.enabledForUsers.includes(context.userId);
    }

    // Check percentage rollout
    if (flag.rolloutPercentage !== undefined && context?.requestId) {
      const hash = this.hashString(context.requestId);
      const percentage = hash % 100;
      return percentage < flag.rolloutPercentage;
    }

    return true;
  }

  /**
   * Get all feature flags (for admin dashboard)
   */
  getAllFlags(): FeatureFlagConfig {
    return { ...this.flags };
  }

  /**
   * Get a specific flag configuration
   */
  getFlag(flagName: string): FeatureFlag | undefined {
    return this.flags[flagName];
  }

  /**
   * Override a flag (useful for testing)
   */
  override(flagName: string, enabled: boolean): void {
    if (this.flags[flagName]) {
      this.flags[flagName].enabled = enabled;
    }
  }

  /**
   * Reset all overrides to default
   */
  reset(): void {
    this.flags = { ...defaultFlags };
    const overrides = environmentOverrides[this.environment];
    if (overrides) {
      Object.entries(overrides).forEach(([key, override]) => {
        if (this.flags[key]) {
          this.flags[key] = { ...this.flags[key], ...override };
        }
      });
    }
  }

  /**
   * Simple hash function for percentage rollout
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

/**
 * Express middleware to add feature flag context to requests
 */
export function featureFlagMiddleware(req: any, res: any, next: any) {
  req.featureFlags = {
    isEnabled: (flagName: string) => featureFlags.isEnabled(flagName, {
      userId: req.user?.id,
      requestId: req.id || req.headers['x-request-id'],
    }),
    getAll: () => featureFlags.getAllFlags(),
  };
  next();
}

/**
 * Helper function for checking flags in route handlers
 */
export function requireFeature(flagName: string) {
  return (req: any, res: any, next: any) => {
    if (!req.featureFlags.isEnabled(flagName)) {
      return res.status(404).json({
        error: 'Feature not available',
        message: `The feature "${flagName}" is not enabled in this environment`,
      });
    }
    next();
  };
}
