# Tales of Aneria - TTRPG Live Play Landing Page

## Overview
A professional landing page for the "Tales of Aneria" TTRPG live play series. This website serves as a central hub for YouTube episodes, podcast content, world lore, merchandise, and community engagement. The site now represents multiple campaign worlds under the Tales of Aneria umbrella: Aneria, Pterrordale, and Journeys Through Taebrin. The project aims to provide a rich, interactive experience for fans, integrating multimedia content and detailed character/world information.

## User Preferences
- Fantasy/medieval aesthetic with modern web design best practices
- Content creator website patterns (emphasis on video/audio content)
- Integration-first approach using external services (YouTube, podcasts, WorldAnvil, Etsy)
- Mobile-responsive design

## System Architecture

### Frontend (React + TypeScript)
The frontend is built with React 18 and TypeScript, utilizing Wouter for routing, TanStack Query for data fetching, and Shadcn UI with Tailwind CSS for styling.

- **Navigation**: Fixed header with logo and responsive mobile menu.
- **Hero Section**: Full-screen hero with auto-rotating image carousel (4 fantasy images) and smooth fade transitions.
- **Content Sections**:
    - **Latest Episodes**: Integrates YouTube playlists, displaying video thumbnails, duration, and view counts. Features server-side caching to prevent API quota exhaustion.
    - **Podcast Section**: RSS feed integration with featured/recent episodes and an audio player.
    - **Characters Section**: Displays active characters in a 4-column grid on the homepage, linking to individual character detail pages.
    - **Character Detail Pages**: Dedicated pages (`/characters/:id`) with hero section (character name, stats), backstory, personality, image gallery, and D&D Beyond integration.
    - **All Characters Page**: A comprehensive roster (`/characters`) with active/past character distinction, campaign badges, and dynamic campaign filtering.
    - **World Section**: Showcases campaign worlds (Aneria, Pterrordale, Taebrin) with details, background images, and WorldAnvil links.
    - **Promotions**: Highlights special events.
    - **Shop**: Etsy storefront integration.
    - **About**: Cast member profiles with photos and series statistics.
    - **Community**: Patreon call-to-action and social media links.
- **Legal**: Includes Privacy Policy (`/legal/privacy`) and Terms of Service (`/legal/tos`) pages detailing third-party services, user rights, intellectual property, and usage terms. Both are linked from the footer.
- **Branding**: Custom D20 die favicon (`client/public/favicon.png`) representing the TTRPG theme.
- **SEO & Social Media**: 
    - Comprehensive Open Graph and Twitter Card meta tags for rich social media previews on Facebook, Twitter/X, LinkedIn, WhatsApp, Discord, and messaging platforms
    - Custom preview image (`client/public/og-image.png`) optimized for social sharing (1200x630px)
    - Dynamic SEO component (`client/src/components/SEO.tsx`) for page-specific meta tags
    - JSON-LD structured data for rich search engine results (Organization, WebSite, BreadcrumbList, CreativeWork schemas)
    - XML sitemap (`client/public/sitemap.xml`) for search engine crawling
    - Robots.txt (`client/public/robots.txt`) with proper directives
    - Page-specific titles, descriptions, and keywords for all routes
    - Canonical URLs to prevent duplicate content issues
    - Semantic HTML with proper heading hierarchy (h1, h2, h3)
    - Descriptive alt text for all images
    - Mobile-friendly responsive design

### Backend (Express + Node.js)
An Express.js backend handles API integrations.
- **YouTube Integration**: `/api/youtube/playlist/:playlistId` endpoint uses Replit YouTube connector for authentication, fetches playlist items, and formats data. Includes a server-side caching system (`server/cache/youtube-playlist.json`) with a 24-hour duration to manage API quotas, falling back to stale cache if necessary.

### Design System
- **Colors**: Dark mode primary with purple and amber accents.
- **Typography**: Cinzel (serif) for headers, Inter for body text.
- **Components**: Shadcn UI component library with custom theming.
- **Spacing**: Consistent vertical rhythm with `py-20/lg:py-32` section spacing.

### Data Management
- **Cast Members**: Managed via `client/src/data/cast.json`, including roles, characters, current status, avatars, and social links.
- **Characters**: Managed via `client/src/data/characters.json`, supporting multiple images, D&D Beyond integration (fetching real data for race, class, level, alignment, avatars), backstories, personality, campaign affiliations, and optional music playlists.

### Image Attribution System
All character images include proper copyright attribution and artist credits:
- **Copyright**: Displays "© [holder]" (e.g., "D&D Beyond / Wizards of the Coast") for all images
- **Artist Credits**: Optional artist name with clickable link to portfolio/commissions page
- **AI-Generated Indicators**: Amber-colored badges mark AI-generated artwork
- **SEO Compliance**: Schema.org microdata (itemProp="copyrightHolder", itemProp="creator")
- **Legal Best Practices**: Follows industry standards for copyright attribution
- Current images from D&D Beyond are properly attributed to "D&D Beyond / Wizards of the Coast"

## External Dependencies
- **Google YouTube Data API v3**: For fetching YouTube playlist and video details.
- **Replit YouTube connector**: For OAuth authentication with YouTube.
- **D&D Beyond API**: For fetching character data (race, class, level, alignment) and avatars.
- **RSS Feed Parser**: For podcast integration.
- **Etsy**: Integration for displaying featured products (requires API credentials).
- **Patreon**: Call-to-action for community support.
- **WorldAnvil**: Links for exploring campaign lore.
- **Social Media**: Links for YouTube, Twitter, Instagram, Twitch, etc.

## Security Architecture (OWASP Top 10:2021 Compliance)

This application implements enterprise-grade security following **OWASP Top 10:2021** best practices.

### Security Middleware (`server/security.ts`)

All security configurations are centralized in `server/security.ts` and applied before any routes.

#### A02: Cryptographic Failures - Security Headers (Helmet)

**Content Security Policy (CSP)**: Prevents XSS attacks by controlling which resources can be loaded.
- `defaultSrc`: Self only
- `scriptSrc`: Self, YouTube, Google APIs (unsafe-inline/eval for Vite dev mode)
- `styleSrc`: Self, Google Fonts (unsafe-inline for Tailwind)
- `imgSrc`: Self, data URIs, HTTPS (for external images)
- `connectSrc`: Self, Google APIs, D&D Beyond, Etsy
- `frameSrc`: YouTube, Spotify embeds
- `upgradeInsecureRequests`: Forces HTTPS in production

**HTTP Strict Transport Security (HSTS)**: Forces HTTPS connections.
- Max age: 1 year (31536000 seconds)
- Includes subdomains
- Preload enabled

**Other Headers**:
- `X-Frame-Options`: SAMEORIGIN (prevents clickjacking)
- `X-Content-Type-Options`: nosniff (prevents MIME sniffing)
- `X-DNS-Prefetch-Control`: Disabled
- `Referrer-Policy`: strict-origin-when-cross-origin

#### A05: Security Misconfiguration - CORS

**Development**: Allows all origins for local development.

**Production**: Whitelist-based origin validation.
- Configurable via `ALLOWED_ORIGINS` environment variable (comma-separated)
- Auto-allows `.replit.app` and `.repl.co` domains
- Credentials enabled for session management
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Max age: 24 hours

#### A05: Rate Limiting (DoS Prevention)

**General API Rate Limit**: 100 requests per 15 minutes per IP.
- Applied to all `/api/*` routes
- Returns 429 status with clear message when exceeded
- Disabled in development mode

**Strict Rate Limit**: 30 requests per 15 minutes per IP.
- Applied to expensive external API calls:
  - `/api/youtube/*`
  - `/api/etsy/*`
  - `/api/podcast/*`
- Prevents API quota exhaustion and abuse

#### A03: Injection Prevention - Input Validation

**YouTube Playlist Endpoint** (`/api/youtube/playlist/:playlistId`):
- Validates `playlistId` format (alphanumeric, hyphens, underscores only)
- Validates `maxResults` parameter (1-100 range)
- Logs suspicious activity

**Podcast Feed Endpoint** (`/api/podcast/feed`):
- **A10: SSRF Protection** - Validates feed URLs to prevent Server-Side Request Forgery:
  - Blocks localhost and 127.0.0.1
  - Blocks private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x)
  - Blocks link-local IPv6 addresses (fc, fd, fe80)
  - Blocks AWS metadata service (169.254.169.254)
  - Requires valid HTTP/HTTPS protocols
- Validates `limit` parameter (1-50 range)
- Logs SSRF attempts with IP address

**Etsy Shop Endpoint** (`/api/etsy/shop/:shopId/listings`):
- Validates `shopId` format (alphanumeric only)
- Validates `limit` parameter (1-50 range)
- Logs suspicious activity

#### A07: Error Handling - Information Disclosure Prevention

**Production Mode**:
- Generic error messages for 500 errors
- No stack traces or implementation details exposed

**Development Mode**:
- Detailed error messages with stack traces
- Full debugging information

**All Modes**:
- Structured error logging with timestamps
- IP address tracking for security events
- Sanitized error responses

#### A09: Security Logging and Monitoring

**Security Events Logged**:
- Invalid input attempts (playlist IDs, shop IDs)
- SSRF attack attempts with IP addresses
- Rate limit violations
- Server errors with full context

**Log Format**:
```json
{
  "timestamp": "2025-10-21T12:00:00.000Z",
  "event": "SSRF_ATTEMPT",
  "feedUrl": "http://169.254.169.254/metadata",
  "ip": "1.2.3.4",
  "error": "Access to metadata service is not allowed"
}
```

### Additional Security Measures

#### Request Body Size Limits
- JSON payload limit: 1MB
- URL-encoded payload limit: 1MB
- Prevents memory exhaustion attacks

#### YouTube Playlist Caching
- 24-hour cache duration
- Prevents API quota exhaustion
- Graceful degradation with stale cache fallback

### Security Configuration

**Environment Variables** (`.env.example`):
```bash
# Security Configuration (OWASP Best Practices)
# Comma-separated list of allowed origins for CORS (production only)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Security Best Practices Summary

✅ **A01: Broken Access Control** - N/A (public content website)
✅ **A02: Cryptographic Failures** - HSTS, security headers, HTTPS enforcement
✅ **A03: Injection** - Input validation, parameterized queries (Drizzle ORM), XSS prevention (React auto-escaping)
✅ **A04: Insecure Design** - Secure architecture with defense in depth
✅ **A05: Security Misconfiguration** - Helmet, CORS, rate limiting, secure defaults
✅ **A06: Vulnerable Components** - Regular dependency updates, audit checks
✅ **A07: Identification/Authentication** - N/A (public content website)
✅ **A08: Software/Data Integrity** - CSP, SRI for external resources
✅ **A09: Security Logging** - Comprehensive security event logging
✅ **A10: Server-Side Request Forgery** - URL validation, IP blocking, whitelist validation
## Character Playlist Feature

Each character can have an associated music playlist (Spotify or YouTube) that captures their theme and personality.

### Adding a Playlist
To add a playlist to a character, edit `client/src/data/characters.json` and add the `playlist` field:

```json
{
  "id": "wayne-archivist",
  "name": "Wayne \"Archivist of Lies\"",
  "playlist": "https://open.spotify.com/playlist/...",
  ...
}
```

### Supported Platforms
- **Spotify**: Use full playlist URL (e.g., `https://open.spotify.com/playlist/...`)
- **YouTube**: Use full playlist URL (e.g., `https://www.youtube.com/playlist?list=...`)
- **YouTube Music**: Use full playlist URL (e.g., `https://music.youtube.com/playlist?list=...`)

### Display
- Playlist button appears on character detail page below the D&D Beyond button
- Uses Music icon from Lucide React
- Opens in new tab with proper security attributes
- Only displays if playlist URL is provided
