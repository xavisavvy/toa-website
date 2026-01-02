# Character Image Gallery Guide

## Overview
Each character can have multiple images in their gallery. The gallery supports various image types and automatically displays badges for official art, fan art, and AI-generated artwork.

## Image Data Structure

```json
{
  "images": [
    {
      "id": "1",
      "url": "https://example.com/image.jpg",
      "caption": "Character Name - Portrait",
      "type": "official",
      "isFeatured": true,
      "artist": "Artist Name",
      "artistUrl": "https://artistwebsite.com",
      "copyright": "Copyright Holder",
      "isAiGenerated": false
    }
  ]
}
```

## Field Descriptions

### Required Fields
- **`id`** (string): Unique identifier for the image
- **`caption`** (string): Description shown in the gallery
- **`type`** (string): Either `"official"` or `"fanart"`
- **`isFeatured`** (boolean): If true, this image is used as the main character image

### Optional Fields
- **`url`** (string): Direct URL to the image. If omitted, a placeholder is shown
- **`artist`** (string): Name of the artist who created the artwork
- **`artistUrl`** (string): Link to artist's website/portfolio
- **`copyright`** (string): Copyright holder information
- **`isAiGenerated`** (boolean): Set to `true` if the artwork was created with AI tools

## Image Type Badges

### Official Art
- Displays a blue "Official Art" badge
- Use for artwork commissioned by or created for Tales of Aneria
- Examples: commissioned character portraits, official promotional art

### Fan Art
- Displays a gray "Fan Art" badge
- Use for community-created artwork
- Always credit the artist with `artist` and `artistUrl` fields

## AI-Generated Artwork Disclosure

When `isAiGenerated: true`, the gallery automatically displays:
- An amber "AI Art" indicator
- A hover tooltip explaining: "This artwork was generated using AI for early character exploration and personal use. AI-generated artwork is not used for commercial purposes or merchandise. We believe in transparency about the use of AI tools in creative work."

### Best Practices for AI Art
1. Always set `isAiGenerated: true` for any AI-generated images
2. AI art should typically be `type: "official"` if used for character exploration
3. Do not use AI art for merchandise or commercial purposes
4. Be transparent about AI usage in all contexts

## Adding Multiple Images

To add multiple images to a character's gallery:

```json
{
  "id": "character-name",
  "images": [
    {
      "id": "1",
      "caption": "Main Character Portrait",
      "type": "official",
      "isFeatured": true,
      "url": "https://example.com/portrait.jpg",
      "isAiGenerated": false
    },
    {
      "id": "2",
      "caption": "Action Scene",
      "type": "official",
      "isFeatured": false,
      "url": "https://example.com/action.jpg",
      "artist": "Artist Name",
      "artistUrl": "https://artist.com"
    },
    {
      "id": "3",
      "caption": "Fan Creation",
      "type": "fanart",
      "isFeatured": false,
      "url": "https://example.com/fanart.jpg",
      "artist": "Fan Artist",
      "artistUrl": "https://fanartist.com"
    }
  ]
}
```

## Examples

### AI-Generated Official Portrait
```json
{
  "id": "1",
  "caption": "Locke Lirien - Character Portrait",
  "type": "official",
  "isFeatured": true,
  "url": "https://dndbeyond.com/avatar.jpg",
  "copyright": "D&D Beyond / Wizards of the Coast",
  "isAiGenerated": true
}
```

### Commissioned Official Art
```json
{
  "id": "2",
  "caption": "Battle Scene Commission",
  "type": "official",
  "isFeatured": false,
  "url": "https://example.com/commission.jpg",
  "artist": "Professional Artist",
  "artistUrl": "https://artistportfolio.com",
  "copyright": "Tales of Aneria"
}
```

### Fan Art with Attribution
```json
{
  "id": "3",
  "caption": "Community Fan Art",
  "type": "fanart",
  "isFeatured": false,
  "url": "https://example.com/fanart.jpg",
  "artist": "Community Member",
  "artistUrl": "https://twitter.com/fan"
}
```

## Display Behavior

### Gallery Grid
- Images are displayed in a responsive grid (1 column on mobile, 2 columns on desktop)
- Each image maintains a 3:4 aspect ratio
- Image captions and metadata appear on hover/at bottom

### Badges Displayed
- **Official Art** badge (blue) when `type: "official"`
- **Fan Art** badge (gray) when `type: "fanart"`
- **AI Art** indicator (amber) when `isAiGenerated: true`
- Artist attribution when provided
- Copyright notice when provided

## Testing

To test the gallery:
1. Navigate to `/characters/[character-id]`
2. Scroll to the "Gallery" section
3. Verify badges appear correctly
4. Test hover tooltips for AI art
5. Check artist links are clickable
6. Verify featured image appears in hero section
