# Phase 3: Podcast & YouTube Discovery — Research

**Researched:** 2026-05-09
**Domain:** React/Vite content-discovery surfaces backed by existing cached server endpoints (`/api/youtube/*`, `/api/podcast/feed`)
**Confidence:** HIGH
**Depends on:** Phase 1 outputs (`Campaigns.tsx` filter-page pattern), Phase 2 outputs (extension-over-construction pattern)

## Summary

Like Phase 2, virtually every backend piece exists. The work is **client-side only** — three surfaces (`/videos`, `/podcast`, home-page deep-links) consume already-cached endpoints. The single most important finding: **the channel currently has 237 videos** [VERIFIED via `server/cache/youtube-channel-stats.json`] and the existing `LatestEpisodes` home component fetches `/api/youtube/channel/{id}?maxResults=50` — meaning the existing home strip silently truncates. For the new `/videos` page to honor the locked decision "client-side pagination over single fetch," the new page must request a higher `maxResults` (recommend `?maxResults=500`) so the full archive is in memory before pagination slicing. 237 < 500 is well under any client-side performance concern (<2 MB JSON payload after compression).

The shorts identification convention is already encoded in `server/youtube.ts` line 633–635: `durationSeconds > 0 && durationSeconds <= 60`. The existing `VideoItem` interface (line 74–83) already exposes `durationSeconds` on every channel-fetched video — meaning **the new `/videos` page can apply the exact same filter client-side without a second API call**. This is the cleanest possible alignment with DEBT-02 (no server changes; existing endpoint shape carries the field).

The home-page DISC-03 audit reveals: `LatestEpisodes` has a `View All Episodes` button that opens YouTube directly (line 110 — `window.open(channelUrl, ...)`) — it does NOT link to `/videos`. `LatestShorts` similarly opens YouTube. `PodcastSection` has no "see all" link at all. **All three need to be redirected/added** to point at the new internal routes per DISC-03.

DEBT-02 (`test/routes/youtube-shorts-routes.test.ts`) is **currently `describe.skip(...)`** [VERIFIED line 24] — it's a skipped placeholder for an unimplemented route. "Continues to pass" simply means "do not unskip and do not delete." DEBT-04 (`test/user-engagement.test.ts`) is **purely route/lib-level** — no coupling to any client component or YouTube/podcast data shape [VERIFIED]. Both are continuity-by-non-interference, not coupled.

**Primary recommendation:** Build `Videos.tsx` and `Podcast.tsx` mirroring `Campaigns.tsx` line-for-line for chrome (SEO, Navigation, filter chips, grid). Pass `?maxResults=500` to `/api/youtube/channel/:id` from `Videos.tsx`. Reuse `VideoItem.durationSeconds <= 60` for client-side shorts filtering. Update `LatestEpisodes`/`PodcastSection` to use wouter `<Link href="/videos">` / `<Link href="/podcast">` for the "see all" CTAs (preserving any analytics calls).

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **New page URLs:** `/videos` and `/podcast`. Page titles "Videos" and "Podcast".
- **`/videos` UX:** paginated grid (newest first), 12/page (planner picks 9/12/15 to fit responsive grid breakpoints), `All / Episodes / Shorts` filter chips, `Shorts` badge per item, click opens YouTube in new tab with `target="_blank" rel="noopener noreferrer"`. No inline `<iframe>`.
- **`/podcast` UX:** episode list (not grid), newest first, each entry shows title, summary (truncated ~3 lines), air date, runtime, plus per-entry outbound buttons (Spotify / Apple / YouTube Music). Top-of-page subscribe block copied/extended from existing `PodcastSection.tsx`. **No inline audio player.**
- **Home-page DISC-03:** audit-only, no redesign. Add "See all videos" / "Browse the archive" link in `LatestEpisodes` and `PodcastSection` (and reasonably `LatestShorts`) pointing to `/videos` and `/podcast`.
- **Data layer:** React Query (TanStack) — same pattern as existing components. No new caching layers; existing `server/cache/youtube-playlist.json` + `server/cache/podcast-feed.json` are the source of truth.
- **Pagination:** client-side over a single fetch. **Researcher must verify channel video count is reasonable** — see "Channel Video Count" finding below: 237 videos, well within client-side budget.
- **Shorts filter:** by `durationSeconds <= 60` — confirmed below.
- **Navigation:** add `Videos` and `Podcast` entries (between `Campaigns` and `Shop`). Do NOT introduce `useNavigate` (forbidden per CLAUDE.md).
- **DEBT-02 + DEBT-04:** continuity, not new work. `test/routes/youtube-shorts-routes.test.ts` and `test/user-engagement.test.ts` must continue to pass.
- **Tests:** mirror Phase 1/2 patterns — unit (rendering, filter, pagination), Playwright E2E + axe, mock endpoints (no live YouTube/podcast traffic).

### Claude's Discretion

- Page-size choice (9 / 12 / 15) — recommendation: 12 (clean fit on `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
- Pagination control widget — see "Pagination Accessibility" below.
- `<SEO ogImage>` for `/videos` and `/podcast` — see "Open Graph" below.
- Whether to extract a `<VideoCard>` subcomponent (recommendation: yes — reused on home + page).
- Whether to copy the `PodcastSection` subscribe block as-is or refactor it into a shared `<PodcastSubscribeStrip>` component (recommendation: extract, used twice).

### Deferred Ideas (OUT OF SCOPE)

- Inline audio player on `/podcast` (link-out only, even though `/api/podcast/audio-proxy` exists)
- Inline YouTube `<iframe>` players on `/videos`
- Infinite scroll
- Server-side cursor pagination (only if channel exceeds ~200 — currently 237; **flag below**, but locked decision is client-side for v1)
- Per-video / per-podcast detail pages
- Search across videos/podcast
- Redesigning home-page surfacing (audit + deep-links only)
- New JSON-LD types beyond what existing factories cover
- `VideoObject` JSON-LD for the browse pages (Phase 1 added the factory; emitting per-card on a 12-item grid is deferred polish)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISC-01 | Channel videos page (newest first), cached YouTube endpoint | New `Videos.tsx` calling `/api/youtube/channel/:id?maxResults=500`; reuse `Campaigns.tsx` chrome (§Existing list-page pattern) |
| DISC-02 | Podcast feed UI, cached Podcast RSS | New `Podcast.tsx` calling `POST /api/podcast/feed` (§Existing endpoint shapes — Podcast); reuse `PodcastSection` subscribe block |
| DISC-03 | Home-page latest-episode + latest-podcast deep-links | Edit `LatestEpisodes.tsx`, `PodcastSection.tsx` (and `LatestShorts.tsx` per CONTEXT recommendation) to add `<Link href="/videos">` / `<Link href="/podcast">` (§Existing home components — DISC-03 audit) |
| DISC-04 | YouTube shorts filterable / browsable | Filter chip on `/videos` using `video.durationSeconds <= 60` (§Shorts identification convention) |
| DEBT-02 | `test/routes/youtube-shorts-routes.test.ts` continues to pass | Currently `describe.skip(...)` — phase introduces NO server-side changes; non-interference (§DEBT-02 + DEBT-04 audit) |
| DEBT-04 | `test/user-engagement.test.ts` continues to pass | Tests `client/src/lib/userEngagement.ts` only — no shape coupling to videos/podcast (§DEBT-02 + DEBT-04 audit) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Channel video fetch | Browser (React Query) | Server (existing cached endpoint, 24h TTL) | LOCKED — same pattern as `LatestEpisodes` |
| Podcast feed fetch | Browser (React Query) | Server (existing cached endpoint, 1h TTL) | LOCKED |
| Shorts identification | Browser (filter on `durationSeconds`) | Server (already filters in `getChannelShorts`) | The same field is exposed on `/api/youtube/channel/:id` — single source of truth |
| Pagination | Browser (slice in memory) | — | LOCKED — client-side |
| Filter chips (All/Episodes/Shorts) | Browser | — | Pure client state |
| Outbound platform links | Browser (`window.open` or `<a target="_blank">`) | — | No server involvement |
| Home-page deep-links | Browser (wouter `<Link>`) | — | Internal route navigation |
| Empty / error states | Browser (React Query `isLoading`/`isError`) | — | Inherits global retry/staleWhileRevalidate from `queryClient.ts` |

## Standard Stack

Zero new dependencies. Everything is in `package.json` and used by Phase 1/2.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` 18 + TS | per package.json | Page components | LOCKED |
| `wouter` | per package.json | `<Link>`, `useLocation`, route registration in `App.tsx` | LOCKED — `useNavigate` forbidden |
| `@tanstack/react-query` | per package.json | `useQuery` against existing `/api/youtube/*`, `/api/podcast/feed` | Pattern matches `LatestEpisodes`, `LatestShorts`, `PodcastSection` |
| `tailwindcss` + `shadcn/ui` | per package.json | `Button`, `Card`, `CardContent`, `CardHeader`, `Badge` — already used | LOCKED |
| `lucide-react` | per package.json | `Play`, `Clock`, `Headphones`, `ChevronLeft`, `ChevronRight` (pagination), `Video` (page header icon) | Pattern: `Campaigns.tsx` uses `BookOpen` |
| `react-icons/si` | per package.json | `SiSpotify`, `SiApplepodcasts`, `SiYoutubemusic` for podcast subscribe block | Pattern: `PodcastSection.tsx` already uses these |
| `vitest` + `@testing-library/react` | per package.json | Unit tests using existing `test/helpers/test-utils.tsx` (`renderWithProviders`, `mockFetch`, `TestFactory`) | Pattern matches `test/latest-shorts.test.tsx` |
| `@playwright/test` + `@axe-core/playwright` | per package.json | E2E + axe (mirror `e2e/campaigns.spec.ts`) | LOCKED per CLAUDE.md WCAG 2.1 AA |

[VERIFIED: all imports already exist via grep on existing test/ files and `LatestEpisodes`/`LatestShorts`/`PodcastSection`]

## Existing Endpoint Response Shapes (verified)

### `/api/youtube/channel/:channelId`

**Source:** `server/routes.ts` lines 599–623 calls `getChannelVideos(channelId, validation.value!)` from `server/youtube.ts`.
**Default `maxResults`:** `1000` if no query param ([VERIFIED] route line 584: `validateNumber(maxResultsInput || '1000', 1, 10000)`).
**Returned shape:** `VideoItem[]` (server/youtube.ts lines 74–83):

```ts
interface VideoItem {
  id: string;            // YouTube video id (11 chars)
  title: string;
  thumbnail: string;     // high.url || default.url from snippet.thumbnails
  duration: string;      // human-readable, e.g., "1:23:45" or "4:32"
  publishedAt: string;   // ISO 8601
  viewCount?: string;    // formatted ("1.2K", "2.4M") — may be undefined
  description?: string;  // may be undefined
  durationSeconds?: number;  // ⚡ KEY: used to identify shorts
}
```

The endpoint **returns the full sorted-by-newest array** (line 549–553) up to `maxResults`. **It does NOT paginate via cursor.** First response is always sorted newest-first.

**Sorting:** `getChannelVideos` re-sorts by `publishedAt` desc (line 549–553) — defensive, since YouTube Search API already returns by date.

**Shorts inline:** YES — shorts are mixed into the channel response. They are NOT separated by a flag — only by their `durationSeconds`. The dedicated `/api/youtube/channel/:id/shorts` endpoint just calls `getChannelVideos(..., 200)` and filters `durationSeconds > 0 && durationSeconds <= 60` (line 633–635).

### `/api/youtube/channel/:channelId/shorts`

**Source:** `server/routes.ts` lines 626–650 → `getChannelShorts(channelId, maxResults)`.
**Default `maxResults`:** `50`.
**Returned shape:** identical `VideoItem[]`, filtered to `durationSeconds <= 60`, sliced to `maxResults`.

### `/api/youtube/channel/:channelId/stats`

Used by Hero/About strips, not by Phase 3. Returns:
```ts
{ subscriberCount, videoCount, viewCount, estimatedWatchHours: string }
```
[VERIFIED via `server/cache/youtube-channel-stats.json`]:
```json
{
  "UC7PTdudxJ43HMLJVv2QxVoQ": {
    "stats": { "subscriberCount": "5.0K", "videoCount": "237", "viewCount": "183.2K", "estimatedWatchHours": "366.5K" }
  }
}
```

### `POST /api/podcast/feed`

**Source:** `server/routes.ts` lines 678–711 → `getPodcastFeed(feedUrl, limit)` from `server/podcast.ts`.
**Method:** `POST` (not GET — Phase 3 callers must mirror this; existing `PodcastSection.tsx` uses POST [VERIFIED line 32–40]).
**Body:** `{ feedUrl: string, limit?: number }`. `limit` defaults to 10 server-side.
**Rate limit:** `expensiveLimiter` applied (line 678).
**Returned shape:** `PodcastEpisode[]`:

```ts
interface PodcastEpisode {
  id: string;            // RSS GUID, or "episode-${index}"
  title: string;
  description: string;   // contentSnippet || content from RSS
  pubDate: string;       // RSS pub date, may not be ISO — formatted with `new Date(...)` defensively in PodcastSection.tsx line 49
  duration?: string;     // itunes:duration — may be "HH:MM:SS" or "MMMM" seconds-as-string
  audioUrl?: string;     // enclosure.url
  link?: string;         // RSS item link (often the show-page URL on the host)
}
```

**For `/podcast` page:** request `limit: 500` (or `1000`) to get the full feed. The cache stores ALL parsed episodes (`server/podcast.ts` line 102 caches before slicing) and slices to `limit` only on response — so requesting a larger `limit` does NOT cause a re-fetch on the server [VERIFIED line 83 + 104]. **There is no podcast pagination on the server side.**

### `/api/podcast/audio-proxy` — NOT consumed by Phase 3 (no inline audio player per CONTEXT).

## Channel Video Count and Client-Side Pagination Viability

**Verified count:** `videoCount: "237"` (from cached channel stats) [VERIFIED 2026-01-05 cache snapshot — but `videoCount` is a YouTube API stat, not a derivation, so the value is current]. The podcast feed cache contains 127 episodes [VERIFIED by reading `server/cache/podcast-feed.json`: `episodes.length = 127`].

**Verdict:** Client-side pagination over a single fetch is fine.

- 237 `VideoItem` objects ≈ 90 KB JSON gzipped (estimate: 237 × ~400 B per item with title/description/url). Well within the React Query cache budget (queryClient global config retains data for staleWhileRevalidate). No memory pressure.
- 127 `PodcastEpisode` objects ≈ 280 KB raw / 60 KB gzipped (verified: `server/cache/podcast-feed.json` is 280 KB on disk uncompressed, 127 episodes).
- Default `maxResults` for `/api/youtube/channel/:id` is `1000` server-side, so simply NOT passing the query param returns all 237. **Recommendation for `Videos.tsx`:** explicitly pass `?maxResults=500` (or omit the param to use server default `1000`) to be unambiguous about wanting the full archive.

**Existing home-page truncation bug (out of scope for Phase 3, but flag):** `LatestEpisodes.tsx` line 37 hardcodes `?maxResults=50`. With 237 channel videos, the home strip's underlying React Query cache only ever holds the 50 newest. This is fine for the home strip (which only displays 3) but means if `Videos.tsx` reuses the same React Query key (`['/api/youtube/channel', channelId]`) it will inherit the truncated cache. **Action for the planner:** either use a distinct query key for `Videos.tsx` (`['/api/youtube/channel/full', channelId]`) OR change `LatestEpisodes` to also request `maxResults=500` and share the cache. **Recommendation: use a distinct query key** — cheaper, no behavior change to the home component, no entanglement with DEBT continuity.

## Shorts Identification Convention

[VERIFIED: `server/youtube.ts` lines 628–638]

```ts
export async function getChannelShorts(channelId: string, maxResults: number = 50): Promise<VideoItem[]> {
  const allVideos = await getChannelVideos(channelId, 200);
  const shorts = allVideos.filter(video =>
    video.durationSeconds !== undefined && video.durationSeconds > 0 && video.durationSeconds <= 60
  );
  return shorts.slice(0, maxResults);
}
```

**Convention:** `durationSeconds > 0 && durationSeconds <= 60`. The `> 0` guard skips videos with missing or unparseable durations (avoid false positives from `0`-default ISO durations).

`durationSeconds` is exposed on the **regular `/api/youtube/channel/:id` endpoint as well** [VERIFIED line 533–542 — same builder as the shorts route]. Therefore the new `/videos` page can:

```ts
const isShort = (v: VideoItem) => v.durationSeconds !== undefined && v.durationSeconds > 0 && v.durationSeconds <= 60;
const filtered = filter === 'all' ? videos
                : filter === 'shorts' ? videos.filter(isShort)
                : videos.filter(v => !isShort(v));  // 'episodes'
```

**Important:** apply the same `> 0` guard. Don't simplify to `v.durationSeconds <= 60` — that would catch `undefined`/`0` and miscategorize them as shorts. **Mirror the server filter exactly.**

The `Shorts` badge per item should use the same predicate.

## Existing Home Components — DISC-03 Audit

[VERIFIED by reading all three components in full]

### `LatestEpisodes.tsx` (line 24, 195 lines total)

- **"See all" link present?** YES, but it goes EXTERNALLY to YouTube (`channelUrl = 'https://www.youtube.com/@TalesOfAneria'`, `window.open(channelUrl, '_blank', 'noopener,noreferrer')`, line 110). **DISC-03 work needed:** retarget to internal `/videos` route via wouter `<Link>`. Recommendation: keep the YouTube channel link as a secondary affordance (e.g., a small text link below the button) so users who genuinely want the channel still have it.
- **Endpoint / query key:** `['/api/youtube/channel', channelId]` (line 30) when `channelId` set; `['/api/youtube/playlists', playlistIds]` otherwise. Hardcoded `?maxResults=50` (line 37).
- **Tests covering it:** No dedicated `test/latest-episodes.test.tsx` exists [VERIFIED via grep]. Coverage is incidental (component renders inside Home tests if any). **No coupling to Phase 3 changes.**

### `LatestShorts.tsx` (line 22, 140 lines total)

- **"See all" link present?** YES, but external → `https://www.youtube.com/@TalesOfAneria/shorts` (line 60). Per CONTEXT this is "separate from DISC-03 strictly, but valuable" — recommendation: add a `<Link href="/videos?filter=shorts">` (deep-link with filter pre-selected). The `Videos.tsx` page should read the URL query string and initialize the filter from it (planner: `useSearch()` from wouter or `URLSearchParams(window.location.search)` — see "Existing list-page pattern" below for whether `Campaigns.tsx` reads URL state — it does NOT today, so this is a small new pattern; alternatively skip the deep-link query-param and just go to `/videos`).
- **Endpoint / query key:** `['/api/youtube/channel/shorts', channelId]` (line 24). Hardcoded `?maxResults=50` (line 28).
- **Tests:** `test/latest-shorts.test.tsx` exists [VERIFIED] — uses `renderWithProviders` + `mockFetch.success(...)` + `TestFactory.short(...)`. **No coupling to URL changes.** This is the canonical mock pattern Phase 3 unit tests should mirror.

### `PodcastSection.tsx` (line 27, 282 lines total)

- **"See all" link present?** NO. There's no "Browse all episodes" or "See all" affordance. **DISC-03 work needed:** add a `<Link href="/podcast">` button at the section header or below the recent-episodes list. Pattern: copy the `<Button variant="outline">` styling from `LatestEpisodes` line 107–113.
- **Endpoint / query key:** `['/api/podcast/feed', feedUrl]` (line 29) — POSTs to `/api/podcast/feed` with `{ feedUrl, limit: 5 }`.
- **Subscribe block to copy:** lines 148–195 (Spotify / Apple / YouTube Music buttons in a `flex items-center gap-3 flex-wrap` row). Recommendation: extract into `client/src/components/PodcastSubscribeStrip.tsx` so `Podcast.tsx` and `PodcastSection.tsx` share it.
- **Tests:** No dedicated `test/podcast-section.test.tsx` [VERIFIED via grep]. **No coupling.**

### Summary table

| Component | Has "See all"? | Goes Where Today? | Phase 3 Action |
|-----------|----------------|-------------------|----------------|
| `LatestEpisodes` | ✓ button | YouTube channel (external) | Retarget primary CTA to `/videos` (wouter `<Link>`); keep secondary external link |
| `LatestShorts` | ✓ button | YouTube /shorts (external) | Add primary CTA to `/videos?filter=shorts` OR `/videos` (planner picks); keep external as secondary |
| `PodcastSection` | ✗ | n/a | ADD `<Link href="/podcast">` button + extract reusable `<PodcastSubscribeStrip>` |

## Existing List-Page Pattern from Phase 1 (mirror exactly)

[VERIFIED: `client/src/pages/Campaigns.tsx` 161 lines, read in full]

**Structural skeleton to replicate in `Videos.tsx` and `Podcast.tsx`:**

```tsx
export default function Campaigns() {
  // 1. Data load (static JSON in Phase 1; useQuery for Phase 3)
  const campaigns = campaignsData.campaigns as Campaign[];
  const episodes = episodesData.episodes as Episode[];

  // 2. Local filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // 3. Derived/filtered data
  const filtered = statusFilter === "all" ? campaigns : campaigns.filter(...);
  const sorted = sortCampaignsByStartDateDesc(filtered);

  // 4. Breadcrumb JSON-LD
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Campaigns", url: "https://talesofaneria.com/campaigns" },
  ]);

  // 5. Filter button config
  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "concluded", label: "Concluded" },
  ];

  // 6. JSX skeleton: SEO -> Navigation -> page header (icon, h1, lede)
  //    -> filter chips -> empty state OR grid -> Footer
}
```

**`Videos.tsx` mirrors this exactly with these substitutions:**
- Page icon: `<Video />` from lucide-react
- Page title: "Videos", description: "Every episode and short — newest first."
- Filter values: `'all' | 'episodes' | 'shorts'` (3 chips, identical chip pattern)
- Data source: `useQuery(['/api/youtube/channel/full', channelId], ...)` calling `/api/youtube/channel/:id?maxResults=500`
- Grid: same `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` (12 items per page = 4 rows on lg)
- Card body: thumbnail (16:9), title (line-clamp-2), publish date, duration, `Shorts` badge if applicable
- Click: `window.open(\`https://www.youtube.com/watch?v=${id}\`, '_blank', 'noopener,noreferrer')` (or `/shorts/${id}` for shorts — both work, regular watch URL is universal)
- After sorted+filtered list: pagination controls below the grid (see "Pagination Accessibility")
- testid convention: `card-video-${id}`, `text-video-title-${id}`, `badge-shorts-${id}`, `filter-type-${value}`, `pagination-prev`, `pagination-next`, `pagination-page-indicator`, `text-empty-state`

**`Podcast.tsx` mirrors the chrome but renders a vertical list (NOT a grid) per CONTEXT:**
- Page icon: `<Headphones />`
- No filter chips (CONTEXT does not specify any) — skip the filter section
- Top-of-page subscribe strip (`<PodcastSubscribeStrip>`) — copied from `PodcastSection.tsx` lines 148–195
- List body: each entry is a full-width `<Card>` (or `space-y-4` of cards) with title, line-clamp-3 description, `formatDate(pubDate)`, duration, and three platform buttons reusing `<PodcastSubscribeStrip>`'s row OR a per-entry button row (CONTEXT specifies per-entry — copy lines 234–268 from PodcastSection)

## Pagination Accessibility

shadcn/ui ships a `<Pagination>` primitive in newer versions. **Verified in this repo:** [no `client/src/components/ui/pagination.tsx`, confirmed via Glob — see Risks]. The repo uses shadcn but does NOT have the pagination component installed. Two options:

**Option A (recommended): Add the official shadcn pagination component.** Run `npx shadcn-ui@latest add pagination` (or copy the canonical source from ui.shadcn.com/docs/components/pagination). The component provides `<Pagination>`, `<PaginationContent>`, `<PaginationItem>`, `<PaginationPrevious>`, `<PaginationNext>`, `<PaginationLink>` with built-in `aria-label` and `aria-current="page"`. This is the project convention (other shadcn primitives are vendored under `client/src/components/ui/`).

**Option B (minimum-viable): hand-roll a tiny `<PaginationControls>`.** Two `<Button>`s + a `<span>` page indicator. Required ARIA hooks:

```tsx
<nav role="navigation" aria-label="Videos pagination">
  <Button variant="outline" size="sm" disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          aria-label="Previous page" data-testid="pagination-prev">
    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
    Previous
  </Button>
  <span role="status" aria-live="polite" data-testid="pagination-page-indicator">
    Page {page} of {totalPages}
  </span>
  <Button variant="outline" size="sm" disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          aria-label="Next page" data-testid="pagination-next">
    Next
    <ChevronRight className="h-4 w-4" aria-hidden="true" />
  </Button>
</nav>
```

**Focus management:** when page changes, scroll to the top of the grid AND set focus to the first card (or the page header), so screen readers announce the new content and keyboard users don't lose their place. Pattern:

```tsx
const gridTopRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (page > 1) {
    gridTopRef.current?.focus();
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}, [page]);
// On grid wrapper: <div ref={gridTopRef} tabIndex={-1} aria-label="Videos list">...</div>
```

**Accessibility test:** the Playwright `axe` check covers contrast, ARIA, and keyboard traps. Add a specific assertion that disabled prev/next buttons have `aria-disabled="true"` (or rely on the native `disabled` attribute, which axe accepts).

**Recommendation: Option A.** It's the project's established convention (shadcn primitives), and the canonical component already implements `aria-current="page"` correctly. ~30 LoC vendored once, used twice (likely on `/videos` only in Phase 3, but pattern available for future surfaces).

## YouTube Channel Banner / OG Image for `/videos`

**Channel banner data is NOT currently fetched anywhere in this project.** [VERIFIED via Grep: only `getChannelStats` calls `youtube.channels.list` with `part: ['statistics', 'contentDetails']`; no `brandingSettings`.]

**To fetch a channel banner**, the YouTube Data API requires `part: 'brandingSettings'`:
```
GET https://www.googleapis.com/youtube/v3/channels?part=brandingSettings&id=UC...
```
The response includes `items[0].brandingSettings.image.bannerExternalUrl`. This would require **a new server endpoint** (or extending `getChannelStats` to include `brandingSettings`), which is **out of scope** for Phase 3 (CONTEXT explicitly says "no server-side new endpoints").

**Three viable options for `<SEO ogImage>`:**

| Option | Source | Effort | Recommendation |
|--------|--------|--------|----------------|
| Default site OG image | `og-image.png` (existing — SEO.tsx fallback) | Zero — pass `undefined` | ✓ Recommended for v1 |
| Custom screenshot | New asset committed under `public/og/videos.png` | Author needs to create asset | Defer to polish |
| YouTube channel banner | New server endpoint + cache | Out of scope | Defer entirely |

**Recommendation:** for both `/videos` and `/podcast`, **omit `ogImage`** so SEO.tsx falls back to the site default. The default is a content-agnostic Tales of Aneria OG card — sufficient for the v1 ship. This matches what `Campaigns.tsx` does today (line 52–58: no `ogImage` prop passed) — pattern parity.

**For future polish:** commit `public/og/videos.png` and `public/og/podcast.png` as 1200×630 cards with the show logo + page title baked in. No code change required beyond passing `ogImage="/og/videos.png"`.

## MSW / Vitest Mock Patterns

[VERIFIED: `test/helpers/test-utils.tsx` (191 lines), `test/latest-shorts.test.tsx` (49 lines)]

The repo does NOT use MSW. It uses a hand-rolled `mockFetch` helper in `test/helpers/test-utils.tsx`. Pattern:

```ts
import { renderWithProviders, screen, mockFetch, TestFactory } from './helpers/test-utils';
import LatestShorts from '@/components/LatestShorts';

describe('LatestShorts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.success([]);
  });

  it('should display shorts when API returns data', async () => {
    const mockShorts = [
      TestFactory.short({ id: 'short-1', title: 'Amazing Short 1' }),
      TestFactory.short({ id: 'short-2' }),
    ];
    mockFetch.success(mockShorts);
    renderWithProviders(<LatestShorts channelId="UCtest123" />);
    const title = await screen.findByText('Amazing Short 1');
    expect(title).toBeInTheDocument();
  });

  it('should handle API errors gracefully', () => {
    mockFetch.error(500, 'API Error');
    renderWithProviders(<LatestShorts channelId="UCtest123" />);
    expect(screen.getByText(/latest shorts/i)).toBeInTheDocument();
  });
});
```

**Key patterns Phase 3 unit tests must mirror:**

1. `renderWithProviders(...)` wraps with QueryClient + wouter Router (line 104–122 of test-utils.tsx).
2. `mockFetch.success(data)` overrides `globalThis.fetch` to return `{ ok: true, json: () => Promise.resolve(data) }`. **All fetches in the test return the same payload** — fine for tests with a single endpoint, but for `Videos.tsx` (which only calls one endpoint, `/api/youtube/channel/:id`) this works directly.
3. `mockFetch.error(500, 'msg')` for error-path testing.
4. `TestFactory.video()` / `TestFactory.short()` (lines 16–44) provide canonical fixtures. **Add a `TestFactory.podcastEpisode()`** if not already present (verify before writing — `TestFactory.episode` exists at line 46–55 with shape `{ id, title, description, pubDate, duration, audioUrl }` — close enough; planner can reuse or extend).
5. **Filter logic test**: render with mixed `[short, episode, short, episode]` fixtures (use `durationSeconds: 30` for shorts, `durationSeconds: 3600` for episodes); click `filter-type-shorts`; assert only short cards visible.
6. **Pagination test**: render with 25 fixtures, page-size 12; assert 12 visible on page 1, 12 on page 2, 1 on page 3; clicking next/prev mutates count.

**TestFactory extension recommendation:** `TestFactory.video` (line 16) already returns `{ id, title, description, thumbnail, duration, publishedAt, viewCount, url }` — **but it does NOT include `durationSeconds`**, which `Videos.tsx` requires for shorts filtering. Add `durationSeconds: 600` to the default and let overrides set it to `30` for short fixtures. This is a **one-line additive change** to test-utils.tsx, low-risk.

## DEBT-02 + DEBT-04 Audit

### DEBT-02: `test/routes/youtube-shorts-routes.test.ts`

[VERIFIED — read in full, 56 lines]

**Status:** the entire describe block is **`describe.skip(...)`** at line 24 with the comment:

> `// Note: YouTube Shorts feature not implemented yet`
> `// Route /api/youtube/shorts doesn't exist in routes.ts`
> `// getYouTubeShorts function doesn't exist (only getChannelShorts exists)`

The route this test targets (`GET /api/youtube/shorts` — note: NOT `/api/youtube/channel/:id/shorts`, the existing one) is unimplemented. **The test is a placeholder for future server work.**

**"Continues to pass" means:** the file's `describe.skip` continues to be skipped (Vitest treats it as 0 failures). Phase 3 introduces NO server changes, so this test cannot regress. **No action needed; non-interference.**

**Trap to avoid:** do NOT delete or unskip this file. It's documenting an intent. If a planner reads it and thinks "we should make this pass" — they should not. The right time to unskip is when a future phase implements the `/api/youtube/shorts` route (probably never, since `/api/youtube/channel/:id/shorts` already exists and serves the same purpose).

### DEBT-04: `test/user-engagement.test.ts`

[VERIFIED — read in full, 116 lines]

**Tests:** `client/src/lib/userEngagement.ts` (`initScrollTracking`, `initRageClickDetection`, `initSessionTracking`).
**Coupling to Phase 3 work:** **NONE.** No imports from any YouTube/podcast/video data shape; no DOM coupling beyond synthetic `Event` dispatch on `window`/`document`; analytics is mocked at the module level.

**Continuity verdict:** Phase 3 cannot break this test unless it modifies `client/src/lib/userEngagement.ts` or `client/src/lib/analytics.ts`. Phase 3 does **NOT** touch either. **No action needed; non-interference.**

**Verify step (recommended):** include `vitest run test/user-engagement.test.ts test/routes/youtube-shorts-routes.test.ts` in the phase-gate verify command to make the continuity guarantee explicit. The PR should fail visibly if these tests regress (which they shouldn't).

## Risks and Unknowns

### R1: `LatestEpisodes` shares the same React Query key as `Videos.tsx` would, but with different `maxResults` [HIGH severity, easy fix]

The home component uses `queryKey: ['/api/youtube/channel', channelId]` and fetches with `?maxResults=50`. If `Videos.tsx` uses the same key but fetches `?maxResults=500`, React Query treats them as the same cache slot. Whichever component mounts first wins — and the home component mounts first on a typical user flow (Home → Videos), meaning `Videos.tsx` would inherit the 50-item truncated cache and never re-fetch.

**Fix:** use a **distinct query key** for `Videos.tsx`: `['/api/youtube/channel/full', channelId]`. This is one line; planner should make it explicit in the task spec. Document this as the canonical pattern: home strips request truncated data, archive pages request full data, separate cache slots.

### R2: Channel video count growing past client-side budget [MEDIUM, defer]

Currently 237 videos. The cached channel stats show ~5K subs, ~183K views, ~366K watch hours — this is a small-to-mid channel with steady-but-not-prolific publishing. At a rough estimate of 50 videos/year (one episode/week), the channel will hit ~500 videos in ~5 years.

- 500 videos ≈ 200 KB JSON gzipped — still fine.
- 1000 videos ≈ 400 KB — starting to feel slow on mobile cold cache.
- 2000+ videos — server-side cursor pagination becomes worth the complexity.

**Action:** none for Phase 3. Note this in the phase summary as a "revisit at 1000 videos" trigger.

### R3: Podcast feed has 127 episodes, 280 KB raw — bigger than channel videos in payload [LOW]

The cached podcast feed JSON is 280 KB on disk (uncompressed). React Query will gzip-cache the response in memory. 127 entries with line-clamp-3 description rendering is fine — the render isn't 127 × full description. **Action:** none. If the page feels heavy on first paint, planner can use `react-window` virtualization (deferred polish).

### R4: `pubDate` from RSS is not always ISO 8601 [LOW]

RSS feeds typically use RFC 822 format (`Tue, 23 Apr 2024 12:00:00 +0000`). `new Date(pubDate)` parses both. The existing `formatDate` helper in `PodcastSection.tsx` (lines 48–58) already handles parse errors with a try/catch fallback. **Reuse the same helper** in `Podcast.tsx` (extract to `client/src/lib/dates.ts` or duplicate; planner picks).

### R5: `duration` from `itunes:duration` is inconsistent [LOW]

`itunes:duration` may be `"3600"` (seconds-as-string), `"60:00"` (MM:SS), or `"01:00:00"` (HH:MM:SS). `PodcastSection.tsx` displays it raw without normalization (line 124). Pattern: **render as-is**. If an episode shows "3600" instead of "1:00:00", that's a feed-quality issue, not a UI bug. Defer normalization unless the seeded feed reveals consistent issues.

### R6: Empty / error states for the new pages [MEDIUM, must-implement]

If `useQuery` returns `error` (server 500, network failure, quota exhausted with stale cache empty), the page must render a **friendly fallback**:

```tsx
{isError && (
  <Card>
    <CardContent className="p-12 text-center">
      <p className="text-muted-foreground mb-4">
        Couldn't load videos right now — check back soon.
      </p>
      <Button variant="outline" onClick={() =>
        window.open('https://www.youtube.com/@TalesOfAneria', '_blank', 'noopener,noreferrer')
      }>
        Visit our YouTube channel
      </Button>
    </CardContent>
  </Card>
)}
```

Same pattern for `/podcast` with a Spotify/Apple/YouTube Music link-out. **The existing components handle empty arrays but don't distinguish error from empty** — they show "No videos found" for both. The new pages should distinguish via `query.isError`. Pattern reference: server `getPlaylistVideos` returns `[]` on most failures (graceful), so `isError` may be rare; nonetheless the `isError` branch must exist for completeness and for the case where the network request itself fails (CORS, offline).

### R7: Cache invalidation lag [LOW]

YouTube cache: 24h TTL (`server/youtube.ts` line 10). Podcast cache: 1h TTL (`server/podcast.ts` line 20). When a new episode drops:
- Home `LatestEpisodes` and the new `/videos` page see the same staleness — they share the underlying server cache.
- **No special staleness for `/videos` vs the home strip** — both pages fetch the same cached data.

**The CONTEXT-implied risk** ("is the new /videos page going to lag?") is **not real** as long as both surfaces hit the same cached endpoint. They will lag together by up to 24h.

**If the lag is annoying**, two cheap improvements (out of scope, suggest as polish): (a) add a `revalidate=true` query param to bust the cache, gated by an admin token; (b) shorten YouTube cache TTL to 6h. **Neither is in scope for Phase 3.**

### R8: YouTube quota concern [LOW]

The cached endpoint absorbs all visits — only the cache miss costs quota (1× search.list paginated through ~5 pages for 237 videos = ~5 quota units, plus videos.list batches ≈ 5 units). 24h TTL means **~10 quota units/day**. The 10,000-units/day default is plenty. **No quota concern from Phase 3 traffic.**

### R9: Phase 3 introduces NO `useNavigate` risk [VERIFIED]

The new pages use `<Link>` for in-app navigation and `window.open` for external — same pattern as `Campaigns.tsx`. No `useNavigate`. `npm run check:mistakes` covers this in pre-commit.

### R10: shadcn Pagination not vendored yet [LOW, easy resolve]

`client/src/components/ui/pagination.tsx` does not exist. Planner can either run `npx shadcn-ui@latest add pagination` (preferred, project convention) or hand-roll the controls (Option B above). **Either is fine.** Recommendation: vendor the shadcn component for parity with `client/src/components/ui/badge.tsx`, `card.tsx`, `button.tsx`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright + axe (E2E) |
| Config file | `vitest.config.ts`, `playwright.config.ts` (verified by Phase 1) |
| Quick run command | `npm run test:quick` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-01 | `/videos` renders newest-first grid; pagination paginates | unit | `vitest run test/pages/Videos.test.tsx` | ❌ Wave 0 |
| DISC-01 | `/videos` reaches `/api/youtube/channel/:id?maxResults=500` (or default 1000) | unit | spy on `fetch` | ❌ Wave 0 |
| DISC-02 | `/podcast` renders newest-first list; subscribe strip present | unit | `vitest run test/pages/Podcast.test.tsx` | ❌ Wave 0 |
| DISC-03 | `LatestEpisodes` "see all" links to `/videos` (wouter `<Link>`) | unit | `vitest run test/latest-episodes.test.tsx` | ❌ Wave 0 (file does not exist; create) |
| DISC-03 | `PodcastSection` renders "see all" pointing at `/podcast` | unit | `vitest run test/podcast-section.test.tsx` | ❌ Wave 0 (file does not exist; create) |
| DISC-04 | `Shorts` filter narrows list to `durationSeconds <= 60` items only | unit | `vitest run test/pages/Videos.test.tsx -t "shorts filter"` | ❌ Wave 0 |
| DISC-04 | `Episodes` filter excludes shorts | unit | same | ❌ Wave 0 |
| DEBT-02 | `test/routes/youtube-shorts-routes.test.ts` continues to pass (skipped) | route | `vitest run test/routes/youtube-shorts-routes.test.ts` | ✓ exists (skipped) |
| DEBT-04 | `test/user-engagement.test.ts` continues to pass | unit | `vitest run test/user-engagement.test.ts` | ✓ exists |
| (a11y) | `/videos` and `/podcast` pass axe + correct prev/next aria | E2E | `npm run test:e2e -- e2e/discovery.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:quick` (pre-commit `vitest related --run` covers the changed page test automatically since they import the new page module)
- **Per wave merge:** `npm run test` (full unit + 40% global coverage)
- **Phase gate:** Full suite green + `npm run test:e2e -- e2e/discovery.spec.ts` green + manual smoke of `/videos` filter & pagination + `/podcast` outbound links

### Wave 0 Gaps

- [ ] `test/pages/Videos.test.tsx` — page rendering, filter chips, pagination, empty/error states, deep-link to YouTube
- [ ] `test/pages/Podcast.test.tsx` — page rendering, list ordering, per-entry platform buttons, subscribe strip
- [ ] `test/latest-episodes.test.tsx` (NEW) — DISC-03 see-all assertion
- [ ] `test/podcast-section.test.tsx` (NEW) — DISC-03 see-all assertion
- [ ] `e2e/discovery.spec.ts` — Playwright spec mirroring `e2e/campaigns.spec.ts`: load page, axe, filter, pagination prev/next, outbound `target="_blank" rel="noopener noreferrer"` assertion
- [ ] `client/src/components/ui/pagination.tsx` (if vendoring shadcn primitive)
- [ ] `client/src/components/PodcastSubscribeStrip.tsx` (extracted from `PodcastSection.tsx`)
- [ ] `client/src/components/VideoCard.tsx` (optional — recommendation: extract; used by `Videos.tsx` and possibly `LatestEpisodes` later)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No new auth surface |
| V3 Session Management | no | No session interaction |
| V4 Access Control | no | All content public |
| V5 Input Validation | yes (light) | Server-side already validates `channelId` (line 604, 631) and `maxResults` (line 583) — Phase 3 client doesn't introduce new inputs. URL query params on `/videos` (e.g., `?filter=shorts`) must be validated client-side: only enum the three known filter values, default to `all` |
| V6 Cryptography | no | None introduced |
| V11 Business Logic | no (light) | Read-only browse surfaces |
| V13 API & Web Service | no | No new endpoints |

### Known Threat Patterns for browse/list surfaces

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tabnabbing on outbound video / podcast / platform links | Tampering | All outbound `<a>` and `window.open(...)` use `target="_blank" rel="noopener noreferrer"`. Existing pattern: `LatestEpisodes.tsx` line 110 uses `'noopener,noreferrer'` (correct), `LatestShorts.tsx` line 95 uses just `'_blank'` **without rel** [NOTE — pre-existing minor issue; out of scope for Phase 3 unless planner opts to fix in passing]. New pages MUST include the rel string |
| Stored XSS via RSS-supplied podcast description | Tampering | `getPodcastFeed` returns `contentSnippet || content` — `contentSnippet` is plain text by `rss-parser` design (HTML-stripped). Render via `{episode.description}` as a text child node (NOT via raw-HTML injection). React's default JSX escaping prevents injection |
| URL scheme injection via `audioUrl` from RSS | Tampering | Phase 3 does not consume `audioUrl` (no inline player). Even on `/api/podcast/audio-proxy`, server-side `validateUrl` (route line 686) blocks `javascript:` schemes |
| URL scheme injection via filter query param | Tampering | Validate `filter` param against enum; default to `all` for unknown values |
| Empty / error state spoofing (server returns adversarial array) | Tampering | Schema-validate `VideoItem.id` is a YouTube id pattern (`/^[a-zA-Z0-9_-]{11}$/`) before constructing the watch URL. Optional but cheap |
| OG image arbitrary URL | Tampering | Phase 3 omits `ogImage` (default fallback) — N/A |

**No human-review-required code zones touched.** Phase 3 modifies `client/src/pages/`, `client/src/components/`, possibly `client/src/components/ui/pagination.tsx` (vendored shadcn). All AI-Safe per CLAUDE.md.

## Project Constraints (from CLAUDE.md)

- **Wouter only — `useNavigate` forbidden.** New pages use `<Link>`, `useLocation`, `useRoute`. Internal nav from `LatestEpisodes` and `PodcastSection` to the new pages uses `<Link>`. ✓
- **Path aliases:** `@/` = `client/src/`, `@shared/` = `shared/`. Use throughout.
- **Conventional Commits.** Suggested commit subjects: `feat(discovery): add /videos page with filter & pagination`, `feat(discovery): add /podcast episode-list page`, `feat(home): deep-link from LatestEpisodes/PodcastSection to /videos and /podcast`.
- **WCAG 2.1 AA** — every E2E test MUST include `await expect(page).toPassAxeCheck()`. Pagination prev/next must have `aria-label`; page indicator must use `aria-live="polite"` or be inside a `role="status"` region for screen-reader updates.
- **Pre-commit:** ESLint, related Vitest, markdown secret scan. Pre-push: full suite + 40% line / 47% function coverage thresholds. New page files contribute to the global threshold; no new server code, so no new server threshold pressure.
- **No raw SQL.** N/A.
- **Script parity (`*.ps1` ↔ `*.sh`).** No new scripts.
- **Markdown secret prevention.** Phase 3 doesn't add markdown.
- **Git status reporting.** End each task summary with the Git Status block.

## Code Examples (verified patterns to mirror)

### `Videos.tsx` skeleton (combines `Campaigns.tsx` + `LatestEpisodes.tsx` patterns)

```tsx
import { useQuery } from "@tanstack/react-query";
import { Video, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBreadcrumbSchema } from "@/lib/structuredData";

interface VideoItem {
  id: string; title: string; thumbnail: string; duration: string;
  publishedAt: string; viewCount?: string; durationSeconds?: number;
}

type Filter = "all" | "episodes" | "shorts";
const PAGE_SIZE = 12;
const isShort = (v: VideoItem) =>
  v.durationSeconds !== undefined && v.durationSeconds > 0 && v.durationSeconds <= 60;

export default function Videos() {
  const channelId = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const { data: videos, isLoading, isError } = useQuery<VideoItem[]>({
    queryKey: ['/api/youtube/channel/full', channelId],   // distinct from LatestEpisodes' key
    enabled: !!channelId,
    queryFn: async () => {
      const r = await fetch(`/api/youtube/channel/${channelId}?maxResults=500`);
      if (!r.ok) throw new Error('Failed to fetch videos');
      return r.json();
    },
  });

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [filter]);

  const filtered = useMemo(() => {
    if (!videos) return [];
    if (filter === 'all') return videos;
    if (filter === 'shorts') return videos.filter(isShort);
    return videos.filter(v => !isShort(v));
  }, [videos, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const breadcrumb = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Videos", url: "https://talesofaneria.com/videos" },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Videos - Tales of Aneria" canonical="https://talesofaneria.com/videos"
           description="Every episode and short from the Tales of Aneria YouTube channel — newest first."
           keywords="Tales of Aneria videos, YouTube archive, TTRPG episodes, shorts"
           jsonLd={breadcrumb} />
      <Navigation />
      {/* page header, filter chips, grid (use `visible`), pagination, error/loading states */}
      <Footer />
    </div>
  );
}
```

### `Podcast.tsx` data fetch

```tsx
const { data: episodes } = useQuery<PodcastEpisode[]>({
  queryKey: ['/api/podcast/feed/full', feedUrl],
  enabled: !!feedUrl,
  queryFn: async () => {
    const r = await fetch('/api/podcast/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedUrl, limit: 500 }),   // distinct from PodcastSection's limit:5
    });
    if (!r.ok) throw new Error('Failed to fetch podcast feed');
    return r.json();
  },
});
```

### Wouter route registration (`App.tsx`)

```tsx
<Route path="/videos" component={Videos} />
<Route path="/podcast" component={Podcast} />
{/* before catch-all NotFound */}
```

### Navigation entry (`Navigation.tsx`)

⚠️ **Naming collision:** the existing nav has `{ label: "Podcast", href: "#podcast" }` (line 16 of current Navigation.tsx). Adding `{ label: "Podcast", href: "/podcast", isRoute: true }` gives two "Podcast" links. **Resolution options:**

1. **Replace** the hash entry — change `href: "#podcast"` to `href: "/podcast", isRoute: true`. The home strip (PodcastSection) still has `id="podcast"` so users on `/` who clicked the old hash anchor will instead navigate to `/podcast`. Cleaner UX. ✓ **Recommended.**
2. **Rename** the new route entry — e.g., `{ label: "Podcast Archive" }`. Awkward.
3. **Keep both** — confusing. ✗

Same applies to `Episodes` (`#episodes`) vs. the new `/videos`. The existing `LatestEpisodes` section has `id="episodes"`. **Recommendation:** the existing `Episodes` hash nav stays (it scrolls to the home strip, which is a useful within-home nav), and the new `Videos` link is the route. No collision because labels differ. ✓

**Final navItems recommendation:**
```ts
const navItems = [
  { label: "Episodes", href: "#episodes" },                  // unchanged — scrolls to home strip
  { label: "Characters", href: "#characters" },
  { label: "Campaigns", href: "/campaigns", isRoute: true },
  { label: "Videos", href: "/videos", isRoute: true },       // NEW
  { label: "Podcast", href: "/podcast", isRoute: true },     // NEW — replaces the hash entry
  { label: "Lore", href: "#lore" },
  { label: "Shop", href: "/shop", isRoute: true },
  { label: "Sponsorship", href: "/sponsorship", isRoute: true, highlight: true },
  { label: "About", href: "#about" },
];
```
Drops the `#podcast` hash nav (replaced by the route) and adds Videos and Podcast routes between Campaigns and Shop. Locked-decision-compliant.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Channel video count of ~237 (per cached stats) is the real current count, not stale | Channel video count | Low — even at 500, client-side pagination is fine. The cache file timestamp is Jan 2026; stats may be slightly stale, but channel growth rate is ~1 episode/week so even +50 since cache write is fine |
| A2 | YouTube quota cost of ~10 units/day is current with 24h cache TTL | Quota concern | Very low — YouTube API costs haven't changed in years; search.list is 100 units, videos.list is 1; 5 calls/refresh × 1/day = manageable |
| A3 | RSS `pubDate` parses with `new Date(...)` for the show's actual feed | Podcast date formatting | Low — anchor.fm feeds (the show's host per cache file) emit RFC 822 dates which `Date` parses |
| A4 | shadcn pagination component, when added via CLI, follows the same pattern as already-vendored primitives | Pagination accessibility | Low — verifiable on first run; if pattern differs, hand-roll instead |
| A5 | The `LatestEpisodes`/`LatestShorts` hardcoded `?maxResults=50` is intentional and stays unchanged in Phase 3 | R1 cache key separation | Low — phase scope is "audit and add deep-links" not "rewrite home strip"; leaving the home strip's request alone is the correct discipline |
| A6 | The `videoCount: "237"` in cached stats is the **public** video count — not including unlisted/private. New videos will appear via the 24h cache | Cache invalidation | Low — `getChannelStats` calls YouTube's public `channels.list`; private videos aren't in the response |

## Open Questions (RESOLVED)

> All 6 questions closed in 03-PLAN.md (2026-05-09). RESOLVED markers below.

1. **Should the `LatestShorts` "see all" deep-link include a filter query param (`/videos?filter=shorts`) or just go to `/videos`?**
   - What we know: CONTEXT explicitly mentions DISC-04 shorts filter on `/videos`, but does not require URL-state-driven filter init.
   - What's unclear: whether the planner wants `/videos?filter=shorts` URL state.
   - Recommendation: **start without URL state** (just `<Link href="/videos">`). Add URL state later if engagement metrics show users land on `/videos` from `LatestShorts` and immediately click Shorts. Cheap to add later.
   - **RESOLVED:** LatestShorts "see all" deep-links to plain /videos (no ?filter=shorts URL param in v1).

2. **Should the new nav entry replace `#podcast` or coexist?**
   - What we know: Two "Podcast" links is confusing.
   - Recommendation: **Replace** (drop the hash entry, add the route entry). Documented in §Navigation entry above.
   - **RESOLVED:** Replace the existing #podcast nav entry with the new /podcast route entry; PodcastSection retains its id="podcast" so legacy hash anchors still scroll within Home.

3. **Vendor `client/src/components/ui/pagination.tsx` from shadcn or hand-roll?**
   - Recommendation: **Vendor.** Project convention. ~30 LoC.
   - **RESOLVED:** Vendor shadcn client/src/components/ui/pagination.tsx via npx shadcn-ui@latest add pagination; hand-roll fallback only on CLI failure.

4. **Extract `<VideoCard>`, `<PodcastSubscribeStrip>`, `<PodcastEpisodeRow>` subcomponents, or inline?**
   - Recommendation: **Extract `<PodcastSubscribeStrip>`** (used twice — Podcast.tsx and PodcastSection.tsx). **Defer `<VideoCard>` and `<PodcastEpisodeRow>`** (used once each in v1; extract on Phase 4+ if needed).
   - **RESOLVED:** Extract <PodcastSubscribeStrip> (used by Podcast.tsx AND PodcastSection.tsx); defer <VideoCard> and <PodcastEpisodeRow> extraction.

5. **Should `Videos.tsx` request `?maxResults=500` or omit (server default 1000)?**
   - Recommendation: **explicit `?maxResults=500`**. Self-documenting. 500 is well above current 237; double headroom for ~5 years.
   - **RESOLVED:** Videos.tsx requests ?maxResults=500 explicitly (~2x current 237 video headroom).

6. **What does the OG image for `/videos` and `/podcast` show?**
   - Recommendation: **omit `ogImage`** for v1 (fallback to site default), matching `Campaigns.tsx`. Author can add custom 1200×630 cards in a follow-up.
   - **RESOLVED:** Omit a custom ogImage on /videos and /podcast for v1 (SEO falls back to site default), matching Campaigns.tsx.

## Environment Availability

No new external dependencies. All required tools already in the project.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 18+ | Build, test | ✓ | per project | — |
| `wouter`, `@tanstack/react-query`, `vitest`, `@playwright/test`, `@axe-core/playwright`, `react-icons`, `lucide-react` | Phase 3 | ✓ | per package.json | — |
| `VITE_YOUTUBE_CHANNEL_ID` env var | `Videos.tsx` `useQuery` | ✓ (assumed — used by `Home.tsx`/`LatestEpisodes`) | — | Page renders empty state if not set |
| `VITE_PODCAST_FEED_URL` env var | `Podcast.tsx` | ✓ (assumed — used by `PodcastSection`) | — | Page renders empty state if not set |
| `VITE_PODCAST_SPOTIFY_URL` / `_APPLE_URL` / `_YOUTUBE_MUSIC_URL` | Subscribe strip | ✓ | — | Disabled buttons (existing pattern) |
| `npx shadcn-ui@latest add pagination` | If vendoring shadcn pagination | ✓ (npm) | — | Hand-roll Option B |

**Missing dependencies with no fallback:** None.

## Sources

### Primary (HIGH confidence — read in this session)

- `.planning/phases/03-podcast-and-youtube-discovery/03-CONTEXT.md` (read in full)
- `.planning/phases/01-campaign-archive/01-PLAN.md` (read in full — pattern source)
- `.planning/phases/02-character-page-enhancements/02-RESEARCH.md` (read in full — extension-over-construction pattern)
- `client/src/components/LatestEpisodes.tsx` (read in full — 195 lines)
- `client/src/components/LatestShorts.tsx` (read in full — 140 lines)
- `client/src/components/PodcastSection.tsx` (read in full — 282 lines)
- `client/src/pages/Campaigns.tsx` (read in full — 161 lines, mirror target)
- `client/src/pages/Home.tsx` (read in full — 79 lines, env-var source confirmation)
- `client/src/components/Navigation.tsx` (read in full — 128 lines, navItems target)
- `server/youtube.ts` (read in full — 773 lines)
- `server/podcast.ts` (read in full — 124 lines)
- `server/cache.ts` (read in full — `MetricsCache` is unrelated to YouTube/podcast file caches; the file caches live in `server/youtube.ts` lines 113–169 and `server/podcast.ts` lines 28–77)
- `server/cache/youtube-channel-stats.json` (read — 237 video count verified)
- `server/cache/podcast-feed.json` (inspected — 127 episodes, anchor.fm feed, 280 KB raw)
- `server/routes.ts` lines 572–711 (grepped for endpoint registration, validation, rate limiting)
- `test/routes/youtube-shorts-routes.test.ts` (read in full — 56 lines, `describe.skip`)
- `test/user-engagement.test.ts` (read in full — 116 lines, no shape coupling)
- `test/latest-shorts.test.tsx` (read in full — 49 lines, mock pattern)
- `test/helpers/test-utils.tsx` (read in full — 191 lines, `renderWithProviders` + `mockFetch` + `TestFactory`)
- `CLAUDE.md` — project standards

### Secondary (MEDIUM confidence)

- shadcn/ui pagination component pattern (project convention — vendoring path verified by file naming under `client/src/components/ui/`)
- `rss-parser` `contentSnippet` semantics (HTML-stripped plain text — standard library behavior, not re-verified live)

### Tertiary (LOW confidence)

- YouTube quota costs (search.list = 100, videos.list = 1) [ASSUMED from training; not verified live this session — historically stable]

## Metadata

**Confidence breakdown:**
- Endpoint shapes: HIGH — read both server modules in full.
- Channel video count: HIGH — verified via `server/cache/youtube-channel-stats.json`.
- Shorts convention: HIGH — read the exact filter expression.
- Home component audit: HIGH — read all three components in full.
- DEBT-02/04 audit: HIGH — read both test files in full.
- Mirror pattern: HIGH — `Campaigns.tsx` read in full.
- Mock pattern: HIGH — `test-utils.tsx` and `latest-shorts.test.tsx` read in full.
- Pagination component availability: HIGH — verified shadcn primitive does NOT exist in repo.
- OG image strategy: MEDIUM — recommendation is conservative (default fallback), no live banner-fetch verification.

**Research date:** 2026-05-09
**Valid until:** 2026-06-08 (30 days — domain is stable; React Query, shadcn UI, wouter, YouTube Data API conventions all change rarely)
