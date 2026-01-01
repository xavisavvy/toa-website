import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';

/**
 * API Contract Tests
 * Validates that API responses match expected schemas and behavior contracts
 */

// Mock external dependencies
vi.mock('../../server/youtube', () => ({
  getPlaylistVideos: vi.fn().mockResolvedValue([
    {
      id: 'test-video-1',
      title: 'Test Video',
      description: 'Test Description',
      thumbnail: 'https://i.ytimg.com/vi/test-video-1/maxresdefault.jpg',
      publishedAt: '2024-01-01T12:00:00Z',
      url: 'https://www.youtube.com/watch?v=test-video-1',
      duration: '10:00',
      viewCount: '1000',
    },
  ]),
}));

vi.mock('../../server/storage');

describe('API Contract Tests', () => {
  let app: Express;

  function createTestApp() {
    const testApp = express();
    testApp.use(express.json());
    registerRoutes(testApp);
    return testApp;
  }

  describe('YouTube API Contract', () => {
    it('should return array of videos with required fields', async () => {
      app = createTestApp();
      const response = await request(app).get('/api/youtube/playlist/test-playlist?maxResults=10');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const video = response.body[0];
        expect(video).toHaveProperty('id');
        expect(video).toHaveProperty('title');
        expect(video).toHaveProperty('description');
        expect(video).toHaveProperty('thumbnail');
        expect(video).toHaveProperty('publishedAt');
        expect(video).toHaveProperty('url');
        
        // Type validations
        expect(typeof video.id).toBe('string');
        expect(typeof video.title).toBe('string');
        expect(typeof video.description).toBe('string');
        expect(typeof video.thumbnail).toBe('string');
        expect(typeof video.publishedAt).toBe('string');
        expect(typeof video.url).toBe('string');
        
        // URL format validations
        expect(video.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
        expect(video.thumbnail).toMatch(/^https?:\/\//);
      }
    });

    it('should validate playlist ID format', async () => {
      app = createTestApp();
      const response = await request(app).get('/api/youtube/playlist/invalid$#@playlist');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate maxResults parameter', async () => {
      app = createTestApp();
      const response = await request(app).get('/api/youtube/playlist/test-playlist?maxResults=999999');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Response Contract', () => {
    it('should return consistent error format for invalid requests', async () => {
      app = createTestApp();
      const response = await request(app).get('/api/youtube/playlist/invalid$playlist');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain field names', async () => {
      app = createTestApp();
      const response = await request(app).get('/api/youtube/playlist/test-playlist?maxResults=10');
      
      if (response.body.length > 0) {
        const video = response.body[0];
        // Ensure old field names still exist (not renamed)
        expect(video).toHaveProperty('id');
        expect(video).toHaveProperty('title');
        expect(video).not.toHaveProperty('videoId'); // Shouldn't rename
        expect(video).not.toHaveProperty('name'); // Shouldn't rename
      }
    });
  });
});
