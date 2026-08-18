# Phase 1: Campaign Archive — Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Source:** /gsd-discuss-phase

<domain>
## Phase Boundary

Visitors can browse the show's campaigns (narrative arcs / sagas) and the episodes within each, as a coherent navigable archive. Each campaign and episode page surfaces enough context (description, cast, ordered episodes, external links) for a visitor to find what to watch next. Pages emit JSON-LD structured data so search engines can index them as proper TV-show entities.

This phase introduces a new content surface to a previously commerce-and-character-focused site. No existing campaign or episode data lives in the codebase yet — `shared/schema.ts` has no campaign/episode tables, `client/src/pages/` has no campaign pages, and `client/src/data/` has no campaign data. This is greenfield content modeling on top of existing site infrastructure.

**In scope:**
- Campaign index page (`/campaigns`)
- Campaign detail page (`/campaigns/<slug>`)
- Episode detail page (`/campaigns/<slug>/episodes/<n>`)
- JSON-LD structured data on all three surfaces
- Outbound links to YouTube + podcast for each episode
- File-based content authoring workflow (`campaigns.json`, `episodes.json`)

**Out of scope (explicit):**
- Admin UI for authoring campaigns/episodes (file-based PR workflow only for v1)
- Auto-pulling episodes from the YouTube channel feed
- Per-episode comments, likes, or social-engagement features
- Search across episodes
- Cast↔episode appearance tracking (campaign-level cast list only)

</domain>

<decisions>
## Implementation Decisions

### Source of Truth for Campaign/Episode Data — LOCKED
- Campaign and episode content lives in **static JSON files** following the existing `client/src/data/{cast,characters,social-links}.json` pattern.
- Two new files: `client/src/data/campaigns.json` and `client/src/data/episodes.json`.
- Content is authored by editing JSON and committing via PR. No DB schema changes. No admin UI for authoring in v1.
- Rationale: matches the established static-content pattern; campaigns change rarely; avoids new Drizzle tables, migrations, and admin forms.

### What "Campaign" Means — LOCKED
- A **campaign = a narrative arc / saga** (e.g., "The Forgotten Gods Saga").
- Multiple campaigns are expected over the lifetime of the show.
- Each campaign has a slug, display name, description, ordered list of participating cast members (by cast id from `cast.json`), and an ordered list of episodes.
- Campaigns have a status: `active` (currently airing) or `concluded`.

### Episode Source-of-Truth Strategy — LOCKED
- Episodes are **manually authored JSON entries with outbound links** to YouTube and (optionally) podcast.
- Each episode entry minimally has: `id`, `campaignSlug`, `episodeNumber`, `title`, `summary`, `airDate` (ISO), `youtubeUrl`, `podcastUrl?` (optional). Additional fields permitted as the planner sees fit (e.g., `runtime`, `thumbnail`).
- No auto-pull from YouTube channel feed in v1. No auto-enrichment at render time. Plan for the data to be fully static after build.
- Episode title may differ from the YouTube video title (e.g., "Ep 12: Into the Mire" rather than the raw video title).

### URL Structure — LOCKED
- **Nested** routes via wouter:
  - Index: `/campaigns`
  - Detail: `/campaigns/<slug>`
  - Episode: `/campaigns/<slug>/episodes/<episodeNumber>`
- Episode URL identifies episode by integer episodeNumber within campaign, not a global id.

### Surface Naming — LOCKED
- Public-facing label: **"Campaigns"** (matches requirement language; familiar to TTRPG audience).
- Page titles: "Campaigns", "<Campaign Name>", "<Campaign Name> — Ep <N>: <Title>".
- Navigation entry added to header/footer as appropriate (planner determines exact placement using existing `client/src/components/layout/` patterns).

### Index Page Browsing Affordances — LOCKED
- Chronological list of campaigns (newest-active first, or by `startDate` descending — planner picks the more obvious ordering once data shape is final).
- **Status filter** (`All` / `Active` / `Concluded`) — client-side filter UI on the index page.
- Each list item shows: campaign name, summary, status badge, episode count.

### JSON-LD Schema — Claude's Discretion
- CAMP-04 says "Episode / VideoObject / TVSeries-equivalent" — exact `@type` selection delegated to the researcher/planner. Suggested: `TVSeries` for campaign, `TVEpisode` (with embedded `VideoObject` referencing the YouTube URL) for each episode. Final choice should validate against Google Rich Results test (success-criterion #4 in ROADMAP.md).
- Use existing `client/src/lib/structuredData.ts` as the integration point — extend rather than replace.

### Authoring Workflow — Claude's Discretion
- File-based: contributor edits `campaigns.json` / `episodes.json`, opens PR.
- Validation strategy (Zod schema, build-time check, etc.) is for the planner to specify — but a build-time validation is strongly preferred so a malformed entry fails CI rather than runtime.

### Cast Linkage — LOCKED (light)
- Campaign has `cast: string[]` — array of cast member IDs from existing `cast.json`.
- No per-episode cast tracking in v1 (deferred — see Deferred Ideas).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing patterns to follow
- `client/src/data/cast.json` — file-based content data pattern
- `client/src/data/characters.json` — file-based content data pattern
- `client/src/pages/Characters.tsx` — list-page pattern (precedent for `/campaigns` index)
- `client/src/pages/CharacterDetail.tsx` — detail-page pattern (precedent for campaign + episode detail)
- `client/src/components/SEO.tsx` — OG/Twitter meta component (page-level meta integration)
- `client/src/lib/structuredData.ts` — JSON-LD generation utility (extend for TVSeries/TVEpisode)
- `client/src/App.tsx` — wouter route registration (where new routes are added)

### Existing integrations referenced (read-only — no changes needed in this phase)
- `server/youtube.ts` — cached YouTube endpoint (episode YouTube URLs validated against this if needed)
- `server/podcast.ts` — podcast RSS integration (episode podcast URLs structurally similar)

### Requirements & decisions sources
- `.planning/REQUIREMENTS.md` — CAMP-01..04 (binding requirements for this phase)
- `.planning/PROJECT.md` — locked project decisions (e.g., DEC-security-scanning)
- `.planning/intel/decisions.md` — synthesized ADRs from doc ingest
- `docs/ROADMAP.md` — historical roadmap context (informational only)
- `CLAUDE.md` — wouter `useNavigate` rule, route patterns
- `.github/copilot-instructions.md` — coding standards including accessibility/test requirements

</canonical_refs>

<specifics>
## Specific Ideas

- Show is "Tales of Aneria" — a TTRPG live play. Audience is TTRPG fans, so "campaigns" terminology is on-brand (won't confuse).
- Existing site already has rich character pages (`Characters.tsx`, `CharacterDetail.tsx`) — campaign cast lists should link to these character pages where the cast member plays a character.
- The existing `cast.json` distinguishes cast (real people) from `characters.json` (in-world characters). Campaign cast list links to **cast** entries, but the cast member's character can be cross-linked via the existing cast↔character relationship.
- Empty-state copy worth getting right: when there's only one campaign listed, the index should still feel intentional (not "empty list").
- The site is React 18 + Vite + wouter + Tailwind + shadcn/ui — new pages must follow existing component conventions (no new UI library).

</specifics>

<deferred>
## Deferred Ideas

These came up but are explicitly NOT part of Phase 1. Capture for backlog.

- **Per-episode cast appearances** — tracking which cast member appeared in which episode (Phase 2 / future content modeling). v1 only tracks campaign-level cast.
- **Admin UI for authoring campaigns/episodes** — file-based for now; revisit if non-developers need to author.
- **Auto-pull from YouTube channel feed** — would reduce manual authoring but requires reconciling auto-pulled metadata with curated titles. Defer until episode count makes manual authoring painful.
- **Episode-level engagement (comments, ratings)** — out of scope; would be its own engagement phase.
- **Cross-campaign search** — index has status filter; search is a future affordance.
- **Episode runtime / thumbnail enrichment from YouTube cache** — could be added later without breaking the schema.
- **`PodcastEpisode` JSON-LD on episode pages** — possible addition alongside `TVEpisode`. Planner may include if cheap; otherwise defer.

</deferred>

---

*Phase: 01-campaign-archive*
*Context gathered: 2026-05-08 via /gsd-discuss-phase*
