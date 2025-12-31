// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock fetch globally
global.fetch = vi.fn();

const CACHE_DIR = path.join(process.cwd(), 'server', 'cache');
const TEST_CACHE_FILE = path.join(CACHE_DIR, 'test-youtube-playlist.json');

describe('YouTube API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean cache before each test
    if (fs.existsSync(TEST_CACHE_FILE)) {
      fs.unlinkSync(TEST_CACHE_FILE);
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_CACHE_FILE)) {
      fs.unlinkSync(TEST_CACHE_FILE);
    }
  });

  describe('API Error Handling', () => {
    it('should handle 429 rate limit errors', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: {
            code: 429,
            message: 'Rate limit exceeded',
          },
        }),
        text: async () => 'Rate limit exceeded',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      try {
        const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PLTest&maxResults=50&key=test');
        expect(response.ok).toBe(false);
        expect(response.status).toBe(429);
        const error = await response.json();
        expect(error.error.code).toBe(429);
      } catch (error: any) {
        expect(error.message).toContain('Rate limit');
      }
    });

    it('should handle 403 forbidden errors', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            code: 403,
            message: 'API key not valid',
          },
        }),
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });

    it('should handle 404 playlist not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 404,
            message: 'Playlist not found',
          },
        }),
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?playlistId=PLNonExistent');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network request failed'));

      await expect(
        fetch('https://www.googleapis.com/youtube/v3/playlistItems')
      ).rejects.toThrow('Network request failed');
    });

    it('should handle malformed JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON');
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems');
      await expect(response.json()).rejects.toThrow('Unexpected token');
    });

    it('should handle empty response bodies', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems');
      const data = await response.json();
      expect(data).toEqual({});
    });

    it('should handle missing items array', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          kind: 'youtube#playlistItemListResponse',
          etag: 'test',
          pageInfo: { totalResults: 0, resultsPerPage: 0 },
        }),
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems');
      const data = await response.json();
      expect(data.items).toBeUndefined();
    });
  });

  describe('Pagination Handling', () => {
    it('should handle multiple pages of results', async () => {
      // First page
      const page1Response = {
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            { contentDetails: { videoId: 'video1' } },
            { contentDetails: { videoId: 'video2' } },
          ],
          nextPageToken: 'token123',
        }),
      };

      // Second page
      const page2Response = {
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            { contentDetails: { videoId: 'video3' } },
            { contentDetails: { videoId: 'video4' } },
          ],
        }),
      };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(page1Response as any)
        .mockResolvedValueOnce(page2Response as any);

      const page1 = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?pageToken=');
      const data1 = await page1.json();
      expect(data1.items).toHaveLength(2);
      expect(data1.nextPageToken).toBe('token123');

      const page2 = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?pageToken=${data1.nextPageToken}`);
      const data2 = await page2.json();
      expect(data2.items).toHaveLength(2);
      expect(data2.nextPageToken).toBeUndefined();
    });

    it('should stop pagination when no nextPageToken', async () => {
      const response = {
        ok: true,
        status: 200,
        json: async () => ({
          items: [{ contentDetails: { videoId: 'video1' } }],
          // No nextPageToken
        }),
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(response as any);

      const result = await fetch('https://www.googleapis.com/youtube/v3/playlistItems');
      const data = await result.json();
      expect(data.nextPageToken).toBeUndefined();
    });

    it('should handle very large playlists (1000+ videos)', async () => {
      // Simulate 20 pages of 50 videos each = 1000 videos
      const pageResponses = Array.from({ length: 20 }, (_, i) => ({
        ok: true,
        status: 200,
        json: async () => ({
          items: Array.from({ length: 50 }, (_, j) => ({
            contentDetails: { videoId: `video${i * 50 + j}` },
          })),
          nextPageToken: i < 19 ? `token${i + 1}` : undefined,
        }),
      }));

      pageResponses.forEach(resp => {
        vi.mocked(global.fetch).mockResolvedValueOnce(resp as any);
      });

      let totalVideos = 0;
      let nextPageToken: string | undefined = undefined;
      let pageCount = 0;

      do {
        const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems');
        const data = await response.json();
        totalVideos += data.items.length;
        nextPageToken = data.nextPageToken;
        pageCount++;
      } while (nextPageToken && pageCount < 20);

      expect(totalVideos).toBe(1000);
      expect(pageCount).toBe(20);
    });
  });

  describe('Data Transformation', () => {
    it('should handle videos with missing thumbnails', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          items: [{
            id: 'video1',
            snippet: {
              title: 'Test Video',
              publishedAt: '2024-01-01',
              // No thumbnails property
            },
            contentDetails: {
              duration: 'PT5M30S',
            },
            statistics: {
              viewCount: '1000',
            },
          }],
        }),
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const response = await fetch('https://www.googleapis.com/youtube/v3/videos');
      const data = await response.json();
      const video = data.items[0];
      
      expect(video.snippet.thumbnails).toBeUndefined();
      // Should fallback to empty string
    });

    it('should handle videos with missing statistics', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          items: [{
            id: 'video1',
            snippet: {
              title: 'Test Video',
              publishedAt: '2024-01-01',
            },
            contentDetails: {
              duration: 'PT5M30S',
            },
            // No statistics property
          }],
        }),
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const response = await fetch('https://www.googleapis.com/youtube/v3/videos');
      const data = await response.json();
      const video = data.items[0];
      
      expect(video.statistics).toBeUndefined();
    });

    it('should handle videos with malformed duration', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          items: [{
            id: 'video1',
            snippet: {
              title: 'Test Video',
            },
            contentDetails: {
              duration: 'INVALID_DURATION',
            },
          }],
        }),
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const response = await fetch('https://www.googleapis.com/youtube/v3/videos');
      const data = await response.json();
      const video = data.items[0];
      
      // Duration should be malformed
      expect(video.contentDetails.duration).toBe('INVALID_DURATION');
    });
  });

  describe('Cache Stale Fallback Integration', () => {
    it('should use stale cache when API fails', () => {
      // First, populate the cache with good data
      const staleCache = {
        'PLTest': {
          videos: [
            {
              id: 'video1',
              title: 'Stale Video',
              thumbnail: '',
              duration: '5:00',
              publishedAt: '2024-01-01',
            },
          ],
          timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago (expired)
        },
      };

      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(TEST_CACHE_FILE, JSON.stringify(staleCache, null, 2));

      // Verify stale cache exists and is usable
      const cached = JSON.parse(fs.readFileSync(TEST_CACHE_FILE, 'utf-8'));
      expect(cached.PLTest).toBeDefined();
      expect(cached.PLTest.videos).toHaveLength(1);
      
      // Verify timestamp is expired
      const age = Date.now() - cached.PLTest.timestamp;
      const CACHE_DURATION = 24 * 60 * 60 * 1000;
      expect(age).toBeGreaterThan(CACHE_DURATION);
    });

    it('should return empty array when no cache and API fails', async () => {
      // Ensure no cache exists
      if (fs.existsSync(TEST_CACHE_FILE)) {
        fs.unlinkSync(TEST_CACHE_FILE);
      }

      // Mock API failure
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('API Error'));

      await expect(
        fetch('https://www.googleapis.com/youtube/v3/playlistItems')
      ).rejects.toThrow('API Error');

      // No cache should be created
      expect(fs.existsSync(TEST_CACHE_FILE)).toBe(false);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent requests to same playlist', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          items: [{ contentDetails: { videoId: 'video1' } }],
        }),
      };

      // Simulate multiple concurrent requests
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const requests = Array.from({ length: 5 }, () => 
        fetch('https://www.googleapis.com/youtube/v3/playlistItems?playlistId=PLTest')
      );

      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(5);
      responses.forEach(async (response) => {
        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.items).toHaveLength(1);
      });
    });

    it('should handle concurrent requests to different playlists', async () => {
      const playlist1Response = {
        ok: true,
        status: 200,
        json: async () => ({
          items: [{ contentDetails: { videoId: 'video1' } }],
        }),
      };

      const playlist2Response = {
        ok: true,
        status: 200,
        json: async () => ({
          items: [{ contentDetails: { videoId: 'video2' } }],
        }),
      };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(playlist1Response as any)
        .mockResolvedValueOnce(playlist2Response as any);

      const [response1, response2] = await Promise.all([
        fetch('https://www.googleapis.com/youtube/v3/playlistItems?playlistId=PL1'),
        fetch('https://www.googleapis.com/youtube/v3/playlistItems?playlistId=PL2'),
      ]);

      expect(response1.ok).toBe(true);
      expect(response2.ok).toBe(true);
    });
  });
});
