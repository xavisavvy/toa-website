# Design Guidelines: Tales of Aneria Landing Page

## Design Approach
**Reference-Based Approach** drawing inspiration from premium TTRPG content creators (Critical Role, Dimension 20) and streaming platforms (Netflix, Spotify) to create an immersive fantasy experience that showcases multimedia content while maintaining professional content creator best practices.

## Core Design Principles
- **Cinematic Immersion**: Create a fantasy world atmosphere that draws viewers into Aneria
- **Content Showcase**: Prominently feature episodes, lore, and community offerings
- **Clear Conversion Paths**: Guide users to watch, listen, shop, and engage
- **Multi-Platform Integration**: Seamlessly present YouTube, podcast, WorldAnvil, and Etsy content

## Color Palette

### Dark Mode Primary (Default)
- **Background Base**: 220 15% 8% (deep charcoal with cool undertone)
- **Surface**: 220 12% 12% (elevated elements)
- **Surface Elevated**: 220 10% 16% (cards, modals)
- **Primary Brand**: 280 60% 55% (rich fantasy purple - main CTAs)
- **Secondary Accent**: 35 80% 50% (warm amber - highlights, badges)
- **Text Primary**: 220 10% 95%
- **Text Secondary**: 220 8% 70%
- **Border Subtle**: 220 15% 20%

### Light Mode (Optional Support)
- **Background**: 40 20% 97% (warm parchment)
- **Primary**: 280 50% 45% (darker purple for contrast)
- **Text**: 220 15% 15%

## Typography

**Font Stack:**
- **Display/Headers**: 'Cinzel' (serif, fantasy-medieval feel) - Google Fonts
- **Body/UI**: 'Inter' (clean, readable) - Google Fonts
- **Accents**: 'Cinzel Decorative' for special headings if needed

**Hierarchy:**
- Hero Title: text-6xl to text-8xl font-bold (Cinzel)
- Section Headers: text-4xl to text-5xl font-semibold (Cinzel)
- Card Titles: text-xl to text-2xl font-semibold (Inter)
- Body: text-base to text-lg (Inter)
- Captions: text-sm font-medium (Inter)

## Layout System

**Spacing Scale**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24, 32 for consistent rhythm
- Section padding: py-20 lg:py-32
- Container: max-w-7xl mx-auto px-6 lg:px-8
- Card spacing: gap-8 to gap-12
- Component internal: p-6 to p-8

**Grid Patterns:**
- Episode grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Featured content: 2-column splits on desktop
- Mobile: Always stack to single column

## Component Library

### Navigation
- Fixed/sticky header with semi-transparent backdrop blur
- Logo + series title on left
- Navigation links: Episodes | Podcast | Lore | Shop | About
- Mobile: Hamburger menu with slide-in drawer

### Hero Section
- Full-viewport dramatic hero (min-h-screen with gradient overlay)
- Large fantasy background image (mystical landscape, dramatic lighting)
- Centered content: Series logo/title, compelling tagline
- Dual CTAs: "Watch Latest Episode" (primary purple) + "Explore the World" (outline with backdrop-blur)
- Subtle scroll indicator at bottom

### Content Sections (6-8 sections total)

**1. Latest Episodes (YouTube Integration)**
- Section header with "Latest Episodes" + "View All" link
- 3-column grid of episode cards
- Each card: Thumbnail image, episode number/title, duration badge, view count
- Hover: Scale slightly + shadow increase
- Click opens embedded player modal or navigates to watch page

**2. Podcast Feed**
- 2-column layout: Featured episode (left, larger) + Recent episodes list (right)
- Audio player embeds with custom styled controls
- Platform badges (Spotify, Apple Podcasts, etc.)

**3. World of Aneria (WorldAnvil)**
- Full-width banner with map/world imagery
- 4-column grid of world aspects: Characters, Locations, Factions, Lore
- Each with icon, title, preview text, "Learn More" link

**4. Featured Promotions**
- Rotating banner or grid of current campaigns
- Large visual cards with discount badges
- Clear CTAs to promotion details

**5. Shop Highlights (Etsy Integration)**
- "Support the Show" section header
- 3-4 featured products with images, titles, prices
- Large "Visit Our Store" CTA button
- Product cards with hover effects

**6. Cast & About**
- Character-style cards for cast members with photos/artwork
- Brief series description and setting overview
- Social proof: subscriber count, episode count, etc.

**7. Community & Social**
- Social media icon grid (YouTube, Twitter, Discord, Patreon)
- Newsletter signup with fantasy-themed input styling
- Recent community highlights or testimonials

### Footer
- Multi-column layout: About | Quick Links | Social | Legal
- Newsletter subscription form
- Copyright and credits
- Dark background with subtle border-top

## Images

**Hero Image**: Epic fantasy landscape - misty mountains, magical lighting, ruins or mystical forest. Should evoke adventure and mystery. Full-width, parallax scroll effect optional.

**Section Backgrounds**: Subtle texture overlays (parchment, leather) at 5-10% opacity on certain sections for depth.

**Episode Thumbnails**: YouTube API will provide these - display in 16:9 aspect ratio cards.

**Product Images**: Etsy API/links will provide - display in square or portrait cards.

**WorldAnvil Content**: May include maps, character art, location illustrations - flexible aspect ratios.

**Decorative Elements**: Subtle fantasy flourishes (corner decorations, divider ornaments) between major sections.

## Accessibility & Interactions

- Maintain WCAG AA contrast ratios (especially purple on dark backgrounds)
- Focus states: 2px ring in primary color with offset
- Smooth transitions: transition-all duration-300 ease-in-out
- Hover states: Subtle scale (scale-105) + shadow elevation
- Loading states: Skeleton screens for content feeds
- Error states: Clear messaging for failed API calls

## Animation Guidelines (Minimal)

- **Scroll Reveals**: Fade-in on scroll for section entries (use Intersection Observer)
- **Card Hovers**: Scale + shadow only, no color shifts
- **Page Load**: Hero fade-in, stagger section reveals
- **No**: Complex animations, parallax (except hero), constant motion

## Responsive Behavior

- Desktop (lg): Full multi-column layouts, expanded navigation
- Tablet (md): 2-column max, condensed spacing
- Mobile: Single column, hamburger menu, larger touch targets (min 44px), reduced padding

This design creates an immersive, premium fantasy content hub that rivals top TTRPG creators while maintaining usability and clear conversion paths to episodes, merchandise, and community engagement.