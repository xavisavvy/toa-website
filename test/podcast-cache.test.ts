import * as fs from 'fs';

import { describe, it, expect, vi, afterEach } from 'vitest';

import { findCachedEpisodeAudioUrl } from '../server/podcast';

const { parseURL } = vi.hoisted(() => ({ parseURL: vi.fn() }));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

vi.mock('rss-parser', () => ({
  default: class {
    parseURL = parseURL;
  },
}));

const cache = {
  feedUrl: 'https://feed.example.com/rss',
  timestamp: Date.now(),
  episodes: [
    { id: '1', title: 'One', description: '', pubDate: '', audioUrl: 'https://anchor.fm/one.mp3' },
    { id: '2', title: 'Two', description: '', pubDate: '' },
  ],
};

describe('findCachedEpisodeAudioUrl', () => {
  afterEach(() => {
    vi.mocked(fs.existsSync).mockReset();
    vi.mocked(fs.readFileSync).mockReset();
    parseURL.mockReset();
    vi.unstubAllEnvs();
  });

  describe('with a configured feed URL', () => {
    const feedUrl = 'https://anchor.fm/s/test/podcast/rss';

    it('returns the feed\'s copy of the URL for an episode in the feed', async () => {
      vi.stubEnv('PODCAST_FEED_URL', feedUrl);
      vi.mocked(fs.existsSync).mockReturnValue(false);
      parseURL.mockResolvedValue({
        items: [{ guid: '1', title: 'One', enclosure: { url: 'https://anchor.fm/one.mp3' } }],
      });
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await expect(findCachedEpisodeAudioUrl('https://anchor.fm/one.mp3')).resolves.toBe('https://anchor.fm/one.mp3');
      expect(parseURL).toHaveBeenCalledWith(feedUrl);
      infoSpy.mockRestore();
    });

    it('returns undefined when the URL is not in the feed or the cache', async () => {
      vi.stubEnv('PODCAST_FEED_URL', feedUrl);
      vi.mocked(fs.existsSync).mockReturnValue(false);
      parseURL.mockResolvedValue({
        items: [{ guid: '1', title: 'One', enclosure: { url: 'https://anchor.fm/one.mp3' } }],
      });
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await expect(findCachedEpisodeAudioUrl('https://anchor.fm/other.mp3')).resolves.toBeUndefined();
      infoSpy.mockRestore();
    });

    it('falls back to the cache file when the feed fetch fails', async () => {
      vi.stubEnv('PODCAST_FEED_URL', feedUrl);
      // The cache file belongs to a different feed URL, so getPodcastFeed has
      // no stale copy to fall back on and the feed lookup itself fails.
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));
      parseURL.mockRejectedValue(new Error('feed down'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await expect(findCachedEpisodeAudioUrl('https://anchor.fm/one.mp3')).resolves.toBe('https://anchor.fm/one.mp3');
      errorSpy.mockRestore();
      infoSpy.mockRestore();
    });
  });

  it('returns the cached audio URL for a matching episode', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

    await expect(findCachedEpisodeAudioUrl('https://anchor.fm/one.mp3')).resolves.toBe('https://anchor.fm/one.mp3');
  });

  it('returns undefined for a URL that is not in the feed', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

    await expect(findCachedEpisodeAudioUrl('https://anchor.fm/other.mp3')).resolves.toBeUndefined();
  });

  it('returns undefined when there is no cache file', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await expect(findCachedEpisodeAudioUrl('https://anchor.fm/one.mp3')).resolves.toBeUndefined();
  });

  it('returns undefined when the cache file is corrupt', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('not json');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(findCachedEpisodeAudioUrl('https://anchor.fm/one.mp3')).resolves.toBeUndefined();
    errorSpy.mockRestore();
  });
});
