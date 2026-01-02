/**
 * Shared Test Utilities
 * Centralizes common test setup, factories, and helpers to reduce duplication
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import { Router } from 'wouter';

/**
 * Test data factories - centralized, typed test data generation
 */
export const TestFactory = {
  video: (overrides = {}) => ({
    id: 'test-video-1',
    title: 'Test Video Title',
    description: 'Test video description',
    thumbnail: 'https://i.ytimg.com/vi/test-video-1/maxresdefault.jpg',
    duration: '10:00',
    publishedAt: '2024-01-01T12:00:00Z',
    viewCount: '1000',
    url: 'https://www.youtube.com/watch?v=test-video-1',
    ...overrides,
  }),

  short: (overrides = {}) => ({
    id: 'test-short-1',
    title: 'Test Short',
    thumbnail: 'https://i.ytimg.com/vi/test-short-1/maxresdefault.jpg',
    duration: '0:45',
    publishedAt: '2024-01-01T12:00:00Z',
    durationSeconds: 45,
    ...overrides,
  }),

  playlistResponse: (videos = 3) => 
    Array.from({ length: videos }, (_, i) => 
      TestFactory.video({ 
        id: `video-${i + 1}`,
        title: `Video ${i + 1}`,
      })
    ),

  episode: (overrides = {}) => ({
    id: 'episode-1',
    title: 'Test Episode',
    description: 'Test Description',
    pubDate: '2024-01-01T12:00:00Z',
    duration: '3600',
    audioUrl: 'https://anchor.fm/test.mp3',
    ...overrides,
  }),

  character: (overrides = {}) => ({
    name: 'Test Character',
    race: 'Human',
    class: 'Fighter',
    level: 5,
    alignment: 'Lawful Good',
    avatarUrl: 'https://example.com/avatar.jpg',
    dndbeyondId: '12345',
    ...overrides,
  }),

  product: (overrides = {}) => ({
    id: '123',
    name: 'Test Product',
    price: '$10.00',
    image: 'https://example.com/product.jpg',
    url: 'https://etsy.com/listing/123',
    inStock: true,
    ...overrides,
  }),
};

/**
 * Creates a React Query client configured for testing
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Custom render function with all necessary providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = createTestQueryClient(), initialRoute = '/', ...renderOptions } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router base={initialRoute}>{children}</Router>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Mock window.location helper
 */
export function mockWindowLocation() {
  const originalLocation = window.location;
  
  // @ts-ignore - testing utility
  delete window.location;
  // @ts-ignore - testing utility
  window.location = { 
    href: '',
    pathname: '/',
    search: '',
    hash: '',
  };

  return {
    restore: () => {
      window.location = originalLocation;
    },
    getHref: () => window.location.href,
  };
}

/**
 * Mock fetch responses
 */
export const mockFetch = {
  success: (data: unknown) => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
        headers: new globalThis.Headers(),
        status: 200,
      }) as Promise<globalThis.Response>
    );
  },

  error: (status = 500, message = 'Internal Server Error') => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: message }),
        headers: new globalThis.Headers(),
        status,
      }) as Promise<globalThis.Response>
    );
  },

  network: () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    );
  },

  timeout: (delay = 5000) => {
    globalThis.fetch = vi.fn(() =>
      new Promise((_, reject) => 
        globalThis.setTimeout(() => reject(new Error('Request timeout')), delay)
      )
    );
  },
};

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
