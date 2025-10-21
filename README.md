# Tales of Aneria - TTRPG Live Play Landing Page

A professional landing page for your TTRPG Live Play series, featuring YouTube integration, podcast feeds, world lore, and merchandise showcase.

## Features

✨ **YouTube Integration** - Automatically fetches and displays your latest episodes from any YouTube playlist
🎙️ **Podcast Feed** - Integrates with any RSS podcast feed to showcase your audio content
🗺️ **World Building** - Links to WorldAnvil pages for characters, locations, factions, and lore
🛍️ **Merchandise** - Showcase products and link to your Etsy storefront
👥 **Cast & Community** - Highlight your team and connect with fans through social media
📱 **Fully Responsive** - Beautiful design on desktop, tablet, and mobile devices

## Quick Start

### 1. Environment Setup

This project uses environment variables for configuration. All required and optional variables are documented in `.env.example`.

**For Local Development:**

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual values - See `.env.example` for detailed documentation of each variable

3. **Required Variables:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `YOUTUBE_API_KEY` - YouTube Data API v3 key
   - `VITE_YOUTUBE_PLAYLIST_ID` - Your YouTube playlist ID
   - `VITE_PODCAST_FEED_URL` - Your podcast RSS feed URL
   - `SESSION_SECRET` - Random secret for session encryption
   - `ALLOWED_ORIGINS` - CORS allowed origins (production only)

4. **Optional Variables:**
   - `ETSY_API_KEY` - For Etsy shop integration
   - `ETSY_ACCESS_TOKEN` - For Etsy shop integration

**For Vercel Deployment:**

See `DEPLOYMENT.md` for comprehensive step-by-step deployment instructions including:
- Database setup options (Vercel Postgres, Neon, Supabase, Railway)
- Getting all required API keys
- Custom domain configuration
- Security best practices
- Troubleshooting guide

### 2. Configure Environment Variables

The YouTube playlist ID is already configured! Your latest episodes are displaying on the site.

**Current Configuration:**
- ✅ YouTube Playlist ID: `PLrmC8WonT9uaUoORXiAwGUo21Mp_N2u8v`

**Optional Configuration:**
To add podcast episodes, you can add the podcast RSS feed URL in the Replit Secrets panel:
- Key: `VITE_PODCAST_FEED_URL`
- Value: Your podcast RSS feed URL

### 2. How to Get Your YouTube Playlist ID

1. Go to your YouTube playlist
2. Look at the URL: `https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxx`
3. Copy everything after `list=` - that's your playlist ID
4. Example: If URL is `https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf`
   Then your ID is: `PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf`

### 3. Find Your Podcast RSS Feed

Most podcast platforms provide an RSS feed URL:
- **Spotify**: Use a service like Spotifeed or check your podcast settings
- **Apple Podcasts**: Right-click your podcast and select "Copy RSS Feed"
- **Anchor/Other hosting**: Check your podcast dashboard for the RSS feed URL

### 4. Run the Application

The application is already running! Just refresh your browser to see the changes after configuring environment variables.

## Customization Guide

### Update Cast Members

Cast members are managed in a simple JSON file at `client/src/data/cast.json`. This makes it easy to add, remove, or update cast information without touching any code.

**To add or update a cast member:**

1. Open `client/src/data/cast.json`
2. Add or modify an entry:

```json
{
  "id": "unique-id-lowercase",
  "name": "Full Name",
  "role": "Game Master" or "Player",
  "characters": ["Character Name 1", "Character Name 2"],
  "isCurrent": true,
  "avatar": "https://url-to-headshot.jpg",
  "socialLinks": {
    "youtube": "https://youtube.com/@yourhandle",
    "twitter": "https://twitter.com/yourhandle",
    "instagram": "https://instagram.com/yourhandle",
    "twitch": "https://twitch.tv/yourhandle"
  }
}
```

**Field Explanations:**
- `id`: Unique identifier (use lowercase with dashes, e.g., "john-smith")
- `name`: Full name as displayed on the site
- `role`: Either "Game Master" or "Player"
- `characters`: Array of character names they've played (can list multiple)
- `isCurrent`: Set to `true` for current cast, `false` for past cast members
- `avatar`: URL to profile image (leave empty `""` for default initials)
- `socialLinks`: Include any/all social platforms (leave empty `""` if they don't have an account)

**Current Cast vs Past Cast:**
- Current cast members appear in the main "Current Cast" section
- Past cast members appear separately below in "Past Cast Members"
- Both are automatically sorted and displayed based on the `isCurrent` field

**Social Media Links:**
- Only platforms with URLs will show icon buttons
- Links open in new tabs with proper security attributes
- Each link includes accessible labels for screen readers (SEO best practice)

### Update Social Media Links

All social media links across the site are managed in a single JSON file: `client/src/data/social-links.json`

**Current Links:**
- ✅ YouTube: `https://www.youtube.com/@TalesOfAneria`
- ✅ X (Twitter): `https://x.com/TalesOfAneria`
- ✅ Discord: `https://discord.gg/br9UhyXtWp`
- ✅ Reddit: `https://www.reddit.com/r/TalesOfAneria/`
- ✅ Patreon: `https://www.patreon.com/TalesofAneria`
- ✅ Etsy: `https://www.etsy.com/shop/talesofaneria`
- ✅ Email: `TalesOfAneria@gmail.com`

To update any link, simply edit the `social-links.json` file. All components (Footer, CommunitySection, Hero, etc.) automatically use these links.

### Add Real Promotions

Edit `client/src/components/PromotionsSection.tsx` to showcase your current events and special offers.

### Link Your Etsy Store

Edit `client/src/components/ShopSection.tsx`:
1. Update the "Visit Our Etsy Store" button with your actual Etsy shop URL
2. Replace mock products with your real products
3. Update product images and prices

### WorldAnvil Integration

Update the links in `client/src/components/WorldSection.tsx` to point to your actual WorldAnvil pages:

```typescript
onClick={() => window.open('https://www.worldanvil.com/your-world', '_blank')}
```

## API Endpoints

### YouTube Episodes
```
GET /api/youtube/playlist/:playlistId?maxResults=10
```
Fetches videos from a YouTube playlist with thumbnails, duration, and view counts.

### Podcast Feed
```
POST /api/podcast/feed
Body: { feedUrl: string, limit?: number }
```
Parses an RSS podcast feed and returns episode information.

## Technologies Used

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Integrations**: YouTube Data API v3, RSS Parser
- **Styling**: Custom fantasy theme with purple and amber accents

## Design System

The site uses a fantasy-themed design:
- **Primary Color**: Rich purple (#280 60% 55%)
- **Accent Color**: Warm amber (#35 80% 50%)
- **Typography**: Cinzel (serif) for headings, Inter for body text
- **Dark Mode**: Deep charcoal background with elevated surfaces

## Deployment

### Deploy to Vercel

This application is optimized for Vercel deployment. See `DEPLOYMENT.md` for complete instructions.

**Quick Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. Click the button above or connect your repository to Vercel
2. Configure environment variables (see `DEPLOYMENT.md` for details)
3. Deploy!

**Required Environment Variables for Production:**
- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `ALLOWED_ORIGINS` - Your production domain(s)
- `SESSION_SECRET` - Secure random string
- `YOUTUBE_API_KEY` - YouTube API credentials
- `VITE_YOUTUBE_PLAYLIST_ID` - Your playlist ID
- `VITE_PODCAST_FEED_URL` - Your podcast RSS feed

**Documentation:**
- See `.env.example` for detailed variable documentation
- See `DEPLOYMENT.md` for complete deployment guide
- See `replit.md` for architecture and technical details

## Support & Troubleshooting

### Episodes Not Showing?
1. Check that `VITE_YOUTUBE_PLAYLIST_ID` is set correctly
2. Verify the playlist is public (not private or unlisted)
3. Check browser console for API errors
4. Verify `YOUTUBE_API_KEY` is valid and has YouTube Data API v3 enabled

### Podcast Not Loading?
1. Verify `VITE_PODCAST_FEED_URL` is a valid RSS feed URL
2. Test the RSS feed URL in a browser to ensure it's accessible
3. Check that the feed follows standard RSS/podcast feed format

### CORS Errors in Production?
1. Ensure `ALLOWED_ORIGINS` includes your production domain
2. Include both www and non-www versions
3. Use HTTPS URLs only

### Database Connection Issues?
1. Verify `DATABASE_URL` is correct and includes `?sslmode=require`
2. Check database is accessible from your deployment platform
3. Ensure SSL certificates are valid

For more troubleshooting, see `DEPLOYMENT.md`.

## Next Steps

1. ✅ Configure environment variables
2. ✅ Add your YouTube playlist ID
3. ✅ Add your podcast RSS feed (optional)
4. ✅ Update cast member information
5. ✅ Link social media profiles
6. ✅ Connect Etsy store
7. ✅ Link WorldAnvil pages
8. ✅ Test on mobile devices
9. ✅ Share with your community!

## License

This project is built for Tales of Aneria. All content and branding specific to Tales of Aneria belongs to the creators.

---

Built with ❤️ for the TTRPG community
