import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { expect, afterEach } from 'vitest';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.PORT = '5000';

// Mock Audio API globally for all tests
globalThis.Audio = function Audio() {
  return {
    play: () => Promise.resolve(),
    pause: () => {},
    currentTime: 0,
    volume: 0.5,
    loop: false,
  };
} as unknown as typeof Audio;
