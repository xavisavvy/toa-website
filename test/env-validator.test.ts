import { describe, it, expect, vi, beforeEach } from 'vitest';

import { validateEnvironment } from '../server/env-validator';

describe('Environment Validator', () => {
  let consoleSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should pass validation with all required variables set', () => {
    process.env.NODE_ENV = 'test';
    
    validateEnvironment();
    
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('✅ Environment validation passed'));
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should warn about missing optional API keys', () => {
    // Clear optional env vars
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.ETSY_API_KEY;
    
    validateEnvironment();
    
    expect(consoleSpy.warn).toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should not fail when optional variables are missing', () => {
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.ETSY_API_KEY;
    delete process.env.ETSY_ACCESS_TOKEN;
    
    expect(() => validateEnvironment()).not.toThrow();
  });
});
