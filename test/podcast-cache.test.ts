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

  it('returns the cached audio URL for a matching episode', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

    expect(findCachedEpisodeAudioUrl('https://anchor.fm/one.mp3')).toBe('https://anchor.fm/one.mp3');
  });

  it('returns undefined for a URL that is not in the feed', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cache));

    expect(findCachedEpisodeAudioUrl('https://anchor.fm/other.mp3')).toBeUndefined();
  });

  it('returns undefined when there is no cache file', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(findCachedEpisodeAudioUrl('https://anchor.fm/one.mp3')).toBeUndefined();
  });

  it('returns undefined when the cache file is corrupt', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('not json');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(findCachedEpisodeAudioUrl('https://anchor.fm/one.mp3')).toBeUndefined();
    errorSpy.mockRestore();
  });
});
