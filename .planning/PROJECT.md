# Tales of Aneria

## What This Is

Tales of Aneria is a TTRPG live-play website that combines content discovery (YouTube episodes, podcast feed, character lore), e-commerce (Printful-fulfilled merch via Stripe), and a public-figure-style fan engagement surface for the show's audience. The product is an established, version 2.2.3 React + Express application running on PostgreSQL with full CI/CD, comprehensive testing, and WCAG 2.1 AA compliance.

## Core Value

Fans of the Tales of Aneria live-play show can discover episodes, explore the world and characters, and support the show through merchandise — all from one trustworthy, accessible site.

## Coding Standards & Authoritative References

This is an established codebase. The following files are the authoritative sources for coding standards, patterns, and operational details — **do not duplicate their content here**:

- `CLAUDE.md` (repo root) — project commands, critical patterns (wouter routing), security requirements, testing thresholds, code review zones
- `.github/copilot-instructions.md` — detailed coding standards and patterns
- `.ai/architecture.md` — system design overview
- `.ai/prompts.md` — effective prompt patterns
- `docs/ARCHITECTURE.md` — full architecture contract
- `docs/security/SECURITY.md` — security policy
- `docs/api-specs/` — OpenAPI contracts (Stripe, Printful webhooks)

## Requirements

### Validated (already shipped — context only, not in current scope)

- Authentication & admin dashboard (server/auth.ts, AdminDashboard.tsx, AdminOrders.tsx)
- Cart + Stripe checkout + Printful fulfillment (CON-cart-system, CON-stripe-integration, CON-printful-integration-final, CON-shipping-implementation, CON-payment-flow, CON-order-status-flow)
- Stripe & Printful webhooks with HMAC verification + OpenAPI contract tests (CON-api-specs, CON-printful-webhook)
- Transactional email via AWS SES (CON-aws-ses-integration)
- GA4 analytics event taxonomy (CON-analytics-implementation)
- Health check endpoints for k8s liveness/readiness (CON-health-checks)
- Multi-layer security scanning in CI/CD (DEC-security-scanning [LOCKED])
- PII-safe logging via `safeLog` (DEC-logging-pii)
- Markdown secret prevention pre-commit hooks (DEC-markdown-secret-prevention)
- Chaos Goblin Mode easter egg (CON-chaos-goblin-mode)

### Active (this milestone — content & engagement)

See `.planning/REQUIREMENTS.md` for the full v1 list. High-level themes:

- [ ] Campaign archive system — browseable history of episodes/arcs with rich metadata
- [ ] Character page enhancements — deeper lore, gallery improvements, structured data
- [ ] Podcast/YouTube discovery improvements — feed integration, navigation, surfacing
- [ ] Fan engagement features (curated subset from REQ-influencer-features)
- [ ] SEO improvements across episode/character/shop pages (REQ-seo-recommendations)
- [ ] Shop page performance optimization (REQ-shop-performance)
- [ ] Kubernetes production hardening (runtime is moving from Replit → self-hosted k8s)

### Out of Scope (this milestone)

- New e-commerce features (cart, payments, shipping flow already complete) — *constraint only*
- Admin dashboard expansion beyond what's needed for content management — *defer to later milestone*
- Real-time chat / live audience interaction — *high complexity, not validated need*
- Mobile native app — *web-first responsive*
- Replacing the Replit deploy target outright — *k8s becomes primary; Replit kept as fallback for now*
- Full implementation of the entire `INFLUENCER_FEATURES_ANALYSIS` catalog — *that doc is a backlog, not a commitment (REQ-influencer-features acceptance is "evaluate and prioritize," not "ship all")*

## Context

- **Established product**: ~30 server modules, hundreds of commits, version 2.2.3
- **Codebase**: React 18 + TypeScript + Vite client; Express + TypeScript + Drizzle ORM + PostgreSQL backend
- **Integrations**: YouTube Data API, Stripe, Printful, AWS SES
- **Testing**: Vitest (unit), Playwright (E2E w/ axe), Stryker (mutation), Pact (contract)
- **Security stack (LOCKED)**: Trivy, Snyk, Gitleaks, npm audit, OWASP Top 10 tests; CodeQL disabled
- **Deployment trajectory**: Replit (current primary) → self-hosted Kubernetes via `.kubernetes/` manifests + ArgoCD (target primary for this milestone)
- **Known tech debt**: moderate-severity transitive vulns in esbuild / drizzle-kit (tracked in `docs/SECURITY_AUDIT.md`); roadmap-tracked sprint items in `docs/ROADMAP.md`
- **Forward backlog**: `docs/INFLUENCER_FEATURES_ANALYSIS.md` is treated as forward-context inspiration, not a shipped commitment

## Constraints

- **Tech stack**: React 18 + Vite + Tailwind + shadcn/ui + wouter; Express + Drizzle + PostgreSQL — fixed
- **Routing**: `wouter` only — `useNavigate` does NOT exist (use `useLocation`)
- **Database access**: Drizzle ORM only, no raw SQL
- **API conventions**: Zod validation + rate limiting + try/catch on every route in `server/routes.ts`; return shape `{ success, data/error }`
- **Logging**: route through `log-sanitizer.ts` `safeLog`; never `console.log` user input (DEC-logging-pii)
- **Webhooks**: HMAC signature verification mandatory (Stripe, Printful)
- **Env files**: `.env`, `.env.docker`, `.env.example` must stay synchronized (`npm run env:check`)
- **Script parity**: `.ps1` and `.sh` versions must remain functionally identical
- **Accessibility**: WCAG 2.1 AA; E2E tests must include `toPassAxeCheck()`
- **Coverage thresholds**: 40% global; 60% lines on `server/security.ts`; 77% on `server/env-validator.ts` — pre-push hook enforces
- **Commit format**: Conventional Commits
- **Printful order creation**: must use `sync_variant_id` (CON-printful-integration-final), not catalog variant
- **Caching/rate-limit**: current strategy is OPTIMAL (DEC-caching-rate-limit) — do not regress

## Key Decisions

<decisions>

| Decision | Rationale | Status | Outcome |
|----------|-----------|--------|---------|
| **DEC-security-scanning** [LOCKED]: Trivy + Snyk + Gitleaks + npm audit + OWASP tests; CodeQL disabled | Multi-layer coverage already in production CI; CodeQL added noise without finding | LOCKED | ✓ Good |
| DEC-audit-compliance: maintain `audit_logs` table with PII masking + retention | GDPR / SOC2 requirements | Proposed | — Pending |
| DEC-caching-rate-limit: keep current YouTube/Printful/Podcast/Etsy caching strategy | Quota analysis shows current limits are sufficient | Proposed (OPTIMAL) | ✓ Good |
| DEC-ci-database-strategy: Docker Compose w/ Postgres + Redis in CI for E2E | Real DB needed; matches `docker-compose.test.yml` | Proposed | ✓ Good |
| DEC-duplicate-order-prevention: in-memory idempotency in Stripe webhook handler | Stripe retries `checkout.session.completed`; prevents duplicate Printful orders | Proposed | ✓ Good |
| DEC-license-compliance: all deps approved for commercial use; LGPL exception for `sharp` (dynamic linking) | License review complete | Proposed | ✓ Good |
| DEC-logging-pii: route all logs through `log-sanitizer.ts` `safeLog` | GDPR/CCPA; prevents accidental PII disclosure | Proposed | ✓ Good |
| DEC-markdown-secret-prevention: pre-commit + gitleaks scan markdown for real keys | Prevents docs leaking secrets | Proposed | ✓ Good |
| DEC-youtube-api-key-split: separate server-side (IP-restricted) and client-side (referrer-restricted) keys | Reduce blast radius if key leaks | Proposed | ✓ Good |

</decisions>

ADR-locked decisions are immutable in this milestone. Proposed decisions are honored as the current way of working but may be formally accepted or revised during this milestone.

---
*Last updated: 2026-05-08 after new-project ingest (41 docs, content & engagement milestone)*
