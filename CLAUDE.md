# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tales of Aneria is a TTRPG (tabletop role-playing game) live play website with enterprise-grade practices: comprehensive testing, security scanning, CI/CD automation, and WCAG 2.1 AA accessibility compliance.

## Common Commands

```bash
# Development
npm run dev                    # Start dev server (Express + Vite on port 5000)
npm run build                  # Build client and server for production
npm run check                  # TypeScript type checking
npm run lint                   # ESLint (add --fix to auto-fix)

# Testing
npm run test                   # Run unit tests (Vitest)
npm run test:coverage          # Unit tests with coverage report
npm run test:e2e               # E2E tests (Playwright)
npm run test:e2e:headed        # E2E tests with browser visible
npm run test:quick             # Fast unit tests without coverage
npm run test:watch             # Watch mode for development
vitest run path/to/test.ts     # Run a single test file

# Database
npm run db:push                # Push schema directly (dev mode only)
npm run db:generate            # Generate migration files from schema changes
npm run db:migrate             # Apply migrations with history (production-safe)
npm run db:studio              # Visual database browser
npm run db:seed                # Seed database with initial data

# Specialized Testing
npm run test:mutation          # Mutation testing with Stryker
npm run test:contract          # Contract tests (Pact)
npm run test:security          # Security tests
npm run test:chaos             # Chaos/resilience tests

# Security & Quality
npm run check:markdown-secrets # Scan markdown for accidental secrets
npm run check:mistakes         # Check for common import errors (wouter, etc.)
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + wouter (routing)
- **Backend**: Express.js + TypeScript + PostgreSQL + Drizzle ORM
- **Testing**: Vitest (unit), Playwright (E2E), Stryker (mutation), Pact (contract)
- **Security**: Trivy, Snyk, Gitleaks, npm audit, OWASP Top 10 protection
- **Integrations**: YouTube Data API, Printful, Stripe, AWS SES

### Directory Structure
```
client/src/
├── components/          # React components (PascalCase.tsx)
│   ├── layout/          # Header, Footer, etc.
│   └── ui/              # shadcn/ui components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
└── data/                # Static JSON data (cast.json, social-links.json)

server/
├── routes.ts            # All Express route handlers
├── db.ts                # Database connection (Drizzle)
├── auth.ts              # Authentication logic
├── security.ts          # Security utilities, validation, logging
├── sentry.ts            # APM integration (optional, set SENTRY_DSN)
├── slo.ts               # SLO/Error budget tracking
├── stripe.ts            # Stripe integration (webhook verification)
├── printful.ts          # Printful API integration
├── youtube.ts           # YouTube API integration
└── cache.ts             # Redis caching layer

shared/
├── schema.ts            # Drizzle ORM schema + Zod validation
└── types/               # Shared TypeScript types

.ai/                     # AI context files
├── architecture.md      # System design overview
└── prompts.md           # Effective prompt patterns

test/                    # Unit & integration tests
e2e/                     # Playwright E2E tests
```

## Critical Patterns

### Wouter Navigation (CRITICAL)
**Never use `useNavigate`** - it does not exist in wouter.
```typescript
// CORRECT
import { useLocation } from 'wouter';
const [, setLocation] = useLocation();
setLocation('/path');

// WRONG - DOES NOT EXIST
import { useNavigate } from 'wouter';
```

### API Routes
All backend routes are in `server/routes.ts`. Every endpoint must have:
- Zod validation for all inputs
- Rate limiting (`apiLimiter` or `expensiveLimiter`)
- try/catch error handling
- Return format: `{ success: boolean, data/error }`

### Database
Drizzle ORM with PostgreSQL. Schema in `shared/schema.ts`. After schema changes, run `npm run db:push`.

**Path Aliases**:
- `@/` → `client/src/`
- `@shared/` → `shared/`

## Security Requirements

### Application Security
- **Input Validation**: ALL user inputs validated with Zod
- **Rate Limiting**: ALL public API endpoints must have rate limiting
- **SQL Injection**: ONLY use Drizzle ORM prepared statements (no raw SQL)
- **Webhook Verification**: Stripe and Printful webhooks use HMAC signature verification
- **Session Security**: Regenerate session ID after login to prevent fixation attacks
- **Security Logging**: Log security events via `logSecurityEvent()` in `server/security.ts`

### Secret Prevention
- Never commit secrets to any file including markdown documentation
- Use placeholders like `sk_test_your_key_here` or `[REDACTED]` in docs
- Pre-commit hooks scan markdown files for real API keys
- Run `npm run check:markdown-secrets` to manually verify

### Security Scanning (CI/CD)
- **Trivy**: Container vulnerability scanning
- **Snyk**: Dependency vulnerability scanning
- **Gitleaks**: Secret detection in commits
- **npm audit**: Package vulnerability scanning

## Testing Requirements

### Pre-commit Hooks (Automatic)
- ESLint with auto-fix
- Related unit tests via `vitest related --run`
- Markdown secret scanning
- Commit blocked if tests fail

### Pre-push Hooks (Automatic)
- Full unit test suite with coverage
- Coverage thresholds enforced (40% global minimum)
- Higher thresholds for critical files:
  - `server/routes.ts`: 40% lines, 47% functions
  - `server/security.ts`: 60% lines, 50% functions
  - `server/env-validator.ts`: 77% lines, 80% functions
- Push blocked if coverage drops below thresholds

### E2E Testing
Include accessibility checks in all E2E tests:
```typescript
await expect(page).toPassAxeCheck(); // WCAG 2.1 AA compliance
```

## Script Parity (CRITICAL)

**Always maintain parity between PowerShell and Shell scripts:**
- `.kubernetes/local/*.ps1` ↔ `.kubernetes/local/*.sh`
- `scripts/*.ps1` ↔ `scripts/*.sh`

When updating any script, update BOTH versions with identical functionality.

## Commit Messages

Use Conventional Commits format for automatic versioning:
```
feat: add new feature        # Minor version bump
fix: resolve bug             # Patch version bump
feat!: breaking change       # Major version bump
docs: update documentation
test: add tests
refactor: code cleanup
perf: performance improvement
```

## Git Push Status Reporting

At the end of every task summary involving code changes, always report git status:
```
## Git Status
**Status:** [PUSHED | NOT PUSHED]
- Branch: main
- Pushed to GitHub: [YES | NO]
**Action Required:** [If needed: "Run `git push` to deploy"]
```

## Code Review Zones

### Human-Review Required (Security-Critical)
- `server/auth.ts` - Authentication logic
- `server/security.ts` - Security utilities
- `server/stripe.ts` - Payment processing
- Any code handling passwords, tokens, or payments

### AI-Safe (Can modify freely)
- `server/routes.ts` - API endpoints (with patterns)
- `client/src/components/` - React components
- `test/` - Test files
- `client/src/data/` - Static JSON data

## Environment Variables

Required variables documented in `.env.example`. Key ones:
- `DATABASE_URL` - PostgreSQL connection string
- `YOUTUBE_API_KEY` - Server-side YouTube API key
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` - Stripe keys
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `PRINTFUL_API_KEY` - Printful integration
- `SESSION_SECRET` - Session encryption
- `SENTRY_DSN` - (Optional) Sentry APM integration

## Observability

### SLO Tracking (`server/slo.ts`)
Track service level objectives with the SLO middleware:
- Availability target: 99.9%
- Latency p95 target: < 200ms
- Error rate target: < 0.1%
- Endpoint: GET `/api/slo` for metrics

### APM Integration (`server/sentry.ts`)
Optional Sentry integration for error tracking and performance monitoring.
Enable by setting `SENTRY_DSN` environment variable.

## Documentation

- `docs/ci-cd/` - CI/CD and GitHub Actions
- `docs/testing/` - Testing strategies
- `docs/security/` - Security practices, secret prevention
- `docs/deployment/` - Docker, Kubernetes, Replit deployment
- `.github/copilot-instructions.md` - Detailed coding standards and patterns
- `.ai/` - Architecture overview and effective prompts
