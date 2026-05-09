---
phase: 01-campaign-archive
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - shared/schema.ts
  - client/src/data/campaigns.json
  - client/src/data/episodes.json
  - client/src/lib/structuredData.ts
  - client/src/lib/campaigns.ts
  - client/src/pages/Campaigns.tsx
  - client/src/pages/CampaignDetail.tsx
  - client/src/pages/EpisodeDetail.tsx
  - client/src/components/Navigation.tsx
  - client/src/App.tsx
  - test/data/campaigns-data.test.ts
  - test/lib/campaigns.test.ts
  - test/structured-data.snapshot.test.ts
  - test/pages/Campaigns.test.tsx
  - test/pages/CampaignDetail.test.tsx
  - test/pages/EpisodeDetail.test.tsx
  - e2e/campaigns.spec.ts
autonomous: true
requirements:
  - CAMP-01
  - CAMP-02
  - CAMP-03
  - CAMP-04
tags: [content-archive, seo, json-ld, wouter-routes, static-data]

must_haves:
  truths:
    - "Visitor opens /campaigns and sees campaigns listed in chronological order (newest startDate first), with status badge and episode count per row"
    - "Visitor toggles the All / Active / Concluded status filter and the list updates client-side without reload"
    - "Visitor opens /campaigns/<slug> and sees the campaign description, the participating cast members (resolved from cast.json), and an ordered list of episodes"
    - "Visitor opens /campaigns/<slug>/episodes/<n> and sees the episode title, summary, air date, and outbound buttons to YouTube (always) and podcast (when present)"
    - "All YouTube and podcast outbound links open in a new tab with rel=\"noopener noreferrer\""
    - "An invalid campaign slug or invalid episodeNumber renders the existing CharacterDetail-style 'Not Found' fallback (no crash)"
    - "Campaign detail page emits TVSeries JSON-LD via @graph; episode detail page emits TVEpisode + VideoObject JSON-LD via @graph (each with name, thumbnailUrl, uploadDate populated)"
    - "All three pages emit OG/Twitter meta and a BreadcrumbList JSON-LD via the existing SEO component"
    - "Build/CI fails when campaigns.json or episodes.json contains a malformed entry, a dangling cast id, a dangling campaignSlug, or a duplicate (campaignSlug, episodeNumber) pair"
    - "Header Navigation includes a 'Campaigns' route entry that links to /campaigns"
  artifacts:
    - path: "client/src/data/campaigns.json"
      provides: "Authored campaign array (>=1 active sample campaign covering The Forgotten Gods Saga or equivalent existing arc)"
      contains: "\"campaigns\":"
    - path: "client/src/data/episodes.json"
      provides: "Authored episode array (>=2 episodes for the seeded campaign)"
      contains: "\"episodes\":"
    - path: "shared/schema.ts"
      provides: "CampaignSchema, EpisodeSchema, CampaignsFileSchema, EpisodesFileSchema Zod exports"
      contains: "export const CampaignSchema"
    - path: "client/src/lib/structuredData.ts"
      provides: "getTVSeriesSchema, getTVEpisodeSchema factories (and getPodcastEpisodeSchema if podcastUrl present)"
      contains: "getTVSeriesSchema"
    - path: "client/src/lib/campaigns.ts"
      provides: "youtubeIdFromUrl, youtubeThumbnail, getCampaignBySlug, getEpisodesByCampaign, sortCampaignsByStartDateDesc helpers"
      contains: "youtubeThumbnail"
    - path: "client/src/pages/Campaigns.tsx"
      provides: "Campaign index page with status filter and chronological order"
      min_lines: 80
    - path: "client/src/pages/CampaignDetail.tsx"
      provides: "Campaign detail page with description, cast, episode list, JSON-LD"
      min_lines: 80
    - path: "client/src/pages/EpisodeDetail.tsx"
      provides: "Episode detail page with YouTube + podcast outbound links and TVEpisode + VideoObject JSON-LD"
      min_lines: 80
    - path: "test/data/campaigns-data.test.ts"
      provides: "Build-time JSON validation: schema, referential integrity, uniqueness"
    - path: "e2e/campaigns.spec.ts"
      provides: "Playwright E2E covering /campaigns, /campaigns/:slug, /campaigns/:slug/episodes/:n + axe a11y check"
  key_links:
    - from: "client/src/App.tsx"
      to: "Campaigns / CampaignDetail / EpisodeDetail pages"
      via: "<Route path=\"/campaigns\"...>, <Route path=\"/campaigns/:slug\"...>, <Route path=\"/campaigns/:slug/episodes/:episodeNumber\"...>"
      pattern: "path=\"/campaigns"
    - from: "client/src/pages/Campaigns.tsx"
      to: "client/src/data/campaigns.json + episodes.json"
      via: "static import + filter/sort"
      pattern: "from \"@/data/campaigns.json\""
    - from: "client/src/pages/CampaignDetail.tsx"
      to: "client/src/data/cast.json"
      via: "campaign.cast.map(id => castData.cast.find(c => c.id === id))"
      pattern: "castData.cast.find"
    - from: "client/src/pages/EpisodeDetail.tsx"
      to: "client/src/lib/structuredData.ts (getTVEpisodeSchema + getVideoSchema)"
      via: "@graph composition passed to SEO jsonLd prop"
      pattern: "getTVEpisodeSchema"
    - from: "test/data/campaigns-data.test.ts"
      to: "shared/schema.ts (CampaignsFileSchema, EpisodesFileSchema)"
      via: "Zod parse on imported JSON"
      pattern: "CampaignsFileSchema.parse"
---

<objective>
Ship the Campaign Archive content surface for Tales of Aneria: a public, file-authored archive of campaigns (narrative arcs) and their episodes, with SEO-grade structured data.

Purpose: Satisfy CAMP-01..04 from REQUIREMENTS.md and the four ROADMAP success criteria. Establish the JSON-LD factory pattern (getTVSeriesSchema, getTVEpisodeSchema) that Phase 2 (Character Page Enhancements) will extend with getPersonSchema usage.

Output: Three new public routes (/campaigns, /campaigns/:slug, /campaigns/:slug/episodes/:episodeNumber), two new static JSON content files, extended Zod + JSON-LD libraries, build-time data validation test, full unit + E2E + axe accessibility coverage.

Scope guardrails (from CONTEXT.md / RESEARCH.md):
- No DB schema changes. No admin UI. No auto-pull from YouTube. Static JSON only.
- Mirror Characters.tsx / CharacterDetail.tsx exactly — do not invent new layout, card, or SEO patterns.
- Wouter only. `useNavigate` is forbidden — use `useLocation` for programmatic nav, `<Link>` for declarative.
- Phase 2 will add `getPersonSchema` consumer code next to these factories — keep `client/src/lib/structuredData.ts` cohesive and the new factories self-contained (no cross-imports between factories).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-campaign-archive/01-CONTEXT.md
@.planning/phases/01-campaign-archive/01-RESEARCH.md
@CLAUDE.md
@.github/copilot-instructions.md

# Pattern sources to mirror — read before implementing pages
@client/src/pages/Characters.tsx
@client/src/pages/CharacterDetail.tsx
@client/src/components/SEO.tsx
@client/src/lib/structuredData.ts
@client/src/App.tsx
@client/src/components/Navigation.tsx
@client/src/data/cast.json
@shared/schema.ts

# Test patterns to mirror
@test/structured-data.snapshot.test.ts
@e2e/characters.spec.ts

<interfaces>
<!-- Contracts the executor needs. Extracted from codebase. Do not re-explore. -->

From client/src/components/SEO.tsx:
```ts
interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;        // "website" | "article" | "profile" — use "article" for episode/campaign
  keywords?: string;
  noindex?: boolean;
  jsonLd?: object;        // Pass the @graph wrapper here as a single object
  ogImageAlt?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}
```
SEO injects exactly ONE `<script type="application/ld+json">` (mutates textContent on subsequent renders). Pass the entire @graph as a single object.

From client/src/lib/structuredData.ts (existing factories — reuse, do not duplicate):
```ts
export const getBreadcrumbSchema: (items: { name: string; url: string }[]) => object;
export const getVideoSchema: (video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
}) => object;
```

From client/src/data/cast.json — verified shape:
```ts
{ cast: Array<{
  id: string; name: string; role: string;
  characters: string[]; isCurrent: boolean;
  avatar: string; socialLinks: { youtube, twitter, instagram, twitch, website: string };
}> }
```

Wouter usage (verified at App.tsx:72,87 and CharacterDetail.tsx:63):
```ts
import { useRoute, Link, useLocation } from "wouter";
const [, params] = useRoute("/campaigns/:slug/episodes/:episodeNumber");
// params is Record<string,string> | null
```

FORBIDDEN: `import { useNavigate } from "wouter"` — does not exist; runtime crash. Use `const [, setLocation] = useLocation();`.
</interfaces>

<authoring_seed>
For Task 4 (sample data), use existing show context to seed at least one campaign and 2–3 episodes. Use the campaign names already referenced in `client/src/data/characters.json` (e.g. "Journeys Through Taebrin", "The Forgotten Gods Saga", or whichever active arc the existing characters most reference) — read characters.json once and pick the most populated value. Cast ids must be drawn from cast.json (verified ids: cory-avis, preston-farr, torrey-woolsey, scott-avis, dallin-rogers, ian, jake). Episode YouTube URLs may be live show URLs from the @TalesofAneria channel; if unknown, use `https://www.youtube.com/watch?v=PLACEHOLDER1` (etc.) — the Zod schema validates the URL shape, not reachability. The site owner will edit JSON in a follow-up PR.
</authoring_seed>
</context>

<tasks>

<!-- =========================================================================
WAVE 1 — FOUNDATIONS
Three independent foundations: data contracts (Zod), JSON-LD factories, helper lib.
Sequenced (not parallel) because all three are small, all touch this plan's
mental model, and Tasks 4–7 depend on every one of them. Single executor, single
plan, single commit per task.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 1: Add Zod schemas for campaigns & episodes to shared/schema.ts</name>
  <files>shared/schema.ts</files>
  <behavior>
    - CampaignSchema parses a valid campaign object and rejects: missing required fields (slug, name, summary, description, status, startDate, cast), invalid status values, non-kebab-case slugs, malformed startDate.
    - EpisodeSchema parses a valid episode object and rejects: missing required fields (id, campaignSlug, episodeNumber, title, summary, airDate, youtubeUrl), non-positive episodeNumber, non-YouTube youtubeUrl (must match youtube.com|youtu.be), malformed airDate, podcastUrl that is not a valid URL when present.
    - CampaignsFileSchema parses `{ campaigns: Campaign[] }`; EpisodesFileSchema parses `{ episodes: Episode[] }`.
    - All four schemas are exported. TypeScript types `Campaign` and `Episode` are exported via `z.infer<typeof CampaignSchema>` / `z.infer<typeof EpisodeSchema>`.
  </behavior>
  <action>
    Append to `shared/schema.ts` (additive only — do not modify existing Drizzle/Zod exports). Add the schemas exactly as specified in 01-RESEARCH.md "Static-Data Validation" section, with these adjustments per CAMP-04 / Pitfall #4:
    - `CampaignSchema`: slug (kebab-case regex `/^[a-z0-9-]+$/`), name, summary (min 1), description (min 1), status (enum active|concluded), startDate (ISO date `/^\d{4}-\d{2}-\d{2}$/`), endDate (optional ISO), cast (`z.array(z.string())`), thumbnail (optional string).
    - `EpisodeSchema`: id, campaignSlug, episodeNumber (positive int), title, summary, airDate (ISO date), youtubeUrl (`z.string().url().refine(u => /youtube\.com|youtu\.be/.test(u))`), podcastUrl (optional valid URL), thumbnail (optional string), duration (optional ISO 8601 string).
    - Exports: `CampaignSchema`, `EpisodeSchema`, `CampaignsFileSchema`, `EpisodesFileSchema`, plus type exports `export type Campaign = z.infer<typeof CampaignSchema>;` and `export type Episode = z.infer<typeof EpisodeSchema>;`.
    Do NOT introduce a Drizzle table for campaigns/episodes (out of scope per CONTEXT.md).
    Run `npm run check` after to confirm no TS regressions.
  </action>
  <verify>
    <automated>npm run check &amp;&amp; npx vitest run test/data/campaigns-data.test.ts -t "schema accepts" 2>/dev/null || npx vitest run shared 2>/dev/null; echo "schema-types-ok"</automated>
  </verify>
  <done>
    `shared/schema.ts` exports `CampaignSchema`, `EpisodeSchema`, `CampaignsFileSchema`, `EpisodesFileSchema`, and `Campaign`/`Episode` types. `npm run check` passes. No existing exports removed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extend structuredData.ts with TVSeries / TVEpisode factories</name>
  <files>client/src/lib/structuredData.ts, test/structured-data.snapshot.test.ts</files>
  <behavior>
    - `getTVSeriesSchema(campaign)` returns `{ "@context": "https://schema.org", "@type": "TVSeries", name, description, url, image, startDate, [endDate?], numberOfEpisodes, actor: Person[], productionCompany, genre }`.
    - `getTVEpisodeSchema(input)` returns `{ "@context", "@type": "TVEpisode", name, episodeNumber, datePublished, description, url, image, partOfSeries, video: VideoObject }` with the embedded VideoObject populating name, description, thumbnailUrl, uploadDate, contentUrl, embedUrl, [duration?].
    - `getPodcastEpisodeSchema(input)` returns `{ "@context", "@type": "PodcastEpisode", ... }` (cheap include per RESEARCH Open Question #1).
    - Snapshot tests verify shape stability for each new factory.
    - Field-presence tests verify CAMP-04 required Google fields: episode JSON-LD has `name`, `thumbnailUrl`, `uploadDate` populated (not undefined) when called with required input.
  </behavior>
  <action>
    1. Append three factory functions to `client/src/lib/structuredData.ts` exactly as specified in 01-RESEARCH.md "JSON-LD Schema Selection" section. Keep them as pure functions — no React, no DOM. Match existing factory style (arrow functions, plain object returns).
    2. Conditional fields: omit `endDate` when undefined, omit `duration` when undefined, omit `image` keys when undefined (use spread-conditional pattern: `...(value ? { key: value } : {})`).
    3. Extend `test/structured-data.snapshot.test.ts`:
       - Import the three new factories.
       - Add `describe('TVSeries Schema', ...)` with snapshot test + assertions: `@type === "TVSeries"`, `actor` is Person[], `genre` includes "Tabletop RPG".
       - Add `describe('TVEpisode Schema', ...)` with snapshot test + assertion that `name`, `video.thumbnailUrl`, `video.uploadDate` are all truthy when called with required input.
       - Add `describe('PodcastEpisode Schema', ...)` snapshot test.
    4. Phase 2 hint: do NOT touch `getPersonSchema` — Phase 2 will reuse it for CHAR-04. Keep new factories isolated.
  </action>
  <verify>
    <automated>npx vitest run test/structured-data.snapshot.test.ts</automated>
  </verify>
  <done>
    Three new exported factories exist. Snapshot tests pass (or are added with `-u` on first run). CAMP-04 required-field assertions green. `npm run check` passes.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add client/src/lib/campaigns.ts helpers</name>
  <files>client/src/lib/campaigns.ts, test/lib/campaigns.test.ts</files>
  <behavior>
    - `youtubeIdFromUrl(url)` returns video id for `youtu.be/<11>`, `youtube.com/watch?v=<11>`, `youtube.com/embed/<11>`; returns null for non-YouTube URLs and malformed inputs.
    - `youtubeThumbnail(url)` returns `https://i.ytimg.com/vi/<id>/hqdefault.jpg` when id parseable; returns undefined otherwise.
    - `getCampaignBySlug(slug)` returns the campaign matching `slug` from `campaigns.json` or undefined.
    - `getEpisodesByCampaign(slug)` returns episodes for that slug, sorted by episodeNumber ascending.
    - `sortCampaignsByStartDateDesc(campaigns)` returns a new array sorted newest-first.
    - All functions are pure; no side effects.
  </behavior>
  <action>
    Create `client/src/lib/campaigns.ts` with the helpers above. `youtubeIdFromUrl` regex: `/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{11})/` (per 01-RESEARCH.md "YouTube thumbnail derivation"). Helpers that read from JSON should accept the data array as a parameter (don't import campaigns.json inside the helper — keeps helpers testable without coupling to seeded content).
    Create `test/lib/campaigns.test.ts`:
    - Cover all three URL formats for `youtubeIdFromUrl` plus null cases.
    - Verify `youtubeThumbnail` returns the expected hqdefault.jpg URL.
    - Verify `getCampaignBySlug` and `getEpisodesByCampaign` against in-test fixtures (don't depend on the seeded campaigns.json yet — Task 4 hasn't run).
    - Verify `sortCampaignsByStartDateDesc` correctness (newest first; equal dates stable).
  </action>
  <verify>
    <automated>npx vitest run test/lib/campaigns.test.ts</automated>
  </verify>
  <done>
    Helpers exported and tested. All test cases pass. No JSON imports inside the helpers (data passed as parameters).
  </done>
</task>

<!-- =========================================================================
WAVE 2 — DATA & VALIDATION GUARD
Seeds the JSON files and locks them down with the build-time integrity test.
The validation test is the gate that stops malformed authoring from ever
shipping again, so it lands in the same commit as the seed data.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 4: Seed campaigns.json + episodes.json and lock with build-time validation test</name>
  <files>client/src/data/campaigns.json, client/src/data/episodes.json, test/data/campaigns-data.test.ts</files>
  <behavior>
    - `campaigns.json` parses against `CampaignsFileSchema`; contains at least one `active` campaign and (ideally) one `concluded` campaign drawn from existing show arcs (read characters.json for naming precedent — see authoring_seed in context).
    - `episodes.json` parses against `EpisodesFileSchema`; contains at least 2 episodes for the seeded active campaign with realistic-shape data.
    - Every `episode.campaignSlug` resolves to an existing campaign slug.
    - Every `campaign.cast[]` id resolves to an id in `cast.json`.
    - Every `(campaignSlug, episodeNumber)` tuple is unique.
    - At least one episode includes `podcastUrl` to exercise that branch in EpisodeDetail.
    - At least one episode includes `thumbnail` (or relies on YouTube thumbnail derivation — both branches must work; the test fixture should cover both).
  </behavior>
  <action>
    1. Read `client/src/data/characters.json` once to identify the most-referenced campaign name (e.g., "The Forgotten Gods Saga", "Journeys Through Taebrin"). Use it as the seed campaign's `name`. Derive `slug` (kebab-case).
    2. Author `client/src/data/campaigns.json` shaped as `{ "campaigns": [ { slug, name, summary, description, status, startDate, [endDate?], cast, [thumbnail?] }, ... ] }`. Cast ids must be drawn from cast.json (`cory-avis`, `preston-farr`, `torrey-woolsey`, `scott-avis`, `dallin-rogers`, `ian`, `jake`). Provide ≥1 active + (optionally) ≥1 concluded campaign so the status filter has content to filter.
    3. Author `client/src/data/episodes.json` shaped as `{ "episodes": [ { id, campaignSlug, episodeNumber, title, summary, airDate, youtubeUrl, [podcastUrl?], [thumbnail?], [duration?] }, ... ] }` with ≥2 episodes for the active campaign. YouTube URLs may be placeholders (`https://www.youtube.com/watch?v=dQw4w9WgXcQ` or real channel videos if known) — the schema validates URL shape, not reachability. Site owner will replace URLs in a follow-up PR.
    4. Create `test/data/campaigns-data.test.ts` exactly as specified in 01-RESEARCH.md "Static-Data Validation" code block:
       - `it("campaigns.json matches schema")` — `CampaignsFileSchema.parse(campaignsData)` does not throw.
       - `it("episodes.json matches schema")` — `EpisodesFileSchema.parse(episodesData)` does not throw.
       - `it("every episode references an existing campaign slug")`.
       - `it("every campaign cast id resolves to a cast member")`.
       - `it("episode (campaignSlug, episodeNumber) tuples are unique")`.
    5. Confirm pre-commit `vitest related --run` will pick this up (it does — the test imports campaigns.json/episodes.json directly).
  </action>
  <verify>
    <automated>npx vitest run test/data/campaigns-data.test.ts</automated>
  </verify>
  <done>
    Both JSON files exist, parse against their schemas, and every integrity test passes. Subsequent malformed edits to either file will fail CI on this test alone.
  </done>
</task>

<!-- =========================================================================
WAVE 3 — INDEX PAGE
First user-visible surface. Mirrors Characters.tsx with status-filter shape.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 5: Implement /campaigns index page (Campaigns.tsx) + unit tests</name>
  <files>client/src/pages/Campaigns.tsx, test/pages/Campaigns.test.tsx</files>
  <behavior>
    - Renders Navigation, SEO (title "Campaigns - Tales of Aneria", canonical https://talesofaneria.com/campaigns, breadcrumb JSON-LD), and Footer chrome — identical to Characters.tsx.
    - Reads `campaignsData.campaigns` and `episodesData.episodes` via static import.
    - Sorts campaigns by `startDate` descending (newest-active first) using `sortCampaignsByStartDateDesc`.
    - Renders status-filter buttons (`All | Active | Concluded`) using shadcn `Button` variants like Characters.tsx.
    - Each campaign renders as a Card (mirrors `CharacterCard` JSX) wrapped in `<Link href={`/campaigns/${slug}`}>` with: name, summary, status `Badge` (variant by status), and episode count derived from `episodesData.episodes.filter(e => e.campaignSlug === slug).length`.
    - data-testid attributes mirror Characters.tsx convention: `card-campaign-${slug}`, `text-campaign-name-${slug}`, `text-campaign-summary-${slug}`, `badge-status-${slug}`, `text-episode-count-${slug}`, `filter-status-${value}`.
    - Empty-state copy when filtered list is empty (e.g., "No campaigns match this filter.") — testid `text-empty-state`.
    - Unit tests: renders all seeded campaigns; filter Active narrows to active only; filter Concluded narrows to concluded only; episode count matches data; clicking a card sets href to `/campaigns/<slug>`.
  </behavior>
  <action>
    Mirror `client/src/pages/Characters.tsx` line-for-line for the page chrome, then swap the body for campaign-list rendering. Use `Link from "wouter"`. Use `getBreadcrumbSchema` for JSON-LD. Do NOT introduce `useMemo` (matches existing Characters.tsx — RESEARCH Anti-Patterns).
    Test file uses `@testing-library/react` (already used in `test/printful-shop.test.tsx` etc.) + a `MemoryRouter`-equivalent via wouter's `Router` wrapper if needed. Pattern reference: `test/printful-shop.test.tsx` and `test/seo.test.tsx`.
    Cover SEO injection by spying on `document.title` or asserting on the breadcrumb JSON-LD shape.
  </action>
  <verify>
    <automated>npx vitest run test/pages/Campaigns.test.tsx</automated>
  </verify>
  <done>
    `/campaigns` renders chronological list with working status filter. All unit tests green. data-testid hooks present for downstream E2E. Mirrors Characters.tsx structure (no new layout patterns introduced).
  </done>
</task>

<!-- =========================================================================
WAVE 4 — DETAIL PAGES
Two detail surfaces. Sequenced because EpisodeDetail's breadcrumb refers to
the campaign route, and we want one human review point per page.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 6: Implement /campaigns/:slug detail page (CampaignDetail.tsx) + unit tests</name>
  <files>client/src/pages/CampaignDetail.tsx, test/pages/CampaignDetail.test.tsx</files>
  <behavior>
    - `useRoute("/campaigns/:slug")`; if slug not found, render the CharacterDetail-style "Not Found" fallback with a `<Link href="/campaigns">` back button.
    - Hero section mirrors CharacterDetail.tsx (title = campaign.name, status `Badge`, optional thumbnail backdrop).
    - Main column renders: description (rendered via the existing `ReactMarkdown + remarkGfm + rehypeSanitize` stack already used in CharacterDetail.tsx — re-use, do not introduce a new markdown lib), and an ordered "Episodes" list. Each episode row links to `/campaigns/<slug>/episodes/<episodeNumber>`, shows `Ep ${n}: ${title}`, airDate, and an optional thumbnail.
    - Sidebar "Cast" card resolves each `castId` via `castData.cast.find(c => c.id === id)` and renders `name` + `avatar` (image path conventions match AboutSection.tsx; use `/cast/${avatar}` if that's the existing pattern, otherwise just render the name). DO NOT cross-link cast→character in v1 (RESEARCH Open Question #2 — explicitly deferred).
    - SEO emits @graph: `[getTVSeriesSchema({...campaign, numberOfEpisodes: episodes.length, cast: resolvedCast.map(c => ({name: c.name}))}), getBreadcrumbSchema([Home, Campaigns, campaign.name])]`. ogType="article".
    - data-testids: `text-campaign-name`, `card-campaign-description`, `card-campaign-cast`, `card-campaign-episodes`, `link-episode-${n}`, `cast-row-${castId}`.
    - Unit tests: known slug renders all sections; unknown slug renders Not Found; cast ids resolve correctly; episode list ordered by episodeNumber asc; JSON-LD passed to SEO contains TVSeries + BreadcrumbList.
  </behavior>
  <action>
    Mirror `client/src/pages/CharacterDetail.tsx` for chrome + hero + sidebar layout. Replace character-specific blocks with campaign blocks. Reuse `getCampaignBySlug` and `getEpisodesByCampaign` helpers from Task 3.
    Cast resolution: import `castData from "@/data/cast.json"`. For unknown ids (defense-in-depth — Task 4's test already prevents this from shipping), skip silently rather than throw.
    Confirm avatar path: read `client/src/components/AboutSection.tsx` once to verify the avatar path convention; mirror exactly.
    Tests: render with a known seeded slug from Task 4's data; render with `/campaigns/does-not-exist` and assert the Not Found fallback.
  </action>
  <verify>
    <automated>npx vitest run test/pages/CampaignDetail.test.tsx</automated>
  </verify>
  <done>
    Campaign detail renders description, cast, and ordered episode list. JSON-LD @graph contains both TVSeries and BreadcrumbList. Not-found fallback works. All unit tests green.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 7: Implement /campaigns/:slug/episodes/:episodeNumber page (EpisodeDetail.tsx) + unit tests</name>
  <files>client/src/pages/EpisodeDetail.tsx, test/pages/EpisodeDetail.test.tsx</files>
  <behavior>
    - `useRoute("/campaigns/:slug/episodes/:episodeNumber")` returning both params on a single match (RESEARCH A1 — verify on first run).
    - 404 fallback when either campaign or episode (campaignSlug + episodeNumber match) cannot be resolved.
    - Hero: `Ep ${n}: ${title}` heading, airDate, optional thumbnail backdrop. Back button → `/campaigns/<slug>`.
    - Main: episode summary (ReactMarkdown stack). Sidebar: two outbound buttons styled like CharacterDetail.tsx D&D Beyond / Playlist buttons:
      - "Watch on YouTube" — always present — `target="_blank" rel="noopener noreferrer"` (CRITICAL — RESEARCH Pitfall: open-redirect/tabnabbing).
      - "Listen on Podcast" — only when `episode.podcastUrl` present — same target/rel.
    - `thumbnailUrl` derivation: prefer `episode.thumbnail`; otherwise call `youtubeThumbnail(episode.youtubeUrl)`. Pass result to both `<SEO ogImage>` AND the JSON-LD VideoObject. If both undefined, the JSON-LD must still parse — but the test asserts thumbnailUrl is populated for at least one seeded episode (so a real episode is always rich-results-eligible).
    - SEO @graph: `[getTVEpisodeSchema({...}), getVideoSchema({name: title, description: summary, thumbnailUrl, uploadDate: airDate, contentUrl: youtubeUrl, [duration?]}), getBreadcrumbSchema([Home, Campaigns, campaign.name, ep label])]`. If `episode.podcastUrl` present, additionally include `getPodcastEpisodeSchema(...)` in the @graph.
    - SEO title: `${campaign.name} — Ep ${n}: ${title}`. ogType="article". canonical absolute URL.
    - data-testids: `text-episode-title`, `link-youtube`, `link-podcast`, `text-episode-summary`, `text-episode-airdate`.
    - Unit tests: known (slug, n) renders; unknown campaign or unknown episodeNumber → Not Found; YouTube link href + target=_blank + rel=noopener noreferrer; podcast link only renders when podcastUrl present; JSON-LD @graph contains TVEpisode + VideoObject + BreadcrumbList; with podcastUrl, @graph also contains PodcastEpisode; VideoObject.thumbnailUrl, name, uploadDate are populated.
  </behavior>
  <action>
    Mirror CharacterDetail.tsx chrome. Build the @graph object once and pass to `<SEO jsonLd={...}>` as a single object (RESEARCH Pitfall #2 — never mount multiple SEO components, never inject JSON-LD outside SEO).
    Outbound link pattern: copy the D&D Beyond `<Button asChild><a href={...} target="_blank" rel="noopener noreferrer">...</a></Button>` block from CharacterDetail.tsx lines 385–399 verbatim and rebadge.
    Episode lookup: `episodesData.episodes.find(e => e.campaignSlug === params.slug && String(e.episodeNumber) === params.episodeNumber)` — string-compare because wouter params are strings.
    Verify wouter multi-param behavior at runtime: if `useRoute("/a/:x/b/:y")` does not return both params (RESEARCH A1 risk), fall back to nested `<Route>` registration. Document the chosen approach in the task summary.
    Tests: cover both `podcastUrl present` and `podcastUrl absent` branches.
  </action>
  <verify>
    <automated>npx vitest run test/pages/EpisodeDetail.test.tsx</automated>
  </verify>
  <done>
    Episode page renders. YouTube link always present with safe rel. Podcast link conditionally renders. JSON-LD @graph passes shape assertions. 404 fallback works. All unit tests green.
  </done>
</task>

<!-- =========================================================================
WAVE 5 — WIRING
Register routes and add header nav. Must come after pages exist (TS imports
would otherwise fail). Tiny but distinct concern from page implementation.
========================================================================= -->

<task type="auto" tdd="false">
  <name>Task 8: Wire routes in App.tsx and add Campaigns entry to Navigation.tsx</name>
  <files>client/src/App.tsx, client/src/components/Navigation.tsx</files>
  <behavior>
    - `App.tsx` `<Switch>` includes three new routes BEFORE the catch-all `<Route component={NotFound} />`:
      - `<Route path="/campaigns" component={Campaigns} />`
      - `<Route path="/campaigns/:slug" component={CampaignDetail} />`
      - `<Route path="/campaigns/:slug/episodes/:episodeNumber" component={EpisodeDetail} />`
    - Imports for the three new pages added to App.tsx with the existing alias-sorted import grouping convention.
    - `Navigation.tsx` `navItems` array gains `{ label: "Campaigns", href: "/campaigns", isRoute: true }` placed between Characters (#characters) and Shop entries — natural location per RESEARCH Open Question #4. The existing `handleNavClick` already handles `isRoute: true` correctly — no logic changes.
    - Mobile menu (if Navigation.tsx has one) automatically picks up the new entry from the same array — verify by reading the rest of Navigation.tsx and confirming the array drives both desktop and mobile renders.
  </behavior>
  <action>
    1. App.tsx: add three imports + three `<Route>` lines following existing pattern (lines 71–72 for the Characters precedent).
    2. Navigation.tsx: insert the new entry into `navItems` (line 14–22). Do NOT change `handleNavClick`. Do NOT introduce `useNavigate` (FORBIDDEN).
    3. Run `npm run check:mistakes` to confirm no accidental `useNavigate` import.
    4. Run `npm run check` and `npm run lint` to confirm no regressions.
  </action>
  <verify>
    <automated>npm run check &amp;&amp; npm run lint &amp;&amp; npm run check:mistakes</automated>
  </verify>
  <done>
    Routes resolve in dev (`/campaigns`, `/campaigns/forgotten-gods-saga`, `/campaigns/forgotten-gods-saga/episodes/1` all render their respective pages). Header has a "Campaigns" link. No lint or type errors.
  </done>
</task>

<!-- =========================================================================
WAVE 6 — END-TO-END + ACCESSIBILITY
Per CLAUDE.md "Include accessibility checks in all E2E tests". Last because
it depends on every page rendering correctly in a real browser.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 9: Playwright E2E with axe accessibility checks for all three pages</name>
  <files>e2e/campaigns.spec.ts</files>
  <behavior>
    - `test('loads campaigns index')` — visit `/campaigns`; assert title matches `/Campaigns.*Tales of Aneria/`; H1 visible; ≥1 `[data-testid^="card-campaign-"]` rendered; passes axe via `expect(page).toPassAxeCheck()` (mirror `e2e/characters.spec.ts` and other existing specs that already use the helper).
    - `test('status filter narrows the list')` — click filter Active, count visible cards; click filter Concluded, count visible cards; click All, count returns to total.
    - `test('campaign detail page')` — visit `/campaigns/<seeded-slug>`; assert page title, description, cast section, episode list visible; passes axe.
    - `test('episode detail page links out safely')` — visit `/campaigns/<slug>/episodes/1`; assert `link-youtube` has `target="_blank"` and `rel` containing `noopener` and `noreferrer`; if podcast link present, same assertions; passes axe.
    - `test('JSON-LD on episode page is valid JSON and contains required fields')` — read the `<script type="application/ld+json">` text from the page, `JSON.parse()` it, assert `@graph` contains an item with `@type === "TVEpisode"` and an item with `@type === "VideoObject"` and that VideoObject has truthy `name`, `thumbnailUrl`, `uploadDate`.
    - `test('unknown campaign slug renders not-found fallback')` — visit `/campaigns/does-not-exist-xyz`; assert "Not Found" affordance + back link.
  </behavior>
  <action>
    Mirror `e2e/characters.spec.ts` for spec-file shape. Use the existing `toPassAxeCheck` helper if exposed via `e2e/global-setup.ts`; otherwise import `@axe-core/playwright` directly with the project's existing pattern (read `e2e/accessibility.spec.ts` once for the canonical incantation).
    Use the seeded slug from Task 4 (read campaigns.json once at the top of the spec to get a real slug rather than hardcoding).
    Per CLAUDE.md WCAG 2.1 AA requirement, every navigated page must run axe at least once.
  </action>
  <verify>
    <automated>npm run test:e2e -- e2e/campaigns.spec.ts</automated>
  </verify>
  <done>
    All E2E tests pass headlessly. Axe finds zero violations on all three new pages. JSON-LD shape assertion green. CI-ready.
  </done>
</task>

<!-- =========================================================================
WAVE 7 — PHASE GATE
Final human verification per success-criteria #4 (Google Rich Results test).
This is genuinely human-only — Google's hosted validator has no public API.
========================================================================= -->

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Campaign archive content surface with three new public routes, JSON-LD structured data (TVSeries + TVEpisode + VideoObject + BreadcrumbList + optional PodcastEpisode), build-time data validation, full unit + E2E + axe coverage. Header has new "Campaigns" entry. All success criteria #1–3 from ROADMAP are automatically verified by the test suite.
  </what-built>
  <how-to-verify>
    Success criterion #4 ("JSON-LD verifiable in Google Rich Results test") is the only remaining gate. After this PR is deployed (or against a public preview URL):

    1. Run `npm run dev` locally (or use a staging URL).
    2. Open https://search.google.com/test/rich-results.
    3. Paste the public URL of one seeded campaign (e.g., `https://talesofaneria.com/campaigns/<seeded-slug>`). Expect: TVSeries detected, no errors. Warnings about optional fields are acceptable.
    4. Paste the public URL of one seeded episode (e.g., `https://talesofaneria.com/campaigns/<seeded-slug>/episodes/1`). Expect: VideoObject detected with no errors (this is the rich-result-eligible type per Google docs). TVEpisode also present. PodcastEpisode if podcastUrl seeded.
    5. Confirm the Schema.org Validator (https://validator.schema.org/) shows no critical issues for both URLs.

    Optional smoke checks while you're there:
    - View page source of `/campaigns/<slug>/episodes/1` → confirm exactly ONE `<script type="application/ld+json">` in `<head>`.
    - Confirm OG/Twitter meta render in a Discord or Twitter URL preview.

    If any required-field error appears (Google reports `name`, `thumbnailUrl`, or `uploadDate` missing on VideoObject), open a follow-up plan to make the corresponding field required in `EpisodeSchema` (Task 1) and re-seed any data missing it.
  </how-to-verify>
  <resume-signal>Type "approved" once both URLs validate cleanly in Google Rich Results test, or describe issues found for follow-up.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Author → repo | Authored campaigns.json/episodes.json content crosses into the bundle on every build. Untrusted only insofar as authoring mistakes can ship. |
| Site → external (YouTube, podcast host) | Outbound links open in new tabs to third-party hosts. |
| Browser → DOM (JSON-LD) | JSON-LD is rendered as `<script type="application/ld+json">` whose textContent is JSON.stringify of an object. No HTML interpolation. |
| Crawler → page | Public read-only surface. No authentication, no PII, no user input accepted. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Tampering | `campaigns.json` / `episodes.json` author-supplied URLs | mitigate | EpisodeSchema's `youtubeUrl` uses `z.string().url().refine(u => /youtube\.com\|youtu\.be/.test(u))`; `podcastUrl` uses `z.string().url()`. test/data/campaigns-data.test.ts gates CI. Prevents `javascript:` and arbitrary-host injection (RESEARCH Pitfall: URL scheme injection). |
| T-01-02 | Tampering | EpisodeDetail / CampaignDetail outbound `<a target="_blank">` | mitigate | All outbound links carry `rel="noopener noreferrer"` (E2E Task 9 asserts this on rendered DOM, not just source). Mirrors CharacterDetail.tsx convention. Prevents tabnabbing. |
| T-01-03 | Tampering | Markdown rendering of campaign/episode descriptions | mitigate | Re-use existing `ReactMarkdown + rehypeSanitize` stack (CharacterDetail.tsx line 211–214). Authored markdown flows through the sanitizer; raw HTML interpolation of authored fields is forbidden. Prevents stored-XSS via markdown. |
| T-01-04 | Tampering | JSON-LD `<script>` content | mitigate | SEO.tsx uses `JSON.stringify(jsonLd)` and sets `textContent` (not innerHTML); `<script type="application/ld+json">` is not executed as JS. Even hostile string content cannot break out. No change required. |
| T-01-05 | Denial of Service (client) | Malformed JSON crashes a page render | mitigate | Build-time Zod test (Task 4) blocks malformed entries from shipping. Detail pages also defensively render Not Found on missing lookup. |
| T-01-06 | Information Disclosure | Authored JSON files | accept | Content is public by design (visible to all visitors). No PII expected — Pre-commit gitleaks scans markdown; JSON files contain only public show metadata. Low risk; standard markdown-secret hooks remain in place. |
| T-01-07 | Spoofing / Repudiation | n/a | n/a | No auth, no user-mutable state. Out of scope. |
| T-01-08 | Elevation of Privilege | n/a | n/a | No new server endpoints; pure client + static data. Out of scope. |
| T-01-09 | DoS (bundle bloat) | Large JSON imports bloat client bundle | accept | Per RESEARCH Pitfall #6, realistic episode counts (<500) keep this under any concerning threshold. Re-evaluate at Phase 5 (SHOP-04 perf budget) if dataset grows. |
</threat_model>

<verification>
**Per-task verification:** the `<verify>` block on each task.

**Phase-level verification (run before Task 9 checkpoint approval):**

```bash
npm run check                                    # TS — clean
npm run lint                                     # ESLint — clean
npm run check:mistakes                           # No useNavigate
npm run test                                     # Full unit suite incl. coverage thresholds
npm run test:e2e -- e2e/campaigns.spec.ts        # E2E + axe
```

Coverage check: new files contribute to the global 40% line threshold. Per-file thresholds (`server/routes.ts`, `server/security.ts`, `server/env-validator.ts`) are not touched by this phase, so no new server-side threshold pressure.
</verification>

<success_criteria>
Mapped 1:1 to ROADMAP success criteria for Phase 1:

1. **"Visitor can open /campaigns and see campaigns listed in chronological order"** — verified by Task 5 unit tests + Task 9 E2E `loads campaigns index` + sort assertion against seeded data.
2. **"Visitor can open any campaign detail page and see description, participating cast, and ordered episodes"** — verified by Task 6 unit tests (all three sections rendered) + Task 9 E2E `campaign detail page`.
3. **"Each archived episode entry links to its YouTube video and (where present) podcast episode"** — verified by Task 7 unit tests (both branches) + Task 9 E2E `episode detail page links out safely` (with safe-rel assertion).
4. **"Campaign and episode pages emit valid JSON-LD verifiable in Google Rich Results test"** — automated portion verified by Task 2 (factory shape), Task 7 (page integration), Task 9 (parsed JSON-LD shape on rendered page); manual external-validator portion verified at the Task 10 human checkpoint.

Additional implicit success:
- Build-time integrity: malformed JSON, dangling cast id, dangling campaignSlug, or duplicate episodeNumber tuple all fail CI (Task 4).
- Accessibility: every new page passes axe (Task 9 — required by CLAUDE.md WCAG 2.1 AA).
- Phase 2 readiness: `client/src/lib/structuredData.ts` is the cohesive home for both `getTVSeriesSchema` (this phase) and `getPersonSchema` usage (Phase 2 CHAR-04).
</success_criteria>

<output>
After completion, create `.planning/phases/01-campaign-archive/01-01-SUMMARY.md` per the standard summary template, recording:
- Files created/modified (final list)
- Seeded campaign slug(s) and episode counts
- Wouter multi-param `useRoute` outcome (RESEARCH A1 — confirmed working OR fell back to nested routes)
- Google Rich Results test outcomes (from Task 10 checkpoint)
- Any RESEARCH Open Questions resolved (especially #1 PodcastEpisode inclusion, #4 nav placement)
- Phase 2 hand-off notes: where in `structuredData.ts` `getPersonSchema` consumer code should land
</output>
