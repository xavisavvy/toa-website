# Tales of Aneria - TTRPG Live Play Landing Page

## Overview
A professional landing page for the "Tales of Aneria" TTRPG live play series. This website serves as a central hub for YouTube episodes, podcast content, world lore, merchandise, and community engagement. The site now represents multiple campaign worlds under the Tales of Aneria umbrella: Aneria (Seasons 1/2 with Wayward Watch and Littlest Hopes), Pterrordale (Halloween special), and Journeys Through Taebrin (coming soon).

## Recent Changes (October 2025)
- Created comprehensive landing page design with fantasy-themed aesthetics
- Integrated YouTube Data API v3 for fetching real playlist videos
- Implemented RSS podcast feed parser with audio player support
- Implemented responsive navigation, hero section, and content sections
- Added official Tales of Aneria logo (logo-TOA.svg) to navigation header
- Added cast member photos: Preston Farr, Brigette S, and Dallin Rogers
- Set up environment variable configuration for YouTube playlist ID and podcast RSS feed
- Created cast.json data file for easy cast member management
- Implemented current vs past cast member distinction
- Added social media links for cast members with SEO best practices
- Created centralized social-links.json for site-wide social media links
- Replaced newsletter signup with Patreon call-to-action
- Connected all social media buttons across site to real URLs
- Restructured World Section to showcase 3 campaign worlds: Aneria, Pterrordale, and Taebrin
- Added campaign details for each world with "Coming Soon" badge for Taebrin
- **Implemented Characters section with detailed character pages:**
  - Created characters.json data structure supporting multiple images per character
  - Built CharactersSection component for homepage with 4-column character grid
  - Added dedicated character detail pages (/characters/:id) with backstory, personality, image gallery, and D&D Beyond integration
  - Created all characters index page (/characters) with active/past character distinction
  - Integrated character navigation with smooth scrolling and routing

## Project Architecture

### Frontend (React + TypeScript)
- **Navigation**: Fixed header with Tales of Aneria logo and responsive mobile menu
- **Hero**: Full-screen hero section with auto-rotating image carousel (4 fantasy images: butterfly, cinderhearth sword, desert, space)
  - Automatic rotation every 6 seconds
  - Manual controls via indicator dots
  - Smooth 1-second fade transitions
- **Latest Episodes**: YouTube playlist integration displaying video thumbnails, duration, and view counts
- **Podcast Section**: RSS feed integration with featured/recent episodes and audio player
- **Characters Section**: Hero showcase with character cards
  - Homepage section displays active characters in 4-column grid
  - Character cards show featured image, name, class/race, player, and backstory snippet
  - Links to individual character detail pages
  - "View All Characters" button navigates to full character roster
- **Character Detail Pages**: Individual character profiles at /characters/:id
  - Hero section with character name and key stats (level, race, class, alignment)
  - Backstory and personality sections
  - Image gallery supporting multiple images per character
  - Character info sidebar with player, campaign, and stats
  - D&D Beyond integration (when link provided)
  - Back navigation to character index
- **All Characters Page**: Complete character roster at /characters
  - Separate sections for active and past characters
  - Same card layout as homepage section
  - Character status filtering (active/inactive)
- **World Section**: Showcases 3 campaign worlds (Aneria, Pterrordale, Taebrin) with campaign details and WorldAnvil links
- **Promotions**: Highlight special events and limited-time offers
- **Shop**: Etsy storefront integration showing featured products
- **About**: Cast member profiles with photos and series statistics
- **Community**: Patreon call-to-action, social media links
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

## Cast Member Management

Cast members are managed via `client/src/data/cast.json`:

### JSON Structure
```json
{
  "id": "unique-id",
  "name": "Full Name",
  "role": "Game Master" or "Player",
  "characters": ["Character 1", "Character 2"],
  "isCurrent": true/false,
  "avatar": "url-to-image",
  "socialLinks": {
    "youtube": "https://youtube.com/@handle",
    "twitter": "https://twitter.com/handle",
    "instagram": "https://instagram.com/handle",
    "twitch": "https://twitch.tv/handle"
  }
}
```

### Current Cast
- Cory Avis (Game Master) - The Storyteller
- Preston Farr (Player) - Wayne the Archivist of Lies, Victor Udonta, Locke Lirian, and more
- Torrey Woolsey (Player) - Winnifred "Fred" Blodbane, Maggie Bramblecheeks
- Scott Avis (Player) - Carine Sol, Bolt, Cilin Meekmarrow
- Dallin Rogers (Player) - Erys Leandorian, Aramis, Ezra
- Ian (Player) - Titheus Cillbrost
- Jake (Player) - Porphan Valaritas

### Past Cast
- Colby Poulsen (Player) - Seredan Fallowshield, Alomah Stargazer (early season)
- Brigette S (Player) - Melly

## Character Management

Characters are managed via `client/src/data/characters.json`:

### JSON Structure
```json
{
  "id": "unique-slug",
  "name": "Character Full Name",
  "player": "Player Name",
  "playerId": "player-id-from-cast.json",
  "campaign": "Campaign Name",
  "race": "Character Race",
  "class": "Character Class",
  "level": 12,
  "alignment": "Alignment",
  "featuredImage": "url-to-featured-image",
  "images": [
    {
      "id": "unique-id",
      "url": "image-url",
      "caption": "Image Caption",
      "type": "portrait|reference|fanart",
      "isFeatured": true/false
    }
  ],
  "backstory": "Character backstory text",
  "personality": "Character personality description",
  "dndbeyond": "https://www.dndbeyond.com/characters/...",
  "status": "active|inactive"
}
```

### Character Image Types
- **portrait**: Main character artwork
- **reference**: Reference images for character design
- **fanart**: Fan-created artwork

### Featured Image
- One image per character should have `isFeatured: true`
- The featured image URL should also be set in `featuredImage` field
- Featured image appears on character cards and detail page hero

### Routes
- Homepage section: Displays active characters only
- `/characters`: All characters (active and inactive)
- `/characters/:id`: Individual character detail page

## Next Steps
1. ✅ Configure `VITE_YOUTUBE_PLAYLIST_ID` environment variable with actual playlist
2. ✅ Add RSS feed parser for podcast integration
3. ✅ Fix YouTube OAuth2 authentication for playlist fetching
4. ✅ Connect Etsy API for real product listings
5. ✅ Add Preston Farr's headshot to cast.json
6. ✅ Add Brigette S's photo to cast.json
7. ✅ Add Dallin Rogers' photo to cast.json
8. ✅ Connect WorldAnvil links to Aneria world page
9. Add remaining cast member photos to `cast.json`
10. Add cast member social media links to `cast.json`
11. Add podcast RSS feed URL to environment variables
12. Add analytics tracking

## Etsy Integration Note
The Etsy API integration is fully implemented but requires valid credentials to display products. The site gracefully handles the API error and shows a friendly message with a working link to the Etsy store.
