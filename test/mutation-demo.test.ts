import { describe, it, expect } from 'vitest';
import {
  add,
  isEven,
  max,
  greet,
  calculateDiscount,
  isPalindrome
} from './mutation-demo';

/**
 * Mutation Testing Demo Tests
 * 
 * These tests demonstrate good testing practices that kill mutations.
 * Run mutation testing to see which mutations survive.
 */

describe('Mutation Testing Demo', () => {
  describe('add function', () => {
    it('adds two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('adds negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });

    it('adds zero', () => {
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
    });

    // This test helps kill subtraction mutations
    it('is commutative', () => {
      expect(add(3, 4)).toBe(add(4, 3));
    });
  });

  describe('isEven function', () => {
    it('returns true for even numbers', () => {
      expect(isEven(2)).toBe(true);
      expect(isEven(4)).toBe(true);
      expect(isEven(0)).toBe(true);
      expect(isEven(-2)).toBe(true);
    });

    it('returns false for odd numbers', () => {
      expect(isEven(1)).toBe(false);
      expect(isEven(3)).toBe(false);
      expect(isEven(-1)).toBe(false);
    });
  });

  describe('max function', () => {
    it('returns larger number when a > b', () => {
      expect(max(5, 3)).toBe(5);
    });

    it('returns larger number when b > a', () => {
      expect(max(3, 5)).toBe(5);
    });

    it('returns either when equal', () => {
      expect(max(5, 5)).toBe(5);
    });

    it('handles negative numbers', () => {
      expect(max(-1, -5)).toBe(-1);
    });

    // This helps kill >= mutations
    it('handles boundary correctly', () => {
      expect(max(10, 9)).toBe(10);
      expect(max(9, 10)).toBe(10);
    });
  });

  describe('greet function', () => {
    it('greets by name when name provided', () => {
      expect(greet('Alice')).toBe('Hello, Alice!');
    });

    it('uses default greeting for null', () => {
      expect(greet(null)).toBe('Hello, stranger!');
    });

    it('uses default greeting for empty string', () => {
      expect(greet('')).toBe('Hello, stranger!');
    });

    it('uses default greeting for whitespace', () => {
      expect(greet('   ')).toBe('Hello, stranger!');
    });

    // This helps kill && to || mutations
    it('trims whitespace from name', () => {
      expect(greet('  Bob  ')).toBe('Hello,   Bob  !');
    });
  });

  describe('calculateDiscount function', () => {
    it('calculates 10% discount correctly', () => {
      expect(calculateDiscount(100, 10)).toBe(90);
    });

    it('calculates 50% discount correctly', () => {
      expect(calculateDiscount(100, 50)).toBe(50);
    });

    it('handles 0% discount', () => {
      expect(calculateDiscount(100, 0)).toBe(100);
    });

    it('handles 100% discount', () => {
      expect(calculateDiscount(100, 100)).toBe(0);
    });

    it('throws for negative discount', () => {
      expect(() => calculateDiscount(100, -10)).toThrow('Invalid discount percentage');
    });

    it('throws for discount over 100', () => {
      expect(() => calculateDiscount(100, 110)).toThrow('Invalid discount percentage');
    });

    // This helps kill boundary mutations (< to <=, > to >=)
    it('handles boundary values', () => {
      expect(() => calculateDiscount(100, -1)).toThrow();
      expect(() => calculateDiscount(100, 101)).toThrow();
    });

    // This helps kill arithmetic mutations
    it('discount amount is proportional to price', () => {
      const discount1 = calculateDiscount(100, 20);
      const discount2 = calculateDiscount(200, 20);
      expect(discount2).toBe(discount1 * 2);
    });
  });

  describe('isPalindrome function', () => {
    it('returns true for palindromes', () => {
      expect(isPalindrome('racecar')).toBe(true);
      expect(isPalindrome('A man a plan a canal Panama')).toBe(true);
    });

    it('returns false for non-palindromes', () => {
      expect(isPalindrome('hello')).toBe(false);
      expect(isPalindrome('world')).toBe(false);
    });

    it('handles empty string', () => {
      expect(isPalindrome('')).toBe(true);
    });

    it('handles single character', () => {
      expect(isPalindrome('a')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(isPalindrome('RaceCar')).toBe(true);
    });

    it('ignores non-alphanumeric characters', () => {
      expect(isPalindrome('A-B-A')).toBe(true);
    });
  });
});
