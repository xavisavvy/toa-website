import * as fs from 'fs';

import { describe, it, expect, vi, afterEach } from 'vitest';

import { findCachedEpisodeAudioUrl } from '../server/podcast';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return { ...actual, existsSync: vi.fn(), readFileSync: vi.fn() };
});

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
