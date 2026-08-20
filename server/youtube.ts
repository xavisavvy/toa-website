import * as fs from 'fs';
import * as path from 'path';

import { google } from 'googleapis';

interface YouTubeConnectionSettings {
  settings: {
    expires_at?: string;
    access_token?: string;
    oauth?: {
      credentials?: {
        access_token?: string;
      };
    };
  };
}

let connectionSettings: YouTubeConnectionSettings | undefined;

const CACHE_DIR = path.join(process.cwd(), 'server', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'youtube-playlist.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Property names that must never be used as a dynamic object key: assigning
// to one of these on a plain object rewrites its prototype chain instead of
// adding a normal data property. playlistId/channelId are validated by the
// callers in server/routes.ts, but that validation only restricts charset,
// not these reserved names, so we guard here too before using them as keys.
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isSafeCacheKey(key: string): boolean {
  return !UNSAFE_OBJECT_KEYS.has(key);
}

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY
    ? `repl ${  process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
    ? `depl ${  process.env.WEB_REPL_RENEWAL}`
    : null;

  if (!xReplitToken || !hostname) {
    return null; // Not in Replit environment
  }

  try {
    connectionSettings = await fetch(
      `https://${  hostname  }/api/v2/connection?include_secrets=true&connector_names=youtube`,
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!connectionSettings || !accessToken) {
      return null;
    }
    return accessToken;
  } catch {
    return null;
  }
}

export async function getUncachableYouTubeClient() {
  // Check if we have a standard YouTube API key (for non-Replit deployments)
  if (process.env.YOUTUBE_API_KEY) {
    return google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
  }

  // Try Replit OAuth flow if in Replit environment
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return null; // Return null instead of throwing - let caller handle gracefully
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.youtube({ version: 'v3', auth: oauth2Client });
}

export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  viewCount?: string;
  description?: string;
  durationSeconds?: number;
}

interface ChannelCacheEntry {
  videos: VideoItem[];
  timestamp: number;
}

interface CachedChannelData {
  [channelId: string]: ChannelCacheEntry;
}

interface PlaylistCacheEntry {
  videos: VideoItem[];
  timestamp: number;
}

interface CachedPlaylistData {
  [playlistId: string]: PlaylistCacheEntry;
}

interface BaseCacheEntry {
  timestamp: number;
}

function isCacheValid(cacheEntry: BaseCacheEntry): boolean {
  const now = Date.now();
  const age = now - cacheEntry.timestamp;
  return age < CACHE_DURATION;
}

function readCache(playlistId: string): VideoItem[] | null {
  try {
    if (!fs.existsSync(CACHE_FILE) || !isSafeCacheKey(playlistId)) {
      return null;
    }

    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cachedData: CachedPlaylistData = JSON.parse(cacheContent);

    // eslint-disable-next-line security/detect-object-injection -- playlistId checked against UNSAFE_OBJECT_KEYS above
    const cacheEntry = cachedData[playlistId];
    if (!cacheEntry) {
      return null;
    }

    if (isCacheValid(cacheEntry)) {
      const ageHours = Math.floor((Date.now() - cacheEntry.timestamp) / (1000 * 60 * 60));
      console.info(`Using cached YouTube data for playlist ${playlistId} (age: ${ageHours}h)`);
      return cacheEntry.videos;
    }

    console.info(`Cache expired for playlist ${playlistId}, fetching fresh data`);
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

function writeCache(playlistId: string, videos: VideoItem[]): void {
  try {
    if (!isSafeCacheKey(playlistId)) {
      console.warn(`Refusing to cache YouTube data for unsafe key: ${playlistId}`);
      return;
    }

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    // Read existing cache to preserve other playlists
    let cachedData: CachedPlaylistData = {};
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const existing = fs.readFileSync(CACHE_FILE, 'utf-8');
        cachedData = JSON.parse(existing);
      } catch (error) {
        console.warn('Could not read existing cache, starting fresh:', error);
      }
    }

    // Update or add this playlist's data
    // eslint-disable-next-line security/detect-object-injection -- playlistId checked against UNSAFE_OBJECT_KEYS above
    cachedData[playlistId] = {
      videos,
      timestamp: Date.now(),
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedData, null, 2), 'utf-8');
    console.info(`YouTube data cached successfully for playlist ${playlistId}`);
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

/**
 * Shape of a raw YouTube "video" API resource, as returned by either the
 * plain REST fetch API or the googleapis client (both are structurally
 * compatible with this subset of fields).
 */
interface YouTubeApiVideoResource {
  id?: string | null;
  snippet?: {
    title?: string | null;
    publishedAt?: string | null;
    description?: string | null;
    thumbnails?: {
      high?: { url?: string | null } | null;
      default?: { url?: string | null } | null;
    } | null;
  } | null;
  statistics?: { viewCount?: string | null } | null;
  contentDetails?: { duration?: string | null } | null;
}

interface YouTubeApiPlaylistItem {
  contentDetails?: { videoId?: string | null } | null;
}

interface YouTubeApiSearchItem {
  id?: { videoId?: string | null } | null;
}

/** Maps a raw YouTube "video" API resource into our internal VideoItem shape. */
function mapVideoResourceToItem(video: YouTubeApiVideoResource): VideoItem {
  const snippet = video.snippet;
  const statistics = video.statistics;
  const contentDetails = video.contentDetails;

  const viewCount = statistics?.viewCount
    ? formatViewCount(parseInt(statistics.viewCount))
    : undefined;

  const isoDuration = contentDetails?.duration || 'PT0S';
  const duration = formatDuration(isoDuration);
  const durationSeconds = getDurationInSeconds(isoDuration);

  return {
    id: video.id || '',
    title: snippet?.title || 'Untitled',
    thumbnail: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || '',
    duration,
    publishedAt: snippet?.publishedAt || '',
    viewCount,
    description: snippet?.description || undefined,
    durationSeconds,
  };
}

/** Sorts videos by publish date, most recent first (mutates and returns the array). */
function sortVideosByPublishedDateDesc(videos: VideoItem[]): VideoItem[] {
  return videos.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });
}

/** Fetches every playlistItem page for a playlist and returns the contained video IDs. */
async function fetchPlaylistItemVideoIds(playlistId: string, apiKey: string): Promise<string[]> {
  const allVideoIds: string[] = [];
  let nextPageToken: string | undefined = undefined;

  // Fetch all pages of playlist items
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);
    if (nextPageToken) {
      url.searchParams.set('pageToken', nextPageToken);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`YouTube API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      break;
    }

    const videoIds = (data.items as YouTubeApiPlaylistItem[])
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => Boolean(id));

    allVideoIds.push(...videoIds);
    nextPageToken = data.nextPageToken;

  } while (nextPageToken);

  return allVideoIds;
}

/** Fetches full video resources (snippet/contentDetails/statistics) for the given IDs, in batches of 50. */
async function fetchVideoDetailsBatch(videoIds: string[], apiKey: string): Promise<VideoItem[]> {
  const allVideos: VideoItem[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50);

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails,statistics');
    url.searchParams.set('id', batchIds.join(','));
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`YouTube API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    const videos: VideoItem[] = ((data.items || []) as YouTubeApiVideoResource[]).map(mapVideoResourceToItem);

    allVideos.push(...videos);
  }

  return allVideos;
}

async function getPlaylistVideosDirectAPI(playlistId: string): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured');
  }

  const allVideoIds = await fetchPlaylistItemVideoIds(playlistId, apiKey);

  if (allVideoIds.length === 0) {
    return [];
  }

  const allVideos = await fetchVideoDetailsBatch(allVideoIds, apiKey);

  // Sort by publishedAt date (most recent first)
  sortVideosByPublishedDateDesc(allVideos);

  // Cache the fetched data
  writeCache(playlistId, allVideos);

  return allVideos;
}


/** Fetches a playlist's videos via the googleapis OAuth client (paged list + batched detail fetch), then caches them. */
async function fetchPlaylistVideosViaClient(playlistId: string): Promise<VideoItem[]> {
  const youtube = await getUncachableYouTubeClient();

  if (!youtube) {
    console.warn('YouTube API not configured');
    return [];
  }

  const allVideoIds: string[] = [];
  let nextPageToken: string | undefined = undefined;

  // Fetch all pages of playlist items
  do {
    const response = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: playlistId,
      maxResults: 50, // YouTube API max per page
      pageToken: nextPageToken,
    });

    if (!response.data.items || response.data.items.length === 0) {
      break;
    }

    const videoIds = response.data.items
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => Boolean(id));

    allVideoIds.push(...videoIds);
    nextPageToken = response.data.nextPageToken as string | undefined;

  } while (nextPageToken);

  if (allVideoIds.length === 0) {
    return [];
  }

  // Fetch video details in batches of 50 (API limit)
  const allVideos: VideoItem[] = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const batchIds = allVideoIds.slice(i, i + 50);

    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: batchIds,
    });

    const videos: VideoItem[] = (videosResponse.data.items || []).map(mapVideoResourceToItem);

    allVideos.push(...videos);
  }

  // Sort by publishedAt date (most recent first)
  sortVideosByPublishedDateDesc(allVideos);

  // Cache the fetched data
  writeCache(playlistId, allVideos);

  return allVideos;
}

/**
 * Attempts to fetch playlist videos via the direct-fetch API.
 * Returns the videos on success, `[]` if the key is referrer-blocked and no
 * OAuth fallback is configured, or `null` to signal the caller should fall
 * through and try the OAuth client path instead. Any other error is rethrown.
 */
async function tryPlaylistVideosDirectAPIWithFallback(playlistId: string): Promise<VideoItem[] | null> {
  try {
    return await getPlaylistVideosDirectAPI(playlistId);
  } catch (apiError: unknown) {
    const errorMsg = apiError instanceof Error ? apiError.message.toLowerCase() : '';
    const isReferrerBlocked = errorMsg.includes('referer') || errorMsg.includes('api_key_http_referrer_blocked') || errorMsg.includes('blocked');
    if (!isReferrerBlocked) {
      throw apiError;
    }

    console.info('YouTube API key has referrer restrictions, attempting OAuth fallback...');

    const hasOAuthSupport = process.env.REPLIT_CONNECTORS_HOSTNAME &&
      (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL);

    if (!hasOAuthSupport) {
      console.warn('OAuth fallback not available. YouTube API key has referrer restrictions and OAuth is not configured.');
      console.warn('To fix: Remove referrer restrictions from your YouTube API key in Google Cloud Console.');
      return [];
    }

    return null;
  }
}

/** Reads a playlist's cached videos directly from disk, ignoring cache-freshness (used as a last-resort fallback). */
function readStalePlaylistCache(playlistId: string): VideoItem[] | null {
  try {
    if (!fs.existsSync(CACHE_FILE) || !isSafeCacheKey(playlistId)) {
      return null;
    }
    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cachedData: CachedPlaylistData = JSON.parse(cacheContent);
    // eslint-disable-next-line security/detect-object-injection -- playlistId checked against UNSAFE_OBJECT_KEYS above
    const cacheEntry = cachedData[playlistId];
    return cacheEntry ? cacheEntry.videos : null;
  } catch (cacheError) {
    console.error('Failed to read stale cache:', cacheError);
    return null;
  }
}

export async function getPlaylistVideos(playlistId: string, _maxResults: number = 1000): Promise<VideoItem[]> {
  // Check cache first
  const cachedVideos = readCache(playlistId);
  if (cachedVideos !== null) {
    return cachedVideos;
  }

  // Cache miss or expired, fetch from API
  try {
    // Use direct fetch API for API key to avoid referrer issues
    if (process.env.YOUTUBE_API_KEY) {
      const directResult = await tryPlaylistVideosDirectAPIWithFallback(playlistId);
      if (directResult !== null) {
        return directResult;
      }
    }

    // Check if OAuth is available before attempting
    const hasOAuthSupport = process.env.REPLIT_CONNECTORS_HOSTNAME &&
      (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL);

    if (!hasOAuthSupport && !process.env.YOUTUBE_API_KEY) {
      console.warn('No YouTube authentication available. Please configure YOUTUBE_API_KEY or connect YouTube via Replit.');
      return [];
    }

    return await fetchPlaylistVideosViaClient(playlistId);
  } catch (error) {
    console.error('Error fetching YouTube playlist:', error);

    // If API fails, try to return stale cache as fallback
    const staleVideos = readStalePlaylistCache(playlistId);
    if (staleVideos) {
      console.info('API failed, serving stale cache as fallback');
      return staleVideos;
    }

    // Return empty array instead of throwing to prevent page crashes
    console.warn('YouTube API unavailable, returning empty video list');
    return [];
  }
}

/**
 * Fetch all videos from a YouTube channel (sorted by newest first)
 * Uses YouTube Search API to get all videos from a channel
 *
 * @param channelId - YouTube channel ID (starts with UC)
 * @param maxResults - Maximum number of videos to fetch
 * @returns Array of video items sorted by publish date (newest first)
 */
/** Fetches every search-result page for a channel (newest first) and returns up to maxResults video IDs. */
async function fetchChannelVideoIds(channelId: string, apiKey: string, maxResults: number): Promise<string[]> {
  let allVideoIds: string[] = [];
  let nextPageToken: string | undefined = undefined;

  // Fetch all pages of channel videos using search API
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'id');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('order', 'date'); // Sort by newest first
    url.searchParams.set('type', 'video'); // Only videos, not playlists or channels
    url.searchParams.set('maxResults', '50'); // API max per page
    url.searchParams.set('key', apiKey);
    if (nextPageToken) {
      url.searchParams.set('pageToken', nextPageToken);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`YouTube API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      break;
    }

    const videoIds = (data.items as YouTubeApiSearchItem[])
      .map((item) => item.id?.videoId)
      .filter((id): id is string => Boolean(id));

    allVideoIds.push(...videoIds);
    nextPageToken = data.nextPageToken;

    // Limit to maxResults
    if (allVideoIds.length >= maxResults) {
      allVideoIds = allVideoIds.slice(0, maxResults);
      break;
    }

  } while (nextPageToken);

  return allVideoIds;
}

export async function getChannelVideos(channelId: string, maxResults: number = 50): Promise<VideoItem[]> {
  // Check cache first (use channelId as cache key)
  const cachedVideos = readCache(channelId);
  if (cachedVideos !== null) {
    return cachedVideos;
  }

  // Cache miss or expired, fetch from API
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.warn('No YouTube API key available. Please configure YOUTUBE_API_KEY.');
      return [];
    }

    const allVideoIds = await fetchChannelVideoIds(channelId, apiKey, maxResults);

    if (allVideoIds.length === 0) {
      console.info(`No videos found for channel ${channelId}`);
      return [];
    }

    console.info(`Found ${allVideoIds.length} videos for channel ${channelId}`);

    // Fetch video details in batches of 50 (API limit)
    const allVideos = await fetchVideoDetailsBatch(allVideoIds, apiKey);

    // Already sorted by date from search API, but ensure consistency
    sortVideosByPublishedDateDesc(allVideos);

    // Cache the fetched data
    writeCache(channelId, allVideos);

    console.info(`Cached ${allVideos.length} videos for channel ${channelId}`);
    return allVideos;

  } catch (error) {
    console.error('Error fetching channel videos:', error);

    // Try to return stale cache if available
    try {
      if (fs.existsSync(CACHE_FILE) && isSafeCacheKey(channelId)) {
        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cachedData: CachedChannelData = JSON.parse(cacheContent);
        // eslint-disable-next-line security/detect-object-injection -- channelId must match /^UC[a-zA-Z0-9_-]+$/ before reaching here (see server/routes.ts) and is checked against UNSAFE_OBJECT_KEYS above
        const cacheEntry = cachedData[channelId];
        if (cacheEntry && cacheEntry.videos) {
          console.warn(`Returning stale cache for channel ${channelId} due to API error`);
          return cacheEntry.videos;
        }
      }
    } catch {
      // Ignore cache read errors
    }

    console.warn('YouTube API unavailable, returning empty video list');
    return [];
  }
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)  }M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)  }K`;
  }
  return count.toString();
}

function formatDuration(isoDuration: string): string {
  // eslint-disable-next-line security/detect-unsafe-regex
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {return '0:00';}

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getDurationInSeconds(isoDuration: string): number {
  // eslint-disable-next-line security/detect-unsafe-regex
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {return 0;}

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch YouTube Shorts from a channel (videos <= 60 seconds)
 * Uses the same caching mechanism as regular videos
 *
 * @param channelId - YouTube channel ID (starts with UC)
 * @param maxResults - Maximum number of shorts to fetch
 * @returns Array of short video items sorted by publish date (newest first)
 */
export async function getChannelShorts(channelId: string, maxResults: number = 50): Promise<VideoItem[]> {
  // Fetch all videos from channel (they're cached)
  const allVideos = await getChannelVideos(channelId, 200); // Fetch more to ensure we get enough shorts

  // Filter for shorts (duration <= 60 seconds)
  const shorts = allVideos.filter(video => {
    return video.durationSeconds !== undefined && video.durationSeconds > 0 && video.durationSeconds <= 60;
  });

  return shorts.slice(0, maxResults);
}

/**
 * Channel statistics interface
 */
export interface ChannelStats {
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  estimatedWatchHours: string;
}

interface ChannelStatsCacheEntry {
  stats: ChannelStats;
  timestamp: number;
}

const CHANNEL_STATS_CACHE_FILE = path.join(CACHE_DIR, 'youtube-channel-stats.json');

/** Reads a single channel's cached stats entry, if the on-disk cache exists and the key is safe to use. */
function readChannelStatsCacheEntry(channelId: string): ChannelStatsCacheEntry | null {
  if (!fs.existsSync(CHANNEL_STATS_CACHE_FILE) || !isSafeCacheKey(channelId)) {
    return null;
  }
  const cacheContent = fs.readFileSync(CHANNEL_STATS_CACHE_FILE, 'utf-8');
  const cachedData: { [key: string]: ChannelStatsCacheEntry } = JSON.parse(cacheContent);
  // eslint-disable-next-line security/detect-object-injection -- channelId must match /^UC[a-zA-Z0-9_-]+$/ before reaching here (see server/routes.ts) and is checked against UNSAFE_OBJECT_KEYS above
  return cachedData[channelId] || null;
}

/** Persists a single channel's stats into the on-disk cache, preserving other channels' entries. */
function writeChannelStatsCacheEntry(channelId: string, stats: ChannelStats): void {
  if (!isSafeCacheKey(channelId)) {
    console.warn(`Refusing to cache channel stats for unsafe key: ${channelId}`);
    return;
  }

  let cachedData: { [key: string]: ChannelStatsCacheEntry } = {};
  if (fs.existsSync(CHANNEL_STATS_CACHE_FILE)) {
    const cacheContent = fs.readFileSync(CHANNEL_STATS_CACHE_FILE, 'utf-8');
    cachedData = JSON.parse(cacheContent);
  }

  // eslint-disable-next-line security/detect-object-injection -- channelId checked against UNSAFE_OBJECT_KEYS above
  cachedData[channelId] = {
    stats,
    timestamp: Date.now(),
  };

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(CHANNEL_STATS_CACHE_FILE, JSON.stringify(cachedData, null, 2));
}

/**
 * Fetch channel statistics from YouTube API
 * Cached for 24 hours
 *
 * @param channelId - YouTube channel ID (starts with UC)
 * @returns Channel statistics including subscribers, videos, views, and estimated watch hours
 */
export async function getChannelStats(channelId: string): Promise<ChannelStats | null> {
  try {
    // Check cache first
    const cacheEntry = readChannelStatsCacheEntry(channelId);
    if (cacheEntry && isCacheValid(cacheEntry)) {
      const age = Math.floor((Date.now() - cacheEntry.timestamp) / 1000 / 60);
      console.info(`Using cached channel stats for ${channelId} (age: ${age}m)`);
      return cacheEntry.stats;
    }

    console.info(`Fetching fresh channel stats for ${channelId}...`);

    const youtube = await getUncachableYouTubeClient();

    if (!youtube) {
      return null; // YouTube API not configured
    }

    const response = await youtube.channels.list({
      part: ['statistics', 'contentDetails'],
      id: [channelId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const channel = response.data.items[0];
    const statistics = channel.statistics;

    if (!statistics) {
      throw new Error('Channel statistics not available');
    }

    // Format numbers with abbreviations
    const subscriberCount = formatLargeNumber(parseInt(statistics.subscriberCount || '0'));
    const videoCount = statistics.videoCount || '0';
    const viewCount = statistics.viewCount || '0';

    // Estimate watch hours: Assume average video duration of 2 hours
    // Watch hours ≈ (Total Views × Average Duration) / 60
    // This is a rough estimate since we don't have actual watch time from API
    const avgVideoDurationMinutes = 120; // 2 hours average
    const estimatedWatchMinutes = parseInt(viewCount) * avgVideoDurationMinutes;
    const estimatedWatchHours = Math.floor(estimatedWatchMinutes / 60);

    const stats: ChannelStats = {
      subscriberCount,
      videoCount,
      viewCount: formatLargeNumber(parseInt(viewCount)),
      estimatedWatchHours: formatLargeNumber(estimatedWatchHours),
    };

    writeChannelStatsCacheEntry(channelId, stats);

    console.info(`Channel stats cached successfully for ${channelId}`);

    return stats;
  } catch (error) {
    console.error('Error fetching channel stats:', error);

    // Try to return stale cache on error
    const staleCacheEntry = readChannelStatsCacheEntry(channelId);
    if (staleCacheEntry) {
      console.warn(`Returning stale cache for channel stats ${channelId} due to API error`);
      return staleCacheEntry.stats;
    }

    throw error;
  }
}

/**
 * Format large numbers with K/M abbreviations
 */
function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
