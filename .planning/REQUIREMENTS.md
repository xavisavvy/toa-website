# Requirements: Tales of Aneria

**Defined:** 2026-05-08
**Milestone:** Content & Engagement (v2.3)
**Core Value:** Fans of the Tales of Aneria live-play show can discover episodes, explore the world and characters, and support the show through merchandise — all from one trustworthy, accessible site.

## Scope Note

Tales of Aneria is an established product (v2.2.3). E-commerce, payments, admin dashboard, GA4 analytics, webhook contracts, and the security scanning stack are **already shipped** and are listed under "Validated" in `.planning/PROJECT.md`. They are referenced as **constraints/context** for this work, not re-listed as new requirements.

This milestone focuses on the **content and engagement** surface area of the live-play show plus the **k8s production hardening** needed to make the move from Replit to self-hosted Kubernetes safe.

## v1 Requirements (this milestone)

### Campaign Archive (CAMP)

- [ ] **CAMP-01**: Visitor can browse a campaign archive index that lists campaigns/arcs in chronological order
- [ ] **CAMP-02**: Visitor can open a campaign detail page showing description, participating cast, and ordered episodes
- [ ] **CAMP-03**: Each archived episode entry links to its YouTube video and (where applicable) podcast episode
- [ ] **CAMP-04**: Campaign and episode pages emit JSON-LD structured data (Episode / VideoObject / TVSeries-equivalent) per `client/src/lib/structuredData.ts`

### Character Pages (CHAR)

- [ ] **CHAR-01**: Each character page surfaces extended lore (background, motivations, arc summary) beyond current short bio
- [ ] **CHAR-02**: Character gallery supports the official-art / fan-art badge taxonomy and AI-generated artwork disclosure (per CON-character-images)
- [ ] **CHAR-03**: Character pages emit dynamic Open Graph + Twitter Card meta via `client/src/components/SEO.tsx` (per CON-dynamic-social-images)
- [ ] **CHAR-04**: Character pages emit JSON-LD `Person` structured data for SEO

### Discovery — Podcast & YouTube (DISC)

- [ ] **DISC-01**: Visitor can browse all channel videos (newest first) via the YouTube channel videos endpoint (per CON-youtube-channel-videos)
- [ ] **DISC-02**: Visitor can browse a podcast feed UI backed by the cached Podcast RSS integration
- [ ] **DISC-03**: Latest episode and latest podcast episode are surfaced on the home page with deep links to full archives
- [ ] **DISC-04**: YouTube shorts are filterable / browsable (existing route `test/routes/youtube-shorts-routes.test.ts` continues to pass)

### Fan Engagement (FAN)

Curated subset of `REQ-influencer-features`. The full backlog in `docs/INFLUENCER_FEATURES_ANALYSIS.md` remains forward-context, not commitments.

- [ ] **FAN-01**: A "Meet the Cast" surface aggregates each cast member's character link plus their public socials
- [ ] **FAN-02**: A social aggregation strip on the home page links to the show's official social channels (data from `client/src/data/social-links.json`)
- [ ] **FAN-03**: A community / fan-content opt-in submission form is present (no auth required; rate-limited; sanitized; stored or emailed via SES)

### SEO (SEO)

Sourced from `REQ-seo-recommendations`.

- [ ] **SEO-01**: `sitemap.xml` is generated and current, including all character, campaign, and episode pages
- [ ] **SEO-02**: Lighthouse SEO score >= 95 on shop page, episode page, and character page templates
- [ ] **SEO-03**: All key page templates emit Open Graph + Twitter Card meta tags

### Shop Performance (SHOP)

Sourced from `REQ-shop-performance`. The shop *exists*; this is the optimization slice.

- [ ] **SHOP-01**: `PrintfulShop` supports pagination
- [ ] **SHOP-02**: Client-side filtering by category and variant attributes
- [ ] **SHOP-03**: Sorting by price (asc/desc) and newest
- [ ] **SHOP-04**: Shop first-paint metric within performance budget (LCP < 2.5s on representative connection)

### Kubernetes Production Hardening (K8S)

Required because runtime is moving from Replit to self-hosted Kubernetes as the primary target.

- [ ] **K8S-01**: Liveness and readiness probes resolve via existing health-check endpoints in production manifests (per CON-health-checks)
- [ ] **K8S-02**: ArgoCD sync of `.kubernetes/` manifests is verified end-to-end against a non-prod namespace
- [ ] **K8S-03**: Secrets management strategy is documented and enforced (no plaintext secrets in manifests; pulls from cluster secret store)
- [ ] **K8S-04**: PowerShell and Shell variants of `.kubernetes/local/*.ps1` / `*.sh` remain in parity (per CLAUDE.md script-parity rule)

### Tech Debt — Sprint Roadmap Items (DEBT)

Sourced from `REQ-roadmap-tech-debt`. These are existing-test-suite continuity requirements that must keep passing as content/engagement work lands.

- [ ] **DEBT-01**: Webhook contract tests continue to pass (`test/contract/webhook.contract.test.ts`)
- [ ] **DEBT-02**: YouTube shorts route tests continue to pass (`test/routes/youtube-shorts-routes.test.ts`)
- [ ] **DEBT-03**: Monitoring tests continue to pass (`test/monitoring.test.ts`)
- [ ] **DEBT-04**: User-engagement tests continue to pass (`test/user-engagement.test.ts`)
- [ ] **DEBT-05**: Known moderate-severity dep vulns (esbuild, drizzle-kit) re-triaged at milestone close

## v2 Requirements (deferred)

### Analytics Enhancements (ANLY)

Sourced from `REQ-analytics-metrics-roadmap`. Defer to a metrics-focused milestone after content work lands.

- **ANLY-01**: Enhanced GA4 e-commerce events (item-level, funnel, refunds)
- **ANLY-02**: Product analytics dashboards (top SKUs, drop-off points)
- **ANLY-03**: Revenue analytics (MRR-equivalent, AOV, repeat purchase rate)
- **ANLY-04**: Backend monitoring metrics surfaced via `/api/slo` extensions

### Audit & Compliance Surfacing (AUDT)

- **AUDT-01**: Admin UI for browsing `audit_logs` with PII masking respected
- **AUDT-02**: GDPR data-export self-serve endpoint
- **AUDT-03**: Configurable audit-log retention policy

### Influencer Backlog (FAN-FUTURE)

Larger features from `INFLUENCER_FEATURES_ANALYSIS.md` not selected for v1: live-stream hooks beyond YouTube embed, gamification, full UGC moderation, member tiers.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New checkout / payment features | Cart + Stripe + Printful flow is shipped and stable (CON-stripe-integration, CON-printful-integration-final) |
| Admin dashboard rewrite | Existing dashboard meets needs; expansion deferred |
| Real-time chat | High complexity, not validated need |
| Mobile native app | Web-first responsive design is sufficient |
| Full influencer-features catalog implementation | `REQ-influencer-features` acceptance is "evaluate and prioritize," not "ship all" |
| Replacing Replit deploy target | K8s becomes primary; Replit kept as fallback this milestone |
| Re-implementing security scanning | DEC-security-scanning is LOCKED |
| CodeQL re-introduction | Explicitly disabled per LOCKED ADR |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAMP-01 | Phase 1 | Pending |
| CAMP-02 | Phase 1 | Pending |
| CAMP-03 | Phase 1 | Pending |
| CAMP-04 | Phase 1 | Pending |
| CHAR-01 | Phase 2 | Pending |
| CHAR-02 | Phase 2 | Pending |
| CHAR-03 | Phase 2 | Pending |
| CHAR-04 | Phase 2 | Pending |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |
| DISC-04 | Phase 3 | Pending |
| DEBT-02 | Phase 3 | Pending |
| DEBT-04 | Phase 3 | Pending |
| FAN-01 | Phase 4 | Pending |
| FAN-02 | Phase 4 | Pending |
| FAN-03 | Phase 4 | Pending |
| SEO-01 | Phase 5 | Pending |
| SEO-02 | Phase 5 | Pending |
| SEO-03 | Phase 5 | Pending |
| SHOP-01 | Phase 5 | Pending |
| SHOP-02 | Phase 5 | Pending |
| SHOP-03 | Phase 5 | Pending |
| SHOP-04 | Phase 5 | Pending |
| K8S-01 | Phase 6 | Pending |
| K8S-02 | Phase 6 | Pending |
| K8S-03 | Phase 6 | Pending |
| K8S-04 | Phase 6 | Pending |
| DEBT-01 | Phase 6 | Pending |
| DEBT-03 | Phase 6 | Pending |
| DEBT-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-08*
*Last updated: 2026-05-08 after new-project ingest*
