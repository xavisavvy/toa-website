# Tales of Aneria - TTRPG Live Play Landing Page 

A professional landing page for our TTRPG Live Play series, featuring YouTube integration, podcast feeds, world lore, and merchandise showcase.

## Features

✨ **YouTube Integration** - Automatically fetches and displays our latest episodes from any YouTube playlist
🎙️ **Podcast Feed** - Integrates with any RSS podcast feed to showcase our audio content
🗺️ **World Building** - Links to WorldAnvil pages for characters, locations, factions, and lore
🛍️ **Merchandise** - Showcase products and link to our Etsy storefront
👥 **Cast & Community** - Highlight our team and connect with fans through social media
📱 **Fully Responsive** - Beautiful design on desktop, tablet, and mobile devices

## Quick Start

### 1. Environment Setup

This project uses environment variables for configuration. All required and optional variables are documented in `.env.example`.

**For Local Development:**

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with Our actual values - See `.env.example` for detailed documentation of each variable

3. **Required Variables:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `YOUTUBE_API_KEY` - YouTube Data API v3 key (server-side)
   - `VITE_YOUTUBE_PLAYLIST_ID` - Our YouTube playlist ID
   - `VITE_PODCAST_FEED_URL` - Our podcast RSS feed URL
   - `SESSION_SECRET` - Random secret for session encryption
   - `ALLOWED_ORIGINS` - CORS allowed origins (production only)

4. **Optional Variables:**
   - `VITE_YOUTUBE_API_KEY` - YouTube API key for client-side access
   - `ETSY_API_KEY` - For Etsy shop integration
   - `ETSY_ACCESS_TOKEN` - For Etsy shop integration



### 2. Configure Environment Variables

The YouTube playlist ID is already configured! Our latest episodes are displaying on the site.

**Current Configuration:**
- ✅ YouTube Playlist ID: `PLrmC8WonT9uaUoORXiAwGUo21Mp_N2u8v`

**Optional Configuration:**
To add podcast episodes, you can add the podcast RSS feed URL in the Replit Secrets panel:
- Key: `VITE_PODCAST_FEED_URL`
- Value: Our podcast RSS feed URL

### 2. How to Get Our YouTube Playlist ID

1. Go to our YouTube playlist
2. Look at the URL: `https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxx`
3. Copy everything after `list=` - that's our playlist ID
4. Example: If URL is `https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf`
   Then our ID is: `PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf`

### 3. Find Our Podcast RSS Feed

Most podcast platforms provide an RSS feed URL:
- **Spotify**: Use a service like Spotifeed or check our podcast settings
- **Apple Podcasts**: Right-click our podcast and select "Copy RSS Feed"
- **Anchor/Other hosting**: Check our podcast dashboard for the RSS feed URL

### 4. Run the Application

The application is already running! Just refresh our browser to see the changes after configuring environment variables.

## Customization Guide

### Update Character Images

Character images can be customized with local files or automatically pulled from D&D Beyond.

**To add custom character images:**

1. Place your images in `client/public/characters/` using these filenames:
   - `wayne-archivist.jpg` (or .png, .webp)
   - `carine-sol.jpg`
   - `erys-leandorian.jpg`
   - `freya-fenrir.jpg`
   - `porphan-valaritas.jpg`
   - `titheus-cillbrost.jpg`

2. Run the update script:
   ```bash
   npm run update-taebrin-images
   ```

**How it works:**
- If a custom image exists → uses the local image
- If no custom image → fetches the latest avatar from D&D Beyond
- You can add custom images gradually - any character without a custom image will use their D&D Beyond avatar

**Supported image formats:** .jpg, .jpeg, .png, .webp

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

Edit `client/src/components/PromotionsSection.tsx` to showcase our current events and special offers.

### Link Our Etsy Store

Edit `client/src/components/ShopSection.tsx`:
1. Update the "Visit Our Etsy Store" button with our actual Etsy shop URL
2. Replace mock products with our real products
3. Update product images and prices

### WorldAnvil Integration

Update the links in `client/src/components/WorldSection.tsx` to point to our actual WorldAnvil pages:

```typescript
onClick={() => window.open('https://www.worldanvil.com/our-world', '_blank')}
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

## Versioning

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning and changelog generation.

### Commit Message Format

When making commits, use the following format:

```
<type>(<scope>): <subject>
```

**Types:**
- `feat:` - A new feature (bumps minor version)
- `fix:` - A bug fix (bumps patch version)
- `refactor:` - Code refactoring without feature changes
- `perf:` - Performance improvements
- `docs:` - Documentation changes only
- `style:` - Code style changes (formatting, semicolons, etc.)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
feat: add character gallery section
fix: resolve mobile navigation menu issues
refactor: optimize YouTube API calls
perf: improve image loading performance
```

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the commit body or add `!` after the type:

```bash
feat!: redesign navigation menu

BREAKING CHANGE: Navigation component API has changed
```

This will bump the major version (1.0.0 → 2.0.0).

### Automatic Versioning

When you push commits to the `main` branch:
1. GitHub Actions automatically analyzes your commit messages
2. Bumps the version in `package.json` based on commit types
3. Generates/updates `CHANGELOG.md` with your changes
4. Creates a git tag for the new version
5. Pushes the changes back to the repository

**Version Bump Rules:**
- `fix:` commits → Patch version (1.0.0 → 1.0.1)
- `feat:` commits → Minor version (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` → Major version (1.0.0 → 2.0.0)

### Manual Versioning

You can also manually trigger versioning:

```bash
# Automatic version bump based on commits
npm run release

# Force a specific version bump
npm run release:patch  # 1.0.0 → 1.0.1
npm run release:minor  # 1.0.0 → 1.1.0
npm run release:major  # 1.0.0 → 2.0.0
```

Then push with tags:
```bash
git push --follow-tags origin main
```

## Design System

The site uses a fantasy-themed design:
- **Primary Color**: Rich purple (#280 60% 55%)
- **Accent Color**: Warm amber (#35 80% 50%)
- **Typography**: Cinzel (serif) for headings, Inter for body text
- **Dark Mode**: Deep charcoal background with elevated surfaces

## Deployment

This application can be deployed to various platforms. Ensure you have:

**Required Environment Variables for Production:**
- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `ALLOWED_ORIGINS` - Our production domain(s)
- `SESSION_SECRET` - Secure random string
- `YOUTUBE_API_KEY` - YouTube API credentials
- `VITE_YOUTUBE_PLAYLIST_ID` - Our playlist ID
- `VITE_PODCAST_FEED_URL` - Our podcast RSS feed

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
1. Ensure `ALLOWED_ORIGINS` includes our production domain
2. Include both www and non-www versions
3. Use HTTPS URLs only

### Database Connection Issues?
1. Verify `DATABASE_URL` is correct and includes `?sslmode=require`
2. Check database is accessible from our deployment platform
3. Ensure SSL certificates are valid

For more troubleshooting, see `DEPLOYMENT.md`.

## Next Steps

1. ✅ Configure environment variables
2. ✅ Add our YouTube playlist ID
3. ✅ Add our podcast RSS feed (optional)
4. ✅ Update cast member information
5. ✅ Link social media profiles
6. ✅ Connect Etsy store
7. ✅ Link WorldAnvil pages
8. ✅ Test on mobile devices
9. ✅ Share with our community!

## License

This project is built for Tales of Aneria. All content and branding specific to Tales of Aneria belongs to the creators.

---

Built with ❤️ for the TTRPG community
