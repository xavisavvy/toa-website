/**
 * API Mocking Utilities
 * Provides consistent mocks for external API dependencies
 */

import { vi } from 'vitest';

import { TestFactory } from './test-utils';

/**
 * YouTube API Mocks
 */
export const mockYouTubeAPI = {
  playlistSuccess: (videoCount = 3) => {
    vi.mock('../../server/youtube', () => ({
      getPlaylistVideos: vi.fn().mockResolvedValue(
        TestFactory.playlistResponse(videoCount)
      ),
    }));
  },

  playlistError: (message = 'YouTube API Error') => {
    vi.mock('../../server/youtube', () => ({
      getPlaylistVideos: vi.fn().mockRejectedValue(new Error(message)),
    }));
  },

  quotaExceeded: () => {
    vi.mock('../../server/youtube', () => ({
      getPlaylistVideos: vi.fn().mockRejectedValue(
        new Error('quotaExceeded')
      ),
    }));
  },
};

/**
 * Podcast API Mocks
 */
export const mockPodcastAPI = {
  feedSuccess: (episodeCount = 5) => {
    vi.mock('../../server/podcast', () => ({
      getPodcastFeed: vi.fn().mockResolvedValue(
        Array.from({ length: episodeCount }, (_, i) =>
          TestFactory.episode({ id: `ep-${i + 1}`, title: `Episode ${i + 1}` })
        )
      ),
    }));
  },

  feedError: (message = 'Podcast API Error') => {
    vi.mock('../../server/podcast', () => ({
      getPodcastFeed: vi.fn().mockRejectedValue(new Error(message)),
    }));
  },
};

/**
 * E-commerce API Mocks
 */
export const mockEtsyAPI = {
  listingsSuccess: (productCount = 10) => {
    vi.mock('../../server/etsy', () => ({
      getShopListings: vi.fn().mockResolvedValue(
        Array.from({ length: productCount }, (_, i) =>
          TestFactory.product({
            id: `${i + 1}`,
            name: `Product ${i + 1}`,
          })
        )
      ),
    }));
  },

  listingsError: (message = 'Etsy API Error') => {
    vi.mock('../../server/etsy', () => ({
      getShopListings: vi.fn().mockRejectedValue(new Error(message)),
    }));
  },
};

export const mockPrintfulAPI = {
  productsSuccess: (productCount = 10) => {
    vi.mock('../../server/printful', () => ({
      getProducts: vi.fn().mockResolvedValue(
        Array.from({ length: productCount }, (_, i) =>
          TestFactory.product({
            id: `${i + 1}`,
            name: `Product ${i + 1}`,
          })
        )
      ),
    }));
  },

  productsError: (message = 'Printful API Error') => {
    vi.mock('../../server/printful', () => ({
      getProducts: vi.fn().mockRejectedValue(new Error(message)),
    }));
  },
};

/**
 * D&D Beyond API Mocks
 */
export const mockDnDBeyondAPI = {
  characterSuccess: (overrides = {}) => {
    vi.mock('../../server/dndbeyond', () => ({
      getCharacterData: vi.fn().mockResolvedValue(
        TestFactory.character(overrides)
      ),
    }));
  },

  characterError: (message = 'D&D Beyond API Error') => {
    vi.mock('../../server/dndbeyond', () => ({
      getCharacterData: vi.fn().mockRejectedValue(new Error(message)),
    }));
  },
};

/**
 * Stripe API Mocks
 */
export const mockStripeAPI = {
  sessionSuccess: (sessionId = 'test_session_123') => {
    vi.mock('../../server/stripe', () => ({
      createCheckoutSession: vi.fn().mockResolvedValue({
        id: sessionId,
        url: `https://checkout.stripe.com/pay/${sessionId}`,
      }),
    }));
  },

  sessionError: (message = 'Stripe API Error') => {
    vi.mock('../../server/stripe', () => ({
      createCheckoutSession: vi.fn().mockRejectedValue(new Error(message)),
    }));
  },
};

/**
 * Mock all external APIs at once
 */
export function mockAllAPIs() {
  mockYouTubeAPI.playlistSuccess();
  mockPodcastAPI.feedSuccess();
  mockEtsyAPI.listingsSuccess();
  mockPrintfulAPI.productsSuccess();
  mockDnDBeyondAPI.characterSuccess();
  mockStripeAPI.sessionSuccess();
}

/**
 * Reset all API mocks
 */
export function resetAllAPIMocks() {
  vi.resetAllMocks();
}
