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

export async function getPodcastFeed(feedUrl: string, limit: number = 10): Promise<PodcastEpisode[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    
    const episodes: PodcastEpisode[] = (feed.items || [])
      .slice(0, limit)
      .map((item, index) => ({
        id: item.guid || `episode-${index}`,
        title: item.title || 'Untitled',
        description: item.contentSnippet || item.content || '',
        pubDate: item.pubDate || item.isoDate || '',
        duration: item.itunes?.duration,
        audioUrl: item.enclosure?.url,
        link: item.link,
      }));

    return episodes;
  } catch (error) {
    console.error('Error fetching podcast feed:', error);
    throw error;
  }
}
