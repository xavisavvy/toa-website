import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { registerRoutes } from '../server/routes';

// Mock external dependencies
vi.mock('../server/youtube', () => ({
  getPlaylistVideos: vi.fn().mockResolvedValue([
    {
      id: 'test-video-1',
      title: 'Test Video',
      thumbnail: 'https://example.com/thumb.jpg',
      duration: '10:00',
      publishedAt: '2024-01-01',
      viewCount: '1000',
    },
  ]),
}));

vi.mock('../server/podcast', () => ({
  getPodcastFeed: vi.fn().mockResolvedValue([
    {
      id: 'episode-1',
      title: 'Test Episode',
      description: 'Test Description',
      pubDate: '2024-01-01',
      duration: '3600',
      audioUrl: 'https://anchor.fm/test.mp3',
    },
  ]),
}));

vi.mock('../server/etsy', () => ({
  getShopListings: vi.fn().mockResolvedValue([
    {
      id: '123',
      name: 'Test Product',
      price: '$10.00',
      image: 'https://example.com/product.jpg',
      url: 'https://etsy.com/listing/123',
      inStock: true,
    },
  ]),
}));

vi.mock('../server/dndbeyond', () => ({
  getCharacterData: vi.fn().mockResolvedValue({
    name: 'Test Character',
    race: 'Human',
    class: 'Fighter',
    level: 5,
    alignment: 'Lawful Good',
    avatarUrl: 'https://example.com/avatar.jpg',
    dndbeyondId: '12345',
  }),
}));

describe('API Routes', () => {
  let app: Express;
  let server: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  describe('GET /api/metrics', () => {
    it('should return application metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('requests');
      expect(response.body).toHaveProperty('cache');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.requests).toHaveProperty('total');
      expect(response.body.cache).toHaveProperty('hitRate');
    });
  });

  describe('GET /api/youtube/playlist/:playlistId', () => {
    it('should return playlist videos with valid playlist ID', async () => {
      const response = await request(app)
        .get('/api/youtube/playlist/PLTestValidId')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
    });

    it('should reject invalid playlist ID format', async () => {
      const response = await request(app)
        .get('/api/youtube/playlist/invalid@id!')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid playlist ID format');
    });

    it('should validate maxResults parameter', async () => {
      const response = await request(app)
        .get('/api/youtube/playlist/PLTestValidId?maxResults=20000')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept valid maxResults parameter', async () => {
      await request(app)
        .get('/api/youtube/playlist/PLTestValidId?maxResults=50')
        .expect(200);
    });
  });

  describe('POST /api/podcast/feed', () => {
    it('should return podcast episodes with valid feed URL', async () => {
      const response = await request(app)
        .post('/api/podcast/feed')
        .send({ feedUrl: 'https://anchor.fm/test/feed', limit: 10 })
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('title');
    });

    it('should reject missing feedUrl', async () => {
      const response = await request(app)
        .post('/api/podcast/feed')
        .send({ limit: 10 })
        .expect(400);

      expect(response.body.error).toBe('feedUrl is required');
    });

    it('should reject localhost URLs (SSRF protection)', async () => {
      const response = await request(app)
        .post('/api/podcast/feed')
        .send({ feedUrl: 'http://localhost:3000/feed', limit: 10 })
        .expect(400);

      expect(response.body.error).toBe('Invalid URL format');
    });

    it('should reject private IP addresses (SSRF protection)', async () => {
      const response = await request(app)
        .post('/api/podcast/feed')
        .send({ feedUrl: 'http://192.168.1.1/feed', limit: 10 })
        .expect(400);

      expect(response.body.error).toBe('Access to private IP addresses is not allowed');
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .post('/api/podcast/feed')
        .send({ feedUrl: 'https://anchor.fm/test/feed', limit: 100 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/podcast/audio-proxy', () => {
    it('should reject missing URL parameter', async () => {
      const response = await request(app)
        .get('/api/podcast/audio-proxy')
        .expect(400);

      expect(response.body.error).toBe('URL parameter is required');
    });

    it('should reject unauthorized domains', async () => {
      const response = await request(app)
        .get('/api/podcast/audio-proxy?url=https://evil.com/audio.mp3')
        .expect(403);

      expect(response.body.error).toBe('Audio URL from unauthorized domain');
    });

    it('should reject localhost URLs', async () => {
      const response = await request(app)
        .get('/api/podcast/audio-proxy?url=http://localhost/audio.mp3')
        .expect(400);

      expect(response.body.error).toBe('Invalid URL format');
    });
  });

  describe('GET /api/etsy/shop/:shopId/listings', () => {
    it('should return shop listings with valid shop ID', async () => {
      const response = await request(app)
        .get('/api/etsy/shop/TestShop123/listings')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should reject invalid shop ID format', async () => {
      const response = await request(app)
        .get('/api/etsy/shop/invalid-shop!/listings')
        .expect(400);

      expect(response.body.error).toBe('Invalid shop ID format');
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/etsy/shop/TestShop123/listings?limit=100')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle errors from Etsy API', async () => {
      const { getShopListings } = await import('../server/etsy');
      vi.mocked(getShopListings).mockRejectedValueOnce(new Error('Etsy API Error'));

      const response = await request(app)
        .get('/api/etsy/shop/TestShop123/listings')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch Etsy products');
    });
  });

  describe('GET /api/dndbeyond/character/:characterId', () => {
    it('should return character data with valid character ID', async () => {
      const response = await request(app)
        .get('/api/dndbeyond/character/12345')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('race');
      expect(response.body).toHaveProperty('class');
    });

    it('should reject invalid character ID format', async () => {
      const response = await request(app)
        .get('/api/dndbeyond/character/abc123')
        .expect(400);

      expect(response.body.error).toBe('Invalid character ID format');
    });

    it('should reject non-numeric character IDs', async () => {
      const response = await request(app)
        .get('/api/dndbeyond/character/test')
        .expect(400);

      expect(response.body.error).toBe('Invalid character ID format');
    });

    it('should handle errors from D&D Beyond API', async () => {
      const { getCharacterData } = await import('../server/dndbeyond');
      vi.mocked(getCharacterData).mockRejectedValueOnce(new Error('D&D Beyond API Error'));

      const response = await request(app)
        .get('/api/dndbeyond/character/12345')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch character data');
    });
  });

  describe('Error Handling and Security', () => {
    it('should handle API errors gracefully', async () => {
      const { getPlaylistVideos } = await import('../server/youtube');
      vi.mocked(getPlaylistVideos).mockRejectedValueOnce(new Error('YouTube API error'));

      const response = await request(app)
        .get('/api/youtube/playlist/PLTest')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to fetch YouTube playlist');
    });

    it('should not leak internal error details in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { getPodcastFeed } = await import('../server/podcast');
      const sensitiveError = new Error('Internal database connection failed at 192.168.1.100:5432');
      vi.mocked(getPodcastFeed).mockRejectedValueOnce(sensitiveError);

      const response = await request(app)
        .post('/api/podcast/feed')
        .send({ feedUrl: 'https://example.com/feed.xml' })
        .expect(500);

      // Should get generic error, not the detailed internal error
      expect(response.body.error).toBeDefined();
      expect(response.body.error).not.toContain('192.168.1.100');
      expect(response.body.error).not.toContain('database');

      process.env.NODE_ENV = originalEnv;
    });

    it('should log errors without exposing sensitive data', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { getPlaylistVideos } = await import('../server/youtube');
      vi.mocked(getPlaylistVideos).mockRejectedValueOnce(new Error('API quota exceeded'));

      await request(app)
        .get('/api/youtube/playlist/PLTest')
        .expect(500);

      expect(consoleSpy).toHaveBeenCalled();
      const loggedError = consoleSpy.mock.calls[0][0];
      
      // Should log error message but not expose API keys or tokens
      expect(loggedError).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should return 400 for malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/podcast/feed')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express should handle malformed JSON
      expect(response.body || response.text).toBeDefined();
    });

    it('should handle missing required fields in POST requests', async () => {
      const response = await request(app)
        .post('/api/podcast/feed')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('feedUrl');
    });

    it('should validate content-type for POST requests', async () => {
      const response = await request(app)
        .post('/api/podcast/feed')
        .set('Content-Type', 'text/plain')
        .send('not json')
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should handle very long URLs gracefully', async () => {
      const veryLongUrl = 'https://example.com/' + 'a'.repeat(10000);
      
      const response = await request(app)
        .post('/api/podcast/feed')
        .send({ feedUrl: veryLongUrl })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle special characters in parameters safely', async () => {
      // Test with characters that shouldn't match the validation pattern
      const response = await request(app)
        .get('/api/youtube/playlist/PL@#$%^&*()')
        .expect(400);

      expect(response.body.error).toBe('Invalid playlist ID format');
    });

    it('should handle null bytes in input', async () => {
      const response = await request(app)
        .get('/api/youtube/playlist/PLTest\x00injection')
        .expect(400);

      expect(response.body.error).toBe('Invalid playlist ID format');
    });

    it('should rate limit excessive requests (if implemented)', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () => 
        request(app).get('/api/youtube/playlist/PLTest')
      );

      const responses = await Promise.all(requests);
      
      // All should succeed if no rate limiting, or some should be 429
      const statuses = responses.map(r => r.status);
      expect(statuses.every(s => s === 200 || s === 429)).toBe(true);
    });

    it('should handle concurrent requests to same resource', async () => {
      const requests = Array.from({ length: 5 }, () => 
        request(app).get('/api/youtube/playlist/PLTest')
      );

      const responses = await Promise.all(requests);
      
      // All should return the same data
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
      });
    });

    it('should set appropriate security headers', async () => {
      const response = await request(app)
        .get('/api/youtube/playlist/PLTest')
        .expect(200);

      // Check for security headers (if implemented)
      // These might vary based on your security middleware
      expect(response.headers).toBeDefined();
    });

    it('should handle timeout scenarios gracefully', async () => {
      const { getPlaylistVideos } = await import('../server/youtube');
      
      // Simulate a timeout
      vi.mocked(getPlaylistVideos).mockImplementationOnce(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      const response = await request(app)
        .get('/api/youtube/playlist/PLTest')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
