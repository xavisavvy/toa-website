# YouTube Channel Videos Feature

## Fetch All Videos from Your Channel (Newest First!)

### Quick Start
1. Get channel ID from YouTube
2. Add to .env: VITE_YOUTUBE_CHANNEL_ID=UC...
3. Test: curl http://localhost:5000/api/youtube/channel/UC.../maxResults=10

### Endpoint
GET /api/youtube/channel/:channelId?maxResults=50

### Features
- Fetches ALL videos (not just playlists)
- Sorted newest first
- 24-hour caching
- Validation & rate limiting

See server/youtube.ts line 406+ for implementation
