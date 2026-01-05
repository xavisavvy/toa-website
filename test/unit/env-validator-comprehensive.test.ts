import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Environment Validator - Comprehensive Coverage', () => {
  let originalEnv: typeof process.env;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleLogSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.resetModules();
  });

  describe('Stripe Configuration Validation', () => {
    it('should accept valid Stripe configuration', async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_validkey';
      process.env.STRIPE_SECRET_KEY = 'sk_test_validkey';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_validkey';

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('E-commerce checkout'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Enabled'));
    });

    it('should fail when publishable key has wrong prefix', async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'sk_test_wrongprefix';
      process.env.STRIPE_SECRET_KEY = 'sk_test_validkey';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_validkey';

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('STRIPE_PUBLISHABLE_KEY must start with "pk_"'));
    });

    it('should fail when secret key has wrong prefix', async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_validkey';
      process.env.STRIPE_SECRET_KEY = 'pk_test_wrongprefix';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_validkey';

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('STRIPE_SECRET_KEY must start with "sk_"'));
    });

    it('should fail when webhook secret has wrong prefix', async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_validkey';
      process.env.STRIPE_SECRET_KEY = 'sk_test_validkey';
      process.env.STRIPE_WEBHOOK_SECRET = 'invalid_secret';

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('STRIPE_WEBHOOK_SECRET must start with "whsec_"'));
    });

    it('should fail when only publishable key is set', async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_validkey';
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('STRIPE_SECRET_KEY is required when Stripe is configured'));
    });

    it('should fail when only secret key is set', async () => {
      delete process.env.STRIPE_PUBLISHABLE_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_validkey';
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('STRIPE_PUBLISHABLE_KEY is required when Stripe is configured'));
    });

    it('should fail when only webhook secret is set', async () => {
      delete process.env.STRIPE_PUBLISHABLE_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_validkey';

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('STRIPE_PUBLISHABLE_KEY is required'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('STRIPE_SECRET_KEY is required'));
    });
  });

  describe('Printful Configuration Validation', () => {
    it('should accept valid Printful API key', async () => {
      process.env.PRINTFUL_API_KEY = 'validprintfulapikey123';

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Product catalog'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Enabled'));
    });

    it('should fail when Printful API key is too short', async () => {
      process.env.PRINTFUL_API_KEY = 'short';

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('PRINTFUL_API_KEY appears to be invalid'));
    });

    it('should show disabled when Printful not configured', async () => {
      delete process.env.PRINTFUL_API_KEY;

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Product catalog'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Disabled'));
    });
  });

  describe('Optional Environment Variables', () => {
    it('should warn about missing optional variables', async () => {
      delete process.env.YOUTUBE_API_KEY;
      delete process.env.ETSY_API_KEY;
      delete process.env.PRINTFUL_API_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Optional environment variables not configured'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should show feature availability summary', async () => {
      delete process.env.PRINTFUL_API_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Feature Availability'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('E-commerce checkout'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Product catalog'));
    });
  });

  describe('Combined Configurations', () => {
    it('should handle multiple configuration errors', async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'invalid';
      process.env.STRIPE_SECRET_KEY = 'invalid';
      process.env.STRIPE_WEBHOOK_SECRET = 'invalid';
      process.env.PRINTFUL_API_KEY = 'bad';

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Environment configuration errors'));
    });

    it('should pass validation with all features enabled', async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_validkey';
      process.env.STRIPE_SECRET_KEY = 'sk_test_validkey';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_validkey';
      process.env.PRINTFUL_API_KEY = 'validprintfulapikey123';

      const { validateEnvironment } = await import('../../server/env-validator');
      validateEnvironment();

      expect(processExitSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Environment validation passed'));
    });
  });
});
