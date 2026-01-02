import * as fs from 'fs';
import * as path from 'path';

import Parser from 'rss-parser';

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  duration?: string;
  audioUrl?: string;
  link?: string;
}

const parser = new Parser();

const CACHE_DIR = path.join(process.cwd(), 'server', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'podcast-feed.json');
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CachedPodcastData {
  feedUrl: string;
  episodes: PodcastEpisode[];
  timestamp: number;
}

function isCacheValid(cachedData: CachedPodcastData, feedUrl: string): boolean {
  if (cachedData.feedUrl !== feedUrl) {
    return false;
  }
  const now = Date.now();
  const age = now - cachedData.timestamp;
  return age < CACHE_DURATION;
}

function readCache(feedUrl: string): PodcastEpisode[] | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cachedData: CachedPodcastData = JSON.parse(cacheContent);

    if (isCacheValid(cachedData, feedUrl)) {
      const ageMinutes = Math.floor((Date.now() - cachedData.timestamp) / (1000 * 60));
      console.log(`Using cached podcast data (age: ${ageMinutes}m)`);
      return cachedData.episodes;
    }

    console.log('Podcast cache expired, fetching fresh data');
    return null;
  } catch (error) {
    console.error('Error reading podcast cache:', error);
    return null;
  }
}

function writeCache(feedUrl: string, episodes: PodcastEpisode[]): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const cacheData: CachedPodcastData = {
      feedUrl,
      episodes,
      timestamp: Date.now(),
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
    console.log('Podcast data cached successfully');
  } catch (error) {
    console.error('Error writing podcast cache:', error);
  }
}

export async function getPodcastFeed(feedUrl: string, limit: number = 10): Promise<PodcastEpisode[]> {
  // Check cache first
  const cachedEpisodes = readCache(feedUrl);
  if (cachedEpisodes !== null) {
    return cachedEpisodes.slice(0, limit);
  }

  // Cache miss or expired, fetch from API
  try {
    const feed = await parser.parseURL(feedUrl);
    
    const episodes: PodcastEpisode[] = (feed.items || [])
      .map((item, index) => ({
        id: item.guid || `episode-${index}`,
        title: item.title || 'Untitled',
        description: item.contentSnippet || item.content || '',
        pubDate: item.pubDate || item.isoDate || '',
        duration: item.itunes?.duration,
        audioUrl: item.enclosure?.url,
        link: item.link,
      }));

    // Cache all episodes
    writeCache(feedUrl, episodes);

    return episodes.slice(0, limit);
  } catch (error) {
    console.error('Error fetching podcast feed:', error);
    
    // If API fails, try to return stale cache as fallback
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cachedData: CachedPodcastData = JSON.parse(cacheContent);
        if (cachedData.feedUrl === feedUrl) {
          console.log('Podcast API failed, serving stale cache as fallback');
          return cachedData.episodes.slice(0, limit);
        }
      }
    } catch (cacheError) {
      console.error('Failed to read stale podcast cache:', cacheError);
    }
    
    throw error;
  }
}
