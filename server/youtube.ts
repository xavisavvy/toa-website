import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

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
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=youtube',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('YouTube not connected');
  }
  return accessToken;
}

export async function getUncachableYouTubeClient() {
  // Check if we have a standard YouTube API key (for non-Replit deployments)
  if (process.env.YOUTUBE_API_KEY) {
    return google.youtube({ 
      version: 'v3', 
      auth: process.env.YOUTUBE_API_KEY 
    });
  }
  
  // Fall back to Replit OAuth flow
  const accessToken = await getAccessToken();
  
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
}

interface CachedPlaylistData {
  playlistId: string;
  videos: VideoItem[];
  timestamp: number;
}

function isCacheValid(cachedData: CachedPlaylistData, playlistId: string): boolean {
  if (cachedData.playlistId !== playlistId) {
    return false;
  }
  const now = Date.now();
  const age = now - cachedData.timestamp;
  return age < CACHE_DURATION;
}

function readCache(playlistId: string): VideoItem[] | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cachedData: CachedPlaylistData = JSON.parse(cacheContent);

    if (isCacheValid(cachedData, playlistId)) {
      const ageHours = Math.floor((Date.now() - cachedData.timestamp) / (1000 * 60 * 60));
      console.log(`Using cached YouTube data (age: ${ageHours}h)`);
      return cachedData.videos;
    }

    console.log('Cache expired, fetching fresh data');
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

    const cacheData: CachedPlaylistData = {
      playlistId,
      videos,
      timestamp: Date.now(),
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
    console.log('YouTube data cached successfully');
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

async function getPlaylistVideosDirectAPI(playlistId: string, maxResults: number): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  let allVideoIds: string[] = [];
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

      const duration = contentDetails?.duration 
        ? formatDuration(contentDetails.duration)
        : '0:00';

      return {
        id: video.id || '',
        title: snippet?.title || 'Untitled',
        thumbnail: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || '',
        duration: duration,
        publishedAt: snippet?.publishedAt || '',
        viewCount: viewCount,
        description: snippet?.description || undefined,
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


export async function getPlaylistVideos(playlistId: string, maxResults: number = 1000): Promise<VideoItem[]> {
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
        return await getPlaylistVideosDirectAPI(playlistId, maxResults);
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
    
    let allVideoIds: string[] = [];
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

        const duration = contentDetails?.duration 
          ? formatDuration(contentDetails.duration)
          : '0:00';

        return {
          id: video.id || '',
          title: snippet?.title || 'Untitled',
          thumbnail: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || '',
          duration: duration,
          publishedAt: snippet?.publishedAt || '',
          viewCount: viewCount,
          description: snippet?.description || undefined,
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
        if (cachedData.playlistId === playlistId) {
          console.log('API failed, serving stale cache as fallback');
          return cachedData.videos;
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

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
