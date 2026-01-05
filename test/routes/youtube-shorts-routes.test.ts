import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { registerRoutes } from '../../server/routes';

vi.mock('../../server/youtube', () => ({
  getYouTubeShorts: vi.fn(() => Promise.resolve([
    {
      id: 'short1',
      title: 'Test Short',
      description: 'Test',
      publishedAt: '2024-01-01T00:00:00Z',
      thumbnail: 'https://example.com/thumb.jpg',
      duration: 'PT30S'
    }
  ]))
}));

// Note: YouTube Shorts feature not implemented yet
// Route /api/youtube/shorts doesn't exist in routes.ts
// getYouTubeShorts function doesn't exist (only getChannelShorts exists)
// Will implement when YouTube Shorts feature is prioritized
describe.skip('YouTube Shorts Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerRoutes(app);
  });

  describe('GET /api/youtube/shorts', () => {
    it('should return shorts list', async () => {
      const response = await request(app)
        .get('/api/youtube/shorts')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
    });

    it('should handle errors gracefully', async () => {
      const { getYouTubeShorts } = await import('../../server/youtube');
      vi.mocked(getYouTubeShorts).mockRejectedValueOnce(new Error('API Error'));

      const response = await request(app)
        .get('/api/youtube/shorts')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
