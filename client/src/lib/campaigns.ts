// Campaign / episode helpers for the Campaign Archive surface.
//
// These helpers are pure: they accept their data as parameters rather than
// importing campaigns.json / episodes.json directly. That keeps them
// trivially unit-testable and decoupled from the seeded content shape.

import type { Campaign, Episode } from "@shared/schema";

/**
 * Extract a YouTube video id (11-char) from any of the three common URL forms:
 *   - https://youtu.be/<id>
 *   - https://www.youtube.com/watch?v=<id>
 *   - https://www.youtube.com/embed/<id>
 *
 * Returns null for non-YouTube URLs or malformed inputs.
 */
export function youtubeIdFromUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") {return null;}
  const match = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}

/**
 * Derive the YouTube hqdefault thumbnail URL from a watch / embed / short URL.
 * Returns undefined when the id can't be parsed (caller falls back to authored
 * thumbnail or omits the field from JSON-LD).
 */
export function youtubeThumbnail(url: string | undefined | null): string | undefined {
  const id = youtubeIdFromUrl(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
}

/**
 * Extract a YouTube playlist id from a `youtube.com/playlist?list=<id>` URL
 * (also matches a `list=` param on a `watch` URL). Returns null when the URL
 * isn't a YouTube playlist link — e.g. a single-video URL or a non-YouTube
 * world link like WorldAnvil.
 */
export function getPlaylistIdFromUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") {return null;}
  const match = url.match(/[?&]list=([\w-]+)/);
  return match ? match[1] : null;
}

/**
 * Find a campaign by slug. Returns undefined when no match.
 */
export function getCampaignBySlug(
  campaigns: Campaign[],
  slug: string | undefined | null
): Campaign | undefined {
  if (!slug) {return undefined;}
  return campaigns.find((c) => c.slug === slug);
}

/**
 * Get all episodes for a given campaign slug, sorted by episodeNumber ascending.
 * Returns a new array (does not mutate input).
 */
export function getEpisodesByCampaign(
  episodes: Episode[],
  slug: string | undefined | null
): Episode[] {
  if (!slug) {return [];}
  return episodes
    .filter((e) => e.campaignSlug === slug)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
}

/**
 * Sort campaigns newest-first by startDate. Returns a new array; ties are
 * resolved by preserving original (input) order (stable sort per ECMA-2019).
 */
export function sortCampaignsByStartDateDesc(campaigns: Campaign[]): Campaign[] {
  return [...campaigns].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}
