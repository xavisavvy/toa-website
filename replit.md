# Tales of Aneria - TTRPG Live Play Landing Page

## Overview
A professional landing page for the "Tales of Aneria" TTRPG live play series. This website serves as a central hub for YouTube episodes, podcast content, world lore, merchandise, and community engagement.

## Recent Changes (January 2025)
- Created comprehensive landing page design with fantasy-themed aesthetics
- Integrated YouTube Data API v3 for fetching real playlist videos
- Implemented responsive navigation, hero section, and content sections
- Added mock data placeholders for podcast feeds, WorldAnvil integration, and Etsy products
- Set up environment variable configuration for YouTube playlist ID

## Project Architecture

### Frontend (React + TypeScript)
- **Navigation**: Fixed header with responsive mobile menu
- **Hero**: Full-screen hero section with fantasy background image
- **Latest Episodes**: YouTube playlist integration displaying video thumbnails, duration, and view counts
- **Podcast Section**: Placeholder for RSS feed integration with featured/recent episodes
- **World Section**: Links to WorldAnvil content (characters, locations, factions, lore)
- **Promotions**: Highlight special events and limited-time offers
- **Shop**: Etsy storefront integration showing featured products
- **About**: Cast member profiles and series statistics
- **Community**: Newsletter signup, social media links, testimonials
- **Footer**: Multi-column layout with quick links and legal information

### Backend (Express + Node.js)
- **YouTube Integration**: `/api/youtube/playlist/:playlistId` endpoint
  - Uses Replit YouTube connector for authentication
  - Fetches playlist items and video details (duration, views, thumbnails)
  - Formats data for frontend consumption
  
### Design System
- **Colors**: Dark mode primary with purple (#280 60% 55%) and amber accents
- **Typography**: Cinzel (serif) for headers, Inter for body text
- **Components**: Shadcn UI component library with custom theming
- **Spacing**: Consistent vertical rhythm with py-20/lg:py-32 section spacing

## Environment Variables

### Required
- `VITE_YOUTUBE_PLAYLIST_ID` - YouTube playlist ID to display episodes from

### Optional (for future integration)
- Podcast RSS feed URL
- WorldAnvil API credentials
- Etsy shop URL/API credentials

## User Preferences
- Fantasy/medieval aesthetic with modern web design best practices
- Content creator website patterns (emphasis on video/audio content)
- Integration-first approach using external services (YouTube, podcasts, WorldAnvil, Etsy)
- Mobile-responsive design

## Tech Stack
- React 18 with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI + Tailwind CSS for styling
- Express.js backend
- Google YouTube Data API v3
- Replit YouTube connector for OAuth

## Next Steps
1. Configure `VITE_YOUTUBE_PLAYLIST_ID` environment variable with actual playlist
2. Add RSS feed parser for podcast integration
3. Implement WorldAnvil API integration for lore content
4. Connect Etsy API or static product links
5. Add analytics tracking
6. Implement newsletter subscription backend
