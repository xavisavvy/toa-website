# Tales of Aneria - TTRPG Live Play Website

## Overview

This is a professional landing page for a TTRPG (Tabletop Role-Playing Game) live play series called "Tales of Aneria." The application features YouTube episode integration, podcast RSS feeds, D&D Beyond character data, Etsy merchandise listings, and world-building lore. It follows enterprise-grade practices including comprehensive testing, security scanning, CI/CD automation, and WCAG 2.1 AA accessibility compliance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with esbuild for fast builds
- **Styling**: Tailwind CSS with shadcn/ui components (New York style)
- **State Management**: TanStack Query for server state
- **Routing**: Wouter (lightweight router)
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Security**: Helmet for headers, CORS configuration, rate limiting with Redis fallback
- **API Structure**: RESTful endpoints under `/api/` prefix
- **Caching**: In-memory cache with TTL support and metrics tracking

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Generated to `./migrations` directory
- **Current Storage**: In-memory storage implementation (MemStorage class)

### Testing Strategy
- **Unit Tests**: Vitest with happy-dom environment
- **E2E Tests**: Playwright with Chromium
- **Mutation Testing**: Stryker Mutator
- **Accessibility**: axe-core via Playwright
- **Coverage Thresholds**: 80% target for business logic
- **Pre-commit Hooks**: Husky with lint-staged runs ESLint and related tests

### Security Implementation
- **Headers**: Helmet with strict CSP directives
- **Input Validation**: validator.js for URL and input sanitization
- **Rate Limiting**: express-rate-limit with optional Redis store
- **Secret Scanning**: Gitleaks configuration available
- **Dependency Scanning**: npm audit, Trivy, Snyk integration

### Build Configuration
- **Client Build**: Vite outputs to `dist/public`
- **Server Build**: esbuild bundles to `dist/index.js`
- **Chunk Splitting**: Manual chunks for React, router, query, UI components, and icons

## External Dependencies

### Third-Party APIs
- **YouTube Data API v3**: Fetches playlist videos (uses Replit OAuth connector or API key)
- **Etsy API**: Retrieves shop listings for merchandise display
- **D&D Beyond API**: Fetches character data from character-service.dndbeyond.com
- **RSS Parser**: Parses podcast feeds from any RSS source

### Infrastructure Services
- **PostgreSQL**: Database via `DATABASE_URL` environment variable
- **Redis**: Optional rate limiting store via `REDIS_URL`
- **Replit Connectors**: YouTube OAuth integration when deployed on Replit

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for Drizzle)
- `YOUTUBE_API_KEY`: YouTube Data API key (optional, falls back to Replit connector)
- `ETSY_API_KEY` / `ETSY_ACCESS_TOKEN`: Etsy API credentials (optional)
- `REDIS_URL`: Redis connection for distributed rate limiting (optional)
- `NODE_ENV`: Environment mode (development/production)
- `ALLOWED_ORIGINS`: CORS allowed origins

### Monitoring & Observability
- **Logging**: Pino logger with pretty printing in development
- **Metrics**: Custom metrics collector for API latency, cache stats, and errors
- **Health Checks**: `/api/health` endpoint with component-level status
- **Lighthouse CI**: Performance and accessibility auditing