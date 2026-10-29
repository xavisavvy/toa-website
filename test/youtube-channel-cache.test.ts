import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory stand-in for the shared cache file, so this suite never touches
// server/cache/youtube-playlist.json that other suites use
const files = new Map<string, string>();
vi.mock('fs', () => {
  const fsMock = {
    existsSync: (p: string) => files.has(p) || p.endsWith('cache'),
    readFileSync: (p: string) => {
      const content = files.get(p);
      if (content === undefined) {throw new Error('ENOENT');}
      return content;
    },
    writeFileSync: (p: string, data: string) => { files.set(p, data); },
    mkdirSync: () => undefined,
  };
  return { ...fsMock, default: fsMock };
});

const { getChannelVideos, isAllowedChannel } = await import('../server/youtube');

const CHANNEL = 'UC7PTdudxJ43HMLJVv2QxVoQ';

function videoIds(count: number) {
  return Array.from({ length: count }, (_, i) => `vid${i}`);
}

// Fake YouTube API: search.list pages of 50 ids, videos.list returns details
function installFetch() {
  const fetchMock = vi.fn((input: string | URL) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/search')) {
      const page = Number(url.searchParams.get('pageToken') ?? 0);
      const ids = videoIds(500).slice(page * 50, page * 50 + 50);
      return Promise.resolve(new Response(JSON.stringify({
        items: ids.map(videoId => ({ id: { videoId } })),
        nextPageToken: page < 9 ? String(page + 1) : undefined,
      })));
    }
    const ids = (url.searchParams.get('id') ?? '').split(',').filter(Boolean);
    return Promise.resolve(new Response(JSON.stringify({
      items: ids.map((id, i) => ({
        id,
        snippet: { title: id, publishedAt: new Date(Date.UTC(2026, 0, 1) - i * 1000).toISOString(), thumbnails: {} },
        contentDetails: { duration: 'PT10M' },
        statistics: {},
      })),
    })));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('YouTube channel cache', () => {
  beforeEach(() => {
    files.clear();
    process.env.YOUTUBE_API_KEY = 'test-key';
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.YOUTUBE_ALLOWED_CHANNEL_IDS;
  });

  it('a small request cannot shrink the cached list for larger requests', async () => {
    installFetch();

    const small = await getChannelVideos(CHANNEL, 1);
    const large = await getChannelVideos(CHANNEL, 500);

    expect(small).toHaveLength(1);
    expect(large).toHaveLength(500);
  });

  it('serves smaller requests from the same bucket without refetching', async () => {
    const fetchMock = installFetch();

    await getChannelVideos(CHANNEL, 50);
    const callsAfterFirst = fetchMock.mock.calls.length;
    const again = await getChannelVideos(CHANNEL, 10);

    expect(again).toHaveLength(10);
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });
});

describe('isAllowedChannel', () => {
  afterEach(() => {
    delete process.env.YOUTUBE_ALLOWED_CHANNEL_IDS;
  });

  it('allows the site channel by default and nothing else', () => {
    expect(isAllowedChannel(CHANNEL)).toBe(true);
    expect(isAllowedChannel('UCxxxxxxxxxxxxxxxxxxxxxx')).toBe(false);
  });

  it('honours YOUTUBE_ALLOWED_CHANNEL_IDS', () => {
    process.env.YOUTUBE_ALLOWED_CHANNEL_IDS = 'UCaaaa, UCbbbb';
    expect(isAllowedChannel('UCbbbb')).toBe(true);
    expect(isAllowedChannel(CHANNEL)).toBe(false);
  });
});
