// Structured Data (JSON-LD) generators for SEO

const SCHEMA_ORG_CONTEXT = "https://schema.org";
const SITE_NAME = "Tales of Aneria";

export const getOrganizationSchema = () => ({
  "@context": SCHEMA_ORG_CONTEXT,
  "@type": "Organization",
  "name": SITE_NAME,
  "url": "https://talesofaneria.com",
  "logo": "https://talesofaneria.com/favicon.png",
  "description": "Epic TTRPG live play series exploring the mystical world of Aneria through Dungeons & Dragons gameplay",
  "sameAs": [
    "https://www.youtube.com/@TalesofAneria",
    "https://twitter.com/talesofaneria",
    "https://www.patreon.com/talesofaneria"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "legal@talesofaneria.com",
    "contactType": "Customer Service"
  }
});

export const getWebSiteSchema = () => ({
  "@context": SCHEMA_ORG_CONTEXT,
  "@type": "WebSite",
  "name": SITE_NAME,
  "url": "https://talesofaneria.com",
  "description": "Join us on an epic journey through the mystical world of Aneria. Watch our TTRPG live play series, explore rich lore, and discover exclusive merchandise from our adventures.",
  "publisher": {
    "@type": "Organization",
    "name": SITE_NAME
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://talesofaneria.com/characters?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});

export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": SCHEMA_ORG_CONTEXT,
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const getVideoSchema = (video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
}) => ({
  "@context": SCHEMA_ORG_CONTEXT,
  "@type": "VideoObject",
  "name": video.name,
  "description": video.description,
  "thumbnailUrl": video.thumbnailUrl,
  "uploadDate": video.uploadDate,
  "duration": video.duration,
  "contentUrl": video.contentUrl,
  "embedUrl": video.contentUrl,
  "publisher": {
    "@type": "Organization",
    "name": SITE_NAME,
    "logo": {
      "@type": "ImageObject",
      "url": "https://talesofaneria.com/favicon.png"
    }
  }
});

export const getPersonSchema = (person: {
  name: string;
  description?: string;
  image?: string;
  sameAs?: string[];
}) => ({
  "@context": SCHEMA_ORG_CONTEXT,
  "@type": "Person",
  "name": person.name,
  "description": person.description,
  "image": person.image,
  "sameAs": person.sameAs,
  "memberOf": {
    "@type": "Organization",
    "name": SITE_NAME
  }
});

export const getTVSeriesSchema = (campaign: {
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate?: string;
  numberOfEpisodes: number;
  thumbnailUrl?: string;
  cast: { name: string }[];
}) => ({
  "@context": SCHEMA_ORG_CONTEXT,
  "@type": "TVSeries",
  "name": campaign.name,
  "description": campaign.description,
  "url": `https://talesofaneria.com/campaigns/${campaign.slug}`,
  ...(campaign.thumbnailUrl ? { "image": campaign.thumbnailUrl } : {}),
  "startDate": campaign.startDate,
  ...(campaign.endDate ? { "endDate": campaign.endDate } : {}),
  "numberOfEpisodes": campaign.numberOfEpisodes,
  "actor": campaign.cast.map((c) => ({ "@type": "Person", "name": c.name })),
  "productionCompany": {
    "@type": "Organization",
    "name": SITE_NAME
  },
  "genre": ["Fantasy", "Tabletop RPG", "Dungeons & Dragons", "Live Play"]
});

export const getTVEpisodeSchema = (input: {
  campaignName: string;
  campaignSlug: string;
  episodeNumber: number;
  title: string;
  summary: string;
  airDate: string;
  url: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  duration?: string;
}) => ({
  "@context": SCHEMA_ORG_CONTEXT,
  "@type": "TVEpisode",
  "name": input.title,
  "episodeNumber": input.episodeNumber,
  "datePublished": input.airDate,
  "description": input.summary,
  "url": input.url,
  ...(input.thumbnailUrl ? { "image": input.thumbnailUrl } : {}),
  "partOfSeries": {
    "@type": "TVSeries",
    "name": input.campaignName,
    "url": `https://talesofaneria.com/campaigns/${input.campaignSlug}`
  },
  "video": {
    "@type": "VideoObject",
    "name": input.title,
    "description": input.summary,
    ...(input.thumbnailUrl ? { "thumbnailUrl": input.thumbnailUrl } : {}),
    "uploadDate": input.airDate,
    "contentUrl": input.youtubeUrl,
    "embedUrl": input.youtubeUrl,
    ...(input.duration ? { "duration": input.duration } : {})
  }
});

export const getPodcastEpisodeSchema = (input: {
  title: string;
  summary: string;
  airDate: string;
  podcastUrl: string;
  campaignName: string;
}) => ({
  "@context": SCHEMA_ORG_CONTEXT,
  "@type": "PodcastEpisode",
  "name": input.title,
  "datePublished": input.airDate,
  "description": input.summary,
  "associatedMedia": {
    "@type": "MediaObject",
    "contentUrl": input.podcastUrl
  },
  "partOfSeries": {
    "@type": "PodcastSeries",
    "name": input.campaignName
  }
});

export const getCreativeWorkSchema = (character: {
  name: string;
  description: string;
  creator: string;
  image?: string;
}) => ({
  "@context": SCHEMA_ORG_CONTEXT,
  "@type": "CreativeWork",
  "name": character.name,
  "description": character.description,
  "creator": {
    "@type": "Person",
    "name": character.creator
  },
  "image": character.image,
  "isPartOf": {
    "@type": "CreativeWorkSeries",
    "name": SITE_NAME
  },
  "genre": ["Fantasy", "Tabletop RPG", "Dungeons & Dragons"]
});
