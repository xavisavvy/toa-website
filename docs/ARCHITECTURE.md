# System Architecture

## Overview

Tales of Aneria website is a full-stack TypeScript application with React frontend and Express.js backend, implementing enterprise-grade practices including comprehensive testing, security scanning, and automated CI/CD.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         React 18 + TypeScript + Tailwind CSS             │   │
│  │  - PrintfulShop (e-commerce)                             │   │
│  │  - LatestEpisodes (YouTube integration)                  │   │
│  │  - LatestShorts (YouTube Shorts)                         │   │
│  │  - SponsorInquiry (form)                                 │   │
│  │  - Stripe Elements (checkout)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Backend (Node.js)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes:                                             │   │
│  │  - /api/youtube/*        (channel, playlist, shorts)    │   │
│  │  - /api/printful/*       (products)                      │   │
│  │  - /api/stripe/*         (checkout & webhooks)           │   │
│  │  - /api/podcast/*        (feed & audio proxy)            │   │
│  │  - /api/metrics          (application metrics)           │   │
│  │  - /api/health           (health checks)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Middleware:                                             │   │
│  │  - CORS (configurable origins)                           │   │
│  │  - Security Headers (helmet)                             │   │
│  │  - Rate Limiting                                         │   │
│  │  - Input Validation                                      │   │
│  │  - Session Management                                    │   │
│  │  - Error Handling                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐
│  YouTube    │  │  Printful   │  │   Stripe    │  │ Google   │
│  Data API   │  │     API     │  │     API     │  │Analytics │
└─────────────┘  └─────────────┘  └─────────────┘  └──────────┘
           │              │              │
           ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │  File Cache  │  │   Drizzle    │          │
│  │  (Database)  │  │    (JSON)    │  │     ORM      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
client/src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx              # Site navigation
│   │   └── Footer.tsx              # Footer with social links
│   ├── PrintfulShop.tsx            # E-commerce product display
│   ├── LatestEpisodes.tsx          # YouTube playlist integration
│   ├── LatestShorts.tsx            # YouTube Shorts display
│   ├── SponsorInquiryForm.tsx      # Sponsor contact form
│   └── ui/                         # shadcn/ui components
├── pages/
│   ├── Home.tsx                    # Landing page
│   ├── Sponsors.tsx                # Sponsor information
│   ├── CheckoutSuccess.tsx         # Post-purchase success
│   └── CheckoutCancel.tsx          # Checkout cancellation
├── lib/
│   ├── stripe.ts                   # Stripe client utilities
│   └── utils.ts                    # Shared utilities
└── data/
    ├── cast.json                   # Cast member data
    └── social-links.json           # Social media links
```

### Backend Services

```
server/
├── routes.ts                       # API route definitions
├── youtube.ts                      # YouTube API integration
├── printful.ts                     # Printful API integration
├── stripe.ts                       # Stripe payment processing
├── email.ts                        # Email service (Resend)
├── db/
│   └── schema.ts                   # Drizzle ORM schema
└── middleware/
    ├── security.ts                 # Security headers
    ├── rateLimit.ts                # Rate limiting
    └── validation.ts               # Input validation
```

## Data Flow

### E-Commerce Flow

```
1. User visits shop section
   ↓
2. Frontend requests products from /api/printful/products
   ↓
3. Backend checks Redis cache (1-hour TTL)
   ↓
4. If cache miss, fetch from Printful API
   ↓
5. Cache response and return to frontend
   ↓
6. User clicks product to purchase
   ↓
7. Frontend creates Stripe checkout session
   ↓
8. User redirected to Stripe Checkout
   ↓
9. Payment processed by Stripe
   ↓
10. Stripe sends webhook to /api/stripe/webhook
    ↓
11. Backend verifies webhook signature
    ↓
12. Log order to database
    ↓
13. (Future) Auto-create Printful order
    ↓
14. Send confirmation email
    ↓
15. Redirect user to success page
```

### Content Delivery Flow

```
1. User visits homepage
   ↓
2. Latest Episodes: /api/youtube/playlist/:id
   ├─ Cache check (1 hour)
   ├─ Fetch from YouTube API if needed
   └─ Return video metadata
   ↓
3. Latest Shorts: /api/youtube/shorts
   ├─ Cache check (1 hour)
   ├─ Fetch shorts (<60s videos)
   └─ Return shorts metadata
   ↓
4. Content rendered on page
```

### Sponsor Inquiry Flow

```
1. User fills sponsor form
   ↓
2. POST to /api/sponsors/inquire
   ↓
3. Validate input data
   ↓
4. Save inquiry to database
   ↓
5. Send email via Resend API
   ↓
6. Return success response
   ↓
7. Show confirmation to user
```

## Caching Strategy

### File-based Cache (JSON)

- **YouTube API responses**: 24-hour TTL (configurable)
- **Printful products**: 1-hour TTL
- **Multi-playlist support**: Independent cache per playlist
- **Graceful degradation**: Falls back to stale cache on API errors
- **Location**: `server/cache/` directory

### Client-side Cache (React Query)

- **Query caching**: Automatic via React Query
- **Stale time**: Configurable per query
- **Refetch strategies**: Background updates

### Browser Cache

- **Static assets**: Long-term caching via Vite build
- **API responses**: React Query manages freshness

## Security Architecture

### API Security

1. **Authentication**
   - Session-based (secure cookies)
   - Environment variable API keys
   - Webhook signature verification

2. **Authorization**
   - Rate limiting (100 req/15min per IP)
   - Input validation (Zod schemas)
   - CORS restrictions

3. **Data Protection**
   - HTTPS required in production
   - Security headers (helmet)
   - No sensitive data in client code
   - Webhook signature verification

### Secret Management

```
Environment Variables (.env):
├── Database credentials
├── API keys (YouTube, Printful, Stripe, Resend)
├── Session secrets
├── Webhook secrets
└── CORS origins

Never committed to git:
├── .env (local)
├── .env.docker (Docker)
└── GitHub Secrets (CI/CD)
```

## Environment Configuration

### Local Development
- `.env` - Local environment variables
- `dev-local.talesofaneria.com` - Local domain

### Docker Development
- `.env.docker` - Docker-specific variables
- PostgreSQL in container
- File-based caching

### Production
- GitHub Secrets - Secure credential storage
- Vercel/Replit Secrets - Production deployment
- `talesofaneria.com` - Production domain

## Database Schema

### Core Tables

```sql
-- Sponsor inquiries
CREATE TABLE sponsor_inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  message TEXT NOT NULL,
  package VARCHAR(50),
  budget VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order tracking (future)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  printful_order_id VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Deployment Architecture

### CI/CD Pipeline

```
Git Push
  ↓
GitHub Actions
  ├── Unit Tests (Vitest)
  ├── E2E Tests (Playwright)
  ├── Mutation Tests (Stryker)
  ├── Security Scans (Trivy, Snyk)
  ├── Build & Bundle
  └── Deploy
      ├── Development (automatic)
      ├── Staging (manual approval)
      └── Production (manual approval)
```

### Container Architecture

```
Docker Compose Stack:
├── toa-website (Node.js app)
└── toa-postgres (PostgreSQL 16)

Networks:
└── app-network (internal)

Volumes:
├── postgres-data (persistent)
└── cache/ directory (file-based)
```

## Performance Optimization

1. **Caching**
   - File-based cache for API responses (24h YouTube, 1h Printful)
   - React Query for client-side data caching
   - Browser caching for static assets
   - Stale cache fallbacks for resilience

2. **Build Optimization**
   - Vite for fast builds & HMR
   - Code splitting & lazy loading
   - Tree shaking
   - Asset optimization
   - Parallel build strategies

3. **API Optimization**
   - Response compression (gzip)
   - Minimal payload sizes
   - Parallel data fetching with React Query
   - Request deduplication

## Monitoring & Observability

### Health Checks

```
GET /api/health
Response:
{
  "status": "healthy",
  "timestamp": "2026-01-02T21:00:00.000Z",
  "uptime": 3600,
  "version": "1.31.0",
  "environment": "production",
  "checks": {
    "storage": { "status": "healthy", "message": "Cache accessible", "responseTime": 5 },
    "cache": { "status": "healthy", "message": "File cache operational", "responseTime": 2 },
    "memory": { "status": "healthy", "message": "Memory usage: 45%", "responseTime": 1 },
    "disk": { "status": "healthy", "message": "Disk usage: 35%", "responseTime": 3 },
    "cpu": { "status": "healthy", "message": "CPU usage: 25%", "responseTime": 1 }
  }
}
```

### Logging

- Request logging (all API calls)
- Error logging (failures)
- Security event logging (suspicious activity)
- Performance logging (slow requests)

## Scalability Considerations

1. **Horizontal Scaling**
   - Stateless backend design
   - File-based cache (can move to distributed cache if needed)
   - Load balancer ready
   - Session management via secure cookies

2. **Vertical Scaling**
   - Database connection pooling
   - Efficient file I/O for caching
   - Memory-efficient caching strategies
   - Configurable cache TTLs

3. **Future Enhancements**
   - CDN for static assets
   - Distributed caching (Redis/Memcached)
   - Database read replicas
   - Message queue for async tasks
   - Serverless function migrations

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI framework |
| | TypeScript | Type safety |
| | Tailwind CSS | Styling |
| | shadcn/ui | Component library |
| | Vite | Build tool |
| | React Query | Data fetching & caching |
| **Backend** | Express.js | Web framework |
| | Node.js 20+ | Runtime |
| | TypeScript | Type safety |
| **Database** | PostgreSQL 16 | Relational data |
| | Drizzle ORM | Database access |
| **Cache** | File-based (JSON) | API response caching |
| **APIs** | YouTube Data API v3 | Video content |
| | Printful API | Products |
| | Stripe API | Payments |
| **Analytics** | Google Analytics 4 | User analytics |
| **Infrastructure** | Docker | Containerization |
| | GitHub Actions | CI/CD pipeline |
| | Vercel/Replit | Hosting options |

## Security Compliance

- ✅ OWASP Top 10 protection
- ✅ PCI DSS Level 1 (via Stripe)
- ✅ GDPR considerations
- ✅ Regular security scanning
- ✅ Dependency vulnerability monitoring
- ✅ Secret rotation support

## Documentation

- [Environment Setup](./ENVIRONMENT_SETUP.md)
- [Printful Integration](../PRINTFUL_INTEGRATION.md)
- [Stripe Integration](../STRIPE_INTEGRATION.md)
- [Testing Guide](./testing/)
- [Security Guide](./security/)
- [Deployment Guide](./deployment/)
