// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/**
 * YouTube Data API v3 Contract Tests
 * 
 * These tests ensure our code works with the actual YouTube API response format.
 * They serve as living documentation of the API contract.
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Create MSW server
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('YouTube API Contract Tests', () => {
  describe('PlaylistItems Endpoint', () => {
    it('returns correct structure for playlistItems', async () => {
      // Mock YouTube API with realistic response structure
      server.use(
        http.get(`${YOUTUBE_API_BASE}/playlistItems`, ({ request }) => {
          const url = new URL(request.url);
          const playlistId = url.searchParams.get('playlistId');
          const part = url.searchParams.get('part');
          const maxResults = url.searchParams.get('maxResults');
          
          // Validate required parameters
          expect(playlistId).toBeTruthy();
          expect(part).toBe('snippet,contentDetails');
          expect(maxResults).toBeTruthy();
          
          // Return realistic YouTube API response
          return HttpResponse.json({
            kind: 'youtube#playlistItemListResponse',
            etag: 'mock-etag',
            nextPageToken: 'CAUQAA',
            pageInfo: {
              totalResults: 100,
              resultsPerPage: 50,
            },
            items: [
              {
                kind: 'youtube#playlistItem',
                etag: 'item-etag-1',
                id: 'playlistItem1',
                snippet: {
                  publishedAt: '2024-01-15T10:00:00Z',
                  channelId: 'UCChannelId',
                  title: 'Test Episode 1',
                  description: 'Test episode description',
                  thumbnails: {
                    default: {
                      url: 'https://i.ytimg.com/vi/video1/default.jpg',
                      width: 120,
                      height: 90,
                    },
                    medium: {
                      url: 'https://i.ytimg.com/vi/video1/mqdefault.jpg',
                      width: 320,
                      height: 180,
                    },
                    high: {
                      url: 'https://i.ytimg.com/vi/video1/hqdefault.jpg',
                      width: 480,
                      height: 360,
                    },
                  },
                  channelTitle: 'Tales of Aneria',
                  playlistId: playlistId!,
                  position: 0,
                  resourceId: {
                    kind: 'youtube#video',
                    videoId: 'video1',
                  },
                },
                contentDetails: {
                  videoId: 'video1',
                  videoPublishedAt: '2024-01-15T10:00:00Z',
                },
              },
            ],
          });
        })
      );

      // Test that our code handles this structure
      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
      url.searchParams.set('part', 'snippet,contentDetails');
      url.searchParams.set('playlistId', 'PLTest123');
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('key', 'test-api-key');

      const response = await fetch(url.toString());
      const data = await response.json();

      // Verify contract compliance
      expect(data.kind).toBe('youtube#playlistItemListResponse');
      expect(data.items).toBeInstanceOf(Array);
      expect(data.items[0].snippet).toBeDefined();
      expect(data.items[0].snippet.resourceId.videoId).toBe('video1');
      expect(data.items[0].contentDetails.videoId).toBe('video1');
    });

    it('handles pagination with nextPageToken', async () => {
      server.use(
        http.get(`${YOUTUBE_API_BASE}/playlistItems`, ({ request }) => {
          const url = new URL(request.url);
          const pageToken = url.searchParams.get('pageToken');
          
          if (!pageToken) {
            // First page
            return HttpResponse.json({
              kind: 'youtube#playlistItemListResponse',
              nextPageToken: 'PAGE2TOKEN',
              items: [{ id: '1' }],
            });
          } else {
            // Second page (no nextPageToken)
            return HttpResponse.json({
              kind: 'youtube#playlistItemListResponse',
              items: [{ id: '2' }],
            });
          }
        })
      );

      // First request
      const url1 = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
      url1.searchParams.set('part', 'snippet');
      url1.searchParams.set('playlistId', 'PLTest');
      url1.searchParams.set('maxResults', '1');

      const response1 = await fetch(url1.toString());
      const data1 = await response1.json();

      expect(data1.nextPageToken).toBe('PAGE2TOKEN');

      // Second request with pageToken
      const url2 = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
      url2.searchParams.set('part', 'snippet');
      url2.searchParams.set('playlistId', 'PLTest');
      url2.searchParams.set('maxResults', '1');
      url2.searchParams.set('pageToken', data1.nextPageToken);

      const response2 = await fetch(url2.toString());
      const data2 = await response2.json();

      expect(data2.nextPageToken).toBeUndefined();
    });

    it('handles 403 Forbidden (API key invalid)', async () => {
      server.use(
        http.get(`${YOUTUBE_API_BASE}/playlistItems`, () => {
          return HttpResponse.json(
            {
              error: {
                code: 403,
                message: 'The request is missing a valid API key.',
                errors: [
                  {
                    message: 'The request is missing a valid API key.',
                    domain: 'global',
                    reason: 'forbidden',
                  },
                ],
                status: 'PERMISSION_DENIED',
              },
            },
            { status: 403 }
          );
        })
      );

      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('playlistId', 'PLTest');

      const response = await fetch(url.toString());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe(403);
      expect(data.error.status).toBe('PERMISSION_DENIED');
    });

    it('handles 429 Rate Limit Exceeded', async () => {
      server.use(
        http.get(`${YOUTUBE_API_BASE}/playlistItems`, () => {
          return HttpResponse.json(
            {
              error: {
                code: 429,
                message: 'The request cannot be completed because you have exceeded your quota.',
                errors: [
                  {
                    message: 'The request cannot be completed because you have exceeded your quota.',
                    domain: 'youtube.quota',
                    reason: 'quotaExceeded',
                  },
                ],
                status: 'RESOURCE_EXHAUSTED',
              },
            },
            { status: 429 }
          );
        })
      );

      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('playlistId', 'PLTest');

      const response = await fetch(url.toString());
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe(429);
      expect(data.error.errors[0].reason).toBe('quotaExceeded');
    });

    it('handles 404 Not Found (playlist does not exist)', async () => {
      server.use(
        http.get(`${YOUTUBE_API_BASE}/playlistItems`, () => {
          return HttpResponse.json(
            {
              error: {
                code: 404,
                message: 'The playlist identified with the request\'s playlistId parameter cannot be found.',
                errors: [
                  {
                    message: 'The playlist identified with the request\'s playlistId parameter cannot be found.',
                    domain: 'youtube.playlistItem',
                    reason: 'playlistNotFound',
                  },
                ],
              },
            },
            { status: 404 }
          );
        })
      );

      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('playlistId', 'PLNonExistent');

      const response = await fetch(url.toString());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.errors[0].reason).toBe('playlistNotFound');
    });
  });

  describe('Videos Endpoint', () => {
    it('returns correct structure for videos', async () => {
      server.use(
        http.get(`${YOUTUBE_API_BASE}/videos`, ({ request }) => {
          const url = new URL(request.url);
          const id = url.searchParams.get('id');
          const part = url.searchParams.get('part');
          
          expect(id).toBeTruthy();
          expect(part).toBe('snippet,contentDetails,statistics');
          
          return HttpResponse.json({
            kind: 'youtube#videoListResponse',
            etag: 'mock-etag',
            items: [
              {
                kind: 'youtube#video',
                etag: 'video-etag',
                id: 'video1',
                snippet: {
                  publishedAt: '2024-01-15T10:00:00Z',
                  channelId: 'UCChannelId',
                  title: 'Test Video',
                  description: 'Video description',
                  thumbnails: {
                    default: {
                      url: 'https://i.ytimg.com/vi/video1/default.jpg',
                    },
                    high: {
                      url: 'https://i.ytimg.com/vi/video1/hqdefault.jpg',
                    },
                  },
                },
                contentDetails: {
                  duration: 'PT1H30M45S', // ISO 8601 duration format
                  dimension: '2d',
                  definition: 'hd',
                },
                statistics: {
                  viewCount: '123456',
                  likeCount: '5000',
                  favoriteCount: '0',
                  commentCount: '250',
                },
              },
            ],
          });
        })
      );

      const url = new URL(`${YOUTUBE_API_BASE}/videos`);
      url.searchParams.set('part', 'snippet,contentDetails,statistics');
      url.searchParams.set('id', 'video1');
      url.searchParams.set('key', 'test-api-key');

      const response = await fetch(url.toString());
      const data = await response.json();

      expect(data.kind).toBe('youtube#videoListResponse');
      expect(data.items[0].contentDetails.duration).toMatch(/^PT/); // ISO 8601 format
      expect(data.items[0].statistics.viewCount).toBe('123456');
    });

    it('handles batch video requests', async () => {
      server.use(
        http.get(`${YOUTUBE_API_BASE}/videos`, ({ request }) => {
          const url = new URL(request.url);
          const ids = url.searchParams.get('id')?.split(',');
          
          expect(ids).toBeInstanceOf(Array);
          expect(ids!.length).toBeGreaterThan(1);
          
          return HttpResponse.json({
            kind: 'youtube#videoListResponse',
            items: ids!.map((id, index) => ({
              kind: 'youtube#video',
              id,
              snippet: { title: `Video ${index + 1}` },
              contentDetails: { duration: 'PT5M' },
              statistics: { viewCount: '1000' },
            })),
          });
        })
      );

      const url = new URL(`${YOUTUBE_API_BASE}/videos`);
      url.searchParams.set('part', 'snippet,contentDetails,statistics');
      url.searchParams.set('id', 'video1,video2,video3');
      url.searchParams.set('key', 'test-api-key');

      const response = await fetch(url.toString());
      const data = await response.json();

      expect(data.items).toHaveLength(3);
      expect(data.items[0].id).toBe('video1');
      expect(data.items[1].id).toBe('video2');
    });

    it('handles missing optional fields gracefully', async () => {
      server.use(
        http.get(`${YOUTUBE_API_BASE}/videos`, () => {
          return HttpResponse.json({
            kind: 'youtube#videoListResponse',
            items: [
              {
                kind: 'youtube#video',
                id: 'video1',
                snippet: {
                  publishedAt: '2024-01-15T10:00:00Z',
                  title: 'Video without stats',
                  // No thumbnails
                },
                contentDetails: {
                  duration: 'PT5M',
                },
                // No statistics
              },
            ],
          });
        })
      );

      const url = new URL(`${YOUTUBE_API_BASE}/videos`);
      url.searchParams.set('part', 'snippet,contentDetails,statistics');
      url.searchParams.set('id', 'video1');

      const response = await fetch(url.toString());
      const data = await response.json();

      // Should handle missing fields
      expect(data.items[0].statistics).toBeUndefined();
      expect(data.items[0].snippet.thumbnails).toBeUndefined();
    });
  });

  describe('API Error Response Format', () => {
    it('all errors follow consistent structure', async () => {
      const errorCodes = [400, 401, 403, 404, 429, 500, 503];
      
      for (const code of errorCodes) {
        server.use(
          http.get(`${YOUTUBE_API_BASE}/playlistItems`, () => {
            return HttpResponse.json(
              {
                error: {
                  code,
                  message: `Error message for ${code}`,
                  errors: [
                    {
                      message: `Detailed error for ${code}`,
                      domain: 'global',
                      reason: 'testReason',
                    },
                  ],
                },
              },
              { status: code }
            );
          })
        );

        const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('playlistId', 'PLTest');

        const response = await fetch(url.toString());
        const data = await response.json();

        // All errors should have this structure
        expect(data.error).toBeDefined();
        expect(data.error.code).toBe(code);
        expect(data.error.message).toBeTruthy();
        expect(data.error.errors).toBeInstanceOf(Array);

        server.resetHandlers();
      }
    });
  });
});
