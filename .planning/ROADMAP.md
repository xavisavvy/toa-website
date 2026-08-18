# Roadmap: Tales of Aneria — Content & Engagement Milestone (v2.3)

## Overview

This milestone shifts focus from the already-shipped commerce/admin surface to the show-facing content and fan-engagement surface, then hardens the runtime for the move from Replit to self-hosted Kubernetes. Phases progress from foundational content data (campaign archive) → richer per-entity surfaces (characters, discovery) → engagement features → cross-cutting SEO/perf → production hardening. E-commerce, auth, payments, webhooks, and the security scanning stack are already in place and are honored as constraints, not redone.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Campaign Archive** - Browseable history of campaigns and episodes with structured data
- [ ] **Phase 2: Character Page Enhancements** - Deeper lore, gallery taxonomy, dynamic OG and JSON-LD
- [ ] **Phase 3: Podcast & YouTube Discovery** - Channel videos, podcast feed UI, home-page surfacing
- [ ] **Phase 4: Fan Engagement** - Cast surface, social aggregation, fan submission form
- [ ] **Phase 5: SEO & Shop Performance** - Sitemap, OG/Twitter coverage, Lighthouse >=95, shop pagination/filter/sort/perf
- [ ] **Phase 6: Kubernetes Production Hardening** - ArgoCD sync, probes, secrets, script parity, tech-debt sweep

## Phase Details

### Phase 1: Campaign Archive
**Goal**: Visitors can browse the show's campaigns and episodes as a coherent, navigable archive
**Depends on**: Nothing (first phase of this milestone; existing app is the foundation)
**Requirements**: CAMP-01, CAMP-02, CAMP-03, CAMP-04
**Success Criteria** (what must be TRUE):
  1. Visitor can open a campaign archive index page and see campaigns listed in chronological order
  2. Visitor can open any campaign detail page and see its description, participating cast, and ordered episodes
  3. Each archived episode entry links out to its YouTube video and (where present) its podcast episode
  4. Campaign and episode pages emit valid JSON-LD structured data verifiable in Google Rich Results test
**Plans**: TBD
**UI hint**: yes

### Phase 2: Character Page Enhancements
**Goal**: Each character has a rich, lore-deep, share-friendly page that reflects the show's worldbuilding
**Depends on**: Phase 1 (shares structured-data infrastructure with episode/campaign pages)
**Requirements**: CHAR-01, CHAR-02, CHAR-03, CHAR-04
**Success Criteria** (what must be TRUE):
  1. Visitor can read extended lore (background, motivations, arc summary) on every character page
  2. Visitor sees official-art and fan-art badges in the character gallery, with AI-generated disclosure where applicable
  3. Sharing a character page on social media renders a character-specific Open Graph card (title, description, image)
  4. Character pages emit valid `Person` JSON-LD verifiable by Google Rich Results test
**Plans**: TBD
**UI hint**: yes

### Phase 3: Podcast & YouTube Discovery
**Goal**: Visitors can find and explore the show's video and audio content from any entry point
**Depends on**: Phase 1 (links from campaign archive into discovery surfaces)
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DEBT-02, DEBT-04
**Success Criteria** (what must be TRUE):
  1. Visitor can browse all channel videos (newest first) via a videos page backed by the cached YouTube endpoint
  2. Visitor can browse a podcast feed UI backed by the cached Podcast RSS integration
  3. Home page surfaces the latest episode and latest podcast with deep links to the full archive surfaces
  4. YouTube shorts and user-engagement test suites continue to pass with no regressions
**Plans**: TBD
**UI hint**: yes

### Phase 4: Fan Engagement
**Goal**: Fans have low-friction ways to connect with the cast and the show without re-architecting auth
**Depends on**: Phase 2 (cast links into character pages)
**Requirements**: FAN-01, FAN-02, FAN-03
**Success Criteria** (what must be TRUE):
  1. Visitor can open a "Meet the Cast" surface and see each cast member's character link plus their public socials
  2. Home page shows a social aggregation strip linking to the show's official channels
  3. Visitor can submit fan content via a rate-limited, sanitized form without creating an account; submission is delivered (DB row or SES email) and acknowledged in the UI
**Plans**: TBD
**UI hint**: yes

### Phase 5: SEO & Shop Performance
**Goal**: Key page templates rank well and the shop loads fast under realistic catalog size
**Depends on**: Phases 1, 2, 3 (their pages are what we're optimizing)
**Requirements**: SEO-01, SEO-02, SEO-03, SHOP-01, SHOP-02, SHOP-03, SHOP-04
**Success Criteria** (what must be TRUE):
  1. `sitemap.xml` is generated, live, and includes all character, campaign, and episode pages
  2. Shop, episode, and character page templates score Lighthouse SEO >= 95
  3. Visitor can paginate, filter (category/variant), and sort (price asc/desc, newest) the Printful shop catalog client-side
  4. Shop page first-paint LCP is under 2.5s on a representative throttled connection
**Plans**: TBD
**UI hint**: yes

### Phase 6: Kubernetes Production Hardening
**Goal**: Self-hosted Kubernetes is the trusted primary runtime, deployed via ArgoCD with verified probes and secret hygiene
**Depends on**: Phases 1-5 (hardening the runtime that hosts all the new surfaces)
**Requirements**: K8S-01, K8S-02, K8S-03, K8S-04, DEBT-01, DEBT-03, DEBT-05
**Success Criteria** (what must be TRUE):
  1. Operator can deploy a change end-to-end through ArgoCD against a non-prod namespace, with liveness and readiness probes reporting healthy via existing health-check endpoints
  2. No plaintext secrets exist in `.kubernetes/` manifests; all secrets resolve from the cluster secret store at runtime
  3. PowerShell and Shell variants of `.kubernetes/local/*` scripts are functionally identical (verified by review)
  4. Webhook contract tests, monitoring tests, and known moderate-severity dependency vulnerability triage are all current at milestone close
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Campaign Archive | 0/TBD | Not started | - |
| 2. Character Page Enhancements | 0/TBD | Not started | - |
| 3. Podcast & YouTube Discovery | 0/TBD | Not started | - |
| 4. Fan Engagement | 0/TBD | Not started | - |
| 5. SEO & Shop Performance | 0/TBD | Not started | - |
| 6. Kubernetes Production Hardening | 0/TBD | Not started | - |
