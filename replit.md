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
- **Legal**: Includes a Privacy Policy page (`/legal/privacy`) detailing third-party services and user rights, linked from the footer.

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
