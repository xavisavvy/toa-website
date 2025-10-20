import { google } from 'googleapis';

let connectionSettings: any;

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

export async function getPlaylistVideos(playlistId: string, maxResults: number = 50): Promise<VideoItem[]> {
  try {
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

    return allVideos;
  } catch (error) {
    console.error('Error fetching YouTube playlist:', error);
    throw error;
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
