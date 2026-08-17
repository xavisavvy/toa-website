# Constraints (SPEC Intel)

Synthesized from 25 SPEC-classified planning documents. Constraints are technical contracts the implementation must honor; conflicts with higher-precedence ADRs are auto-resolved in favor of the ADR (see INGEST-CONFLICTS.md).

---

## CON-architecture — System Architecture Contract

- source: docs/ARCHITECTURE.md
- type: schema
- content: Full-stack architecture: React 18 + TypeScript + Vite client; Express + Drizzle ORM + PostgreSQL backend; integrations with YouTube Data API, Printful API, Stripe API. API routes centralized in server/routes.ts; database access via Drizzle ORM only.

## CON-security-policy — Security Policy

- source: docs/security/SECURITY.md
- type: nfr
- content: Documented supported versions, vulnerability reporting process, OWASP Top 10 coverage, container security, CI/CD security, webhook signature verification (HMAC), and session management requirements.

## CON-authentication-security — Authentication & Session Implementation

- source: docs/AUTHENTICATION_SECURITY.md
- type: nfr
- content: Session management, RBAC, password hashing (bcrypt/argon2), PII-safe logging contract for the admin dashboard. Session ID regenerated post-login. References docs/LOGGING_AND_PII.md.

## CON-admin-dashboard — Admin Dashboard & Order Tracking

- source: docs/ADMIN_DASHBOARD.md
- type: api-contract
- content: Admin dashboard and customer order tracking implementation: authentication via server/auth.ts and auth-middleware.ts; pages AdminLogin.tsx, AdminDashboard.tsx, AdminOrders.tsx, TrackOrder.tsx; privacy protections enforced.

## CON-analytics-implementation — GA4 Event Tracking Contract

- source: docs/ANALYTICS_IMPLEMENTATION.md
- type: api-contract
- content: GA4 event names and parameters tracked across LatestEpisodes, PodcastSection, CharacterDetail, Footer, PrintfulShop, CheckoutSuccess. Standardized event taxonomy for video, podcast, character, e-commerce, external link interactions.

## CON-api-specs — OpenAPI Contract Index

- source: docs/api-specs/README.md
- type: api-contract
- content: OpenAPI 3.0 contract specifications for Stripe webhooks (docs/api-specs/stripe-webhooks.yaml) and Printful webhooks (docs/api-specs/printful-webhooks.yaml). Validated by test/contract/openapi-validation.test.ts.

## CON-aws-ses-integration — AWS SES Transactional Email

- source: docs/integration/AWS_SES_INTEGRATION_SUMMARY.md
- type: api-contract
- content: server/notification-service.ts uses AWS SES for transactional email. Configuration via .env / .env.docker / .env.example. Test tooling: scripts/test-ses.ts.

## CON-cart-system — Shopping Cart Implementation

- source: docs/CART_SYSTEM.md
- type: api-contract
- content: Cart state via useCart hook, persisted to localStorage; cart analytics events emitted; supports product variants and merchandise. Checkout integrates with Stripe via the e-commerce flow.

## CON-chaos-goblin-mode — Chaos Goblin Mode Easter Egg

- source: docs/features/CHAOS_GOBLIN_MODE.md
- type: api-contract
- content: Konami-code activated overlay component (ChaosGoblinMode.tsx + useKonamiCode hook). Animation must respect WCAG 2.1 seizure-safety guidelines (epilepsy-safe rainbow). Asset: client/public/chaos-goblin.svg.

## CON-character-images — Character Gallery Image Schema

- source: docs/CHARACTER_IMAGES.md
- type: schema
- content: Character gallery image data structure with field definitions, official-art and fan-art badge types, and mandatory AI-generated artwork disclosure on AI-produced assets.

## CON-contract-testing — Contract Testing Strategy

- source: docs/CONTRACT_TESTING.md
- type: nfr
- content: Contract test coverage required for Stripe, Printful, and YouTube external integrations. Webhook signature verification covered by contract tests.

## CON-deployment — Deployment Targets & Pipeline

- source: docs/deployment/DEPLOYMENT.md
- type: nfr
- content: Supported deployment targets: Replit (primary), Vercel, Netlify, Docker. Automated via .github/workflows/deploy.yml. Sub-guides: REPLIT_DEPLOYMENT.md, DOCKER.md.

## CON-design-guidelines — Landing Page Design System

- source: docs/guides/DESIGN_GUIDELINES.md
- type: nfr
- content: Visual contract for landing page: color palette, typography, layout system, component library, navigation patterns; both dark mode and light mode supported.

## CON-docker-deployment — Docker Deployment Contract

- source: docs/deployment/DOCKER.md
- type: nfr
- content: Containerized deployment via Docker / docker-compose, including local dev, production builds, environment configuration, and image security hardening.

## CON-dynamic-social-images — Dynamic OG/Twitter Cards

- source: docs/DYNAMIC_SOCIAL_IMAGES.md
- type: api-contract
- content: client/src/components/SEO.tsx emits dynamic Open Graph and Twitter Card meta tags for character and other dynamic pages.

## CON-ecommerce-guide — E-Commerce Integration Contract

- source: docs/E-COMMERCE_GUIDE.md
- type: api-contract
- content: Printful + Stripe integration: server/printful.ts, server/stripe.ts, server/routes.ts; client surfaces PrintfulShop.tsx, Shop.tsx, CheckoutSuccess.tsx, CheckoutCancel.tsx. Defines shop page → checkout → fulfillment lifecycle.

## CON-environment-management — Env File Sync Contract

- source: docs/ENVIRONMENT_MANAGEMENT.md
- type: nfr
- content: .env, .env.docker, and .env.example must remain synchronized. Tooling: `npm run env:check`, `npm run env:sync`. Pre-commit hook enforces sync.

## CON-health-checks — Health Check Endpoints

- source: docs/deployment/HEALTH_CHECK_GUIDE.md
- type: api-contract
- content: Health check endpoints with defined response schemas and status levels for Kubernetes liveness/readiness probes, Docker healthchecks, and load balancer use. Component-level checks included.

## CON-order-status-flow — Order Lifecycle & Webhooks

- source: docs/ORDER_STATUS_FLOW.md
- type: api-contract
- content: Order status lifecycle and Stripe ↔ Printful ↔ orders DB webhook event contracts. Includes shipping notifications and refund handling. References shared/schema.ts and server/notification-service.ts.

## CON-payment-flow — Payment Flow Implementation

- source: docs/PAYMENT_FLOW_IMPLEMENTATION.md
- type: api-contract
- content: End-to-end payment flow covering order tracking, customer notifications, admin alerts, failed-order persistence. Touches server/db.ts, server/order-service.ts, shared/schema.ts, server/notification-service.ts.

## CON-printful-integration-final — Printful Order Creation via sync_variant_id

- source: docs/integration/PRINTFUL_INTEGRATION_FINAL.md
- type: api-contract
- content: Printful order creation uses `sync_variant_id` (not catalog variant). Stripe metadata flows the sync_variant_id from checkout into the Printful order payload. This is the canonical implementation choice.

## CON-printful-shipping-api — Printful Shipping Rates API

- source: docs/integration/PRINTFUL_SHIPPING_API.md
- type: api-contract
- content: Two-step checkout: shipping/tax estimate endpoint computes Printful shipping rates and tax before Stripe Checkout session creation. Defines request/response schemas.

## CON-printful-webhook — Printful Webhook Endpoint

- source: docs/PRINTFUL_WEBHOOK_IMPLEMENTATION.md
- type: api-contract
- content: Printful webhook endpoint with HMAC signature verification, supported event types, and corresponding shared/schema.ts updates. Tests: test/printful-webhook.test.ts and e2e/printful-webhook.spec.ts.

## CON-shipping-implementation — Shipping Estimate + Stripe Checkout

- source: docs/integration/SHIPPING_IMPLEMENTATION_SUMMARY.md
- type: api-contract
- content: New shipping estimate endpoint and updated Stripe checkout endpoint that pass shipping/tax data into the Stripe session. Complements CON-printful-shipping-api.

## CON-stripe-integration — Stripe Checkout & Webhook Contract

- source: docs/integration/STRIPE_INTEGRATION.md
- type: api-contract
- content: Stripe Checkout integration: env variables (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET), webhook endpoints, event handler set, and Printful linkage. Surfaces include client/src/pages/Home.tsx and PrintfulShop.

## CON-youtube-channel-videos — YouTube Channel Videos Endpoint

- source: docs/features/YOUTUBE_CHANNEL_VIDEOS.md
- type: api-contract
- content: YouTube channel videos API endpoint backed by server/youtube.ts; returns all channel videos sorted newest first; cached and rate-limited per CON-caching-rate-limit policy.
