# Phase 1: Campaign Archive — Research

**Researched:** 2026-05-08
**Domain:** React/Vite content surface — static-data archive pages with JSON-LD SEO
**Confidence:** HIGH

## Summary

Phase 1 adds a campaign/episode archive on top of the existing static-JSON content pattern (`cast.json`, `characters.json`). All decisions for data shape, URL structure, and authoring workflow are LOCKED in CONTEXT.md, so this research focuses on the few discretionary areas: the JSON-LD schema choice, the build-time validation approach, and how to mirror the established `Characters.tsx` / `CharacterDetail.tsx` patterns precisely.

The codebase already has the integration points the planner needs: `client/src/lib/structuredData.ts` is a pure factory module trivially extended with new `@type` factories; `client/src/components/SEO.tsx` accepts an arbitrary `jsonLd` object and injects a single `<script type="application/ld+json">`; `App.tsx` registers wouter routes with `:param` syntax that supports nested paths; and `CharacterDetail.tsx` already demonstrates `useRoute("/characters/:id")` plus the `@graph` multi-schema injection pattern that campaign/episode pages should mirror.

**Primary recommendation:** Mirror the `Characters.tsx` + `CharacterDetail.tsx` shape exactly (same SEO + breadcrumb wrapper, same `@graph` JSON-LD bundle, same `Card`/`Badge` primitives), extend `structuredData.ts` with `getTVSeriesSchema` and `getTVEpisodeSchema` factories, and put a Zod schema in `shared/schema.ts` (reusing the project's existing Zod setup) that an existing or new Vitest test runs at build time to validate `campaigns.json` / `episodes.json` against. JSON-LD strategy: emit `TVSeries` for the campaign, and a `@graph` of `[TVEpisode, VideoObject, BreadcrumbList]` for episode pages — the `VideoObject` is the part Google actually consumes for rich results (per Google's Video structured data docs), so both must be present.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Data source:** static JSON files following `cast.json`/`characters.json` pattern. Two new files: `client/src/data/campaigns.json` and `client/src/data/episodes.json`. No DB schema changes. No admin UI in v1.
- **Campaign meaning:** narrative arc/saga (e.g., "The Forgotten Gods Saga"). Each has slug, display name, description, ordered cast member ids (from `cast.json`), ordered episodes, and `status: 'active' | 'concluded'`.
- **Episode shape:** manually authored entries with at minimum `id`, `campaignSlug`, `episodeNumber`, `title`, `summary`, `airDate` (ISO), `youtubeUrl`, optional `podcastUrl`. No auto-pull from YouTube; no render-time enrichment.
- **URL structure:** nested via wouter — `/campaigns`, `/campaigns/<slug>`, `/campaigns/<slug>/episodes/<episodeNumber>`. Episode identified by integer episodeNumber within campaign.
- **Surface naming:** "Campaigns". Page titles follow "Campaigns" / "<Campaign Name>" / "<Campaign Name> — Ep <N>: <Title>".
- **Index browsing:** chronological list (newest-active first), client-side `All / Active / Concluded` status filter; each list item shows name, summary, status badge, episode count.
- **Cast linkage:** campaign-level only. `cast: string[]` of cast ids from `cast.json`. No per-episode cast in v1.

### Claude's Discretion

- **JSON-LD schema choice:** exact `@type` for campaign and episode is delegated. CONTEXT suggests `TVSeries` + `TVEpisode` with embedded `VideoObject`. Must validate against Google Rich Results test.
- **Build-time validation strategy:** Zod / vite plugin / test-suite check — pick the lightest option that fails CI on a malformed entry.
- **Authoring workflow specifics** beyond "edit JSON, open PR".

### Deferred Ideas (OUT OF SCOPE)

- Per-episode cast appearances (Phase 2+).
- Admin UI for authoring.
- Auto-pull from YouTube channel feed.
- Episode-level engagement (comments, ratings).
- Cross-campaign search.
- YouTube cache enrichment of runtime/thumbnail.
- `PodcastEpisode` JSON-LD (planner may include if cheap).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAMP-01 | Campaign archive index in chronological order | List/filter pattern from `Characters.tsx` (Standard Stack + Architecture Patterns) |
| CAMP-02 | Campaign detail with description, cast, ordered episodes | Detail layout from `CharacterDetail.tsx`; cast linkage via `cast.json` ids (Cross-Link section) |
| CAMP-03 | Each episode entry links to YouTube + optional podcast | External-link button pattern from `CharacterDetail.tsx` (D&D Beyond / Playlist buttons) |
| CAMP-04 | Campaign + episode pages emit JSON-LD per `structuredData.ts` | New `getTVSeriesSchema` / `getTVEpisodeSchema` factories — see JSON-LD section |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Campaign/episode data load | Browser (static JSON import) | Vite (build-time bundle) | LOCKED: static JSON imported into client bundle, identical to `cast.json` / `characters.json` |
| Routing (`/campaigns/...`) | Browser (wouter SPA) | — | Existing app is wouter SPA; nested routes register in `App.tsx` |
| JSON-LD injection | Browser (SEO component, runtime) | — | Existing `SEO.tsx` injects `<script type="application/ld+json">` in `useEffect` — same pattern reused |
| Status filter (All/Active/Concluded) | Browser (React `useState`) | — | LOCKED: client-side filter, exact mirror of `Characters.tsx` campaign filter |
| Build-time data validation | Build (Vitest in CI) | — | Lightest option: a unit test that imports JSON + parses with Zod. No new tooling needed. |
| YouTube/podcast outbound | Browser (anchor `target="_blank"`) | — | LOCKED: episodes are static URLs with no enrichment in v1 |

## Standard Stack

### Core (already in repo — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `wouter` | per package.json | Routing — `/campaigns`, `/campaigns/:slug`, `/campaigns/:slug/episodes/:episodeNumber` | LOCKED project routing library; `useRoute` supports `:param` named segments [VERIFIED: existing usage in `CharacterDetail.tsx` line 63 and `AdminOrderDetail.tsx` line 16] |
| `react` 18 + TS | per package.json | Page components | LOCKED stack |
| `tailwindcss` + `shadcn/ui` | per package.json | Layout, `Card`, `Badge`, `Button`, `Tooltip` | LOCKED stack; existing pages compose these primitives |
| `zod` | per `shared/schema.ts` | Build-time JSON shape validation | Already used in `shared/schema.ts` for Drizzle table validation [VERIFIED: grep of `shared/`] |
| `vitest` | per package.json | Test that runs Zod schema against `campaigns.json`/`episodes.json` to fail CI on malformed entries | LOCKED test framework; pre-push hook runs unit tests |
| `lucide-react` | per package.json | Icons (`BookOpen`, `Play`, `Calendar`, `ExternalLink`, etc.) | Used everywhere in existing pages |

### Supporting (already present, used as-is)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `client/src/components/SEO.tsx` | n/a | Page meta + JSON-LD injection | Every campaign and episode page |
| `client/src/lib/structuredData.ts` | n/a | JSON-LD factories | Extend with `getTVSeriesSchema`, `getTVEpisodeSchema` (and optionally `getPodcastEpisodeSchema`) |
| `client/src/components/Navigation.tsx` + `Footer.tsx` | n/a | Page chrome | Wrap each new page identically to `Characters.tsx` |
| `react-helmet-async` | per package.json | Helmet provider mounted in `App.tsx` | Already present; `SEO.tsx` actually mutates `document.head` directly via `useEffect` rather than using Helmet — keep that pattern for consistency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest test for JSON validation | Vite plugin that runs Zod on import | Plugin adds new build dependency and a new failure mode; a one-file test with `expect(() => CampaignsSchema.parse(data)).not.toThrow()` is two minutes to write, runs in existing pre-commit hook (`vitest related --run`), and fails CI on schema drift just as well [ASSUMED: lightest-weight choice — confirm with planner] |
| Vitest test | `tsx` script invoked from `prebuild` npm script | A `prebuild` step runs every `npm run build` but is invisible to `npm run check` and `vitest` — splits the mental model. A test colocated with other tests is discoverable. |
| `TVSeries` + `TVEpisode` | `PodcastSeries` + `PodcastEpisode` only | The show is YouTube-primary with podcast as a secondary distribution; modeling as TV is more accurate. Optional `PodcastSeries` could be added in `@graph` but is deferred per CONTEXT |
| Storing data in DB (Drizzle) | static JSON | LOCKED — out of scope. JSON matches existing pattern. |

**Installation:** No new packages required. Verify with `npm ls zod vitest wouter` — all already declared.

## Architecture Patterns

### System Architecture Diagram

```
                       ┌──────────────────────────────────┐
                       │  client/src/data/                │
                       │   ├─ campaigns.json (NEW)        │
                       │   ├─ episodes.json  (NEW)        │
                       │   ├─ cast.json      (existing)   │
                       │   └─ characters.json(existing)   │
                       └──────────────┬───────────────────┘
                                      │  static import (Vite bundles into JS)
                                      ▼
   ┌─────────────────┐   wouter   ┌────────────────────────┐
   │   App.tsx       │───────────▶│  Pages                 │
   │   <Switch>      │            │   ├─ Campaigns.tsx     │  /campaigns
   │  + 3 new Routes │            │   ├─ CampaignDetail.tsx│  /campaigns/:slug
   └─────────────────┘            │   └─ EpisodeDetail.tsx │  /campaigns/:slug/episodes/:episodeNumber
                                  └──────────┬─────────────┘
                                             │ uses
                  ┌──────────────────────────┼─────────────────────────────┐
                  ▼                          ▼                             ▼
        ┌───────────────────┐    ┌────────────────────────┐   ┌────────────────────────┐
        │ SEO.tsx           │    │ structuredData.ts      │   │ shadcn/ui primitives   │
        │ (title, OG, JSON- │◀───│ getTVSeriesSchema      │   │ Card, Badge, Button,   │
        │  LD <script>)     │    │ getTVEpisodeSchema     │   │ Tooltip                │
        └───────────────────┘    │ getBreadcrumbSchema    │   └────────────────────────┘
                                 │ getVideoSchema         │
                                 └────────────────────────┘

  Build-time:  Vitest test imports campaigns.json + episodes.json → parses with Zod
               schemas in shared/schema.ts (or test/fixtures) → fails CI on malformed entry.

  Runtime:     Pages do not call backend. Outbound links to youtubeUrl / podcastUrl
               open in new tab (target="_blank" rel="noopener noreferrer").
```

### Recommended Project Structure

```
client/src/
├── data/
│   ├── campaigns.json              # NEW — array of campaigns
│   └── episodes.json               # NEW — array of episodes (flat; filtered by campaignSlug)
├── pages/
│   ├── Campaigns.tsx               # NEW — list page (mirrors Characters.tsx)
│   ├── CampaignDetail.tsx          # NEW — detail page (mirrors CharacterDetail.tsx)
│   └── EpisodeDetail.tsx           # NEW — episode detail page
├── lib/
│   ├── structuredData.ts           # EXTEND — add getTVSeriesSchema, getTVEpisodeSchema
│   └── campaigns.ts                # NEW (optional) — small helper: getCampaignBySlug, getEpisodesByCampaign, sortByAirDate
└── components/
    └── (no new shared components needed in v1; if reused, e.g. EpisodeCard, place under client/src/components/campaigns/)

shared/
└── schema.ts                       # EXTEND — add zod schemas: CampaignSchema, EpisodeSchema, CampaignsFileSchema, EpisodesFileSchema

test/
└── data/
    └── campaigns-data.test.ts      # NEW — runs Zod parse on JSON files; fails build on malformed entry
```

### Pattern 1: List Page (mirror `Characters.tsx`)

**What:** Stateless page that imports JSON, computes derived lists with `useState` for filters, renders `Card` grids.

**When to use:** `/campaigns` index.

**Example:**
```tsx
// Source: derived from C:/Users/Preston/git/toa-website/client/src/pages/Characters.tsx (lines 52-271)
import { useState } from "react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import campaignsData from "@/data/campaigns.json";
import episodesData from "@/data/episodes.json";
import { getBreadcrumbSchema } from "@/lib/structuredData";

export default function Campaigns() {
  const campaigns = campaignsData.campaigns;
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "concluded">("all");

  const filtered = statusFilter === "all"
    ? campaigns
    : campaigns.filter(c => c.status === statusFilter);

  const sorted = [...filtered].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const episodeCount = (slug: string) =>
    episodesData.episodes.filter(e => e.campaignSlug === slug).length;

  const breadcrumb = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Campaigns", url: "https://talesofaneria.com/campaigns" },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Campaigns - Tales of Aneria"
        description="Browse the campaigns and sagas of Tales of Aneria — ongoing arcs and concluded narratives."
        canonical="https://talesofaneria.com/campaigns"
        jsonLd={breadcrumb}
      />
      <Navigation />
      {/* Filter buttons + campaign cards exactly like Characters.tsx campaign filter */}
      <Footer />
    </div>
  );
}
```

### Pattern 2: Detail Page with `@graph` JSON-LD (mirror `CharacterDetail.tsx`)

**What:** `useRoute("/campaigns/:slug")`, find by slug, render hero + sidebar layout, emit `@graph` of multiple schemas.

**Example:**
```tsx
// Source: derived from C:/Users/Preston/git/toa-website/client/src/pages/CharacterDetail.tsx (lines 62-129)
const [, params] = useRoute("/campaigns/:slug");
const campaign = campaignsData.campaigns.find(c => c.slug === params?.slug);
if (!campaign) return <NotFoundFallback />; // mirror lines 70-90

const tvSeries = getTVSeriesSchema({ /* see JSON-LD section */ });
const breadcrumb = getBreadcrumbSchema([
  { name: "Home", url: "https://talesofaneria.com/" },
  { name: "Campaigns", url: "https://talesofaneria.com/campaigns" },
  { name: campaign.name, url: `https://talesofaneria.com/campaigns/${campaign.slug}` },
]);
const structuredData = { "@context": "https://schema.org", "@graph": [tvSeries, breadcrumb] };

return <SEO title={...} jsonLd={structuredData} ... />;
```

### Pattern 3: Episode Detail Page

**What:** `useRoute("/campaigns/:slug/episodes/:episodeNumber")` — wouter supports multiple `:` params on a single path.

**Example:**
```tsx
const [, params] = useRoute("/campaigns/:slug/episodes/:episodeNumber");
const campaign = campaignsData.campaigns.find(c => c.slug === params?.slug);
const episode = episodesData.episodes.find(e =>
  e.campaignSlug === params?.slug &&
  String(e.episodeNumber) === params?.episodeNumber
);
if (!campaign || !episode) return <NotFoundFallback />;

const tvEpisode = getTVEpisodeSchema({ campaign, episode });
const videoObject = getVideoSchema({  // existing factory in structuredData.ts
  name: episode.title,
  description: episode.summary,
  thumbnailUrl: episode.thumbnail ?? extractYouTubeThumb(episode.youtubeUrl),
  uploadDate: episode.airDate,
  contentUrl: episode.youtubeUrl,
});
const breadcrumb = getBreadcrumbSchema([
  { name: "Home", url: "https://talesofaneria.com/" },
  { name: "Campaigns", url: "https://talesofaneria.com/campaigns" },
  { name: campaign.name, url: `https://talesofaneria.com/campaigns/${campaign.slug}` },
  { name: `Ep ${episode.episodeNumber}: ${episode.title}`, url: `https://talesofaneria.com/campaigns/${campaign.slug}/episodes/${episode.episodeNumber}` },
]);
const structuredData = { "@context": "https://schema.org", "@graph": [tvEpisode, videoObject, breadcrumb] };
```

### Anti-Patterns to Avoid

- **`import { useNavigate } from "wouter"`** — does not exist. Use `useLocation` (`const [, setLocation] = useLocation()`) for programmatic navigation, or `<Link href="...">` for declarative. [VERIFIED: CLAUDE.md explicit rule + existing usage]
- **Putting JSON-LD inline in JSX outside `<SEO>`** — would create duplicate `<script type="application/ld+json">` tags on rerenders. `SEO.tsx` queries the DOM for an existing one and updates it (line 96-104).
- **Filtering episodes at render time on every keystroke** — fine for the small dataset expected (LOCKED: manually authored, low cardinality), but if the filter UI grows, memoize with `useMemo` (matches no current pattern in `Characters.tsx`, so don't introduce unless data demands it).
- **Re-implementing the SEO component or calling `react-helmet-async` directly** — existing app uses imperative `document.head` mutation in `SEO.tsx`. Don't mix idioms.
- **Adding new routing libraries to ease nesting** — wouter's `useRoute` handles two-param paths fine [VERIFIED: pattern is mainstream wouter usage; the project already uses single-param `:id` and `:orderId` segments in `App.tsx` lines 72, 87].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON-LD generation | Hand-typed schema objects in each page | Factory functions in `structuredData.ts` (extend existing pattern) | Single source of truth, easier to update if Google's required fields change |
| Page meta tags | `<head>` mutation in each page | Existing `SEO` component | Already handles OG, Twitter, canonical, JSON-LD injection (`SEO.tsx` lines 32-106) |
| Slug generation | Auto-derived from name at runtime | Explicit `slug` field in `campaigns.json` | LOCKED. Authored explicitly so URLs are stable when titles get edited |
| YouTube ID parsing for thumbnails | Custom regex | A single tiny helper in `client/src/lib/campaigns.ts` if needed; or simply require authors to include `thumbnail` field | YouTube URL formats vary (watch?v=, youtu.be/, embed/) — but if `thumbnail` is required in the schema, no parsing needed at all |
| JSON validation | `if (!data.name) throw...` blocks | Zod schema in `shared/schema.ts` parsed by a Vitest test | Project already uses Zod for Drizzle validation; tests already run pre-push |
| Breadcrumb schema | Hand-rolled object | `getBreadcrumbSchema()` (already in `structuredData.ts` line 39) | Reuse |
| Episode listing/sorting | Imperative loop in render | `Array.prototype.sort` + `.filter` (matches `Characters.tsx`) | Existing pattern |

**Key insight:** Every infrastructure piece this phase needs already exists. The work is data modeling + page composition + extending one factory module. Resist the urge to introduce loaders, vite plugins, route generators, or JSON-LD libraries — none save effort at this scale.

## Cross-Link to Existing Cast (CAMP-02 implementation detail)

`cast.json` shape (verified):
```json
{ "id": "preston-farr", "name": "Preston Farr", "role": "Player", "characters": [...], "isCurrent": true, "avatar": "cast-preston.webp", "socialLinks": {...} }
```

`cast.json` is consumed in exactly one place today: `client/src/components/AboutSection.tsx` (line 17). The character pages reference `playerId` (e.g., `"playerId": "preston-farr"` in `characters.json`) — the same id-shape campaigns will use.

**Recommendation for CampaignDetail.tsx cast section:**
1. Import `castData from "@/data/cast.json"`.
2. For each `castId` in `campaign.cast`, look up the cast member: `castData.cast.find(c => c.id === castId)`.
3. Render the cast member's name + avatar.
4. Optional cross-link: if any character in `characters.json` has `playerId === castId` and `campaign === campaign.name` (or a future `campaignSlug` field — see Risks), link the cast row to that character's detail page. v1 may simply link to `/#about` (matches what `CharacterDetail.tsx` does — line 352).

**Watch-out:** `characters.json` currently uses a free-text `campaign` field (e.g., `"Journeys Through Taebrin"`), not a slug. If campaign cross-linking from cast→character is wanted in v1, the planner should either (a) match on display name, or (b) add an optional `campaignSlug` field to `characters.json` (data migration in same phase). Per LOCKED scope ("no per-episode cast tracking"), the simplest path is just rendering cast names without character cross-linking in v1.

## JSON-LD Schema Selection

### Decision: `TVSeries` (campaign) + `TVEpisode` + `VideoObject` (episode)

**Rationale (HIGH confidence):**
- A live-play show is a series of episodes — `TVSeries` / `TVEpisode` matches the domain semantically [CITED: schema.org/TVSeries, schema.org/TVEpisode].
- Google Rich Results documentation does **NOT** list `TVEpisode` among supported rich-result types for video features [VERIFIED: developers.google.com/search/docs/appearance/structured-data/video — only `VideoObject`, `Clip`, `BroadcastEvent`, `SeekToAction` are listed]. Therefore `TVEpisode` alone will not yield video rich results — but it does provide accurate semantic markup for general indexing.
- The actionable rich-result win comes from `VideoObject`. Emitting both via `@graph` gives you semantic accuracy (TVSeries/TVEpisode) AND eligibility for Google's video rich result (VideoObject).

**Required `VideoObject` properties (Google) [CITED: Google video structured data docs]:**
- `name`, `thumbnailUrl`, `uploadDate` (required)
- `description`, `contentUrl` or `embedUrl`, `duration` (recommended)

The existing `getVideoSchema()` in `structuredData.ts` already emits `name`, `description`, `thumbnailUrl`, `uploadDate`, `duration?`, `contentUrl?`, `embedUrl`, and `publisher` — sufficient for Google rich results provided the planner ensures `thumbnailUrl` is always populated.

### New factories to add to `client/src/lib/structuredData.ts`

```ts
// CAMPAIGN PAGE — emit as the single jsonLd, or as part of @graph with breadcrumb
export const getTVSeriesSchema = (campaign: {
  name: string;
  slug: string;
  description: string;
  startDate: string;       // ISO
  endDate?: string;        // ISO, optional (only for concluded)
  numberOfEpisodes: number;
  thumbnailUrl?: string;
  cast: { name: string }[]; // resolved from cast.json
}) => ({
  "@context": "https://schema.org",
  "@type": "TVSeries",
  "name": campaign.name,
  "description": campaign.description,
  "url": `https://talesofaneria.com/campaigns/${campaign.slug}`,
  "image": campaign.thumbnailUrl,
  "startDate": campaign.startDate,
  ...(campaign.endDate ? { "endDate": campaign.endDate } : {}),
  "numberOfEpisodes": campaign.numberOfEpisodes,
  "actor": campaign.cast.map(c => ({ "@type": "Person", "name": c.name })),
  "productionCompany": { "@type": "Organization", "name": "Tales of Aneria" },
  "genre": ["Fantasy", "Tabletop RPG", "Dungeons & Dragons", "Live Play"],
});

// EPISODE PAGE — combine with getVideoSchema in @graph
export const getTVEpisodeSchema = (input: {
  campaignName: string;
  campaignSlug: string;
  episodeNumber: number;
  title: string;
  summary: string;
  airDate: string;        // ISO
  url: string;            // https://talesofaneria.com/campaigns/<slug>/episodes/<n>
  youtubeUrl: string;
  thumbnailUrl?: string;
  duration?: string;      // ISO 8601
}) => ({
  "@context": "https://schema.org",
  "@type": "TVEpisode",
  "name": input.title,
  "episodeNumber": input.episodeNumber,
  "datePublished": input.airDate,
  "description": input.summary,
  "url": input.url,
  "image": input.thumbnailUrl,
  "partOfSeries": {
    "@type": "TVSeries",
    "name": input.campaignName,
    "url": `https://talesofaneria.com/campaigns/${input.campaignSlug}`,
  },
  // VideoObject embedded so Google sees video data even on the TVEpisode node
  "video": {
    "@type": "VideoObject",
    "name": input.title,
    "description": input.summary,
    "thumbnailUrl": input.thumbnailUrl,
    "uploadDate": input.airDate,
    "contentUrl": input.youtubeUrl,
    "embedUrl": input.youtubeUrl,
    ...(input.duration ? { "duration": input.duration } : {}),
  },
});

// Optional, per CONTEXT deferred decision — include if podcastUrl present
export const getPodcastEpisodeSchema = (input: {
  title: string;
  summary: string;
  airDate: string;
  podcastUrl: string;
  campaignName: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "PodcastEpisode",
  "name": input.title,
  "datePublished": input.airDate,
  "description": input.summary,
  "associatedMedia": { "@type": "MediaObject", "contentUrl": input.podcastUrl },
  "partOfSeries": { "@type": "PodcastSeries", "name": input.campaignName },
});
```

### Validation: Google Rich Results Test

Manually run after first deploy: paste `https://talesofaneria.com/campaigns/<slug>/episodes/1` into https://search.google.com/test/rich-results. Expect "Videos" detected. (Phase 1 success criterion #4 in CONTEXT.md.) Per Google docs the validator checks `name`, `thumbnailUrl`, `uploadDate` presence — so the planner must specify these three as **required** in the Zod episode schema, not optional.

## Wouter Nested-Route Confirmation

[VERIFIED via existing code]:

- `App.tsx` lines 72, 87: `<Route path="/admin/orders/:orderId" component={...} />` — single `:` param works.
- `CharacterDetail.tsx` line 63: `const [, params] = useRoute("/characters/:id"); const characterId = params?.id;` — params returned as `Record<string, string>`.
- Wouter's path matcher (regexparam under the hood) supports multiple named params on one path — `/campaigns/:slug/episodes/:episodeNumber` is conventional usage. [ASSUMED for the multi-param case based on regexparam library docs; verified at implementation time by `useRoute` test.]

**Forbidden pattern (from CLAUDE.md, repeated for emphasis):**
```ts
import { useNavigate } from "wouter"; // DOES NOT EXIST — build will succeed, runtime crash
```
**Use:** `import { useLocation } from "wouter"; const [, setLocation] = useLocation();`

## Static-Data Validation (Build-time)

### Recommended approach: Zod schema + Vitest test

**Why this over a Vite plugin:** Lightest-weight, uses tools already in the repo, plugs into existing pre-commit (`vitest related --run`) and pre-push (full test) hooks per CLAUDE.md "Pre-commit Hooks (Automatic)".

**Implementation outline:**

1. Add Zod schemas to `shared/schema.ts` (alongside existing Drizzle table validation):

```ts
import { z } from "zod";

export const CampaignSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["active", "concluded"]),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cast: z.array(z.string()),       // cast member ids — referential integrity checked in test
  thumbnail: z.string().optional(),
});

export const EpisodeSchema = z.object({
  id: z.string(),
  campaignSlug: z.string(),
  episodeNumber: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  airDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  youtubeUrl: z.string().url().refine(u => /youtube\.com|youtu\.be/.test(u), { message: "must be a YouTube URL" }),
  podcastUrl: z.string().url().optional(),
  thumbnail: z.string().optional(),
  duration: z.string().optional(),  // ISO 8601 PT15M
});

export const CampaignsFileSchema = z.object({ campaigns: z.array(CampaignSchema) });
export const EpisodesFileSchema = z.object({ episodes: z.array(EpisodeSchema) });
```

2. Add `test/data/campaigns-data.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import campaignsData from "@/data/campaigns.json";
import episodesData from "@/data/episodes.json";
import castData from "@/data/cast.json";
import { CampaignsFileSchema, EpisodesFileSchema } from "@shared/schema";

describe("campaigns/episodes static data", () => {
  it("campaigns.json matches schema", () => {
    expect(() => CampaignsFileSchema.parse(campaignsData)).not.toThrow();
  });
  it("episodes.json matches schema", () => {
    expect(() => EpisodesFileSchema.parse(episodesData)).not.toThrow();
  });
  it("every episode references an existing campaign slug", () => {
    const slugs = new Set(campaignsData.campaigns.map(c => c.slug));
    for (const ep of episodesData.episodes) expect(slugs.has(ep.campaignSlug)).toBe(true);
  });
  it("every campaign cast id resolves to a cast member", () => {
    const ids = new Set(castData.cast.map(c => c.id));
    for (const c of campaignsData.campaigns) for (const id of c.cast) expect(ids.has(id)).toBe(true);
  });
  it("episode (campaignSlug, episodeNumber) tuples are unique", () => {
    const seen = new Set<string>();
    for (const ep of episodesData.episodes) {
      const key = `${ep.campaignSlug}#${ep.episodeNumber}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
```

This catches: malformed entries, broken cast references, broken campaign references, duplicate episodeNumbers within a campaign — all at CI time.

**Existing JSON validation in repo:** None. `cast.json` and `characters.json` are imported untyped and trusted. This phase introduces validation as net-new but using only existing tools (Zod, Vitest).

## Common Pitfalls

### Pitfall 1: Importing `useNavigate` from wouter

**What goes wrong:** Build succeeds (TypeScript may not flag it depending on tsconfig), runtime crash on navigation.
**Why it happens:** Muscle memory from `react-router`.
**How to avoid:** Use `useLocation` (`[location, setLocation]`) for programmatic nav, `<Link>` for declarative. CLAUDE.md "Wouter Navigation (CRITICAL)" section is the authoritative reference. `npm run check:mistakes` is a pre-existing script that flags this.
**Warning signs:** Any import line like `import { useNavigate }` from anywhere — should not exist.

### Pitfall 2: JSON-LD `<script>` tag deduplication

**What goes wrong:** Multiple JSON-LD scripts on a page can confuse Google; rerenders create duplicates.
**Why it happens:** Naively appending `<script>` in `useEffect`.
**How to avoid:** `SEO.tsx` lines 96-104 already handle this — it queries for an existing `script[type="application/ld+json"]` and **mutates `textContent` instead of appending**. Pass the entire `@graph` as a single object to `SEO`'s `jsonLd` prop, not multiple `SEO` calls.
**Warning signs:** DevTools shows >1 `<script type="application/ld+json">` in `<head>`.

### Pitfall 3: Vite middleware in dev — JSON-LD only renders client-side

**What goes wrong:** Crawlers that don't execute JS see `<script type="application/ld+json">` empty (it's populated in `useEffect`).
**Why it happens:** This app uses Express + Vite middleware (per project tech stack); pages are client-rendered. Googlebot does execute JS, so this is mostly fine — but social scrapers (Twitter, LinkedIn, Discord) generally do not.
**How to avoid:** For OG/Twitter, ensure server-rendered fallback meta tags exist in `client/index.html` for the most important pages. JSON-LD itself is safe for Google (which renders JS); for other consumers, accept the limitation in v1. **Planner: confirm this trade-off is acceptable** — full SSR is out of scope for this phase.
**Warning signs:** "View Page Source" shows empty `<head>` instead of populated meta. Rich Results test still works because Google does run JS.

### Pitfall 4: Required `VideoObject` fields missing → no rich results

**What goes wrong:** Episode passes Zod but `thumbnailUrl` defaults to undefined; Google Rich Results test fails.
**Why it happens:** Optional in schema → empty in JSON-LD.
**How to avoid:** Make `thumbnail` required in the Zod episode schema (or auto-derive from YouTube video id: `https://i.ytimg.com/vi/<id>/hqdefault.jpg`). The latter avoids author burden — recommend the planner add a small helper that parses YouTube URL for the video id and derives the thumbnail.
**Warning signs:** Search Console "Videos report" shows zero impressions; manual Rich Results test reports missing fields.

### Pitfall 5: Episode URL collisions with episode reorders

**What goes wrong:** If `episodeNumber` is renumbered after publish, old URLs 404 and lose SEO equity.
**Why it happens:** URL identifies episode by number-within-campaign per LOCKED decision.
**How to avoid:** Document in the authoring guide that `episodeNumber` is permanent once an episode is published. The validation test enforces uniqueness; humans must enforce stability.
**Warning signs:** Git diff to `episodes.json` shows existing entries' `episodeNumber` changing — reviewer should reject.

### Pitfall 6: Large JSON imports in Vite

**What goes wrong:** Vite imports JSON as a module; very large files bloat the client bundle.
**Why it happens:** Static import = bundled in.
**How to avoid:** Realistic episode counts (dozens to low hundreds) are tiny; not a real concern at v1 scale. If episode count grows beyond ~500, consider dynamic `import()` per-campaign. **Action: none in v1.** [ASSUMED: typical YouTube live-play backlogs are well under 500 episodes — confirm if dataset is larger]
**Warning signs:** Bundle analyzer shows a single JSON chunk >100KB.

## Code Examples

### Adding routes to `App.tsx`

```tsx
// Source: extends C:/Users/Preston/git/toa-website/client/src/App.tsx pattern (lines 70-93)
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import EpisodeDetail from "@/pages/EpisodeDetail";

// Inside <Switch>, BEFORE the <Route component={NotFound} /> catch-all:
<Route path="/campaigns" component={Campaigns} />
<Route path="/campaigns/:slug" component={CampaignDetail} />
<Route path="/campaigns/:slug/episodes/:episodeNumber" component={EpisodeDetail} />
```

Order matters in wouter `<Switch>`: more specific routes first. The example above is already correctly ordered (most specific last is fine because wouter matches prefixes by full path, not segments — `/campaigns` does not match `/campaigns/foo`).

### YouTube thumbnail derivation helper

```ts
// client/src/lib/campaigns.ts
export function youtubeIdFromUrl(url: string): string | null {
  // Handles youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function youtubeThumbnail(url: string): string | undefined {
  const id = youtubeIdFromUrl(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-helmet` for head management | Direct `document.head` mutation in `SEO.tsx` `useEffect` | Project's existing convention | Keep this idiom in new pages — don't introduce Helmet |
| Inline JSON-LD in JSX | Factories in `structuredData.ts` returning plain objects, passed to `SEO`'s `jsonLd` prop | Project's existing convention | Extend factories; don't deviate |
| `react-router` `useNavigate` | wouter `useLocation` | Project's framework choice | LOCKED [VERIFIED: CLAUDE.md] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Wouter `useRoute("/a/:x/b/:y")` returns both params on a single matcher (multi-param path) | Wouter Nested-Route Confirmation | Low — fallback is two nested `<Route>` components or a custom matcher. Verified pattern at implementation time by writing the page and running it. |
| A2 | Vitest test in `test/data/` runs as part of pre-commit `vitest related --run` and pre-push full-suite | Static-Data Validation | Low — if not, planner adds it to a CI step explicitly. Test still runs locally. |
| A3 | Episode counts will stay below ~500 over the foreseeable life of the show, so static import bundles are fine | Common Pitfalls #6 | Low — splitting JSON later is straightforward |
| A4 | `cast.json` ids are stable enough that referencing them from campaigns is safe (no migration anticipated) | Cross-Link section | Low — Zod test catches dangling references at CI time |
| A5 | The tradeoff of client-rendered JSON-LD (Google handles it; non-JS social scrapers may not) is acceptable for v1 | Common Pitfalls #3 | Medium — affects social-card preview quality. Planner should confirm with the user. |

## Open Questions (RESOLVED)

1. **Should v1 emit `PodcastEpisode` JSON-LD when `podcastUrl` is present?** — **RESOLVED in PLAN.md**: include `getPodcastEpisodeSchema` factory (Task 2) and emit conditionally on episode pages when `podcastUrl` is present (Task 7).

2. **Cross-linking cast → character on a campaign detail page** — **RESOLVED in PLAN.md**: deferred. Per CONTEXT, campaign-level cast linkage only in v1. Cast names render without character cross-link.

3. **Sitemap.xml inclusion of campaign/episode URLs** — **RESOLVED in PLAN.md**: out of scope for Phase 1. Phase 5 (SEO-01) will pick up campaign/episode URLs at sitemap time.

4. **Where to add "Campaigns" navigation entry** — **RESOLVED in PLAN.md**: `client/src/components/Navigation.tsx` primary nav, between "Characters" and "Shop" (Task 8).

## Environment Availability

No new external dependencies needed. All required tools and libraries are already in the project.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 18+ | Build, test | ✓ (per project) | per `.nvmrc` / package.json engines | — |
| `wouter` | Routing | ✓ | per package.json | — |
| `zod` | Schema validation | ✓ | per package.json (used in `shared/schema.ts`) | — |
| `vitest` | Build-time data test | ✓ | per package.json | — |
| `react-helmet-async` | Mounted in `App.tsx` (not actively used by `SEO.tsx`) | ✓ | per package.json | — |
| Google Rich Results Test | Manual post-deploy verification | ✓ (web tool) | n/a | Schema.org Validator (validator.schema.org) |

**Missing dependencies with no fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (E2E with axe) |
| Config file | `vitest.config.ts` and `playwright.config.ts` (verified present per CLAUDE.md commands) |
| Quick run command | `npm run test:quick` |
| Full suite command | `npm run test` (with coverage: `npm run test:coverage`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAMP-01 | `/campaigns` renders chronological list | unit (component) + E2E | `vitest run test/pages/Campaigns.test.tsx` / `npm run test:e2e -- campaigns.spec.ts` | ❌ Wave 0 |
| CAMP-01 | Status filter (All/Active/Concluded) toggles list | unit | `vitest run test/pages/Campaigns.test.tsx` | ❌ Wave 0 |
| CAMP-02 | `/campaigns/:slug` renders description, cast, episodes | unit | `vitest run test/pages/CampaignDetail.test.tsx` | ❌ Wave 0 |
| CAMP-02 | 404 fallback when slug not found | unit | `vitest run test/pages/CampaignDetail.test.tsx` | ❌ Wave 0 |
| CAMP-03 | Episode YouTube + podcast links render with `target="_blank" rel="noopener noreferrer"` | unit | `vitest run test/pages/EpisodeDetail.test.tsx` | ❌ Wave 0 |
| CAMP-04 | Campaign page emits valid TVSeries JSON-LD | unit | `vitest run test/lib/structuredData.test.ts` | ❌ Wave 0 |
| CAMP-04 | Episode page emits valid TVEpisode + VideoObject JSON-LD with required fields (name, thumbnailUrl, uploadDate) | unit | `vitest run test/lib/structuredData.test.ts` | ❌ Wave 0 |
| (cross-cutting) | `campaigns.json` / `episodes.json` validate against Zod schemas | unit | `vitest run test/data/campaigns-data.test.ts` | ❌ Wave 0 |
| (a11y) | Pages pass axe checks | E2E | `npm run test:e2e -- campaigns.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:quick` (existing pre-commit `vitest related --run` covers changed files)
- **Per wave merge:** `npm run test` (full unit suite — pre-push hook enforces this and 40% global coverage)
- **Phase gate:** Full suite green, then manual Rich Results check on a deployed campaign + episode page

### Wave 0 Gaps

- [ ] `test/pages/Campaigns.test.tsx` — covers CAMP-01
- [ ] `test/pages/CampaignDetail.test.tsx` — covers CAMP-02
- [ ] `test/pages/EpisodeDetail.test.tsx` — covers CAMP-03
- [ ] `test/lib/structuredData.test.ts` — covers CAMP-04 (extend if file exists)
- [ ] `test/data/campaigns-data.test.ts` — schema integrity guard
- [ ] `e2e/campaigns.spec.ts` — Playwright + axe accessibility (per CLAUDE.md WCAG 2.1 AA requirement)
- [ ] No new framework install needed

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No new auth surface; pages are public read-only |
| V3 Session Management | no | No session interaction |
| V4 Access Control | no | All content is public |
| V5 Input Validation | yes | Zod at build time on `campaigns.json` / `episodes.json`; outbound URLs validated to be YouTube/podcast hosts |
| V6 Cryptography | no | No crypto operations introduced |
| V11 Business Logic | yes (light) | Episode URLs are author-curated; risk surface is minimal |
| V13 API & Web Service | no | No new API endpoints — phase is pure client + static data |

### Known Threat Patterns for static-content + outbound-link pages

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via authored fields (e.g., title, summary rendered as HTML) | Tampering | Render summaries as plain text via React's default JSX text interpolation. If markdown is desired (matching `CharacterDetail.tsx` line 211), use `react-markdown` + `rehype-sanitize` (already in repo) — never inject raw HTML strings |
| Open-redirect / tabnabbing on outbound links | Tampering | All `<a target="_blank">` must include `rel="noopener noreferrer"` (CharacterDetail uses this — line 308, 393, 415; mirror exactly) |
| URL scheme injection (e.g., `javascript:` in `youtubeUrl`) | Tampering | Zod schema requires `.url()` and refines to YouTube hosts; podcast URL refined similarly |
| Malformed/missing data crashes page | DoS (client-side) | Build-time Zod validation prevents broken data from shipping; runtime null-checks in detail pages render NotFound rather than throw |
| Client-side bundling of secrets | Information Disclosure | No secrets in `campaigns.json` / `episodes.json` (public data only); pre-commit gitleaks already scans markdown — apply same vigilance to JSON |

**No human-review required code zones touched.** This phase touches `client/src/pages/`, `client/src/lib/`, `client/src/data/`, `shared/schema.ts` (additive Zod schemas only — not Drizzle table changes), and route registration in `App.tsx`. None are listed under CLAUDE.md "Human-Review Required" zones.

## Project Constraints (from CLAUDE.md)

Directives the planner must honor for this phase:

- **Wouter only — `useNavigate` is forbidden.** Use `useLocation` for programmatic nav.
- **Path aliases:** `@/` = `client/src/`, `@shared/` = `shared/`. Use them in all new imports.
- **Conventional Commits** for commit messages.
- **WCAG 2.1 AA + axe checks in E2E** — every Playwright spec for new pages must include `await expect(page).toPassAxeCheck()`.
- **Pre-commit:** ESLint, related Vitest tests, markdown secret scan. Pre-push: full unit suite + 40% global coverage threshold (60% on `server/security.ts`, 77% on `server/env-validator.ts`). New code must keep these passing.
- **No raw SQL.** Not relevant here (no DB changes), but if planner accidentally proposes one, reject.
- **`shared/schema.ts`** is shared — extending it with new Zod schemas is fine; don't break existing exports.
- **Script parity (`*.ps1` ↔ `*.sh`):** No new scripts proposed in this phase; if planner adds any, both versions required.
- **Markdown secret prevention:** Authored campaign/episode content is JSON, not markdown — but if descriptions are markdown-rendered, `npm run check:markdown-secrets` should be evaluated for whether it covers JSON string fields (likely not — this is a low-risk gap; data is public anyway).
- **Git status reporting:** End each task summary with the Git Status block per CLAUDE.md convention.

## Sources

### Primary (HIGH confidence)
- `client/src/lib/structuredData.ts` (read in full) — existing JSON-LD factory module
- `client/src/components/SEO.tsx` (read in full) — meta + JSON-LD injection logic
- `client/src/pages/Characters.tsx` (read in full) — list page precedent
- `client/src/pages/CharacterDetail.tsx` (read in full) — detail page + `@graph` precedent
- `client/src/App.tsx` (read in full) — route registration site
- `client/src/data/cast.json`, `client/src/data/characters.json` — data shape precedents
- `CLAUDE.md` — wouter, security, testing rules
- `shared/schema.ts` (verified Zod use via grep)
- Google Search Central — VideoObject structured data: https://developers.google.com/search/docs/appearance/structured-data/video (fetched)

### Secondary (MEDIUM confidence)
- schema.org TVSeries / TVEpisode / VideoObject definitions (knowledge — schema.org is stable; semantic accuracy verified by reading SD docs)
- `.planning/phases/01-campaign-archive/01-CONTEXT.md` — locked decisions (authoritative for scope)
- `.planning/REQUIREMENTS.md` — CAMP-01..04 requirement IDs

### Tertiary (LOW confidence)
- Wouter multi-param path matching (`:a/:b` on one route) — common pattern but not directly verified by docs in this session; verified at implementation time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library is already in `package.json` and used in the codebase.
- Architecture: HIGH — patterns are direct mirrors of existing Characters/CharacterDetail pages.
- Pitfalls: HIGH for items #1, #2, #4, #5; MEDIUM for #3 (SSR/scraper concern is general knowledge, not project-verified) and #6 (depends on dataset size).
- JSON-LD selection: HIGH — verified against Google's official Video structured data documentation in this session.

**Research date:** 2026-05-08
**Valid until:** 2026-06-07 (30 days — domain is stable; static-content pattern, schema.org types, and wouter API change rarely)
