import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
  noindex?: boolean;
  jsonLd?: object;
  ogImageAlt?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

export default function SEO({
  title = 'Tales of Aneria - Epic TTRPG Live Play Series',
  description = 'Join us on an epic journey through the mystical world of Aneria. Watch our TTRPG live play series, explore rich lore, and discover exclusive merchandise from our adventures.',
  canonical = 'https://talesofaneria.com/',
  ogImage = 'https://talesofaneria.com/og-image.png',
  ogType = 'website',
  keywords = 'TTRPG, Dungeons and Dragons, D&D, live play, actual play, tabletop RPG, fantasy, Aneria, podcast, YouTube',
  noindex = false,
  jsonLd,
  ogImageAlt = 'Tales of Aneria - Epic TTRPG Live Play Series',
  ogImageWidth = '1200',
  ogImageHeight = '630',
  twitterCard = 'summary_large_image',
}: SEOProps) {
  useEffect(() => {
    // Ensure absolute URL for OG image
    const absoluteOgImage = ogImage.startsWith('http') 
      ? ogImage 
      : `https://talesofaneria.com${ogImage}`;

    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Primary meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:url', canonical, true);
    updateMetaTag('og:image', absoluteOgImage, true);
    updateMetaTag('og:image:secure_url', absoluteOgImage, true);
    updateMetaTag('og:image:alt', ogImageAlt, true);
    updateMetaTag('og:image:width', ogImageWidth, true);
    updateMetaTag('og:image:height', ogImageHeight, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:site_name', 'Tales of Aneria', true);

    // Twitter Card
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', absoluteOgImage);
    updateMetaTag('twitter:image:alt', ogImageAlt);

    // Robots
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }

    // Update canonical link
    let canonicalElement = document.querySelector('link[rel="canonical"]');
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute('href', canonical);

    // Add JSON-LD structured data
    if (jsonLd) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]');
      if (scriptElement) {
        scriptElement.textContent = JSON.stringify(jsonLd);
      } else {
        scriptElement = document.createElement('script');
        scriptElement.setAttribute('type', 'application/ld+json');
        scriptElement.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(scriptElement);
      }
    }
  }, [title, description, canonical, ogImage, ogType, keywords, noindex, jsonLd, ogImageAlt, ogImageWidth, ogImageHeight, twitterCard]);

  return null; // This component doesn't render anything
}
