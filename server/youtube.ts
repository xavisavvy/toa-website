import * as fs from 'fs';
import * as path from 'path';

import { google } from 'googleapis';

let connectionSettings: any;

const CACHE_DIR = path.join(process.cwd(), 'server', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'youtube-playlist.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

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
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cachedData: CachedPlaylistData = JSON.parse(cacheContent);

    const cacheEntry = cachedData[playlistId];
    if (!cacheEntry) {
      return null;
    }

    if (isCacheValid(cacheEntry)) {
      const ageHours = Math.floor((Date.now() - cacheEntry.timestamp) / (1000 * 60 * 60));
      console.log(`Using cached YouTube data for playlist ${playlistId} (age: ${ageHours}h)`);
      return cacheEntry.videos;
    }

    console.log(`Cache expired for playlist ${playlistId}, fetching fresh data`);
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

function writeCache(playlistId: string, videos: VideoItem[]): void {
  try {
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
    cachedData[playlistId] = {
      videos,
      timestamp: Date.now(),
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedData, null, 2), 'utf-8');
    console.log(`YouTube data cached successfully for playlist ${playlistId}`);
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

async function getPlaylistVideosDirectAPI(playlistId: string): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const allVideoIds: string[] = [];
  let nextPageToken: string | undefined = undefined;
  
  // Fetch all pages of playlist items
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey!);
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

    const videoIds = data.items
      .map((item: any) => item.contentDetails?.videoId)
      .filter(Boolean) as string[];
    
    allVideoIds.push(...videoIds);
    nextPageToken = data.nextPageToken;
    
  } while (nextPageToken);

  if (allVideoIds.length === 0) {
    return [];
  }

  // Fetch video details in batches of 50 (API limit)
  const allVideos: VideoItem[] = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const batchIds = allVideoIds.slice(i, i + 50);
    
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails,statistics');
    url.searchParams.set('id', batchIds.join(','));
    url.searchParams.set('key', apiKey!);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`YouTube API error: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();

    const videos: VideoItem[] = (data.items || []).map((video: any) => {
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
        duration: duration,
        publishedAt: snippet?.publishedAt || '',
        viewCount: viewCount,
        description: snippet?.description || undefined,
        durationSeconds: durationSeconds,
      };
    });
    
    allVideos.push(...videos);
  }

  // Sort by publishedAt date (most recent first)
  allVideos.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });

  // Cache the fetched data
  writeCache(playlistId, allVideos);

  return allVideos;
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
      try {
        return await getPlaylistVideosDirectAPI(playlistId);
      } catch (apiError: any) {
        const errorMsg = apiError.message?.toLowerCase() || '';
        // If API key has referrer restrictions, fall through to try OAuth only if Replit env is available
        if (errorMsg.includes('referer') || errorMsg.includes('api_key_http_referrer_blocked') || errorMsg.includes('blocked')) {
          console.log('YouTube API key has referrer restrictions, attempting OAuth fallback...');
          
          // Check if OAuth is available before attempting it
          const hasOAuthSupport = process.env.REPLIT_CONNECTORS_HOSTNAME && 
            (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL);
          
          if (!hasOAuthSupport) {
            console.log('⚠️  OAuth fallback not available. YouTube API key has referrer restrictions and OAuth is not configured.');
            console.log('   To fix: Remove referrer restrictions from your YouTube API key in Google Cloud Console.');
            return [];
          }
        } else {
          throw apiError;
        }
      }
    }
    
    // Check if OAuth is available before attempting
    const hasOAuthSupport = process.env.REPLIT_CONNECTORS_HOSTNAME && 
      (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL);
    
    if (!hasOAuthSupport && !process.env.YOUTUBE_API_KEY) {
      console.log('⚠️  No YouTube authentication available. Please configure YOUTUBE_API_KEY or connect YouTube via Replit.');
      return [];
    }
    
    const youtube = await getUncachableYouTubeClient();
    
    if (!youtube) {
      console.log('⚠️  YouTube API not configured');
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
        .map((item: any) => item.contentDetails?.videoId)
        .filter(Boolean) as string[];
      
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

      const videos: VideoItem[] = (videosResponse.data.items || []).map((video) => {
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
          duration: duration,
          publishedAt: snippet?.publishedAt || '',
          viewCount: viewCount,
          description: snippet?.description || undefined,
          durationSeconds: durationSeconds,
        };
      });
      
      allVideos.push(...videos);
    }

    // Sort by publishedAt date (most recent first)
    allVideos.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    // Cache the fetched data
    writeCache(playlistId, allVideos);

    return allVideos;
  } catch (error) {
    console.error('Error fetching YouTube playlist:', error);
    
    // If API fails, try to return stale cache as fallback
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cachedData: CachedPlaylistData = JSON.parse(cacheContent);
        const cacheEntry = cachedData[playlistId];
        if (cacheEntry) {
          console.log('API failed, serving stale cache as fallback');
          return cacheEntry.videos;
        }
      }
    } catch (cacheError) {
      console.error('Failed to read stale cache:', cacheError);
    }
    
    // Return empty array instead of throwing to prevent page crashes
    console.log('⚠️  YouTube API unavailable, returning empty video list');
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
      console.log('⚠️  No YouTube API key available. Please configure YOUTUBE_API_KEY.');
      return [];
    }

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

      const videoIds = data.items
        .map((item: any) => item.id?.videoId)
        .filter(Boolean) as string[];
      
      allVideoIds.push(...videoIds);
      nextPageToken = data.nextPageToken;
      
      // Limit to maxResults
      if (allVideoIds.length >= maxResults) {
        allVideoIds = allVideoIds.slice(0, maxResults);
        break;
      }
      
    } while (nextPageToken);

    if (allVideoIds.length === 0) {
      console.log(`No videos found for channel ${channelId}`);
      return [];
    }

    console.log(`Found ${allVideoIds.length} videos for channel ${channelId}`);

    // Fetch video details in batches of 50 (API limit)
    const allVideos: VideoItem[] = [];
    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batchIds = allVideoIds.slice(i, i + 50);
      
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

      const videos: VideoItem[] = (data.items || []).map((video: any) => {
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
          duration: duration,
          publishedAt: snippet?.publishedAt || '',
          viewCount: viewCount,
          description: snippet?.description || undefined,
          durationSeconds: durationSeconds,
        };
      });
      
      allVideos.push(...videos);
    }

    // Already sorted by date from search API, but ensure consistency
    allVideos.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA; // Newest first
    });

    // Cache the fetched data
    writeCache(channelId, allVideos);

    console.log(`Cached ${allVideos.length} videos for channel ${channelId}`);
    return allVideos;

  } catch (error) {
    console.error('Error fetching channel videos:', error);
    
    // Try to return stale cache if available
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cachedData: CachedChannelData = JSON.parse(cacheContent);
        const cacheEntry = cachedData[channelId];
        if (cacheEntry && cacheEntry.videos) {
          console.log(`⚠️  Returning stale cache for channel ${channelId} due to API error`);
          return cacheEntry.videos;
        }
      }
    } catch {
      // Ignore cache read errors
    }
    
    console.log('⚠️  YouTube API unavailable, returning empty video list');
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
    if (fs.existsSync(CHANNEL_STATS_CACHE_FILE)) {
      const cacheContent = fs.readFileSync(CHANNEL_STATS_CACHE_FILE, 'utf-8');
      const cachedData: { [key: string]: ChannelStatsCacheEntry } = JSON.parse(cacheContent);
      const cacheEntry = cachedData[channelId];
      
      if (cacheEntry && isCacheValid(cacheEntry)) {
        const age = Math.floor((Date.now() - cacheEntry.timestamp) / 1000 / 60);
        console.log(`Using cached channel stats for ${channelId} (age: ${age}m)`);
        return cacheEntry.stats;
      }
    }

    console.log(`Fetching fresh channel stats for ${channelId}...`);
    
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

    // Update cache
    let cachedData: { [key: string]: ChannelStatsCacheEntry } = {};
    if (fs.existsSync(CHANNEL_STATS_CACHE_FILE)) {
      const cacheContent = fs.readFileSync(CHANNEL_STATS_CACHE_FILE, 'utf-8');
      cachedData = JSON.parse(cacheContent);
    }

    cachedData[channelId] = {
      stats,
      timestamp: Date.now(),
    };

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CHANNEL_STATS_CACHE_FILE, JSON.stringify(cachedData, null, 2));
    
    console.log(`Channel stats cached successfully for ${channelId}`);
    
    return stats;
  } catch (error) {
    console.error('Error fetching channel stats:', error);
    
    // Try to return stale cache on error
    if (fs.existsSync(CHANNEL_STATS_CACHE_FILE)) {
      const cacheContent = fs.readFileSync(CHANNEL_STATS_CACHE_FILE, 'utf-8');
      const cachedData: { [key: string]: ChannelStatsCacheEntry } = JSON.parse(cacheContent);
      const cacheEntry = cachedData[channelId];
      
      if (cacheEntry) {
        console.log(`⚠️  Returning stale cache for channel stats ${channelId} due to API error`);
        return cacheEntry.stats;
      }
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
