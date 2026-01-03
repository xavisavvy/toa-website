import { describe, it, expect, vi } from 'vitest';

// Mock fetch
globalThis.fetch = vi.fn();

describe('YouTube Client Library', () => {
  it('should export getPlaylistVideosClient function', async () => {
    const module = await import('../client/src/lib/youtube');
    
    expect(module.getPlaylistVideosClient).toBeDefined();
    expect(typeof module.getPlaylistVideosClient).toBe('function');
  });

  it('should handle API errors gracefully', async () => {
    (globalThis.fetch as any).mockRejectedValueOnce(new Error('API Error'));
    
    const { getPlaylistVideosClient } = await import('../client/src/lib/youtube');
    
    await expect(
      getPlaylistVideosClient('test-playlist', 'test-key', 10)
    ).rejects.toThrow();
  });

  it('should format durations correctly', async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ contentDetails: { videoId: 'test123' } }],
          nextPageToken: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'test123',
              snippet: {
                title: 'Test Video',
                publishedAt: '2024-01-01',
                thumbnails: { high: { url: 'https://example.com/thumb.jpg' } },
              },
              contentDetails: { duration: 'PT1H30M15S' },
              statistics: { viewCount: '1500000' },
            },
          ],
        }),
      });

    const { getPlaylistVideosClient } = await import('../client/src/lib/youtube');
    const videos = await getPlaylistVideosClient('test-playlist', 'test-key', 10);

    expect(videos[0].duration).toBe('1:30:15');
    expect(videos[0].viewCount).toBe('1.5M');
  });
});

describe('Structured Data Library', () => {
  it('should generate valid organization schema', async () => {
    const { getOrganizationSchema } = await import('../client/src/lib/structuredData');
    const schema = getOrganizationSchema();

    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('Tales of Aneria');
    expect(schema.url).toBe('https://talesofaneria.com');
  });

  it('should generate valid website schema', async () => {
    const { getWebSiteSchema } = await import('../client/src/lib/structuredData');
    const schema = getWebSiteSchema();

    expect(schema['@type']).toBe('WebSite');
    expect(schema.name).toBe('Tales of Aneria');
  });

  it('should generate valid breadcrumb schema', async () => {
    const { getBreadcrumbSchema } = await import('../client/src/lib/structuredData');
    const schema = getBreadcrumbSchema([
      { name: 'Home', url: 'https://talesofaneria.com' },
      { name: 'Characters', url: 'https://talesofaneria.com/characters' },
    ]);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(2);
  });
});
