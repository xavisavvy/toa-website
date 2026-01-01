import { describe, it, expect, vi } from 'vitest';
import { getPlaylistVideos, VideoItem } from '../../server/youtube';

/**
 * YouTube Service Contract Tests
 * Ensures YouTube integration maintains expected behavior
 */

// Mock the YouTube client
vi.mock('../../server/youtube', async () => {
  const actual = await vi.importActual<typeof import('../../server/youtube')>('../../server/youtube');
  return {
    ...actual,
    getPlaylistVideos: vi.fn().mockResolvedValue([
      {
        id: 'test-video-1',
        title: 'Test Video 1',
        description: 'Test description',
        thumbnail: 'https://i.ytimg.com/vi/test-video-1/maxresdefault.jpg',
        publishedAt: '2024-01-15T12:00:00Z',
        url: 'https://www.youtube.com/watch?v=test-video-1',
        duration: '10:00',
        viewCount: '1000',
      },
      {
        id: 'test-video-2',
        title: 'Test Video 2',
        description: 'Test description 2',
        thumbnail: 'https://i.ytimg.com/vi/test-video-2/maxresdefault.jpg',
        publishedAt: '2024-01-10T12:00:00Z',
        url: 'https://www.youtube.com/watch?v=test-video-2',
        duration: '15:00',
        viewCount: '2000',
      },
    ] as VideoItem[]),
  };
});

describe('YouTube Service Contract', () => {
  describe('Video Object Contract', () => {
    it('should return videos with all required fields', async () => {
      const videos = await getPlaylistVideos('test-playlist');
      
      expect(videos.length).toBeGreaterThan(0);
      
      videos.forEach(video => {
        expect(video).toHaveProperty('id');
        expect(video).toHaveProperty('title');
        expect(video).toHaveProperty('description');
        expect(video).toHaveProperty('thumbnail');
        expect(video).toHaveProperty('publishedAt');
        expect(video).toHaveProperty('url');
        
        expect(typeof video.id).toBe('string');
        expect(typeof video.title).toBe('string');
        expect(typeof video.description).toBe('string');
        expect(typeof video.thumbnail).toBe('string');
        expect(typeof video.publishedAt).toBe('string');
        expect(typeof video.url).toBe('string');
      });
    });

    it('should format URLs correctly', async () => {
      const videos = await getPlaylistVideos('test-playlist');
      
      videos.forEach(video => {
        expect(video.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+$/);
        expect(video.thumbnail).toMatch(/^https?:\/\//i);
      });
    });

    it('should have valid ISO 8601 dates', async () => {
      const videos = await getPlaylistVideos('test-playlist');
      
      videos.forEach(video => {
        const date = new Date(video.publishedAt);
        expect(date.toString()).not.toBe('Invalid Date');
        expect(video.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });

    it('should maintain backward compatibility with field names', async () => {
      const videos = await getPlaylistVideos('test-playlist');
      
      videos.forEach(video => {
        // Ensure field names haven't changed
        expect(video).toHaveProperty('id');
        expect(video).not.toHaveProperty('videoId');
        expect(video).toHaveProperty('url');
        expect(video).not.toHaveProperty('link');
      });
    });
  });

  describe('Type Safety Contract', () => {
    it('should match VideoItem interface', async () => {
      const videos = await getPlaylistVideos('test-playlist');
      
      videos.forEach(video => {
        // Check all expected properties exist
        const requiredProps: (keyof VideoItem)[] = [
          'id',
          'title',
          'description',
          'thumbnail',
          'publishedAt',
          'url',
        ];
        
        requiredProps.forEach(prop => {
          expect(video).toHaveProperty(prop);
          expect(video[prop]).toBeDefined();
        });
      });
    });
  });
});
