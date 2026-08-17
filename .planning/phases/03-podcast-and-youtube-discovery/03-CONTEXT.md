# Phase 3: Podcast & YouTube Discovery — Context

**Gathered:** 2026-05-09
**Status:** Ready for planning
**Source:** /gsd-discuss-phase
**Depends on:** Phase 1 (URL pattern precedent — /campaigns/<slug>/episodes/<n> means /episodes is taken at the namespace level)

<domain>
## Phase Boundary

Visitors gain a top-level surface to browse the show's full video and audio output: a `/videos` page listing all YouTube channel content (filterable by full-episodes / shorts), a `/podcast` page listing all podcast episodes with links to listening platforms, and home-page deep-links into both archives. The cached server endpoints already exist (`/api/youtube/*`, `/api/podcast/*`) — this phase is primarily about **new client pages and home-page deep-links**, not new backend.

Existing infrastructure (already shipped, this phase consumes/extends only):
- Server: `/api/youtube/playlist/:id`, `/api/youtube/channel/:id`, `/api/youtube/channel/:id/shorts`, `/api/youtube/channel/:id/stats`, `/api/podcast/feed`, `/api/podcast/audio-proxy`
- Client home components: `LatestEpisodes`, `LatestShorts`, `PodcastSection` (DISC-03 already largely satisfied — needs verification + deep-links only)
- Tests that must continue passing: `test/routes/youtube-shorts-routes.test.ts` (DEBT-02), `test/user-engagement.test.ts` (DEBT-04)

**In scope:**
- New page `/videos` — paginated grid of channel videos with `All / Episodes / Shorts` filter chips
- New page `/podcast` — episode list with outbound platform links (Spotify / Apple / YouTube Music)
- Audit existing home components for DISC-03 compliance; add "See all" / "Browse archive" deep-links to new pages where missing
- Navigation entries for the two new pages
- Standard test coverage matching Phase 1/2: integrity tests where data is curated, snapshot tests for any new structured data, Playwright E2E + axe

**Out of scope (explicit):**
- Inline audio player on `/podcast` (link-out only)
- Inline YouTube `<iframe>` players on `/videos` (link-out to YouTube)
- Infinite scroll (paginated grid for accessibility + deep-link stability)
- Server-side new endpoints (existing endpoints suffice)
- Search across videos/podcast (not in success criteria)
- Per-video / per-podcast detail pages (link-out is sufficient for v1)
- Redesigning home-page surfacing (Option D was "verify existing + deep-links," not "redesign")
- New JSON-LD types beyond what existing structuredData.ts provides for these surfaces

</domain>

<decisions>
## Implementation Decisions

### Page URLs and Names — LOCKED
- `/videos` — full channel videos archive (DISC-01, DISC-04). Page title: "Videos".
- `/podcast` — full podcast episode list (DISC-02). Page title: "Podcast".
- Naming choice rationale: `/videos` is generic, distinct from `/campaigns/<slug>/episodes/<n>` introduced in Phase 1, and content-source-agnostic if future distribution channels are added.

### Videos Page Browsing UX — LOCKED
- **Paginated grid**, newest first. Page size suggestion: 12 (planner may pick 9/12/15 based on responsive grid breakpoints — must be divisible into a clean grid at md/lg/xl).
- **Pagination controls**: prev / next + page indicator (no infinite scroll, no "Load more").
- **Filter chips**: `All / Episodes / Shorts` — client-side filter on the fetched list. Default: `All`.
- Each grid item shows: thumbnail, title, publish date, runtime, and a `Shorts` badge when applicable.
- Shorts identified by length (< 60 seconds) — confirmed by researcher against the existing `/api/youtube/channel/:id/shorts` endpoint shape.
- Clicking an item opens the YouTube URL in a new tab (existing outbound-link pattern: `target="_blank" rel="noopener noreferrer"`).

### Podcast Page UX — LOCKED
- **Episode list** (not grid), newest first.
- Each entry shows: episode title, summary (truncated to ~3 lines, full on hover/expand), air date, runtime.
- **Outbound platform links per entry** — Spotify, Apple Podcasts, YouTube Music — same icons/treatment as the existing `PodcastSection.tsx` home strip.
- **No inline audio player** in v1. The existing `/api/podcast/audio-proxy` route is not consumed by this phase.
- Top-of-page links to subscribe (Spotify/Apple/YouTube Music) — copy/extend existing PodcastSection.tsx subscribe block.

### Home-Page Surfacing (DISC-03) — LOCKED
- **Audit only, do not redesign.** Existing components on `Home.tsx`:
  - `LatestEpisodes` — surfaces latest YouTube episodes (covers latest-episode requirement)
  - `LatestShorts` — surfaces latest shorts (separate from DISC-03 strictly, but valuable)
  - `PodcastSection` — surfaces the podcast (covers latest-podcast requirement)
- **Required v1 work**: add a "See all videos" / "Browse the archive" link in `LatestEpisodes` and `PodcastSection` pointing to `/videos` and `/podcast` respectively. If a "See all" already exists, no-op (planner verifies during work).
- **Deferred unless found broken**: layout tweaks, copy changes, visual redesign.

### Caching / Data-Fetching Strategy — LOCKED
- **React Query (TanStack)** — same layer used by existing home components. The new pages call the same `/api/youtube/channel/:id` and `/api/podcast/feed` endpoints.
- **No new caching layers**. The server endpoints are already cached (per `server/cache.ts` and the cached endpoint convention used by Phase 1/2 references).
- Pagination is **client-side** — fetch the full channel video list once via React Query, slice by page in memory. If the channel has > ~200 videos and this becomes a performance concern, planner can switch to server-side cursor pagination, but v1 assumes the channel is small enough for client-side. Researcher must verify channel video count and the existing endpoint's pagination/limit behavior.

### YouTube Shorts Visibility (DISC-04) — LOCKED
- Shorts are **first-class** on the videos page — visible by default in the `All` filter, with a `Shorts` badge.
- The `Shorts` filter chip narrows to only shorts.
- The `Episodes` filter chip narrows to only non-shorts (full videos).
- DEBT-02 acceptance: `test/routes/youtube-shorts-routes.test.ts` continues to pass — no regression to the existing `/api/youtube/channel/:id/shorts` endpoint or its tests.

### DEBT-02 + DEBT-04 — LOCKED
- These are continuity requirements, not new work. The integrity test added in this phase must verify both files still pass at phase close. Planner specifies the exact verify step.
- Existing tests are NOT to be modified to make them pass — if Phase 3 implementation breaks them, the implementation is wrong.

### Navigation — LOCKED
- New nav entries in `client/src/components/Navigation.tsx`: `Videos` and `Podcast`.
- Placement: planner picks; Phase 1 placed `Campaigns` between `Characters` and `Shop`; Phase 2 noted that pattern. Suggested placement: `Videos` and `Podcast` between `Campaigns` and `Shop`. Not blocking.

### Testing — LOCKED
- Mirror Phase 1/2 patterns:
  - **Unit tests** for the new pages (rendering, filter logic, pagination, deep-links).
  - **Playwright E2E + axe** spec for `/videos` and `/podcast` (mirror `e2e/campaigns.spec.ts`).
  - **Continuity check**: Phase 3 must not break `test/routes/youtube-shorts-routes.test.ts` or `test/user-engagement.test.ts` (DEBT-02, DEBT-04).
- No new server-side test work expected (no new endpoints).

### Data Fixtures for Tests — LOCKED
- Tests should mock the cached server endpoints (use existing MSW patterns or vitest mocks already in the test suite).
- E2E tests should not require live YouTube/podcast traffic — use the test fixtures the existing `LatestEpisodes`/`PodcastSection` tests already have.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing pages to mirror
- `client/src/pages/Campaigns.tsx` (Phase 1) — list/filter page pattern with status chips → mirror for `Videos.tsx`
- `client/src/pages/CharacterDetail.tsx` — outbound link pattern with `rel="noopener noreferrer"`
- `client/src/pages/Characters.tsx` — list-page card grid

### Existing components to extend / consume
- `client/src/components/LatestEpisodes.tsx` — DISC-03 audit; possibly add "See all" link
- `client/src/components/LatestShorts.tsx` — exists; not extended in this phase
- `client/src/components/PodcastSection.tsx` — DISC-03 audit; possibly add "See all" link; copy/extend its subscribe block onto the new `/podcast` page
- `client/src/components/SEO.tsx` — page-level meta integration on the new pages
- `client/src/components/Navigation.tsx` — add new nav entries
- `client/src/App.tsx` — wouter route registration

### Server endpoints (read-only, no changes this phase)
- `server/routes.ts` lines around `/api/youtube/playlist/:id`, `/api/youtube/channel/:id`, `/api/youtube/channel/:id/shorts`, `/api/youtube/channel/:id/stats`
- `server/routes.ts` lines around `/api/podcast/feed`, `/api/podcast/audio-proxy`
- `server/youtube.ts`, `server/podcast.ts` — implementation; researcher reads to confirm response shapes

### Tests that must keep passing (DEBT continuity)
- `test/routes/youtube-shorts-routes.test.ts` (DEBT-02)
- `test/user-engagement.test.ts` (DEBT-04)
- `test/latest-shorts.test.tsx`, `test/youtube.test.ts`, `test/youtube-integration.test.ts` — adjacent suites; planner names them in the verify step

### Requirements & decisions sources
- `.planning/REQUIREMENTS.md` — DISC-01..04, DEBT-02, DEBT-04 binding requirements
- `.planning/PROJECT.md` — locked project decisions
- `.planning/phases/01-campaign-archive/01-PLAN.md` — pattern reference (Phase 3 mirrors it)
- `.planning/phases/02-character-page-enhancements/02-PLAN.md` — pattern reference (especially the lighter "extension over construction" approach when infra exists)
- `CLAUDE.md` — wouter `useNavigate` ban; route patterns; accessibility/test requirements

</canonical_refs>

<specifics>
## Specific Ideas

- The shorts/episodes distinction is by video length (< 60 seconds typically = short). The existing `/api/youtube/channel/:id/shorts` endpoint already encodes this convention — researcher should confirm the current threshold and reuse it.
- A **page-level error/empty state** matters for the new pages: if YouTube quota is exhausted or the API returns nothing, the page must render a friendly "Couldn't load videos right now — check back soon" message and a manual link to the YouTube channel. Same pattern for podcast.
- React Query already has retry / stale-while-revalidate semantics configured globally (per `client/src/lib/queryClient.ts`). The new pages inherit this — they don't need custom retry logic.
- The new `/videos` page may reasonably be tagged with `<SEO ogImage>` pointing at the channel banner or a fallback. Researcher should suggest; planner picks.

</specifics>

<deferred>
## Deferred Ideas

These came up but are explicitly NOT part of Phase 3.

- **Inline audio player on `/podcast`** — `/api/podcast/audio-proxy` exists, so this is enabled, but Option C v1 was link-out only. Revisit when audio engagement metrics suggest it's worth the complexity.
- **Per-video detail pages** (`/videos/<id>`) — link-out to YouTube is sufficient for v1.
- **Per-podcast-episode detail pages** (`/podcast/<id>`) — link-out is sufficient for v1.
- **Search across videos/podcast** — not in success criteria; defer unless Phase 5 or a future engagement phase adds it.
- **Infinite scroll** — paginated controls are more accessible and deep-link-stable; revisit only if scale demands it.
- **Server-side cursor pagination** — only if the channel exceeds ~200 videos.
- **Episode artwork in podcast list** — possible polish; depends on what the RSS feed exposes. Let researcher report.
- **VideoObject / PodcastEpisode JSON-LD on the new browse pages** — Phase 1 added these factories; whether to emit a list of `ItemList` schema on the browse page is a possible polish, deferred unless researcher recommends it for SEO measurable upside.
- **Cross-link from a campaign-archive episode to its corresponding YouTube watch page** — already exists per CAMP-03 (Phase 1). No additional cross-linking added in this phase.

</deferred>

---

*Phase: 03-podcast-and-youtube-discovery*
*Context gathered: 2026-05-09 via /gsd-discuss-phase*
