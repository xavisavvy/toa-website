# Council Security Review — 2026-10-29

Scope: full repo at `1740756` (main). Five independent read-only reviewers (auth/sessions, payments/webhooks,
input handling, platform hardening, CI/CD + supply chain), then the Critical/High findings were re-verified
against the code by the coordinator. Nothing was run against production.

Key context: production runs `dist/index.js` built from the **root `index.ts`**, which differs from the dev
entry `server/index.ts`. Several findings come from that divergence. The repo is **public**.

## Summary

| # | Sev | Finding | Where |
|---|-----|---------|-------|
| 1 | **Critical** | Client sets price, shipping, tax at checkout → near-free real Printful orders | `server/routes.ts:1161-1200`, `server/stripe.ts:68-116` |
| 2 | **High** | Unauthenticated `POST /api/auth/logout` crashes the prod process | `server/routes.ts:118`, `index.ts` |
| 3 | **High** | Prod entry has no session/CSRF/env validation; login is a credential oracle | `index.ts:12-26` |
| 4 | **High** | Hard-coded admin password committed to a public repo | `scripts/create-admin-quick.ts`, `scripts/create-admin-direct.ts` |
| 5 | **High** | Printful webhook HMAC can't work in prod; fails open without secret | `index.ts:22-25`, `server/routes.ts:1584-1608` |
| 6 | **High** | Public-repo PR code runs on persistent self-hosted runners holding high-value creds | `.github/workflows/ci.yml:6`, `lighthouse.yml:6` |
| 7 | Medium | Duplicate Stripe webhook deliveries → duplicate fulfilment + emails | `server/routes.ts:1244-1406, 1486-1526` |
| 8 | Medium | Quantity unvalidated; charged ~qty² × price, ships 1 | `server/stripe.ts:84-116, 250` |
| 9 | Medium | No login brute-force limit (`authLimiter` defined, never used); no lockout | `server/rate-limiter.ts:97` |
| 10 | Medium | Session fixation — no `regenerate()` on login | `server/routes.ts:85-88` |
| 11 | Medium | CSP allows `unsafe-inline` + `unsafe-eval` in production | `server/security.ts:21-24` |
| 12 | Medium | `/api/health` public, unthrottled, does DB + disk I/O, leaks internals | `server/health.ts:325-341`, `rate-limiter.ts:65-68` |
| 13 | Medium | YouTube/Etsy cache poisoning via `maxResults`/`limit` not in cache key | `server/youtube.ts:567`, `server/etsy.ts:117-170` |
| 14 | Medium | Unpinned YouTube IDs → quota exhaustion + unbounded sync cache file | `server/routes.ts:570-648`, `server/youtube.ts` |
| 15 | Medium | Deploy SSH has no host-key fingerprint; action tag-pinned with prod key | `.github/workflows/deploy.yml:57` |
| 16 | Medium | `GH_PAT` persisted in `.git/config` while `npm ci` runs install scripts | `.github/workflows/version.yml:21-58` |
| 17 | Medium | Stale Replit Signin app is an always-bypass actor on the main ruleset | GitHub ruleset 11575524 |
| 18 | Low | Weak `SESSION_SECRET` fallback; env-validator requires nothing | `server/index.ts:68`, `server/env-validator.ts` |
| 19 | Low | Role/deactivation not re-checked for up to 7 days | `server/auth-middleware.ts:96` |
| 20 | Low | Unescaped HTML in order-confirmation and sponsor emails | `server/notification-service.ts:110-129`, `server/routes.ts:1913-1927` |
| 21 | Low | Customer PII logged (Printful payloads, orders, failed-login emails) | `server/routes.ts:1624`, `server/stripe.ts:271`, `server/security.ts:282` |
| 22 | Low | `/api/metrics` public | `server/routes.ts:566` |
| 23 | Low | `/api/stripe/checkout/:sessionId` returns customer email | `server/routes.ts:1214-1234` |
| 24 | Low | Hand-parsed bodies without Zod (shipping estimate, sponsor, cart) | `server/routes.ts:974-1159, 1882-1940` |
| 25 | Low | D&D Beyond avatar proxy: no size cap, only `apiLimiter` | `server/routes.ts:1834-1879` |
| 26 | Low | `version.yml` can fire from a fork branch named `main` | `.github/workflows/version.yml:3-14` |
| 27 | Low | Production environment has no required reviewer | GitHub environment settings |
| 28 | Low | Unpinned actions / unverified downloads (`curl \| sh`, spdx generator) | `sbom.yml:54-57, 119`, others |
| 29 | Info | Tracked artefacts: `cookies.txt` (expired localhost `connect.sid`), `coverage-report.json`, `lint-output.*` | repo root |
| 30 | Info | Latent `javascript:` sink: `href={order.trackingUrl}` | `client/src/pages/AdminOrderDetail.tsx:283` |
| 31 | Info | Local compose publishes Postgres/Redis with default creds on all interfaces | `docker-compose.yml`, `docker-compose.dev.yml` |

## Details — Critical / High

### 1. Client-controlled checkout price (Critical)
`/api/stripe/create-checkout` takes `price`, `quantity`, `shipping.shipping`, `shipping.tax`, `productName`
and `imageUrl` from `req.body`. The only price check is `priceInCents > 0`; shipping/tax only need to be
numbers (negatives pass). On `checkout.session.completed` the webhook auto-creates a Printful order for the
`variantId`. **Exploit:** POST a real sync variant with `price: "0.50"` (or a negative shipping value) → pay
~$0.50 → receive the real product; the store pays Printful.
**Fix:** accept only `variantId` + `quantity` (Zod int 1–10). Look up retail price server-side from Printful/the
catalog cache; compute shipping/tax server-side (or Stripe shipping options + Stripe Tax). Put shipping in a
separate line item so `unit_amount × quantity` is correct (also fixes #8).

### 2. Unauthenticated crash via logout (High)
The prod entry mounts no session middleware, so `req.session` is `undefined`. The async logout handler reads
`req.session.user` outside try/catch; Express 4 doesn't catch async rejections, there is no
`unhandledRejection` handler anywhere, and Node 26 exits on unhandled rejections.
`curl -X POST https://talesofaneria.com/api/auth/logout` kills the process; Docker restarts it, so a loop
keeps the site down. **Fix:** see #3, plus try/catch and `req.session?.user`.

### 3. Prod entry missing session, CSRF, env validation (High)
Root `index.ts` never mounts `express-session`, `csrfProtection`, `validateEnvironment()` or
`metricsMiddleware` (all present in `server/index.ts`). Effects: admin and customer auth can't work (fails
closed — `requireAdmin` returns 401, no data leak today); login does the full bcrypt check then throws on
`req.session.user = …`, so **wrong password → 401, right password → 500** — a credential-validity oracle.
**Fix:** one shared `createApp()` used by both entries; persistent store (`connect-pg-simple` is already a
dependency); refuse to start without a strong `SESSION_SECRET`; `req.session.regenerate()` on login.
Note the client never sends `x-csrf-token`, so turning CSRF on in prod also needs a client change.

### 4. Hard-coded admin credential in a public repo (High → Critical once #3 is fixed)
`scripts/create-admin-quick.ts` and `scripts/create-admin-direct.ts` create `admin@talesofaneria.com`
with a literal password; `docs/ADMIN_DASHBOARD.md:271` tells operators to run the direct script. Seeds fall
back to `ChangeMe123!`. **Fix:** check whether that account exists in the prod DB and rotate/disable it now;
treat the password as burned (it is in git history); delete both scripts; make seeds refuse to run without
`ADMIN_PASSWORD`.

### 5. Printful webhook verification broken in prod (High)
Global `express.json()` runs before the route-level `express.raw()`, and prod never sets `rawBody`, so
`hmac.update(<object>)` throws. With `PRINTFUL_WEBHOOK_SECRET` set → every real webhook 500s (status/tracking
updates lost). Unset → unsigned forged events accepted (cancel/fail/return orders, inject tracking data,
trigger admin emails containing customer email). Comparison is `!==`, not constant-time.
**Fix:** `app.use('/api/webhooks/printful', express.raw({type:'application/json'}))` before `express.json`
in `index.ts`; `crypto.timingSafeEqual`; 503 when the secret is missing in production; store processed event IDs.

### 6. PR code on persistent self-hosted runners (High)
`ci.yml` and `lighthouse.yml` run on `pull_request` with `runs-on: [self-hosted, Linux, X64]`. Fork runs need
approval (`all_external_contributors`), but once approved — and always for Dependabot — PR code runs as
`restonpreston` (docker group ≈ root) on Shadowsong, where it can read `~/actions-runner/.poller/token`
(gh OAuth: `repo, workflow, write:packages`), other runners' credentials, and plant persistence that captures
`SSH_PRIVATE_KEY` from the next `deploy.yml` run (shared Lightsail VPS, 4 sites).
**Fix:** run `pull_request` jobs on GitHub-hosted runners (or ephemeral/isolated ones); keep self-hosted for
push/main/deploy. Replace the poller token with a fine-grained PAT (Actions: read) owned by a different uid.

## Done well (verified)
- Stripe webhook: `constructEvent` on the raw body in prod, fails closed; fulfilment only from verified events
  using server-retrieved session data.
- bcrypt cost 12, dummy compare on unknown email, generic login errors, `requireAdmin` mounted on all `/api/admin`.
- No `sql.raw`; all Drizzle queries parameterised. No `pull_request_target`; no `${{ github.event.* }}` in `run:`.
- Podcast/audio proxy: pinned feed, host allowlist, per-hop redirect re-validation — no SSRF found.
- Client: only shadcn `chart.tsx` uses `dangerouslySetInnerHTML`; markdown uses `rehype-sanitize`.
- CORS allowlist without reflection; HSTS preload; 1 MB body limits; generic 500s in prod.
- Docker: multi-stage, non-root runtime, `npm ci --ignore-scripts`, no secrets in layers, no published DB ports in prod.
- `npm audit --omit=dev`: 0 vulnerabilities. Dependabot covers npm, docker, actions.

## Suggested order
1. Today: #1 (disable or fix checkout pricing), #4 (rotate/disable that admin account), #2 (crash).
2. This week: #3 + #10 + #9 + #18 together (shared `createApp`), #5, #6, #7/#8.
3. Then: CSP, health/metrics exposure, cache keys/allowlists, CI hardening (#15–#17, #26–#28), Lows.
