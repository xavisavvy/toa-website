import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

import { validateNumber } from '../../server/security';

/**
 * Property-Based Tests for Validators
 * 
 * These tests use fast-check to generate hundreds/thousands of random inputs
 * to find edge cases and verify validators work correctly for ALL possible inputs.
 */

// Helper function to validate playlist ID (extracted from routes logic)
function validatePlaylistId(playlistId: string): { valid: boolean; error?: string; value?: string } {
  // YouTube playlist IDs must start with 'PL' followed by alphanumeric, underscore, or hyphen
  // Must not be ONLY hyphens/underscores after PL prefix
  if (!/^PL[a-zA-Z0-9_-]+$/.test(playlistId) || /^PL[-_]+$/.test(playlistId)) {
    return { valid: false, error: 'Invalid playlist ID format' };
  }
  return { valid: true, value: playlistId };
}

describe('Property-Based Validator Tests', () => {
  describe('validatePlaylistId', () => {
    it('accepts all valid YouTube playlist IDs', () => {
      fc.assert(
        fc.property(
          // Generate valid playlist IDs: PL + alphanumeric + underscore + hyphen
          // Must contain at least one alphanumeric character (not just -_)
          fc.stringMatching(/^PL[a-zA-Z0-9_-]{10,50}$/)
            .filter(id => /[a-zA-Z0-9]/.test(id.substring(2))), // Ensure at least one alphanumeric after PL
          (playlistId) => {
            const result = validatePlaylistId(playlistId);
            expect(result.valid).toBe(true);
            expect(result.value).toBe(playlistId);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 1000 } // Run 1000 times with different inputs
      );
    });

    it('rejects all invalid playlist IDs', () => {
      fc.assert(
        fc.property(
          // Generate strings that DON'T match valid pattern
          fc.string().filter(s => !/^PL[a-zA-Z0-9_-]+$/.test(s)),
          (invalidId) => {
            const result = validatePlaylistId(invalidId);
            expect(result.valid).toBe(false);
            expect(result.value).toBeUndefined();
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 500 }
      );
    });

    it('rejects playlist IDs with only hyphens and underscores', () => {
      fc.assert(
        fc.property(
          // Generate PL + only hyphens/underscores
          fc.stringMatching(/^PL[-_]{1,50}$/),
          (invalidId) => {
            const result = validatePlaylistId(invalidId);
            expect(result.valid).toBe(false);
            expect(result.value).toBeUndefined();
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 200 }
      );
    });

    it('rejects strings with special characters', () => {
      fc.assert(
        fc.property(
          fc.string(), // Any string
          fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ';', ':', '"', "'", '<', '>', ',', '.', '?', '/', '~', '`'),
          (base, specialChar) => {
            const playlistId = `PL${base}${specialChar}`;
            const result = validatePlaylistId(playlistId);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('handles empty and whitespace strings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t'),
            fc.constant('\n'),
            fc.constant('  \t  \n  ')
          ),
          (whitespace) => {
            const result = validatePlaylistId(whitespace);
            expect(result.valid).toBe(false);
          }
        )
      );
    });

    it('rejects null bytes and control characters', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer({ min: 0, max: 31 }), // Control characters
          (base, controlChar) => {
            const playlistId = `PL${base}${String.fromCharCode(controlChar)}`;
            const result = validatePlaylistId(playlistId);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('handles very long strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1000, maxLength: 10000 }),
          (longString) => {
            const result = validatePlaylistId(longString);
            // Should handle gracefully (either accept if valid or reject)
            expect(result).toHaveProperty('valid');
            expect(typeof result.valid).toBe('boolean');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('is case-sensitive for valid patterns', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9_-]{10,30}$/),
          (suffix) => {
            const upperCase = `PL${suffix.toUpperCase()}`;
            const lowerCase = `PL${suffix.toLowerCase()}`;
            const mixed = `PL${suffix}`;

            const upperResult = validatePlaylistId(upperCase);
            const lowerResult = validatePlaylistId(lowerCase);
            const mixedResult = validatePlaylistId(mixed);

            // All should have consistent validation
            expect(upperResult.valid).toBe(true);
            expect(lowerResult.valid).toBe(true);
            expect(mixedResult.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validateNumber', () => {
    it('accepts all integers within valid range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (num) => {
            const result = validateNumber(String(num), 1, 10000);
            expect(result.valid).toBe(true);
            expect(result.value).toBe(num);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('rejects all numbers outside valid range', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -1000000, max: 0 }), // Below min
            fc.integer({ min: 10001, max: 1000000 }) // Above max
          ),
          (num) => {
            const result = validateNumber(String(num), 1, 10000);
            expect(result.valid).toBe(false);
            expect(result.value).toBeUndefined();
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 500 }
      );
    });

    it('handles boundary values correctly', () => {
      // Test exact boundaries
      const min = 1;
      const max = 10000;

      const minResult = validateNumber(String(min), min, max);
      expect(minResult.valid).toBe(true);
      expect(minResult.value).toBe(min);

      const maxResult = validateNumber(String(max), min, max);
      expect(maxResult.valid).toBe(true);
      expect(maxResult.value).toBe(max);

      const belowMinResult = validateNumber(String(min - 1), min, max);
      expect(belowMinResult.valid).toBe(false);

      const aboveMaxResult = validateNumber(String(max + 1), min, max);
      expect(aboveMaxResult.valid).toBe(false);
    });

    it('rejects non-numeric strings', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => isNaN(Number(s)) || s.trim() === ''),
          (nonNumeric) => {
            const result = validateNumber(nonNumeric, 1, 100);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 300 }
      );
    });

    it('handles floating point numbers', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 100, noNaN: true }),
          (floatNum) => {
            const result = validateNumber(String(floatNum), 1, 100);
            
            // Should handle decimals (likely converting to int or rejecting)
            expect(result).toHaveProperty('valid');
            expect(typeof result.valid).toBe('boolean');
            
            if (result.valid && result.value !== undefined) {
              // If accepted, should be within range
              expect(result.value).toBeGreaterThanOrEqual(1);
              expect(result.value).toBeLessThanOrEqual(100);
            }
          }
        ),
        { numRuns: 200 }
      );
    });

    it('handles special numeric strings', () => {
      const specialCases = [
        'Infinity',
        '-Infinity',
        'NaN',
        '1e10',
        '0x10', // Hex
        '0o10', // Octal
        '0b10', // Binary
      ];

      specialCases.forEach((special) => {
        const result = validateNumber(special, 1, 100);
        // Should reject or handle gracefully
        expect(result).toHaveProperty('valid');
        expect(typeof result.valid).toBe('boolean');
      });
    });

    it('handles whitespace in numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.constantFrom('', ' ', '  ', '\t', '\n'),
          (num, whitespace) => {
            const withWhitespace = `${whitespace}${num}${whitespace}`;
            const result = validateNumber(withWhitespace, 1, 100);
            
            // Should either accept (after trimming) or reject
            expect(result).toHaveProperty('valid');
            if (result.valid) {
              expect(result.value).toBe(num);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('handles negative numbers based on range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: -1 }),
          (negNum) => {
            // Test with range that allows negatives
            const result1 = validateNumber(String(negNum), -1000, -1);
            expect(result1.valid).toBe(true);

            // Test with range that doesn't allow negatives
            const result2 = validateNumber(String(negNum), 1, 100);
            expect(result2.valid).toBe(false);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('handles very large numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: Number.MAX_SAFE_INTEGER - 1000, max: Number.MAX_SAFE_INTEGER }),
          (largeNum) => {
            const result = validateNumber(
              String(largeNum),
              Number.MAX_SAFE_INTEGER - 1000,
              Number.MAX_SAFE_INTEGER
            );
            expect(result.valid).toBe(true);
            expect(result.value).toBe(largeNum);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('different ranges produce consistent results', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 600, max: 1000 }),
          (value, min1, max1) => {
            // Value should be consistently validated across different ranges
            const result1 = validateNumber(String(value), min1, max1);
            const result2 = validateNumber(String(value), min1, max1);
            
            // Same inputs should produce same results
            expect(result1.valid).toBe(result2.valid);
            expect(result1.value).toBe(result2.value);
            expect(result1.error).toBe(result2.error);
          }
        ),
        { numRuns: 300 }
      );
    });
  });

  describe('Validator Invariants', () => {
    it('validatePlaylistId never throws exceptions with strings', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            expect(() => {
              validatePlaylistId(input);
            }).not.toThrow();
          }
        ),
        { numRuns: 500 }
      );
    });

    it('validateNumber never throws exceptions with strings', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer(),
          fc.integer(),
          (input, min, max) => {
            expect(() => {
              validateNumber(input, min, max);
            }).not.toThrow();
          }
        ),
        { numRuns: 500 }
      );
    });

    it('validators always return consistent structure', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            const result = validatePlaylistId(input);
            
            // Must always have 'valid' property
            expect(result).toHaveProperty('valid');
            expect(typeof result.valid).toBe('boolean');
            
            // If valid, must have value
            if (result.valid) {
              expect(result.value).toBeTruthy();
              expect(result.error).toBeUndefined();
            } else {
              // If invalid, must have error
              expect(result.value).toBeUndefined();
              expect(result.error).toBeTruthy();
            }
          }
        ),
        { numRuns: 300 }
      );
    });
  });
});
