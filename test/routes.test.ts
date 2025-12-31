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
        .get('/api/youtube/playlist/PLTestValidId?maxResults=200')
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
  });
});
