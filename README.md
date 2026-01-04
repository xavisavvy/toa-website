# Tales of Aneria - TTRPG Live Play Landing Page 

## 📊 Project Status

### CI/CD Pipeline
[![CI Pipeline](https://github.com/xavisavvy/toa-website/actions/workflows/ci.yml/badge.svg)](https://github.com/xavisavvy/toa-website/actions/workflows/ci.yml)
[![Deploy](https://github.com/xavisavvy/toa-website/actions/workflows/deploy.yml/badge.svg)](https://github.com/xavisavvy/toa-website/actions/workflows/deploy.yml)
[![Versioning](https://github.com/xavisavvy/toa-website/actions/workflows/version.yml/badge.svg)](https://github.com/xavisavvy/toa-website/actions/workflows/version.yml)

### Security & Compliance
[![SBOM Generation](https://github.com/xavisavvy/toa-website/actions/workflows/sbom.yml/badge.svg)](https://github.com/xavisavvy/toa-website/actions/workflows/sbom.yml)
![Security Scanning](https://img.shields.io/badge/security-Trivy%20%7C%20Snyk%20%7C%20npm%20audit-success)
![License Compliance](https://img.shields.io/badge/license-compliant-success)

### Code Quality
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Test Coverage](https://img.shields.io/badge/coverage-80%2B%25-brightgreen)
![Mutation Score](https://img.shields.io/badge/mutation%20score-80%2B%25-brightgreen)

### Standards & Testing
![WCAG 2.1](https://img.shields.io/badge/WCAG-2.1%20AA-success)
![E2E Tests](https://img.shields.io/badge/e2e-Playwright-green?logo=playwright)
![Unit Tests](https://img.shields.io/badge/unit-Vitest-green?logo=vitest)
![Contract Tests](https://img.shields.io/badge/contract-Pact-orange)

---

A professional landing page for our TTRPG Live Play series, featuring YouTube integration, podcast feeds, world lore, and merchandise showcase.

## 📚 Documentation

**Comprehensive documentation is available in the [docs/](./docs/) folder.**

- 🔧 **[CI/CD Guides](./docs/ci-cd/)** - Enterprise CI/CD, build optimization, GitHub Actions
- 🧪 **[Testing Documentation](./docs/testing/)** - Unit, E2E, mutation, accessibility, load, chaos testing
- 🔒 **[Security Guides](./docs/security/)** - Security scanning, compliance, license review
- 🚀 **[Deployment Guides](./docs/deployment/)** - Docker, Replit, health checks
- 📘 **[Implementation Guides](./docs/guides/)** - Phase documentation and summaries

👉 **Start here:** [Documentation Index](./docs/README.md)

## Features

✨ **YouTube Integration** - Automatically fetches and displays our latest episodes and shorts from YouTube playlists
🎙️ **Podcast Feed** - Integrates with any RSS podcast feed to showcase our audio content
🗺️ **World Building** - Links to WorldAnvil pages for characters, locations, factions, and lore
🛍️ **E-Commerce** - Direct sales through Printful integration with Stripe checkout
💳 **Payment Processing** - Secure Stripe integration for direct customer payments
📦 **Print-on-Demand** - Automated fulfillment through Printful
👥 **Cast & Community** - Highlight our team and connect with fans through social media
📱 **Fully Responsive** - Beautiful design on desktop, tablet, and mobile devices
🤝 **Sponsorship Platform** - Professional sponsor inquiry form with automated email delivery

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
   - `VITE_YOUTUBE_SHORTS_PLAYLIST_ID` - Our YouTube Shorts playlist ID
   - `VITE_PODCAST_FEED_URL` - Our podcast RSS feed URL
   - `SESSION_SECRET` - Random secret for session encryption
   - `ALLOWED_ORIGINS` - CORS allowed origins (production only)
   - `PRINTFUL_API_KEY` - Printful API key for product catalog
   - `STRIPE_PUBLISHABLE_KEY` - Stripe public key for checkout
   - `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

4. **Optional Variables:**
   - `VITE_YOUTUBE_API_KEY` - YouTube API key for client-side access
   - `AWS_SES_REGION` - AWS region for SES (e.g., us-east-1)
   - `AWS_SES_ACCESS_KEY_ID` - AWS access key for SES
   - `AWS_SES_SECRET_ACCESS_KEY` - AWS secret key for SES
   - `AWS_SES_FROM_EMAIL` - Verified sender email for SES
   - `BASE_URL` - Base URL for redirects (defaults to localhost)



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

### YouTube Shorts
```
GET /api/youtube/shorts?maxResults=5
```
Fetches short-form videos (< 60 seconds) from configured shorts playlist.

### Podcast Feed
```
POST /api/podcast/feed
Body: { feedUrl: string, limit?: number }
```
Parses an RSS podcast feed and returns episode information.

### Printful Products
```
GET /api/printful/products
GET /api/printful/products/:productId
```
Fetches product catalog from Printful with caching.

### Stripe Checkout
```
POST /api/stripe/create-checkout-session
Body: { productId: string, variantId: string, quantity: number }
```
Creates a Stripe checkout session for product purchase.

### Stripe Webhook
```
POST /api/stripe/webhook
```
Handles Stripe payment confirmation webhooks.

### Sponsor Inquiries
```
POST /api/sponsors/inquire
Body: { name, email, company, message, package, budget }
```
Sends sponsor inquiry email and logs to database.

## Technologies Used

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js, PostgreSQL, Redis
- **Integrations**: YouTube Data API v3, RSS Parser, Printful API, Stripe API, AWS SES (email)
- **Payment**: Stripe Checkout
- **Fulfillment**: Printful (print-on-demand)
- **Email**: AWS SES for transactional emails
- **Caching**: Redis (with graceful degradation)
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

## 🚀 CI/CD Pipeline

This project implements enterprise-grade CI/CD practices with comprehensive testing, security scanning, and automated deployments.

### Continuous Integration (CI)

**Workflow:** `.github/workflows/ci.yml`  
**Trigger:** Push to `main`/`develop`, Pull Requests

**Pipeline Stages:**

1. **Tests & Coverage** 
   - ✅ Unit tests (Vitest)
   - ✅ E2E tests (Playwright)  
   - ✅ Contract tests (Pact)
   - ✅ Coverage reporting (80%+ threshold)
   - ✅ Accessibility tests (WCAG 2.1 AA)

2. **Code Quality**
   - ✅ TypeScript type checking
   - ✅ Linting (ESLint)
   - ✅ Code formatting (Prettier)
   - ✅ Pre-commit hooks (Husky + lint-staged)

3. **Security Scanning**
   - ✅ Trivy container scanning
   - ✅ Snyk dependency scanning  
   - ✅ npm audit for vulnerabilities
   - ✅ Secret detection (GitLeaks)

4. **Mutation Testing**
   - ✅ Stryker.js mutation testing
   - ✅ 80%+ mutation score threshold
   - ✅ Critical path validation

5. **Load Testing**
   - ✅ Autocannon performance tests
   - ✅ Response time monitoring
   - ✅ Throughput validation

6. **Container Security**
   - ✅ Docker image scanning
   - ✅ SARIF report generation
   - ✅ Vulnerability remediation tracking

### Continuous Deployment (CD)

**Workflow:** `.github/workflows/deploy.yml`  
**Trigger:** Push to `main`, Manual dispatch

**Deployment Stages:**

1. **Build Artifacts**
   - Production-optimized bundles
   - Asset optimization
   - Source maps generation

2. **Security Validation**
   - Pre-deployment security scan
   - Container image signing
   - Dependency verification

3. **Deploy to Production**
   - Zero-downtime deployment
   - Health check validation
   - Rollback on failure

4. **Post-Deployment**
   - Smoke tests
   - Performance monitoring
   - Error tracking

### Versioning & Releases

**Workflow:** `.github/workflows/version.yml`  
**Trigger:** Push to `main`

- 🏷️ Automatic semantic versioning
- 📝 Changelog generation
- 🔖 Git tag creation
- 📦 Release artifact publishing

### SBOM Generation

**Workflow:** `.github/workflows/sbom.yml`  
**Trigger:** Push to `main`, Tags, Releases

- 📋 Software Bill of Materials (SBOM) generation
- 🔍 Dependency tracking
- 🛡️ Vulnerability correlation
- 📊 Compliance reporting

### Test Coverage Metrics

| Test Type | Coverage | Threshold |
|-----------|----------|-----------|
| Unit Tests | 80%+ | 80% |
| E2E Tests | Full user flows | N/A |
| Contract Tests | API contracts | 100% |
| Mutation Score | 80%+ | 80% |
| Accessibility | WCAG 2.1 AA | 100% |

### Quality Gates

All pull requests must pass:
- ✅ All tests passing
- ✅ 80%+ code coverage
- ✅ 80%+ mutation score
- ✅ No high/critical security vulnerabilities
- ✅ TypeScript type checking
- ✅ Linting & formatting
- ✅ Accessibility standards (WCAG 2.1 AA)

### Security Scanning Tools

| Tool | Purpose | Frequency |
|------|---------|-----------|
| Trivy | Container vulnerabilities | Every push |
| Snyk | Dependency vulnerabilities | Every push |
| npm audit | Package vulnerabilities | Every push |
| GitLeaks | Secret detection | Every commit |

### Documentation

- 📖 [CI/CD Quick Start](./QUICK_START_CICD.md) - Get started quickly
- 🏢 [Enterprise CI/CD Guide](./ENTERPRISE_CICD_GUIDE.md) - Complete guide
- 🔒 [Security Scanning](./SECURITY_SCANNING.md) - Security practices
- 🧪 [Testing Guide](./TESTING.md) - Testing strategies
- 🐳 [Docker Guide](./DOCKER.md) - Container practices

## License

This project is built for Tales of Aneria. All content and branding specific to Tales of Aneria belongs to the creators.

---

Built with ❤️ for the TTRPG community
