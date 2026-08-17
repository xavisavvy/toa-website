# Phase 2: Character Page Enhancements — Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Source:** /gsd-discuss-phase
**Depends on:** Phase 1 (extends `client/src/lib/structuredData.ts` with `getPersonSchema`)

<domain>
## Phase Boundary

Each character page on `talesofaneria.com` becomes a richer, share-friendly destination: deeper lore, a gallery that distinguishes official-from-fan-from-AI imagery, a character-specific Open Graph card when shared on social media, and `Person` JSON-LD that Google Rich Results can validate.

Existing infrastructure is substantial — this phase **extends** rather than rewrites:
- `client/src/data/characters.json` already has 24 entries with `images[]`, `backstory`, `personality`, `featuredImage`, per-image `isAiGenerated`/`copyright`
- `client/src/pages/CharacterDetail.tsx` (432 lines) is the page to enhance
- `client/src/components/SEO.tsx` already supports per-page `ogImage` (just needs to be passed through)
- `client/src/lib/structuredData.ts` is the JSON-LD factory hub from Phase 1; this phase adds `getPersonSchema` next to `getTVSeriesSchema` etc.

**In scope:**
- Schema migration: add `motivations`, `arcSummary` to characters.json
- Schema migration: add `source: 'official' | 'fan'` per-image; default existing entries to `source: 'official'`
- UI: surface lore (motivations, arcSummary) on CharacterDetail.tsx
- UI: corner badge on AI-generated images + page-level legend
- UI: official/fan badge on each gallery image
- SEO: pass `featuredImage` through to `<SEO ogImage={...}>` on CharacterDetail.tsx
- JSON-LD: `Person` schema (subject = real cast member) on every character page

**Out of scope (explicit):**
- Fan-art submission / upload UI (only the *taxonomy* is required by CHAR-02; ingestion is a future engagement feature)
- Long-form MDX lore (chose flat strings instead)
- `Character` schema.org type (chose Person on the real cast member only)
- Pre-generated or dynamic OG card generation (using raw `featuredImage`)
- Migrating all 24 characters to fully populated `arcSummary` content (planner adds the field; population is a content-authoring follow-up)

</domain>

<decisions>
## Implementation Decisions

### Lore Data Shape — LOCKED
- Add **flat string fields** to each entry in `client/src/data/characters.json`:
  - `motivations: string`
  - `arcSummary: string`
- Both **optional** in the Zod schema initially (not every character has lore yet — population is content-authoring follow-up).
- No nested `lore` object, no MDX, no markdown rendering. Plain strings.
- Existing `backstory` and `personality` fields remain unchanged.

### Image Source Taxonomy — LOCKED
- Add **`source: 'official' | 'fan'`** field per image in the existing `images[]` array.
- **Keep existing `isAiGenerated: boolean`** — orthogonal to source. An image can be `{ source: 'official', isAiGenerated: true }` (e.g., commissioned AI art) or any combination.
- Migration: every existing image entry defaults to `source: 'official'` when the field is added — these images predate the schema change and were curated by the show.
- Zod schema enforces both fields are present on new entries; existing entries get the default applied at the migration step (one-shot script or manual JSON edit per Task plan).

### AI-Disclosure UX — LOCKED
- **Per-image corner badge** on every image where `isAiGenerated: true`. Visible always (not hover-only). Top-right corner overlay with a small icon + "AI" text. Must be:
  - Accessible: `role="img"` or `aria-label="AI-generated image"` on the badge
  - High-contrast against any underlying image
- **Page-level legend** at the start of the gallery section (or under the gallery heading): one short sentence explaining the symbol, e.g., *"Images marked ✨ AI are AI-generated."*
- **Per-image official/fan badge** also visible (different visual style than AI badge — e.g., official = subtle "Official Art" caption; fan = "Fan Art").

### Open Graph Image Strategy — LOCKED
- Use the character's existing **`featuredImage`** directly as `og:image`.
- CharacterDetail.tsx passes `<SEO ogImage={character.featuredImage} ogImageAlt={`${character.name} — official character art`} />`.
- Existing SEO.tsx absolute-URL handling (lines 33–36) will prepend `https://talesofaneria.com` to relative paths.
- No build-time OG composition. No dynamic OG route. No satori.
- Trade-off accepted: the OG card on social shares will be the raw character art with no title overlay or branding. Acceptable for v1 because character art is recognizable and the social-platform-rendered title text adds context.

### Person JSON-LD Subject — LOCKED
- The `Person` JSON-LD on each character page describes the **real cast member** (the player), not the fictional character.
- Maps `Person.name` → `cast.json` lookup by `playerId`. Currently `characters.json[i].playerId` is "preston-farr" → join against `cast.json` to get the real name and any other Person-valid fields (e.g., `url` to social handles if present).
- `Person.description` includes the character context: *"Preston Farr plays Wayne 'Archivist of Lies', a Changeling Wizard, in Tales of Aneria."* Format: planner picks the exact string template; must be deterministic from `cast` + `character` data (no LLM).
- If `playerId` does not resolve in `cast.json`, omit the JSON-LD block entirely for that character (planner handles the conditional). Logging the orphan is fine but **not** failing the page render.
- Schema.org `Person` is the chosen `@type`. **No** `Character` type, **no** `@graph` with both — keep it minimal so Google Rich Results validates cleanly (matches Phase 1 strategy of adding minimal valid types).

### JSON-LD Factory Location — LOCKED
- **Add `getPersonSchema(player: Cast, character: Character)` to `client/src/lib/structuredData.ts`** alongside the Phase 1 factories (`getTVSeriesSchema`, `getTVEpisodeSchema`, `getPodcastEpisodeSchema`).
- Same factory style: pure function, returns the JSON-LD object, no side effects.
- Snapshot-test it the same way Phase 1's factories are tested in `test/structured-data.snapshot.test.ts`.

### Migration Strategy — LOCKED
- Schema changes are applied to `client/src/data/characters.json` **in-place** in a single migration commit (not gradually).
- Build-time integrity test (extends or mirrors Phase 1's `test/data/campaigns-data.test.ts` pattern) catches missing required fields and bad enum values before deploy.
- New optional fields (`motivations`, `arcSummary`) can be empty strings or omitted in any given character entry; planner picks the convention (recommendation: omit when not present, Zod uses `.optional()`).

### UI Pattern Mirroring — LOCKED
- Phase 2 mirrors existing patterns rather than introducing new ones:
  - Gallery enhancements stay inside `CharacterDetail.tsx` (do not extract to new component unless > 80 LoC of badge logic warrants it — planner judges)
  - Use existing shadcn/ui components (`Badge`, `Card`) that the project already has
  - Tailwind utilities only; no new CSS files

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-1 outputs we extend
- `client/src/lib/structuredData.ts` — JSON-LD factory hub. Add `getPersonSchema` here.
- `test/structured-data.snapshot.test.ts` — snapshot test pattern for new factory.
- `client/src/data/cast.json` — source of player data for Person JSON-LD lookup.

### Existing files this phase modifies
- `client/src/data/characters.json` — schema migration target (add fields).
- `client/src/pages/CharacterDetail.tsx` (432 lines) — main UI extension.
- `client/src/components/SEO.tsx` — already supports `ogImage`, no changes needed; just consume.
- `shared/schema.ts` — extend Zod schemas for the new fields (mirror Phase 1's `CampaignSchema` pattern).

### Existing patterns to mirror
- `client/src/pages/CharacterDetail.tsx` lines 380+ (D&D Beyond outbound link block) — outbound link pattern with `target="_blank" rel="noopener noreferrer"`
- Phase 1's `test/data/campaigns-data.test.ts` — build-time integrity test pattern.
- shadcn/ui `Badge` component (already installed) — use for AI / source badges.

### Requirements & decisions sources
- `.planning/REQUIREMENTS.md` — CHAR-01..04 binding requirements.
- `.planning/PROJECT.md` — locked project decisions.
- `CLAUDE.md` — wouter rule, accessibility/test requirements.
- `.github/copilot-instructions.md` — coding standards.

</canonical_refs>

<specifics>
## Specific Ideas

- The AI badge symbol can be ✨ (already used in the deferred-ideas legend in Phase 1's CONTEXT). Planner can pick a Lucide icon (`Sparkles`) for visual consistency with shadcn/ui.
- Player→character relationship is many-to-one in current data (Preston Farr plays Wayne; one player per character). The Person JSON-LD reflects this — one Person per character page.
- The cast.json entry shape is unverified during this discussion — planner must read `cast.json` first to confirm the field names (e.g., is the player's full real name a single field, split first/last, or different from `playerId`?).
- 6 character images exist for 24 characters. Pages without a `featuredImage` should fall back to the show's default OG image (already the SEO.tsx default at `https://talesofaneria.com/og-image.png`). The conditional is trivial — only pass `ogImage` if `featuredImage` is present.

</specifics>

<deferred>
## Deferred Ideas

These came up but are explicitly NOT part of Phase 2. Capture for backlog.

- **Fan-art submission / upload UI** — CHAR-02 only requires the *taxonomy* to be present in the data model and badge UI. Actual fan-content ingestion is fan-engagement work (Phase 4 partially, larger work in v2).
- **Pre-generated composite OG cards** — Possible v2 polish. Adds branding and title overlay. Skipped for v1 because raw character art is recognizable.
- **Dynamic OG generation via satori or similar** — Not needed at 24-character scale. Re-evaluate if character count grows or non-art OG content becomes important.
- **Long-form MDX/markdown lore** — Strings are sufficient for v1. Re-evaluate if any character's lore exceeds ~500 words.
- **`schema.org/Character` JSON-LD** — Google Rich Results doesn't surface this. May be added later for completeness if relevant search engines start using it.
- **Per-character meta title customization** — Currently the page title comes from `character.name`. Possible future: include race/class in title for SEO.
- **Image lightbox / fullscreen viewer** — gallery currently shows images at fixed sizes. A lightbox is a UX improvement, not a CHAR requirement.
- **Cast member's social handles surfaced via Person.url / sameAs** — Could be added when cast.json is enriched. Out of scope for v1 unless cast.json already has it.

</deferred>

---

*Phase: 02-character-page-enhancements*
*Context gathered: 2026-05-08 via /gsd-discuss-phase*
