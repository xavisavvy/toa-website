// Structured Data (JSON-LD) generators for SEO

export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Tales of Aneria",
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
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Tales of Aneria",
  "url": "https://talesofaneria.com",
  "description": "Join us on an epic journey through the mystical world of Aneria. Watch our TTRPG live play series, explore rich lore, and discover exclusive merchandise from our adventures.",
  "publisher": {
    "@type": "Organization",
    "name": "Tales of Aneria"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://talesofaneria.com/characters?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});

export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
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
  "@context": "https://schema.org",
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
    "name": "Tales of Aneria",
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
  "@context": "https://schema.org",
  "@type": "Person",
  "name": person.name,
  "description": person.description,
  "image": person.image,
  "sameAs": person.sameAs,
  "memberOf": {
    "@type": "Organization",
    "name": "Tales of Aneria"
  }
});

export const getCreativeWorkSchema = (character: {
  name: string;
  description: string;
  creator: string;
  image?: string;
}) => ({
  "@context": "https://schema.org",
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
    "name": "Tales of Aneria"
  },
  "genre": ["Fantasy", "Tabletop RPG", "Dungeons & Dragons"]
});
