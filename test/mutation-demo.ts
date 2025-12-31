/**
 * Mutation Testing Demo
 * 
 * This file demonstrates mutation testing concepts with simple examples.
 * Run: npx stryker run stryker-demo.conf.json
 */

export function add(a: number, b: number): number {
  return a + b;
}

export function isEven(n: number): boolean {
  return n % 2 === 0;
}

export function max(a: number, b: number): number {
  if (a > b) {
    return a;
  }
  return b;
}

export function greet(name: string | null): string {
  if (name && name.trim()) {
    return `Hello, ${name}!`;
  }
  return 'Hello, stranger!';
}

export function calculateDiscount(price: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid discount percentage');
  }
  
  const discount = price * (discountPercent / 100);
  return price - discount;
}

export function isPalindrome(str: string): boolean {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const reversed = cleaned.split('').reverse().join('');
  return cleaned === reversed;
}
