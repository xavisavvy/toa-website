import type { Episode } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

import type { WorldMeta } from "@/data/worlds";
import { getPlaylistIdFromUrl } from "@/lib/campaigns";

interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
}

/**
 * Builds the campaign's episode list from its world's real YouTube playlist
 * (via the existing /api/youtube/playlist/:id endpoint, scoped to only that
 * playlist's items — unlike the channel-wide fetch LatestEpisodes/Videos use),
 * so youtubeUrl always points at a real, current video instead of whatever
 * was hand-typed into episodes.json at authoring time.
 *
 * Playlist videos are ordered oldest-first and matched 1:1 to episodeNumber.
 * Authored fields in episodes.json (title, summary, podcastUrl) are kept as
 * overrides where present — only youtubeUrl/thumbnail/duration/airDate come
 * from the live playlist. Falls back to the static list untouched when the
 * world has no playlist link, or the playlist fetch fails/returns nothing.
 */
export function useCampaignEpisodes(
  campaignSlug: string | undefined,
  world: WorldMeta | undefined,
  staticEpisodes: Episode[]
): Episode[] {
  const playlistId = getPlaylistIdFromUrl(world?.link);

  const { data: playlistVideos } = useQuery<PlaylistVideo[]>({
    queryKey: ["/api/youtube/playlist", playlistId],
    enabled: !!playlistId,
    queryFn: async () => {
      const response = await fetch(
        `/api/youtube/playlist/${playlistId}?maxResults=1000`
      );
      if (!response.ok) {return [];}
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!playlistId || !playlistVideos || playlistVideos.length === 0) {
    return staticEpisodes;
  }

  const orderedVideos = [...playlistVideos].sort(
    (a, b) =>
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const authoredByEpisodeNumber = new Map(
    staticEpisodes
      .filter((e) => e.campaignSlug === campaignSlug)
      .map((e) => [e.episodeNumber, e])
  );

  return orderedVideos.map((video, index) => {
    const episodeNumber = index + 1;
    const authored = authoredByEpisodeNumber.get(episodeNumber);

    return {
      id: authored?.id ?? video.id,
      campaignSlug: campaignSlug ?? "",
      episodeNumber,
      title: authored?.title ?? video.title,
      summary: authored?.summary ?? "",
      airDate: authored?.airDate ?? video.publishedAt.slice(0, 10),
      youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
      podcastUrl: authored?.podcastUrl,
      thumbnail: video.thumbnail || authored?.thumbnail,
      duration: video.duration || authored?.duration,
    };
  });
}
