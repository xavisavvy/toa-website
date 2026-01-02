import { describe, it, expect } from 'vitest';

import { validateUrl, validateNumber, validateString } from '../server/security';

describe('Security - Input Validation', () => {
  describe('validateUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept valid HTTP URLs', () => {
      const result = validateUrl('http://example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject URLs without protocol', () => {
      const result = validateUrl('example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should reject localhost URLs', () => {
      const result = validateUrl('http://localhost:3000');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should reject 127.0.0.1 URLs', () => {
      const result = validateUrl('http://127.0.0.1:3000');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Access to localhost is not allowed');
    });

    it('should reject private IP addresses (10.x.x.x)', () => {
      const result = validateUrl('http://10.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Access to private IP addresses is not allowed');
    });

    it('should reject private IP addresses (192.168.x.x)', () => {
      const result = validateUrl('http://192.168.1.1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Access to private IP addresses is not allowed');
    });

    it('should reject private IP addresses (172.16-31.x.x)', () => {
      const result = validateUrl('http://172.16.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Access to private IP addresses is not allowed');
    });

    it('should reject AWS metadata service IP', () => {
      const result = validateUrl('http://169.254.169.254');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Access to private IP addresses is not allowed');
    });

    it('should reject malformed URLs', () => {
      const result = validateUrl('not a url');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });
  });

  describe('validateNumber', () => {
    it('should accept valid numbers within range', () => {
      const result = validateNumber('50', 1, 100);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(50);
    });

    it('should accept minimum value', () => {
      const result = validateNumber('1', 1, 100);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
    });

    it('should accept maximum value', () => {
      const result = validateNumber('100', 1, 100);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(100);
    });

    it('should reject numbers below minimum', () => {
      const result = validateNumber('0', 1, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Number must be between 1 and 100');
    });

    it('should reject numbers above maximum', () => {
      const result = validateNumber('101', 1, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Number must be between 1 and 100');
    });

    it('should reject non-numeric strings', () => {
      const result = validateNumber('abc', 1, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Input must be a valid number');
    });

    it('should reject empty strings', () => {
      const result = validateNumber('', 1, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Input must be a valid number');
    });
  });

  describe('validateString', () => {
    it('should accept valid strings', () => {
      const result = validateString('Hello World');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
    });

    it('should trim whitespace', () => {
      const result = validateString('  Hello World  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toContain('  ');
    });

    it('should reject empty strings', () => {
      const result = validateString('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Input cannot be empty');
    });

    it('should reject non-string inputs', () => {
      const result = validateString(123 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Input must be a string');
    });

    it('should reject strings exceeding max length', () => {
      const longString = 'a'.repeat(1001);
      const result = validateString(longString, 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Input exceeds maximum length of 1000 characters');
    });

    it('should escape HTML characters', () => {
      const result = validateString('<script>alert("xss")</script>');
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('&lt;');
    });
  });
});
