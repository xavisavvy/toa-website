export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  viewCount?: string;
  description?: string;
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

export async function getMultiplePlaylistVideosClient(playlistIds: string[], apiKey: string, maxResults: number = 50): Promise<VideoItem[]> {
  // Fetch videos from all playlists in parallel
  const allPlaylistPromises = playlistIds.map(playlistId => 
    getPlaylistVideosClient(playlistId, apiKey, 100).catch(error => {
      console.error(`Error fetching playlist ${playlistId}:`, error);
      return [] as VideoItem[];
    })
  );
  
  const playlistResults = await Promise.all(allPlaylistPromises);
  
  // Flatten and dedupe by video ID
  const videoMap = new Map<string, VideoItem>();
  for (const videos of playlistResults) {
    for (const video of videos) {
      if (!videoMap.has(video.id)) {
        videoMap.set(video.id, video);
      }
    }
  }
  
  // Sort by publishedAt date (most recent first)
  const allVideos = Array.from(videoMap.values());
  allVideos.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA; // Most recent first
  });
  
  return allVideos.slice(0, maxResults);
}

export async function getPlaylistVideosClient(playlistId: string, apiKey: string, maxResults: number = 50): Promise<VideoItem[]> {
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

  return allVideos.slice(0, maxResults);
}
