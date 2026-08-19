import type { Episode } from "@shared/schema";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { WorldMeta } from "@/data/worlds";
import { useCampaignEpisodes } from "@/hooks/useCampaignEpisodes";

const playlistWorld: WorldMeta = {
  id: "taebrin",
  name: "Journeys Through Taebrin",
  description: "test",
  link: "https://www.youtube.com/playlist?list=PLPwB6km-TpoAQiDKQnXQW-JUUXBwvkFQY",
};

const nonPlaylistWorld: WorldMeta = {
  id: "aneria",
  name: "Aneria",
  description: "test",
  link: "https://www.worldanvil.com/w/aneria-niburu",
};

const staticEpisodes: Episode[] = [
  {
    id: "ep-1",
    campaignSlug: "journeys-through-taebrin",
    episodeNumber: 1,
    title: "Into the Mire",
    summary: "Authored summary for episode 1.",
    airDate: "2025-01-15",
    youtubeUrl: "https://www.youtube.com/watch?v=PLACEHOLDER1",
    podcastUrl: "https://anchor.fm/talesofaneria/episodes/ep-1",
  },
  {
    id: "ep-2",
    campaignSlug: "journeys-through-taebrin",
    episodeNumber: 2,
    title: "The Council of Embers",
    summary: "Authored summary for episode 2.",
    airDate: "2025-01-29",
    youtubeUrl: "https://www.youtube.com/watch?v=PLACEHOLDER2",
  },
];

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useCampaignEpisodes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the static list untouched when the world has no playlist link", () => {
    const { result } = renderHook(
      () =>
        useCampaignEpisodes(
          "journeys-through-taebrin",
          nonPlaylistWorld,
          staticEpisodes
        ),
      { wrapper }
    );

    expect(result.current).toEqual(staticEpisodes);
  });

  it("returns the static list untouched when world is undefined", () => {
    const { result } = renderHook(
      () =>
        useCampaignEpisodes(
          "journeys-through-taebrin",
          undefined,
          staticEpisodes
        ),
      { wrapper }
    );

    expect(result.current).toEqual(staticEpisodes);
  });

  it("merges real playlist videos over the placeholder youtubeUrl, keeping authored title/summary", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => [
        {
          id: "realVideoId2",
          title: "Ep 2 raw YouTube title",
          thumbnail: "https://i.ytimg.com/vi/realVideoId2/hqdefault.jpg",
          duration: "2:10:00",
          publishedAt: "2025-01-29T00:00:00Z",
        },
        {
          id: "realVideoId1",
          title: "Ep 1 raw YouTube title",
          thumbnail: "https://i.ytimg.com/vi/realVideoId1/hqdefault.jpg",
          duration: "2:15:00",
          publishedAt: "2025-01-15T00:00:00Z",
        },
      ],
    } as Response);

    const { result } = renderHook(
      () =>
        useCampaignEpisodes(
          "journeys-through-taebrin",
          playlistWorld,
          staticEpisodes
        ),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current[0].youtubeUrl).not.toContain("PLACEHOLDER");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/youtube/playlist/PLPwB6km-TpoAQiDKQnXQW-JUUXBwvkFQY"
      )
    );

    // Oldest video first == episode 1, matching authored title/summary.
    expect(result.current[0]).toMatchObject({
      episodeNumber: 1,
      title: "Into the Mire",
      summary: "Authored summary for episode 1.",
      youtubeUrl: "https://www.youtube.com/watch?v=realVideoId1",
      podcastUrl: "https://anchor.fm/talesofaneria/episodes/ep-1",
    });
    expect(result.current[1]).toMatchObject({
      episodeNumber: 2,
      title: "The Council of Embers",
      youtubeUrl: "https://www.youtube.com/watch?v=realVideoId2",
    });
  });

  it("appends extra playlist videos beyond the authored episode count, using the raw video title", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => [
        {
          id: "vid1",
          title: "Video 1",
          thumbnail: "t1",
          duration: "1:00:00",
          publishedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "vid2",
          title: "Video 2",
          thumbnail: "t2",
          duration: "1:00:00",
          publishedAt: "2025-01-08T00:00:00Z",
        },
        {
          id: "vid3",
          title: "Video 3 - Not Yet Authored",
          thumbnail: "t3",
          duration: "1:00:00",
          publishedAt: "2025-01-15T00:00:00Z",
        },
      ],
    } as Response);

    const { result } = renderHook(
      () =>
        useCampaignEpisodes(
          "journeys-through-taebrin",
          playlistWorld,
          staticEpisodes
        ),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    expect(result.current[2]).toMatchObject({
      episodeNumber: 3,
      title: "Video 3 - Not Yet Authored",
      youtubeUrl: "https://www.youtube.com/watch?v=vid3",
    });
  });

  it("falls back to the static list when the playlist fetch fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    const { result } = renderHook(
      () =>
        useCampaignEpisodes(
          "journeys-through-taebrin",
          playlistWorld,
          staticEpisodes
        ),
      { wrapper }
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    expect(result.current).toEqual(staticEpisodes);
  });
});
