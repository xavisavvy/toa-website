# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tales of Aneria is a TTRPG live play website. It runs as an Express + Vite app with React 18 on the client, PostgreSQL via Drizzle ORM on the server, and integrates YouTube, Stripe, Printful, and AWS SES.

## Critical Patterns (read first)

### Wouter routing — `useNavigate` does not exist
This is the most common AI-introduced bug in this repo. Wouter has no `useNavigate` export.
```typescript
// CORRECT
import { useLocation } from 'wouter';
const [, setLocation] = useLocation();
setLocation('/path');
```

### API routes live in a single file
All Express handlers are in `server/routes.ts`. Every endpoint must include:
- Zod validation for inputs
- A rate limiter (`apiLimiter` for standard, `expensiveLimiter` for resource-heavy)
- try/catch with `{ success, data | error }` response shape
- `logSecurityEvent()` from `server/security.ts` on failures

### Script parity (PowerShell ↔ Shell)
When editing any `.ps1` script under `.kubernetes/local/` or `scripts/`, update the matching `.sh` file with identical functionality, and vice versa.

## Common Commands

```bash
# Dev / build
npm run dev                    # Express + Vite, port 5000 (entry: server/index.ts)
npm run build                  # build:client (vite) + build:server (esbuild)
npm run check                  # tsc type check
npm run lint                   # eslint .ts/.tsx (--fix variant: npm run lint:fix)

# Tests
npm run test                   # Vitest (watch mode by default)
npm run test:quick             # Single run, dot reporter, no coverage
npm run test:coverage          # Run with coverage (used by pre-push hook)
npm run test:changed           # Only files changed since HEAD~1
vitest run path/to/file.test.ts                       # Single file
vitest run --testNamePattern="should handle errors"   # Single test by name

# E2E (Playwright)
npm run test:e2e               # Headless
npm run test:e2e:headed        # Visible browser
npm run test:e2e:setup         # Bring up docker-compose test stack
npm run test:visual            # Visual regression
npm run test:visual:update     # Update snapshots
npm run test:load              # Load tests via Playwright
npm run test:load:autocannon   # Autocannon-based load test (test/load/load-test.ts)

# Specialized
npm run test:mutation          # Stryker
npm run test:contract          # Pact contract tests
npm run test:security          # test/security suite
npm run test:chaos             # test/chaos suite
npm run lighthouse:ci          # Lighthouse CI (builds first)

# Database (Drizzle)
npm run db:push                # Direct schema push (dev only)
npm run db:generate            # Generate migration from schema diff
npm run db:migrate             # Apply migrations (production-safe)
npm run db:studio              # Visual browser
npm run db:seed                # Seed (scripts/seed-database.ts)
npm run db:seed:e2e            # E2E test data

# Utilities
npm run create-admin           # scripts/create-admin.ts
npm run sync:orders            # Pull Printful orders (use --dry-run first)
npm run env:check              # Verify .env vs .env.example
npm run check:markdown-secrets # Scan markdown for accidental keys
npm run check:mistakes         # Scan for known anti-patterns (e.g. wouter useNavigate)
npm run test:ses               # Verify AWS SES sender works
```

## Architecture

### Build entry points
- **Dev**: `npm run dev` → `tsx server/index.ts` (Express boots Vite middleware)
- **Production build**: `vite build` produces the client; `esbuild index.ts` (the **root-level** `index.ts`) bundles the server to `dist/index.js`
- **Production runtime**: `node dist/index.js`

The root-level `index.ts` is the production server entry — not `server/index.ts`. The `server/index.ts` file is the dev entry.

### Server modules (`server/`)
Single-file routing in `routes.ts`; everything else is feature- or concern-scoped. Notable modules:
- Auth: `auth.ts`, `auth-middleware.ts` (`requireAdmin`, `optionalAuth`)
- Security/observability: `security.ts`, `rate-limiter.ts`, `audit.ts`, `logger.ts`, `log-sanitizer.ts`, `monitoring.ts`, `sentry.ts`, `slo.ts`, `health.ts`, `env-validator.ts`, `feature-flags.ts`
- Data: `db.ts`, `storage.ts`, `cache.ts`, `cache/`
- Integrations: `stripe.ts`, `printful.ts`, `youtube.ts`, `podcast.ts`, `etsy.ts`, `dndbeyond.ts`, `notification-service.ts`, `order-service.ts`
- Dev infra: `vite.ts` (Vite middleware mount), `index.ts` (dev entry)

### Client (`client/src/`)
React + wouter routing. Components in PascalCase (`components/`, with `layout/` and `ui/` for shadcn). Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`.

### Shared (`shared/`)
`schema.ts` is the source of truth — Drizzle table definitions plus `drizzle-zod` validation schemas. Type changes flow from here.

### Root config files
`drizzle.config.ts`, `vite.config.ts`, `vitest.config.ts`, `vitest.report.config.ts`, `playwright.config.ts`, `tailwind.config.ts`, `index.ts` (prod server entry).

## Pre-commit / Pre-push Hooks

Husky enforces these automatically:
- **Pre-commit**: ESLint --fix on staged `.ts/.tsx`, `vitest related --run` for impacted tests, markdown secret scan
- **Pre-push**: `npm run test:coverage` with thresholds enforced

Coverage thresholds (Vitest config):
- Global: 40% lines/functions/statements
- `server/routes.ts`: 40% lines, 47% functions
- `server/security.ts`: 60% lines, 50% functions
- `server/env-validator.ts`: 77% lines, 80% functions

## Code Review Sensitivity

Touch carefully — these are security-critical and warrant extra review:
- `server/auth.ts`, `server/auth-middleware.ts` — authentication
- `server/security.ts`, `server/rate-limiter.ts` — security primitives
- `server/stripe.ts`, `server/printful.ts` — payments and webhook HMAC verification
- `shared/schema.ts` — schema/validation boundary

`server/routes.ts` is the standard place to add endpoints, but note it imports from the security-critical modules above; changes there can still affect auth/payment flows.

## Commit Messages

Conventional Commits (drives `standard-version` automatic versioning):
- `feat:` minor bump · `fix:` patch · `feat!:` major
- `docs:` `test:` `refactor:` `perf:` `chore:`

## Further Reading

- `.github/copilot-instructions.md` — full coding standards, code samples, and trigger-word patterns. Most "how to write a route / component / test" details live there; this file is the higher-level orientation.
- `.ai/architecture.md` — system design overview
- `docs/ci-cd/`, `docs/testing/`, `docs/security/`, `docs/deployment/`, `docs/features/`
