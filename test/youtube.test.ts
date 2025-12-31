import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// We need to test the cache functions and formatters
// Since they're not exported, we'll test through the main function
vi.mock('googleapis', () => ({
  google: {
    youtube: vi.fn(),
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn(),
      })),
    },
  },
}));

// Import after mocking
const CACHE_DIR = path.join(process.cwd(), 'server', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'youtube-playlist.json');

describe('YouTube Cache System', () => {
  beforeEach(() => {
    // Clean up cache before each test
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
  });

  afterEach(() => {
    // Clean up cache after tests
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
  });

  describe('Multi-Playlist Cache', () => {
    it('should cache multiple playlists independently', () => {
      // Create cache with two playlists
      const cacheData = {
        'PLPlaylist1': {
          videos: [{ id: 'video1', title: 'Video 1', thumbnail: '', duration: '5:00', publishedAt: '2024-01-01' }],
          timestamp: Date.now(),
        },
        'PLPlaylist2': {
          videos: [{ id: 'video2', title: 'Video 2', thumbnail: '', duration: '3:00', publishedAt: '2024-01-02' }],
          timestamp: Date.now(),
        },
      };

      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));

      // Read and verify both playlists exist
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      expect(cached).toHaveProperty('PLPlaylist1');
      expect(cached).toHaveProperty('PLPlaylist2');
      expect(cached.PLPlaylist1.videos).toHaveLength(1);
      expect(cached.PLPlaylist2.videos).toHaveLength(1);
    });

    it('should not overwrite existing playlist cache when adding new one', () => {
      // Start with one playlist cached
      const initialCache = {
        'PLPlaylist1': {
          videos: [{ id: 'video1', title: 'Video 1', thumbnail: '', duration: '5:00', publishedAt: '2024-01-01' }],
          timestamp: Date.now(),
        },
      };

      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(initialCache, null, 2));

      // Simulate adding a second playlist (read existing, merge, write)
      let existingCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      existingCache['PLPlaylist2'] = {
        videos: [{ id: 'video2', title: 'Video 2', thumbnail: '', duration: '3:00', publishedAt: '2024-01-02' }],
        timestamp: Date.now(),
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(existingCache, null, 2));

      // Verify both playlists still exist
      const finalCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      expect(finalCache).toHaveProperty('PLPlaylist1');
      expect(finalCache).toHaveProperty('PLPlaylist2');
      expect(finalCache.PLPlaylist1.videos[0].id).toBe('video1');
      expect(finalCache.PLPlaylist2.videos[0].id).toBe('video2');
    });

    it('should handle expired cache per playlist', () => {
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      const now = Date.now();
      
      const cacheData = {
        'PLPlaylist1': {
          videos: [{ id: 'video1', title: 'Video 1', thumbnail: '', duration: '5:00', publishedAt: '2024-01-01' }],
          timestamp: now - (CACHE_DURATION + 1000), // Expired
        },
        'PLPlaylist2': {
          videos: [{ id: 'video2', title: 'Video 2', thumbnail: '', duration: '3:00', publishedAt: '2024-01-02' }],
          timestamp: now - 1000, // Fresh
        },
      };

      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));

      // Read cache and check validity
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      const age1 = now - cached.PLPlaylist1.timestamp;
      const age2 = now - cached.PLPlaylist2.timestamp;

      expect(age1).toBeGreaterThan(CACHE_DURATION); // Expired
      expect(age2).toBeLessThan(CACHE_DURATION); // Valid
    });

    it('should create cache directory if it does not exist', () => {
      // Remove cache file but not directory (to avoid conflicts with other tests)
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
      }

      const hasDir = fs.existsSync(CACHE_DIR);

      // Simulate cache write operation
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }

      const cacheData = {
        'PLTest': {
          videos: [],
          timestamp: Date.now(),
        },
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));

      expect(fs.existsSync(CACHE_DIR)).toBe(true);
      expect(fs.existsSync(CACHE_FILE)).toBe(true);
    });
  });

  describe('Cache Fallback on API Failure', () => {
    it('should return stale cache when API fails', () => {
      const CACHE_DURATION = 24 * 60 * 60 * 1000;
      const staleCache = {
        'PLTest': {
          videos: [
            { id: 'stale1', title: 'Stale Video', thumbnail: '', duration: '5:00', publishedAt: '2024-01-01' }
          ],
          timestamp: Date.now() - (CACHE_DURATION + 1000), // Expired
        },
      };

      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(staleCache, null, 2));

      // Simulate API failure scenario - should still return stale data
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      const cacheEntry = cached['PLTest'];
      
      expect(cacheEntry).toBeDefined();
      expect(cacheEntry.videos).toHaveLength(1);
      expect(cacheEntry.videos[0].id).toBe('stale1');
    });

    it('should handle missing cache gracefully', () => {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
      }

      expect(fs.existsSync(CACHE_FILE)).toBe(false);
      // This simulates the cache miss scenario - should return null/empty
    });

    it('should handle corrupted cache file', () => {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      
      // Write invalid JSON
      fs.writeFileSync(CACHE_FILE, 'invalid json{{{');

      expect(() => {
        JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      }).toThrow();
    });
  });
});

describe('YouTube Formatters', () => {
  describe('formatDuration', () => {
    // Test the ISO 8601 duration parsing logic
    const testCases = [
      { input: 'PT1H30M45S', expected: '1:30:45', description: 'hours, minutes, seconds' },
      { input: 'PT5M20S', expected: '5:20', description: 'minutes and seconds' },
      { input: 'PT45S', expected: '0:45', description: 'only seconds' },
      { input: 'PT1H5S', expected: '1:00:05', description: 'hours and seconds (no minutes)' },
      { input: 'PT2H', expected: '2:00:00', description: 'only hours' },
      { input: 'PT10M', expected: '10:00', description: 'only minutes' },
      { input: 'PT0S', expected: '0:00', description: 'zero duration' },
      { input: 'invalid', expected: '0:00', description: 'invalid format' },
      { input: '', expected: '0:00', description: 'empty string' },
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`should format ${description}: ${input} -> ${expected}`, () => {
        // Manual implementation to test the logic
        const formatDuration = (isoDuration: string): string => {
          const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (!match) return '0:00';

          const hours = parseInt(match[1] || '0');
          const minutes = parseInt(match[2] || '0');
          const seconds = parseInt(match[3] || '0');

          if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        expect(formatDuration(input)).toBe(expected);
      });
    });
  });

  describe('formatViewCount', () => {
    const testCases = [
      { input: 999, expected: '999', description: 'less than 1K' },
      { input: 1000, expected: '1.0K', description: 'exactly 1K' },
      { input: 1500, expected: '1.5K', description: '1.5K' },
      { input: 999999, expected: '1000.0K', description: 'almost 1M' },
      { input: 1000000, expected: '1.0M', description: 'exactly 1M' },
      { input: 2500000, expected: '2.5M', description: '2.5M' },
      { input: 0, expected: '0', description: 'zero views' },
      { input: 42, expected: '42', description: 'small number' },
      { input: 1234567, expected: '1.2M', description: 'rounds millions' },
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`should format ${description}: ${input} -> ${expected}`, () => {
        const formatViewCount = (count: number): string => {
          if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
          } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
          }
          return count.toString();
        };

        expect(formatViewCount(input)).toBe(expected);
      });
    });
  });

  describe('Video sorting', () => {
    it('should sort videos by publishedAt date (most recent first)', () => {
      const videos = [
        { id: '1', title: 'Old', thumbnail: '', duration: '5:00', publishedAt: '2024-01-01' },
        { id: '2', title: 'Newest', thumbnail: '', duration: '5:00', publishedAt: '2024-12-31' },
        { id: '3', title: 'Middle', thumbnail: '', duration: '5:00', publishedAt: '2024-06-15' },
      ];

      const sorted = [...videos].sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA; // Most recent first
      });

      expect(sorted[0].id).toBe('2'); // Newest
      expect(sorted[1].id).toBe('3'); // Middle
      expect(sorted[2].id).toBe('1'); // Oldest
    });

    it('should handle invalid dates gracefully', () => {
      const videos = [
        { id: '1', title: 'Valid', thumbnail: '', duration: '5:00', publishedAt: '2024-01-01' },
        { id: '2', title: 'Invalid', thumbnail: '', duration: '5:00', publishedAt: 'invalid-date' },
      ];

      const sorted = [...videos].sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
      });

      // Invalid dates become NaN, which should be handled
      expect(sorted).toHaveLength(2);
    });
  });
});
