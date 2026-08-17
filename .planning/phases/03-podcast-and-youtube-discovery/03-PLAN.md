---
phase: 03-podcast-and-youtube-discovery
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/03-podcast-and-youtube-discovery/03-RESEARCH.md
  - client/src/components/ui/pagination.tsx
  - client/src/components/PodcastSubscribeStrip.tsx
  - client/src/pages/Videos.tsx
  - client/src/pages/Podcast.tsx
  - client/src/components/LatestEpisodes.tsx
  - client/src/components/LatestShorts.tsx
  - client/src/components/PodcastSection.tsx
  - client/src/components/Navigation.tsx
  - client/src/App.tsx
  - test/helpers/test-utils.tsx
  - test/pages/Videos.test.tsx
  - test/pages/Podcast.test.tsx
  - test/latest-episodes.test.tsx
  - test/podcast-section.test.tsx
  - e2e/discovery.spec.ts
autonomous: false
requirements:
  - DISC-01
  - DISC-02
  - DISC-03
  - DISC-04
  - DEBT-02
  - DEBT-04
tags: [content-discovery, youtube, podcast, pagination, wouter-routes, react-query, accessibility]

must_haves:
  truths:
    - "Visitor opens /videos and sees a paginated grid of channel videos (12 per page), newest first, each with thumbnail, title, publish date, runtime, and a Shorts badge when applicable"
    - "Visitor toggles the All / Episodes / Shorts filter chips on /videos and the visible grid + page count update client-side without reload; page resets to 1 on filter change"
    - "Visitor clicks Previous / Next pagination on /videos and the visible 12-card window slides; controls are disabled at boundaries; page indicator announces 'Page N of M' to screen readers"
    - "Visitor clicks any video card on /videos and the YouTube watch URL opens in a new tab with rel=\"noopener noreferrer\""
    - "Visitor opens /podcast and sees a vertical list of podcast episodes (newest first) with title, summary (line-clamp-3), pubDate, runtime, and three outbound platform buttons (Spotify / Apple Podcasts / YouTube Music) per episode"
    - "Top of /podcast shows a subscribe strip (Spotify / Apple / YouTube Music) — the same content reused via a shared <PodcastSubscribeStrip> component on the home PodcastSection"
    - "All outbound links on /videos and /podcast open in a new tab with rel=\"noopener noreferrer\" (verified by E2E DOM assertion, not just source)"
    - "/videos and /podcast render a friendly error fallback (with a manual link to YouTube channel / podcast platforms) when their useQuery returns isError"
    - "/videos and /podcast render a 'no content' empty state when the API returns an empty array"
    - "Home component LatestEpisodes 'View All Episodes' CTA links to internal /videos via wouter <Link> (was: external youtube.com/@TalesOfAneria); a small secondary 'YouTube channel' link preserves access to the external URL"
    - "Home component LatestShorts 'View All Shorts' CTA links to internal /videos via wouter <Link>; secondary external YouTube /shorts link preserved"
    - "Home component PodcastSection gains a 'Browse all episodes' CTA linking to internal /podcast via wouter <Link>"
    - "Header Navigation includes a 'Videos' route entry (/videos) and a 'Podcast' route entry (/podcast) between Campaigns and Shop; the existing #podcast hash entry is REMOVED (replaced by the route entry)"
    - "test/routes/youtube-shorts-routes.test.ts continues to pass (remains describe.skip — DEBT-02 non-interference)"
    - "test/user-engagement.test.ts continues to pass (DEBT-04 non-interference)"
    - "/videos and /podcast pass axe (WCAG 2.1 AA) on the rendered page"
    - "All RESEARCH Open Questions (#1-#6) carry RESOLVED markers in 03-RESEARCH.md"
  artifacts:
    - path: "client/src/pages/Videos.tsx"
      provides: "Videos archive page: paginated grid + All/Episodes/Shorts filter chips + error/empty states + Shorts badge"
      contains: "queryKey: ['/api/youtube/channel/full'"
      min_lines: 150
    - path: "client/src/pages/Podcast.tsx"
      provides: "Podcast archive page: vertical episode list + per-entry platform buttons + subscribe strip + error/empty states"
      contains: "queryKey: ['/api/podcast/feed/full'"
      min_lines: 120
    - path: "client/src/components/ui/pagination.tsx"
      provides: "shadcn Pagination primitives (Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink) with proper aria-current/aria-label"
      contains: "aria-current"
    - path: "client/src/components/PodcastSubscribeStrip.tsx"
      provides: "Reusable Spotify / Apple Podcasts / YouTube Music subscribe button row, used by Podcast.tsx and PodcastSection.tsx"
      contains: "SiSpotify"
    - path: "test/pages/Videos.test.tsx"
      provides: "Unit coverage: rendering, All/Episodes/Shorts filter, pagination prev/next + page reset on filter change, Shorts badge, click opens YouTube watch URL with safe rel, error + empty states, query key distinct from LatestEpisodes (R1 mitigation)"
    - path: "test/pages/Podcast.test.tsx"
      provides: "Unit coverage: rendering, list ordering, per-entry platform buttons present, subscribe strip present, error + empty states"
    - path: "test/latest-episodes.test.tsx"
      provides: "DISC-03 assertion that View All Episodes is a wouter <Link> to /videos (NEW file)"
    - path: "test/podcast-section.test.tsx"
      provides: "DISC-03 assertion that PodcastSection renders 'Browse all episodes' wouter <Link> to /podcast (NEW file)"
    - path: "e2e/discovery.spec.ts"
      provides: "Playwright spec covering /videos (load + filter chips + pagination prev/next + outbound rel + axe) and /podcast (load + outbound platform link + axe), mirrors e2e/campaigns.spec.ts"
  key_links:
    - from: "client/src/App.tsx"
      to: "Videos / Podcast pages"
      via: "<Route path=\"/videos\" component={Videos} /> and <Route path=\"/podcast\" component={Podcast} />"
      pattern: "path=\"/videos"
    - from: "client/src/pages/Videos.tsx"
      to: "/api/youtube/channel/:id?maxResults=500"
      via: "useQuery with distinct cache key ['/api/youtube/channel/full', channelId] (R1 mitigation)"
      pattern: "/api/youtube/channel/full"
    - from: "client/src/pages/Podcast.tsx"
      to: "POST /api/podcast/feed body { feedUrl, limit: 500 }"
      via: "useQuery with cache key ['/api/podcast/feed/full', feedUrl]"
      pattern: "/api/podcast/feed/full"
    - from: "client/src/components/LatestEpisodes.tsx"
      to: "/videos"
      via: "wouter <Link href=\"/videos\"> on the View All button"
      pattern: "href=\"/videos\""
    - from: "client/src/components/PodcastSection.tsx"
      to: "/podcast"
      via: "wouter <Link href=\"/podcast\"> on the Browse all episodes button"
      pattern: "href=\"/podcast\""
    - from: "client/src/components/PodcastSection.tsx"
      to: "client/src/components/PodcastSubscribeStrip.tsx"
      via: "Imported and rendered in place of inline subscribe block"
      pattern: "PodcastSubscribeStrip"
    - from: "client/src/components/Navigation.tsx"
      to: "navItems array"
      via: "Adds { label: 'Videos', href: '/videos', isRoute: true } and replaces { label: 'Podcast', href: '#podcast' } with { label: 'Podcast', href: '/podcast', isRoute: true }"
      pattern: "/videos"
---

<objective>
Ship Phase 3 of the Tales of Aneria content milestone: two new public archive surfaces (`/videos`, `/podcast`) and home-page deep-links into them, satisfying DISC-01..04 plus DEBT-02/04 continuity.

Purpose: All backend infrastructure already exists (`/api/youtube/channel/:id`, `/api/youtube/channel/:id/shorts`, `POST /api/podcast/feed`, server caches). Phase 3 is **client-side only** — three surfaces consume already-cached endpoints with no new endpoints, no DB schema changes, and no inline media players. Mirrors Phase 2's "extension over construction" discipline.

Output: Two new wouter routes, one extracted shared component (`PodcastSubscribeStrip`), one vendored shadcn primitive (`pagination.tsx`), three home-page DISC-03 retargets, two nav entries (with one hash entry replaced), four new test files, one E2E spec. Plus: back-edit 03-RESEARCH.md to mark all 6 Open Questions resolved (Phase 1/2 lesson).

Scope guardrails (LOCKED from CONTEXT / RESEARCH):
- No new server endpoints, no DB schema changes.
- No inline audio player on `/podcast` (link-out only).
- No inline `<iframe>` players on `/videos` (link-out to YouTube).
- No infinite scroll — paginated controls only (12/page).
- Wouter only — `useNavigate` is forbidden. Internal navigation uses `<Link>`.
- DISTINCT React Query cache key on `/videos` (`['/api/youtube/channel/full', channelId]`) to avoid colliding with `LatestEpisodes`' `?maxResults=50` truncated cache (RESEARCH R1 — HIGH severity). Same pattern for `/podcast` (`['/api/podcast/feed/full', feedUrl]`) vs PodcastSection's `limit:5` slot.
- Tests use mocked endpoints (`mockFetch.success` from `test/helpers/test-utils.tsx`) — no live YouTube/podcast traffic.
- Phase 4 (Fan Engagement) imports from PodcastSection patterns — keep changes additive: PodcastSection retains its current API and visual; we extract subscribe block into a shared component PodcastSection imports back.

Open Questions resolved (back-edited in Task 1):
1. **RESOLVED:** `LatestShorts` "see all" deep-link goes to plain `/videos` (no URL filter param) — start simple; revisit if engagement metrics suggest otherwise.
2. **RESOLVED:** Replace the existing `#podcast` hash nav entry with the `/podcast` route entry. The PodcastSection still has `id="podcast"` so any old hash anchor still scrolls within Home — but the nav surfaces the route, which is the canonical location.
3. **RESOLVED:** Vendor shadcn `client/src/components/ui/pagination.tsx` via `npx shadcn-ui@latest add pagination`. Fall back to hand-rolled `<PaginationControls>` only if the CLI add fails (Task 3 documents the chosen path in its summary).
4. **RESOLVED:** Extract `<PodcastSubscribeStrip>` (used twice — `Podcast.tsx` and `PodcastSection.tsx`). Defer `<VideoCard>` and `<PodcastEpisodeRow>` extraction (used once each in v1).
5. **RESOLVED:** `Videos.tsx` requests `?maxResults=500` explicitly (self-documenting; doubles current 237 video count headroom for ~5 years).
6. **RESOLVED:** Both `/videos` and `/podcast` omit a custom `ogImage` for v1 (SEO falls back to site default `og-image.png`, matching `Campaigns.tsx`). Author can commit `public/og/videos.png` and `public/og/podcast.png` in a future content polish PR.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/phases/03-podcast-and-youtube-discovery/03-CONTEXT.md
@.planning/phases/03-podcast-and-youtube-discovery/03-RESEARCH.md
@.planning/phases/01-campaign-archive/01-PLAN.md
@.planning/phases/02-character-page-enhancements/02-PLAN.md
@CLAUDE.md
@.github/copilot-instructions.md

# Pages to mirror line-for-line
@client/src/pages/Campaigns.tsx
@client/src/components/SEO.tsx
@client/src/lib/structuredData.ts

# Existing home components — modified by this phase + pattern source for new pages
@client/src/components/LatestEpisodes.tsx
@client/src/components/LatestShorts.tsx
@client/src/components/PodcastSection.tsx
@client/src/components/Navigation.tsx
@client/src/App.tsx

# Endpoint shapes (read-only — no server changes)
@server/youtube.ts
@server/podcast.ts
@server/routes.ts

# Test patterns to mirror
@test/helpers/test-utils.tsx
@test/latest-shorts.test.tsx
@e2e/campaigns.spec.ts

<interfaces>
<!-- Contracts the executor needs. Extracted from codebase. Do not re-explore. -->

VideoItem (server/youtube.ts:74-83 — returned by /api/youtube/channel/:id):
```ts
interface VideoItem {
  id: string;            // YouTube video id (11 chars)
  title: string;
  thumbnail: string;
  duration: string;      // human-readable, e.g. "1:23:45" or "4:32"
  publishedAt: string;   // ISO 8601
  viewCount?: string;
  description?: string;
  durationSeconds?: number;  // KEY for shorts identification
}
```

PodcastEpisode (server/podcast.ts — returned by POST /api/podcast/feed):
```ts
interface PodcastEpisode {
  id: string;
  title: string;
  description: string;   // contentSnippet || content (HTML-stripped by rss-parser)
  pubDate: string;       // RFC 822 typically; new Date(...) parses
  duration?: string;
  audioUrl?: string;
  link?: string;
}
```

Shorts predicate (mirror server/youtube.ts:633-635 EXACTLY — do NOT simplify):
```ts
const isShort = (v: VideoItem) =>
  v.durationSeconds !== undefined && v.durationSeconds > 0 && v.durationSeconds <= 60;
```

SEO contract (client/src/components/SEO.tsx) — pass jsonLd as a single object:
```ts
interface SEOProps { title?: string; description?: string; canonical?: string;
  ogImage?: string; keywords?: string; jsonLd?: object; ogType?: string; }
```

Existing factory to reuse (no new factories in Phase 3):
```ts
export const getBreadcrumbSchema: (items: { name: string; url: string }[]) => object;
```

Wouter usage (CLAUDE.md):
```ts
import { Link, useLocation } from "wouter";   // useNavigate FORBIDDEN
```

Test helpers (test/helpers/test-utils.tsx — VERIFIED):
```ts
renderWithProviders(node)          // wraps QueryClient + wouter Router
mockFetch.success(data)            // single-payload fetch mock for ALL fetches in test
mockFetch.error(status, message)
TestFactory.video({...overrides})  // returns { id, title, description, thumbnail, duration, publishedAt, viewCount, url }
TestFactory.short({...overrides})
TestFactory.episode({...overrides})  // podcast-shaped (id, title, description, pubDate, duration, audioUrl)
```

NOTE — TestFactory.video does NOT currently include `durationSeconds`. Task 4 extends the factory ADDITIVELY (default `durationSeconds: 600`, override-friendly so tests can set `30` for shorts).

Distinct query keys (R1 mitigation — CRITICAL):
- LatestEpisodes (existing): `['/api/youtube/channel', channelId]` — fetches `?maxResults=50` (truncated)
- LatestShorts (existing):   `['/api/youtube/channel/shorts', channelId]`
- PodcastSection (existing): `['/api/podcast/feed', feedUrl]` — POST limit:5
- Videos.tsx (NEW):          `['/api/youtube/channel/full', channelId]` — fetches `?maxResults=500` (full archive)
- Podcast.tsx (NEW):         `['/api/podcast/feed/full', feedUrl]` — POST limit:500 (full feed)

Verified channel/feed sizes (RESEARCH 2026-05-09):
- 237 channel videos (videoCount stat); 127 podcast episodes (cached feed file).
- Both fit comfortably in client-side pagination (90KB and 280KB respectively).
</interfaces>

<navigation_target_state>
Final navItems shape after Task 8 (LOCKED — see RESEARCH §Navigation entry):
```ts
const navItems = [
  { label: "Episodes", href: "#episodes" },
  { label: "Characters", href: "#characters" },
  { label: "Campaigns", href: "/campaigns", isRoute: true },
  { label: "Videos", href: "/videos", isRoute: true },        // NEW
  { label: "Podcast", href: "/podcast", isRoute: true },      // REPLACES the #podcast hash entry
  { label: "Lore", href: "#lore" },
  { label: "Shop", href: "/shop", isRoute: true },
  { label: "Sponsorship", href: "/sponsorship", isRoute: true, highlight: true },
  { label: "About", href: "#about" },
];
```
The existing `id="podcast"` on PodcastSection remains intact, so any external bookmark to `/#podcast` still scrolls within Home.
</navigation_target_state>
</context>

<tasks>

<!-- =========================================================================
WAVE 1 — DOC HYGIENE
Phase 1/2 lesson: never ship a phase plan with unresolved RESEARCH Open
Questions. Land first so RESEARCH.md is canonical before any code touches.
========================================================================= -->

<task type="auto" tdd="false">
  <name>Task 1: Resolve and seal Open Questions in 03-RESEARCH.md</name>
  <files>.planning/phases/03-podcast-and-youtube-discovery/03-RESEARCH.md</files>
  <action>
    Edit `.planning/phases/03-podcast-and-youtube-discovery/03-RESEARCH.md` "Open Questions" section (the numbered 1-6 list near the bottom). For EACH of the 6 questions, append a `**RESOLVED:**` marker line directly under the question with the matching one-sentence decision from this PLAN's <objective> Open Questions block:

    1. **RESOLVED:** `LatestShorts` "see all" deep-links to plain `/videos` (no `?filter=shorts` URL param in v1).
    2. **RESOLVED:** Replace the existing `#podcast` nav entry with the new `/podcast` route entry; PodcastSection retains its `id="podcast"` so legacy hash anchors still scroll within Home.
    3. **RESOLVED:** Vendor shadcn `client/src/components/ui/pagination.tsx` via `npx shadcn-ui@latest add pagination`; hand-roll fallback only on CLI failure (Task 3 records the path taken).
    4. **RESOLVED:** Extract `<PodcastSubscribeStrip>` (used by `Podcast.tsx` AND `PodcastSection.tsx`); defer `<VideoCard>` and `<PodcastEpisodeRow>` extraction.
    5. **RESOLVED:** `Videos.tsx` requests `?maxResults=500` explicitly (~2x current 237 video headroom).
    6. **RESOLVED:** Omit a custom `ogImage` on `/videos` and `/podcast` for v1 (SEO falls back to site default), matching `Campaigns.tsx`.

    Do NOT modify any other section of RESEARCH.md. Pure documentation hygiene.

    After editing, also update the heading of the Open Questions section from "## Open Questions" to "## Open Questions (RESOLVED)" so future readers see at a glance the questions are closed (matches the Phase 2 RESEARCH back-edit convention).
  </action>
  <verify>
    <automated>node -e "const c=require('fs').readFileSync('.planning/phases/03-podcast-and-youtube-discovery/03-RESEARCH.md','utf8');const resolved=(c.match(/\*\*RESOLVED:\*\*/g)||[]).length;process.exit(resolved>=6 ? 0 : 1)"</automated>
  </verify>
  <done>
    All 6 Open Questions in 03-RESEARCH.md carry `**RESOLVED:**` markers matching the decisions in this PLAN's <objective>. Heading updated. No other content modified.
  </done>
</task>

<!-- =========================================================================
WAVE 2 — FOUNDATIONS (UI primitives + test fixture extension)
Two cheap, additive setup tasks that everything downstream depends on.
========================================================================= -->

<task type="auto" tdd="false">
  <name>Task 2: Extend TestFactory.video with durationSeconds (additive, non-breaking)</name>
  <files>test/helpers/test-utils.tsx</files>
  <action>
    Open `test/helpers/test-utils.tsx`. Locate `TestFactory.video` (around line 16). ADD a `durationSeconds: 600` default to the returned object so existing callers continue to work but `Videos.tsx` tests can override to `30` for short fixtures and `3600` for full episodes.

    Be defensive: only ADD the field — do NOT remove or rename any existing field on the factory. Existing tests (e.g. `test/latest-shorts.test.tsx`) must continue to pass without changes.

    No other helper changes. Do NOT touch `mockFetch`, `renderWithProviders`, `TestFactory.short`, `TestFactory.episode`. If `TestFactory.short` does NOT already include `durationSeconds`, also add `durationSeconds: 30` as its default (mirrors server convention `<= 60`).
  </action>
  <verify>
    <automated>npx vitest run test/latest-shorts.test.tsx</automated>
  </verify>
  <done>
    `TestFactory.video` returns `durationSeconds: 600` by default; `TestFactory.short` returns `durationSeconds: 30` by default. Existing `test/latest-shorts.test.tsx` still passes (proves the change is non-breaking).
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Vendor shadcn Pagination primitive into client/src/components/ui/pagination.tsx</name>
  <files>client/src/components/ui/pagination.tsx</files>
  <action>
    Run `npx shadcn-ui@latest add pagination` (or the modern equivalent — `npx shadcn@latest add pagination`) from the repo root. The CLI vendors `client/src/components/ui/pagination.tsx` exporting `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationNext`, `PaginationLink`, `PaginationEllipsis` with proper `aria-current="page"` on the active link and `aria-label="Previous page" / "Next page"` on the directional buttons.

    If the CLI is unavailable in this environment OR adds files outside `client/src/components/ui/` (project misconfig), FALL BACK to hand-rolling: copy the canonical source from https://ui.shadcn.com/docs/components/pagination into `client/src/components/ui/pagination.tsx` directly, adjusting imports to use `@/lib/utils` (`cn`) and `@/components/ui/button` (`buttonVariants`) — both already vendored. Document the path taken (CLI vs hand-roll) in the eventual SUMMARY.

    After vendoring, run `npm run check` and `npm run lint` to confirm no regressions. Do NOT use the component anywhere yet — Task 5 wires it into `Videos.tsx`.
  </action>
  <verify>
    <automated>node -e "const c=require('fs').readFileSync('client/src/components/ui/pagination.tsx','utf8');const ok=c.includes('aria-current')&&c.includes('PaginationPrevious')&&c.includes('PaginationNext');process.exit(ok?0:1)" &amp;&amp; npm run check</automated>
  </verify>
  <done>
    `client/src/components/ui/pagination.tsx` exists, exports the standard shadcn primitives, contains `aria-current` and the directional aria-labels, and `npm run check` passes. No callers exist yet.
  </done>
</task>

<!-- =========================================================================
WAVE 3 — SHARED PODCAST SUBSCRIBE STRIP
Extract once, used twice (Podcast.tsx + PodcastSection.tsx). Lands BEFORE
Podcast.tsx (Task 6) and the PodcastSection retarget (Task 7) so both consumers
import a stable contract.
========================================================================= -->

<task type="auto" tdd="false">
  <name>Task 4: Extract PodcastSubscribeStrip from PodcastSection.tsx</name>
  <files>client/src/components/PodcastSubscribeStrip.tsx, client/src/components/PodcastSection.tsx</files>
  <action>
    1. Read `client/src/components/PodcastSection.tsx` once (already in <context>) and identify the subscribe block (Spotify / Apple Podcasts / YouTube Music buttons in a `flex items-center gap-3 flex-wrap` row, around lines 148-195 per RESEARCH).
    2. Create `client/src/components/PodcastSubscribeStrip.tsx` exporting a default React component with this contract:
       ```ts
       interface PodcastSubscribeStripProps {
         spotifyUrl?: string;
         applePodcastsUrl?: string;
         youtubeMusicUrl?: string;
         className?: string;          // optional layout override
       }
       ```
       The component renders three `<Button asChild>` (or `<Button>` with `<a>`) entries — one per platform — using the existing `react-icons/si` (`SiSpotify`, `SiApplepodcasts`, `SiYoutubemusic`) icons. Buttons that have no URL provided render as DISABLED (mirrors the existing PodcastSection behavior where empty env vars produce disabled buttons). All anchors use `target="_blank" rel="noopener noreferrer"`.
    3. Refactor `PodcastSection.tsx` to import and render `<PodcastSubscribeStrip ... />` in place of the inline subscribe block. The visible output MUST be byte-equivalent to the current rendering — this is a refactor, not a redesign. Preserve any `data-testid` attributes (`button-podcast-spotify`, etc.) on the new component so existing tests (or Phase 4 tests) keep working.
    4. Run `npm run check && npm run lint`. If any existing snapshot test references the section, update with `-u` ONLY after manually confirming the diff is purely structural (component boundary moved) and not visual.
    5. Do NOT change `PodcastSection`'s public props, its data-fetching, or its visual layout. Phase 4 (Fan Engagement) extends from this component — keep it stable.
  </action>
  <verify>
    <automated>npm run check &amp;&amp; npm run lint</automated>
  </verify>
  <done>
    `PodcastSubscribeStrip.tsx` exists, accepts the three platform URL props + optional className, renders three platform buttons with safe outbound rel. `PodcastSection.tsx` imports and uses it; visual output unchanged. `npm run check` and `npm run lint` pass.
  </done>
</task>

<!-- =========================================================================
WAVE 4 — VIDEOS PAGE
The phase's largest single surface. Mirrors Campaigns.tsx chrome with a
paginated grid + filter chips + the R1-mitigated distinct query key.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 5: Implement /videos page (Videos.tsx) + unit tests</name>
  <files>client/src/pages/Videos.tsx, test/pages/Videos.test.tsx</files>
  <behavior>
    - Renders Navigation, SEO (title "Videos - Tales of Aneria", canonical https://talesofaneria.com/videos, BreadcrumbList JSON-LD via `getBreadcrumbSchema`, NO `ogImage` — site default fallback), Footer.
    - Page header mirrors `Campaigns.tsx`: circle icon (Lucide `Video`), `<h1>Videos</h1>`, lede paragraph "Every episode and short — newest first.".
    - Fetches via `useQuery({ queryKey: ['/api/youtube/channel/full', channelId], queryFn: fetch('/api/youtube/channel/${channelId}?maxResults=500') })` — DISTINCT cache key from `LatestEpisodes` (R1 mitigation; this is non-negotiable).
    - Channel ID source: `import.meta.env.VITE_YOUTUBE_CHANNEL_ID` (matches existing `Home.tsx` and `LatestEpisodes` consumer pattern).
    - Filter chips: three buttons (`All | Episodes | Shorts`) with `data-testid="filter-type-${value}"`, identical pattern to Campaigns.tsx status filter. Default: `all`. Clicking a chip resets pagination to page 1 (`useEffect(() => { setPage(1); }, [filter])`).
    - Shorts predicate (mirrors server EXACTLY): `v.durationSeconds !== undefined && v.durationSeconds > 0 && v.durationSeconds <= 60`. Do NOT simplify to `v.durationSeconds <= 60`.
    - Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`, 12 items per page (`PAGE_SIZE = 12`).
    - Each card: 16:9 thumbnail (lazy loaded), title (line-clamp-2), `formatDate(publishedAt)`, duration (Lucide `Clock` icon + text), `Shorts` Badge when `isShort(v)` is true. Click handler: `window.open(\`https://www.youtube.com/watch?v=${id}\`, '_blank', 'noopener,noreferrer')`. data-testids: `card-video-${id}`, `text-video-title-${id}`, `badge-shorts-${id}`.
    - Pagination: render `<Pagination>` (from Task 3's vendored primitive) below the grid with Previous / Next buttons (disabled at boundaries) and a `Page {page} of {totalPages}` indicator. Use `data-testid="pagination-prev"`, `data-testid="pagination-next"`, `data-testid="pagination-page-indicator"`. The page indicator MUST be inside an element with `aria-live="polite"` (or `role="status"`) so screen readers announce page changes.
    - Empty state (filtered list is empty but query succeeded): `<p data-testid="text-empty-state">No videos match this filter.</p>`.
    - Error state (`isError === true`): friendly fallback Card with the copy "Couldn't load videos right now — check back soon." plus a `<Button>` that opens `https://www.youtube.com/@TalesOfAneria` in a new tab with safe rel. data-testid: `card-error-state`.
    - Loading state: 3-6 skeleton cards (mirror `LatestEpisodes` skeleton style).
    - SEO description: "Every episode and short from the Tales of Aneria YouTube channel — newest first."

    **Unit tests (test/pages/Videos.test.tsx) using `renderWithProviders` + `mockFetch.success`:**
    - **renders all 12 videos on page 1**: pass 25 mixed fixtures via `mockFetch.success`; assert exactly 12 `card-video-*` rendered; assert `pagination-page-indicator` reads "Page 1 of 3" (ceil(25/12) = 3).
    - **clicking pagination-next advances to page 2**: assert next 12 rendered.
    - **clicking pagination-next on the last page is disabled**: assert button has `disabled` attribute when `page === totalPages`.
    - **filter chip Shorts narrows to durationSeconds <= 60 only**: pass `[short, episode, short, episode, ...]` mix; click `filter-type-shorts`; assert only short cards visible; assert page resets to 1.
    - **filter chip Episodes excludes shorts**: same mix; click `filter-type-episodes`; assert only episode cards visible.
    - **Shorts badge renders only on short cards**: with mixed fixtures, assert `badge-shorts-${id}` exists for short ids and is absent for episode ids.
    - **clicking a card opens YouTube watch URL with safe rel**: spy on `window.open`; assert call args include `'https://www.youtube.com/watch?v=' + id`, `'_blank'`, `'noopener,noreferrer'`.
    - **error state**: `mockFetch.error(500, 'down')`; assert `card-error-state` rendered with the YouTube channel button.
    - **empty state**: `mockFetch.success([])`; assert `text-empty-state` rendered.
    - **distinct cache key (R1 regression)**: render `<LatestEpisodes channelId="UC..."/>` with `mockFetch.success([oneVideo])`, then unmount, render `<Videos />`, with `mockFetch.success([twentyVideos])` set BEFORE the second render. Assert that the second render shows 12 cards (proving Videos refetches against its own key, not the cached 1-item LatestEpisodes slot). NOTE: this test is the canonical regression for R1 — if it fails, the query keys collided.
  </behavior>
  <action>
    Mirror `client/src/pages/Campaigns.tsx` line-for-line for the page chrome (SEO + Navigation + page header + filter chip JSX + grid + Footer). Substitute the body and data layer per <behavior>.

    Use the `<Pagination>` primitive from Task 3. Reference shadcn docs for the exact composition pattern — typically:
    ```tsx
    <Pagination>
      <PaginationContent>
        <PaginationItem><PaginationPrevious onClick={...} aria-disabled={page===1} /></PaginationItem>
        <PaginationItem><span role="status" aria-live="polite" data-testid="pagination-page-indicator">Page {page} of {totalPages}</span></PaginationItem>
        <PaginationItem><PaginationNext onClick={...} aria-disabled={page===totalPages} /></PaginationItem>
      </PaginationContent>
    </Pagination>
    ```
    If shadcn's `PaginationPrevious`/`Next` use `<a>` rather than `<button>`, add `data-testid` and ensure the disabled state is communicated via `aria-disabled` AND a click guard so keyboard users cannot trigger out-of-bounds.

    Use `import.meta.env.VITE_YOUTUBE_CHANNEL_ID`. If unset (test environment), the page should render the empty/loading state gracefully — confirm by leaving `enabled: !!channelId` on the useQuery.

    Build the `formatDate` helper inline (or import from `@/components/PodcastSection`'s pattern if you extract it — defer extraction; inline is fine here).

    Tests use `mockFetch.success(arrayOfVideoFixtures)` from `test/helpers/test-utils.tsx`. Build fixtures via `TestFactory.video({ durationSeconds: 30 })` for shorts and `TestFactory.video({ durationSeconds: 3600 })` for episodes. The R1 regression test sets `import.meta.env.VITE_YOUTUBE_CHANNEL_ID` via `vi.stubEnv` if needed.

    No `useNavigate`. No new server endpoints. No inline iframe.
  </action>
  <verify>
    <automated>npx vitest run test/pages/Videos.test.tsx</automated>
  </verify>
  <done>
    `/videos` renders 12-per-page grid with All/Episodes/Shorts filter chips and Previous/Next pagination. Shorts badge correct. Click opens YouTube with safe rel. Error and empty states render. Distinct query key verified by R1 regression test. `npm run check` passes. `npm run check:mistakes` clean.
  </done>
</task>

<!-- =========================================================================
WAVE 5 — PODCAST PAGE
Vertical list (not grid) — different layout than Videos. Reuses
PodcastSubscribeStrip from Task 4.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 6: Implement /podcast page (Podcast.tsx) + unit tests</name>
  <files>client/src/pages/Podcast.tsx, test/pages/Podcast.test.tsx</files>
  <behavior>
    - Renders Navigation, SEO (title "Podcast - Tales of Aneria", canonical https://talesofaneria.com/podcast, BreadcrumbList JSON-LD, NO custom ogImage), Footer.
    - Page header: circle icon (Lucide `Headphones`), `<h1>Podcast</h1>`, lede "Every episode of the Tales of Aneria podcast — newest first.".
    - Fetches via `useQuery({ queryKey: ['/api/podcast/feed/full', feedUrl], queryFn: POST /api/podcast/feed body { feedUrl, limit: 500 } })` — DISTINCT cache key from PodcastSection's `['/api/podcast/feed', feedUrl]` (limit:5).
    - Feed URL source: `import.meta.env.VITE_PODCAST_FEED_URL` (matches existing PodcastSection consumer).
    - Top-of-page subscribe strip: `<PodcastSubscribeStrip spotifyUrl={...} applePodcastsUrl={...} youtubeMusicUrl={...} />` — feed URLs from `VITE_PODCAST_SPOTIFY_URL`, `VITE_PODCAST_APPLE_URL`, `VITE_PODCAST_YOUTUBE_MUSIC_URL` (existing env-var contract from Home.tsx).
    - Episode list: vertical stack (`space-y-4` of `<Card>`), NOT a grid. Each entry shows:
      - Title (line-clamp-2) — `data-testid="text-podcast-title-${id}"`
      - Description (line-clamp-3, plain text — rss-parser strips HTML; render as `{episode.description}` text child) — `data-testid="text-podcast-description-${id}"`
      - `formatDate(pubDate)` (with try/catch fallback per RESEARCH R4: `try { return new Date(d).toLocaleDateString(...) } catch { return d }`)
      - Duration (when present) rendered as-is (per RESEARCH R5; no normalization)
      - Per-entry platform buttons: a row of three small Button + anchor entries (Spotify / Apple Podcasts / YouTube Music) — same icons (SiSpotify/SiApplepodcasts/SiYoutubemusic) as the subscribe strip but pointing at the same platform URLs (since RSS doesn't generally expose per-episode platform deep links — for v1 the per-entry buttons share the show-level platform URLs from env). data-testids: `link-podcast-spotify-${id}`, `link-podcast-apple-${id}`, `link-podcast-youtube-music-${id}`. All anchors `target="_blank" rel="noopener noreferrer"`.
      - If `episode.link` is present (the RSS item link, often the show-page URL on the host), render an additional "Listen on host" outbound button. Optional — keep simple if it complicates the row.
    - Loading state: 3 skeleton Card placeholders.
    - Empty state: `<p data-testid="text-empty-state">No podcast episodes available.</p>`.
    - Error state: friendly Card with copy "Couldn't load podcast episodes right now — check back soon." and a Button that opens the Spotify URL (or Apple if Spotify unset; first non-empty wins) — keep parallel to Videos.tsx error pattern.
    - NO INLINE AUDIO PLAYER. Do not consume `episode.audioUrl`. Do not call `/api/podcast/audio-proxy`.

    **Unit tests (test/pages/Podcast.test.tsx):**
    - renders the subscribe strip (`<PodcastSubscribeStrip>` mounts; assert via testid on the platform buttons inside it).
    - renders all episodes from mockFetch in newest-first order (server already sorts; no client re-sort needed; assert order matches mock array).
    - per-entry platform buttons present with correct `target="_blank"` and `rel` attributes (DOM assertion).
    - error state renders fallback Card + button when `mockFetch.error(500, 'down')`.
    - empty state renders when `mockFetch.success([])`.
    - description rendered as plain text (no HTML markup leaks): pass a fixture with `description: 'Hello <script>alert(1)</script> world'`; assert the rendered text contains the literal angle brackets (React's auto-escape) — defensive test for the rss-parser HTML-stripping assumption.
  </behavior>
  <action>
    Mirror `Campaigns.tsx` for SEO + Navigation + Footer chrome. Use `<PodcastSubscribeStrip>` from Task 4 for the subscribe block. The episode list is a `<div className="space-y-4 max-w-3xl mx-auto">` of `<Card>` entries — keep narrower than Videos' grid (single column reads better for description-heavy content).

    Build inline `formatDate` (mirror PodcastSection.tsx:48-58). Per-entry platform buttons reuse `<Button asChild>` + `<a>` pattern.

    Tests use `mockFetch.success` with `TestFactory.episode({...})` fixtures. The XSS-defense test sends an angle-bracketed description string and confirms React's automatic JSX escaping renders it as text.

    `import.meta.env.VITE_PODCAST_FEED_URL` is the source of truth; if unset, render empty state. Mirror this contract for the platform URLs (Spotify/Apple/YT Music).

    No `useNavigate`. No audio player. No new server endpoints.
  </action>
  <verify>
    <automated>npx vitest run test/pages/Podcast.test.tsx</automated>
  </verify>
  <done>
    `/podcast` renders subscribe strip + vertical list of episodes with per-entry platform buttons. Description XSS-defense test green. Error and empty states render. `npm run check` and `npm run check:mistakes` clean.
  </done>
</task>

<!-- =========================================================================
WAVE 6 — DISC-03 RETARGETS (home-page deep-links)
Three small but visible edits. Each home component gets a wouter <Link> CTA
into the new internal routes. External YouTube/podcast links preserved as
secondary affordances where useful (LatestEpisodes, LatestShorts).
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 7: Retarget LatestEpisodes / LatestShorts / PodcastSection home CTAs to internal routes</name>
  <files>client/src/components/LatestEpisodes.tsx, client/src/components/LatestShorts.tsx, client/src/components/PodcastSection.tsx, test/latest-episodes.test.tsx, test/podcast-section.test.tsx</files>
  <behavior>
    **B1. LatestEpisodes.tsx:**
    - Replace the existing "View All Episodes" Button (currently `onClick={() => window.open(channelUrl, '_blank', ...)}`) with a wouter `<Link href="/videos">` wrapping a `<Button variant="outline">View All Episodes</Button>` (`data-testid="button-view-all-episodes"` preserved).
    - ADD a small secondary `<a href="https://www.youtube.com/@TalesOfAneria" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-youtube-channel">Visit YouTube channel</a>` directly below or beside the primary button so users who genuinely want the external channel still have an affordance.
    - No data-fetching changes. The `?maxResults=50` and `['/api/youtube/channel', channelId]` query key STAY UNCHANGED (per RESEARCH A5 — home strip's request is intentional).

    **B2. LatestShorts.tsx:**
    - Replace the existing "View All Shorts" button (currently opens `https://www.youtube.com/@TalesOfAneria/shorts` externally) with a wouter `<Link href="/videos">` wrapping `<Button variant="outline">View All Shorts</Button>` (`data-testid="button-view-all-shorts"` preserved).
    - ADD a small secondary external `<a>` to `https://www.youtube.com/@TalesOfAneria/shorts` with safe rel.
    - Per Open Question #1 RESOLVED: do NOT add `?filter=shorts` to the internal link. Plain `/videos` only.
    - **Bonus tabnabbing fix:** RESEARCH §Security found LatestShorts.tsx line 95 currently uses `window.open(..., '_blank')` WITHOUT `noopener,noreferrer`. While retargeting, also fix this preexisting issue to `window.open(..., '_blank', 'noopener,noreferrer')` on the per-card click handler. Document as a defense-in-depth improvement.

    **B3. PodcastSection.tsx:**
    - In the section header (next to or below the existing `<h2>Podcast</h2>`), ADD a wouter `<Link href="/podcast">` wrapping `<Button variant="outline">Browse all episodes</Button>` (`data-testid="button-browse-all-podcast"`). Place it analogous to LatestEpisodes' `View All Episodes` button positioning (right side of the heading row on desktop).
    - No other PodcastSection changes (Task 4 already extracted the subscribe strip; THIS task only adds the deep-link button).

    **Tests:**
    - **NEW** `test/latest-episodes.test.tsx`:
      - `it('renders View All Episodes as a wouter Link to /videos')`: render `<LatestEpisodes channelId="UC..." />` with `mockFetch.success([])`; query the button by testid; assert its closest enclosing anchor element has `href="/videos"` (wouter `<Link>` renders as `<a href>`).
      - `it('renders a secondary external YouTube channel link with safe rel')`: assert the `link-youtube-channel` anchor has `target="_blank"` and `rel` containing `noopener` and `noreferrer`.
    - **NEW** `test/podcast-section.test.tsx`:
      - `it('renders Browse all episodes as a wouter Link to /podcast')`: render `<PodcastSection feedUrl="https://example.com/rss" />` with `mockFetch.success([])`; assert the button-browse-all-podcast button is enclosed by an `<a href="/podcast">`.
      - `it('mounts PodcastSubscribeStrip with provided platform URLs')`: assert at least one of the platform-button testids is present in the DOM.
    - Both tests use `renderWithProviders` (which provides the wouter Router context). Mock `VITE_*` env vars where the component needs them (use `vi.stubEnv` if necessary).
  </behavior>
  <action>
    1. Edit each of the three components in place. Imports: add `import { Link } from "wouter"` to LatestShorts.tsx if missing (LatestEpisodes.tsx will need it too — verify against the existing file). Use `<Button asChild><Link href="/videos">View All Episodes</Link></Button>` if the project's button pattern supports `asChild` (it does — verified via `<Button asChild>` usage in CharacterDetail.tsx). Otherwise use `<Link href="..."><Button>...</Button></Link>` (slightly less semantic but works).
    2. Preserve every existing `data-testid`. Adding new testids is fine (`link-youtube-channel`, `button-browse-all-podcast`).
    3. Tests: create `test/latest-episodes.test.tsx` and `test/podcast-section.test.tsx` from scratch. Mirror the structure of `test/latest-shorts.test.tsx` for setup. Use `mockFetch.success([])` so the components render without API errors.
    4. Run `npm run check && npm run lint && npm run check:mistakes` to confirm: TS clean, no ESLint regressions, no `useNavigate` smuggled in.
  </action>
  <verify>
    <automated>npx vitest run test/latest-episodes.test.tsx test/podcast-section.test.tsx test/latest-shorts.test.tsx &amp;&amp; npm run check:mistakes</automated>
  </verify>
  <done>
    LatestEpisodes, LatestShorts, and PodcastSection all surface internal-route CTAs (`/videos`, `/videos`, `/podcast` respectively). Secondary external links preserved with safe rel. LatestShorts per-card window.open now includes `noopener,noreferrer`. Two new test files green; existing `test/latest-shorts.test.tsx` still passes.
  </done>
</task>

<!-- =========================================================================
WAVE 7 — WIRING
Register routes in App.tsx and update Navigation. Tiny but distinct from
page implementation. Lands AFTER pages exist (TS imports would otherwise fail).
========================================================================= -->

<task type="auto" tdd="false">
  <name>Task 8: Wire /videos and /podcast routes in App.tsx; update Navigation.tsx (replace #podcast with /podcast, add Videos)</name>
  <files>client/src/App.tsx, client/src/components/Navigation.tsx</files>
  <behavior>
    - `App.tsx` imports `Videos` and `Podcast` from `@/pages/Videos` and `@/pages/Podcast`. Adds two `<Route path="/videos" component={Videos} />` and `<Route path="/podcast" component={Podcast} />` BEFORE the catch-all NotFound route, following the existing `/campaigns` precedent.
    - `Navigation.tsx` `navItems` array updated EXACTLY to the locked target shape (see <navigation_target_state> in <context>):
      - REMOVE `{ label: "Podcast", href: "#podcast" }` (existing line 16)
      - INSERT `{ label: "Videos", href: "/videos", isRoute: true }` between `Campaigns` and `Lore`
      - INSERT `{ label: "Podcast", href: "/podcast", isRoute: true }` directly after `Videos`
    - The existing `handleNavClick` already handles `isRoute: true` — no logic changes. Mobile menu picks up the entries from the same array — no separate edit needed.
    - The `id="podcast"` on PodcastSection in Home stays intact, so a legacy link to `/#podcast` still scrolls within Home (handled by `handleNavClick`'s scrollIntoView fallback when `location === '/'`).
  </behavior>
  <action>
    1. App.tsx: add the two imports + two `<Route>` lines following existing alias-sorted import grouping and the route ordering used for `/campaigns`.
    2. Navigation.tsx: edit the `navItems` array to the locked shape. No `useNavigate`. No `handleNavClick` changes.
    3. Run `npm run check && npm run lint && npm run check:mistakes`. Spot-check `npm run dev` if the executor wants visual confirmation (optional — the E2E pass in Task 9 covers this).
  </action>
  <verify>
    <automated>npm run check &amp;&amp; npm run lint &amp;&amp; npm run check:mistakes</automated>
  </verify>
  <done>
    `/videos` and `/podcast` routes resolve in dev. Header has `Videos` and `Podcast` route entries between Campaigns and Shop; `#podcast` hash entry removed. No type or lint errors. No `useNavigate`.
  </done>
</task>

<!-- =========================================================================
WAVE 8 — END-TO-END + ACCESSIBILITY + DEBT CONTINUITY
Real-browser exercise of the new pages plus a non-interference proof for
DEBT-02 / DEBT-04. The DEBT step is the explicit verify for the continuity
requirement; it is non-modifying.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 9: Playwright E2E with axe checks for /videos and /podcast (e2e/discovery.spec.ts) + DEBT-02/04 continuity verify</name>
  <files>e2e/discovery.spec.ts</files>
  <behavior>
    Mirror `e2e/campaigns.spec.ts` structure. All page navigations include `expect(page).toPassAxeCheck()` per CLAUDE.md WCAG 2.1 AA requirement.

    1. `test('loads /videos with paginated grid')` — visit `/videos`; assert title contains "Videos"; assert at least 1 `[data-testid^="card-video-"]` is rendered (the page may rely on cached data or an MSW-style intercept — for v1, the test runs against the dev server with the real cached YouTube response, mirroring how `e2e/campaigns.spec.ts` runs against real data). Run axe.

    2. `test('filter chips narrow the grid')` — click `filter-type-shorts`; assert page indicator resets to "Page 1 of N"; assert visible cards all carry `badge-shorts-*`. Click `filter-type-episodes`; assert no `badge-shorts-*` visible. Click `filter-type-all`; total returns to baseline.

    3. `test('pagination prev/next moves the window')` — assert prev is disabled on page 1; click next; assert page indicator increments; click prev; assert it returns. (If the dev cache has fewer than 13 videos so totalPages == 1, skip the increment assertion gracefully — mirror the conditional pattern from `e2e/campaigns.spec.ts` if applicable, or hardcode that the seeded channel has ≥13 videos per RESEARCH 237 count.)

    4. `test('video card opens YouTube watch URL with safe rel')` — click on any `card-video-*`. Because the click uses `window.open` (not an `<a href>`), capture the popup with `page.waitForEvent('popup')` and assert its URL matches `/^https:\/\/www\.youtube\.com\/watch\?v=/`. Then close the popup. ALTERNATIVELY: if the implementation uses `<a target="_blank">` instead of `window.open`, assert `target` and `rel` on the anchor directly (the executor picks the implementation in Task 5; this E2E adapts).

    5. `test('loads /podcast with episode list and subscribe strip')` — visit `/podcast`; assert at least one episode entry rendered (testid prefix `text-podcast-title-`); assert the subscribe strip's Spotify button is present. Run axe.

    6. `test('podcast platform buttons open with safe rel')` — locate one `link-podcast-spotify-*` anchor; assert its `target="_blank"` and `rel` contains both `noopener` and `noreferrer`.

    7. `test('error fallback renders when API fails')` — OPTIONAL if the test environment supports Playwright route interception: `page.route('/api/youtube/channel/*', r => r.fulfill({ status: 500 }))` then visit `/videos`; assert `card-error-state` visible. If route interception is not used elsewhere in this repo's E2E suite, drop this test (covered by the unit test in Task 5 already).

    Run `expect(page).toPassAxeCheck()` on at least `/videos` and `/podcast`.

    **DEBT-02 / DEBT-04 continuity (NOT in this E2E spec — runs separately):**
    Add a `<verify>` step at the bottom of this task (not a new test) that runs:
    ```
    npx vitest run test/routes/youtube-shorts-routes.test.ts test/user-engagement.test.ts
    ```
    Both files MUST report 0 failures (DEBT-02 is `describe.skip` so reports 0 tests run; DEBT-04 reports its existing test count green). If either reports failures, the phase has a regression and must not ship.
  </behavior>
  <action>
    Read `e2e/campaigns.spec.ts` once for the canonical `toPassAxeCheck` import pattern (RESEARCH confirmed it exists). Mirror it.

    File location: `e2e/discovery.spec.ts`. Reuse `test.describe('Discovery — /videos and /podcast', ...)` block.

    For the pagination/filter tests, use Playwright's `page.locator('[data-testid="..."]').click()` and `page.locator('[data-testid="pagination-page-indicator"]').textContent()`.

    The `window.open` popup capture pattern is:
    ```ts
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('[data-testid^="card-video-"]').first().click(),
    ]);
    await expect(popup).toHaveURL(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    await popup.close();
    ```

    Avoid live YouTube calls in the test by either: (a) running against the dev server with its server-side cache populated (preferred — mirrors `e2e/campaigns.spec.ts` which depends on the dev server), or (b) using Playwright route interception to mock `/api/youtube/channel/*` and `/api/podcast/feed`. The executor picks based on what `playwright.config.ts` already does for `e2e/campaigns.spec.ts`.
  </action>
  <verify>
    <automated>npm run test:e2e -- e2e/discovery.spec.ts &amp;&amp; npx vitest run test/routes/youtube-shorts-routes.test.ts test/user-engagement.test.ts</automated>
  </verify>
  <done>
    All E2E tests pass; axe finds zero violations on `/videos` and `/podcast`. DEBT-02 file remains 0 failures (skipped suite reports clean). DEBT-04 reports all its existing tests green. Phase does not regress either continuity surface.
  </done>
</task>

<!-- =========================================================================
WAVE 9 — PHASE GATE
Manual sanity check on a deployed URL. Truly human-only because the test
suite cannot validate "the deployed page looks right" without a deploy step.
========================================================================= -->

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Phase 3 ships:
    - New page `/videos` — paginated grid (12/page), All/Episodes/Shorts filter chips, Shorts badge, distinct R1-mitigated React Query cache key, error/empty states.
    - New page `/podcast` — vertical episode list, per-entry platform buttons, top subscribe strip via `<PodcastSubscribeStrip>`, error/empty states; NO inline audio player.
    - Vendored shadcn `client/src/components/ui/pagination.tsx` primitive with proper ARIA.
    - Extracted shared `client/src/components/PodcastSubscribeStrip.tsx` (used by Podcast.tsx and PodcastSection.tsx).
    - DISC-03 retargets: LatestEpisodes / LatestShorts CTAs now point at internal `/videos` (with secondary external links preserved); PodcastSection gains "Browse all episodes" CTA pointing at `/podcast`. Plus a defense-in-depth tabnabbing fix on LatestShorts per-card click.
    - Navigation: `Videos` and `Podcast` route entries between Campaigns and Shop; legacy `#podcast` hash entry removed.
    - Tests: `test/pages/Videos.test.tsx`, `test/pages/Podcast.test.tsx`, `test/latest-episodes.test.tsx`, `test/podcast-section.test.tsx` (all NEW), plus extended `test/helpers/test-utils.tsx` (TestFactory `durationSeconds` defaults), plus `e2e/discovery.spec.ts` with axe.
    - DEBT-02 and DEBT-04 continuity: both test files unchanged and continue to pass (verified in Task 9).
    - All RESEARCH Open Questions (#1-#6) marked RESOLVED in 03-RESEARCH.md.
  </what-built>
  <how-to-verify>
    Final manual sanity check (per task brief J — visit deployed URLs and eyeball the new surfaces):

    1. After this PR is merged or against a public preview / staging URL:
       - Visit `https://<deployed-url>/videos`.
       - Confirm the page title reads "Videos - Tales of Aneria".
       - Confirm the grid renders with thumbnails, titles, dates, durations.
       - Toggle the filter chips: All -> Episodes -> Shorts. The grid should narrow correctly each time. Pagination should reset to page 1 on each filter change.
       - Click Previous / Next pagination on each filter. Boundary buttons should disable cleanly.
       - Click a Shorts card; YouTube should open in a new tab (with the watch URL) — NOT a redirect within the same tab.
       - Resize the browser to mobile width — filter chips and grid should reflow without overflow.

    2. Visit `https://<deployed-url>/podcast`.
       - Confirm the subscribe strip at the top shows the three platform buttons.
       - Confirm the episode list renders with title, description, date, duration, and three per-entry platform buttons.
       - Click a Spotify per-entry button — Spotify should open in a new tab.
       - Confirm there is NO inline audio player.

    3. Visit Home (`/`).
       - Click "View All Episodes" on the Latest Episodes section — should navigate to `/videos` (internal SPA navigation, no page reload). Then back to Home, click the small "Visit YouTube channel" secondary link — should open YouTube externally.
       - Click "View All Shorts" on the Latest Shorts section — should navigate to `/videos`.
       - Click "Browse all episodes" on the Podcast section — should navigate to `/podcast`.
       - Header navigation should show `Videos` and `Podcast` between `Campaigns` and `Shop`. The old `#podcast` hash entry should be GONE. Clicking either route entry navigates to the new pages.

    4. Open the page source on `/videos` and `/podcast` and confirm:
       - Exactly one `<script type="application/ld+json">` per page (BreadcrumbList).
       - `og:image` meta tag uses the site default (not a broken/empty value).

    5. (Optional) Run Lighthouse on `/videos` and `/podcast` — both should score ≥95 on Accessibility (E2E axe already covers WCAG 2.1 AA, but Lighthouse is a useful cross-check before SEO-02 phase work later).

    If anything looks broken or off-pattern (e.g. the Shorts filter doesn't narrow, or the per-entry podcast button opens in the same tab), describe the issue and a follow-up plan can address it. Otherwise approve.
  </how-to-verify>
  <resume-signal>Type "approved" once both pages render correctly on the deployed URL and all home-page CTAs route to the expected internal routes, or describe issues found for follow-up.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → external (YouTube, Spotify, Apple, YT Music, podcast host) | Outbound platform / video links open in new tabs to third-party hosts. |
| Server cache → browser | Already-cached YouTube/podcast responses pass through unchanged; Phase 3 adds no new server endpoints. |
| Browser → DOM (RSS-supplied content) | Podcast `description` / `title` from the RSS feed is rendered as text via React JSX. |
| Crawler → page | Public read-only browse surfaces. No authentication, no PII, no user input accepted (filter chips are client-only enums). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | Tampering (XSS) | Podcast `description` field rendered in `Podcast.tsx` | mitigate | rss-parser exposes `contentSnippet` (HTML-stripped plain text). Render via `{episode.description}` text child — React auto-escapes. Task 6 includes an explicit XSS-defense unit test using a fixture containing `<script>` markup; the test asserts the rendered text shows literal angle brackets. |
| T-03-02 | Tampering (tabnabbing) | All outbound links on `/videos`, `/podcast`, and the retargeted home CTAs | mitigate | Every outbound `<a target="_blank">` and `window.open(..., '_blank', 'noopener,noreferrer')` carries safe rel. Task 9 E2E asserts on rendered DOM (not just source). Task 7 explicitly fixes a preexisting tabnabbing issue on `LatestShorts.tsx` per-card click. |
| T-03-03 | Tampering | URL scheme injection via the filter query string | mitigate | `Videos.tsx` does not read URL state in v1 (RESOLVED Open Q #1); the only filter source is internal React state with a typed enum (`'all' | 'episodes' | 'shorts'`). If a future change adds URL-driven filter init, validate against the enum and default to `'all'` on unknown values. |
| T-03-04 | Tampering | YouTube `videoId` from API response used to construct watch URL | accept | Server-side `getChannelVideos` returns YouTube-API-supplied 11-character ids. Risk that an adversarial response could inject crafted ids is bounded by YouTube's first-party shape; rendering via `https://www.youtube.com/watch?v=${id}` with id appearing as a query param is safe (query params don't execute). Optional defense (deferred): regex-validate `id` matches `/^[a-zA-Z0-9_-]{11}$/` before constructing the URL. |
| T-03-05 | Tampering | Podcast `audioUrl` (RSS enclosure URL) | n/a | Phase 3 does NOT consume `audioUrl` (no inline audio player — locked decision). Out of attack surface. |
| T-03-06 | Information Disclosure | Cached YouTube/podcast endpoints | accept | Public content already served on the home page via `LatestEpisodes`, `LatestShorts`, `PodcastSection`. Phase 3 adds no new disclosure; same data, paginated UI. |
| T-03-07 | Denial of Service (client) | Large channel video count saturating client memory | accept | RESEARCH verified 237 videos ≈ 90KB gzipped (well under any concerning threshold). Trigger to revisit (server-side cursor pagination): >1000 videos. R2 noted; no Phase 3 action required. |
| T-03-08 | Denial of Service (quota) | YouTube API quota | accept | Server-side cache (24h TTL) absorbs all visits. RESEARCH R8 estimated ~10 quota units/day across the channel surface; Phase 3 introduces zero additional API load (same cached endpoints). |
| T-03-09 | Spoofing / Repudiation | n/a | n/a | No auth, no user-mutable state. Out of scope. |
| T-03-10 | Elevation of Privilege | n/a | n/a | No new server endpoints; pure client + cached read surfaces. Out of scope. |
| T-03-11 | Tampering (regression) | DEBT-02 (`youtube-shorts-routes.test.ts`) and DEBT-04 (`user-engagement.test.ts`) continuity | mitigate | Phase 3 introduces zero changes to `server/routes.ts`, `server/youtube.ts`, `client/src/lib/userEngagement.ts`, or `client/src/lib/analytics.ts`. Task 9's verify step explicitly runs both files and gates on green. |
</threat_model>

<verification>
**Per-task verification:** the `<verify>` block on each task.

**Phase-level verification (run before Task 10 checkpoint approval):**

```bash
npm run check                                       # TS — clean (verifies new pages + pagination primitive types)
npm run lint                                        # ESLint — clean
npm run check:mistakes                              # No useNavigate (CRITICAL per CLAUDE.md)
npm run test                                        # Full unit suite incl. coverage thresholds
npm run test:e2e -- e2e/discovery.spec.ts           # E2E + axe for the new pages
npx vitest run test/routes/youtube-shorts-routes.test.ts test/user-engagement.test.ts   # DEBT-02 + DEBT-04 continuity
```

Coverage check: new files (`client/src/pages/Videos.tsx`, `client/src/pages/Podcast.tsx`, `client/src/components/PodcastSubscribeStrip.tsx`, `client/src/components/ui/pagination.tsx`) all contribute to the global 40% line threshold. Per-file thresholds (`server/routes.ts`, `server/security.ts`, `server/env-validator.ts`) are not touched by this phase, so no new server-side threshold pressure.
</verification>

<success_criteria>
Mapped 1:1 to ROADMAP success criteria + REQUIREMENTS.md DISC-01..04 + DEBT-02/04 continuity:

1. **DISC-01 — "Visitor can browse all channel videos (newest first)"** — verified by Task 5 unit tests (rendering, sort order, pagination) + Task 9 E2E (`loads /videos with paginated grid`). The `?maxResults=500` request size + R1-mitigated query key are explicit in the implementation.

2. **DISC-02 — "Visitor can browse a podcast feed UI backed by the cached Podcast RSS"** — verified by Task 6 unit tests (rendering, list ordering, subscribe strip mount) + Task 9 E2E (`loads /podcast with episode list and subscribe strip`).

3. **DISC-03 — "Latest episode and latest podcast episode are surfaced on the home page with deep links to full archives"** — verified by Task 7 unit tests (`test/latest-episodes.test.tsx` and `test/podcast-section.test.tsx`) on the wouter `<Link href="/videos">` / `<Link href="/podcast">` retargets. Manually verified at the Task 10 checkpoint by clicking each home CTA on a deployed URL.

4. **DISC-04 — "YouTube shorts are filterable / browsable"** — verified by Task 5 unit tests (Shorts filter narrows correctly; Episodes filter excludes shorts; Shorts badge per-item) + Task 9 E2E (`filter chips narrow the grid`). Server's `durationSeconds <= 60` predicate is mirrored EXACTLY on the client.

5. **DEBT-02 — "test/routes/youtube-shorts-routes.test.ts continues to pass"** — verified by Task 9's continuity verify command running the file directly. No code change to `server/routes.ts` or `server/youtube.ts` can occur in this phase, so the file's `describe.skip` remains intact.

6. **DEBT-04 — "test/user-engagement.test.ts continues to pass"** — verified by Task 9's continuity verify command. No code change to `client/src/lib/userEngagement.ts` or `client/src/lib/analytics.ts` occurs in this phase.

Additional implicit success:
- Accessibility: `/videos` and `/podcast` pass axe at the WCAG 2.1 AA bar (CLAUDE.md requirement; Task 9 enforces).
- Pagination ARIA: prev/next disabled state communicated via `aria-disabled` and native `disabled`; page indicator inside `aria-live="polite"` for screen-reader announcement on page change.
- R1 cache-key collision proof: Task 5's regression test mounts both `LatestEpisodes` and `Videos` in sequence and asserts each renders against its own cache slot (truncated 50 vs full 500).
- Phase 4 readiness: `PodcastSection.tsx` keeps its public API and visual layout; the extracted `<PodcastSubscribeStrip>` is additive, so Phase 4 (Fan Engagement) can extend PodcastSection patterns without conflict.
</success_criteria>

<output>
After completion, create `.planning/phases/03-podcast-and-youtube-discovery/03-01-SUMMARY.md` per the standard summary template, recording:
- Files created / modified (final list)
- Path taken for shadcn pagination primitive (CLI add vs hand-roll fallback)
- Whether the LatestShorts tabnabbing fix landed cleanly (defense-in-depth bonus)
- Confirmation that DEBT-02 and DEBT-04 verify steps reported zero failures
- Confirmation that the R1 cache-key regression test green (proves Videos.tsx does not inherit LatestEpisodes' truncated cache)
- Open Questions resolved (6 — see <objective>) and matching RESEARCH.md back-edits
- Manual checkpoint outcomes from Task 10 (deployed-URL spot check)
- Phase 4 hand-off notes: confirm `PodcastSection.tsx` public props + visual unchanged; `<PodcastSubscribeStrip>` is the canonical reuse path for the platform-button row going forward
</output>
