# Tales of Aneria - TTRPG Live Play Landing Page

## Overview
A professional landing page for the "Tales of Aneria" TTRPG live play series, serving as a central hub for YouTube episodes, podcast content, world lore, merchandise, and community engagement. The site now represents multiple campaign worlds (Aneria, Pterrordale, Journeys Through Taebrin) and aims to provide a rich, interactive experience for fans, integrating multimedia content and detailed character/world information.

## User Preferences
- Fantasy/medieval aesthetic with modern web design best practices
- Content creator website patterns (emphasis on video/audio content)
- Integration-first approach using external services (YouTube, podcasts, WorldAnvil, Etsy)
- Mobile-responsive design

## System Architecture

### Frontend (React + TypeScript)
The frontend is built with React 18, TypeScript, Wouter for routing, TanStack Query for data fetching, and Shadcn UI with Tailwind CSS for styling. Key features include:
-   **Navigation**: Fixed header with responsive mobile menu, automatic scroll-to-top on route changes for optimal UX.
-   **Hero Section**: Full-screen hero with an auto-rotating image carousel.
-   **Content Sections**: Dedicated sections for latest YouTube episodes (with server-side caching), podcast integration, character rosters (active/past, campaign filtering), individual character detail pages (linking D&D Beyond data), world lore, promotions, an Etsy shop, cast profiles, and community calls-to-action.
-   **Legal**: Includes Privacy Policy and Terms of Service pages.
-   **Branding**: Custom D20 die favicon.
-   **SEO & Social Media**: Comprehensive Open Graph and Twitter Card meta tags, dynamic SEO component, JSON-LD structured data, XML sitemap, robots.txt, canonical URLs, semantic HTML, and descriptive alt text.

### Backend (Express + Node.js)
An Express.js backend handles API integrations, including:
-   **YouTube Integration**: `/api/youtube/playlist/:playlistId` endpoint with server-side caching (24-hour duration) to manage API quotas. Supports multiple playlists via `VITE_YOUTUBE_PLAYLIST_IDS` (comma-separated) environment variable. Falls back to Replit OAuth connector if API key has referrer restrictions.
-   **Security Architecture**: Implements OWASP Top 10:2021 compliance, including:
    -   **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options via Helmet.
    -   **CORS**: Whitelist-based origin validation in production.
    -   **Rate Limiting**: General and strict rate limits to prevent DoS attacks and API quota exhaustion.
    -   **Input Validation**: Strict validation for all API parameters to prevent injection.
    -   **SSRF Protection**: Validates podcast feed URLs to prevent Server-Side Request Forgery.
    -   **Error Handling**: Generic error messages in production to prevent information disclosure.
    -   **Security Logging**: Comprehensive logging of security events.

### Design System
-   **Colors**: Dark mode primary with purple and amber accents.
-   **Typography**: Cinzel for headers, Inter for body text.
-   **Components**: Shadcn UI with custom theming.

### Press Kit
A dedicated press kit page provides downloadable brand assets (logo, social previews, brand guidelines) for media and partners.

### Data Management
-   **Cast Members**: Managed via `client/src/data/cast.json`.
-   **Characters**: Managed via `client/src/data/characters.json`, supporting multiple images, D&D Beyond integration, backstories, personality, campaign affiliations, and optional music playlists (Spotify/YouTube).
-   **D&D Beyond Character Sync**: Automated scripts fetch official character data (race, class, level, alignment, avatars) from D&D Beyond API:
    -   `scripts/update-taebrin-characters.ts` - Updates 6 Journeys Through Taebrin characters
    -   `scripts/update-aneria-characters.ts` - Updates 11 Aneria - Wayward Watch characters
    -   `scripts/update-pterrordale-characters.ts` - Updates 5 Pterrordale characters
    -   `scripts/update-all-characters.ts` - Updates all 22 characters across all campaigns
    -   Run with: `tsx scripts/update-all-characters.ts`

### Image Attribution System
All character images include proper copyright attribution, artist credits, and optional AI-generated indicators, adhering to legal best practices and SEO compliance.

### Performance Optimizations
The site implements comprehensive performance optimizations to ensure fast loading times:
-   **Smart Hero Carousel**: Preloads only the current and next image, reducing initial load from 15+ MB to ~1.1 MB.
-   **Lazy Loading**: All non-critical images (campaign backgrounds, cast photos, promotion images) use `loading="lazy"` to defer loading until scrolled into view.
-   **Production Bundle**: Optimized production build produces:
    -   JavaScript: 125.53 KB (gzipped)
    -   CSS: 12.85 KB (gzipped)
    -   Initial hero image: ~1.1 MB
    -   **Total initial load: ~1.25 MB**
-   **Future Optimization**: Phase 2 will convert PNG images to WebP format for ~80% file size reduction.

## External Dependencies
-   **Google YouTube Data API v3**: For fetching YouTube playlist and video details.
-   **Replit YouTube connector**: For OAuth authentication with YouTube (Replit only).
-   **D&D Beyond API**: For fetching character data (race, class, level, alignment) and avatars.
-   **RSS Feed Parser**: For podcast integration.
-   **Etsy**: Integration for displaying featured products.
-   **Patreon**: Call-to-action for community support.
-   **WorldAnvil**: Links for exploring campaign lore.
-   **Social Media**: Links to YouTube, Twitter, Instagram, Twitch, etc.