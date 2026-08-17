# Phase 2: Character Page Enhancements — Research

**Researched:** 2026-05-08
**Domain:** React/Vite character-detail UX — lore expansion, image taxonomy, Person JSON-LD, dynamic OG
**Confidence:** HIGH
**Depends on:** Phase 1 outputs (`structuredData.ts`, `shared/schema.ts` Zod patterns, `test/structured-data.snapshot.test.ts`)

## Summary

Every infrastructure piece this phase needs is already in the codebase. The biggest single finding: **`getPersonSchema` already exists** in `client/src/lib/structuredData.ts` lines 77–93 (it predates Phase 1; it was used historically and is also re-exported in the Phase 1 snapshot test). Its current shape is `(person: { name, description?, image?, sameAs? }) => Person` with a `memberOf: Tales of Aneria` block — almost exactly the shape Phase 2 needs. The phase reduces to (a) **wrapping** that factory with a `getPersonSchemaForCharacter(player, character)` adapter (or simply calling the existing factory directly with derived inputs in `CharacterDetail.tsx`), (b) extending the Zod schema for `motivations`, `arcSummary`, and `images[].source`, (c) adding 4 new sections / badges to `CharacterDetail.tsx`, and (d) passing `character.featuredImage` through to `<SEO ogImage>` (CharacterDetail.tsx already does this on line 123 — the OG work is **already done**).

The big risks are author-data quality, not engineering: (1) two characters have `playerId` values (`tbd`, `brigette-s`) that do not resolve in `cast.json` — Person JSON-LD must skip them. (2) Several entries have `images[].url === ""` or no `featuredImage` — the page must handle empty strings (not just undefined). (3) Existing `CharacterDetail.tsx` already injects a `CreativeWork + BreadcrumbList` `@graph` (lines 97–113) — Phase 2 must extend that `@graph` rather than create a second SEO mount or factory.

**Primary recommendation:** Extend the existing `@graph` in CharacterDetail.tsx with the Person node (conditionally, when `playerId` resolves). Do NOT add a new factory — reuse the existing `getPersonSchema` and pass derived `description` text. Add a thin `lookupCastById(playerId)` helper alongside (or in `client/src/lib/cast.ts` — new file). Mirror Phase 1's `test/data/campaigns-data.test.ts` for a new `test/data/characters-data.test.ts` integrity guard.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Lore data shape:** flat optional string fields `motivations`, `arcSummary` on each `characters.json` entry. No nested `lore`, no MDX, no markdown rendering required (planner picks plain text vs ReactMarkdown reuse). Existing `backstory` and `personality` unchanged.
- **Image source taxonomy:** new `source: 'official' | 'fan'` per image. Keep existing `isAiGenerated`. Migration defaults all existing images to `source: 'official'`.
- **AI disclosure UX:** per-image corner badge (always visible, `aria-label="AI-generated image"`, high-contrast). Page-level legend at gallery start. Per-image official/fan badge (different visual style than AI badge).
- **Open Graph:** pass `character.featuredImage` directly into `<SEO ogImage={...}>`. SEO.tsx already prepends `https://talesofaneria.com` for relative paths (lines 33–36). No build-time or dynamic OG generation.
- **Person JSON-LD subject:** the REAL cast member (player), not the fictional character. Lookup `cast.json` by `playerId`. `Person.description` includes character context. Minimal `@type: Person`, **no** `Character` type, **no** separate `@graph` — extend the existing `@graph` already emitted by CharacterDetail.tsx.
- **JSON-LD factory location:** `client/src/lib/structuredData.ts` next to Phase 1 factories. **Already present as `getPersonSchema` — reuse, do not duplicate.**
- **Migration:** in-place edit of `characters.json`, single commit. Optional fields can be omitted.

### Claude's Discretion

- Exact wording template for `Person.description` (must be deterministic, no LLM).
- Specific Lucide icon for AI badge (Sparkles recommended; CONTEXT specifically calls it out).
- Whether motivations/arcSummary render via plain `<p>` or via the existing ReactMarkdown stack already imported in CharacterDetail.tsx (recommendation below).
- Whether to extract a `<CharacterGalleryImage>` subcomponent. CONTEXT says planner judges; my recommendation is to **inline** — see Risks.
- Whether to add a tiny `client/src/lib/cast.ts` helper module (recommendation: yes, mirroring `client/src/lib/campaigns.ts` from Phase 1).

### Deferred Ideas (OUT OF SCOPE)

- Fan-art submission/upload UI (only the taxonomy is required by CHAR-02)
- Pre-generated or dynamic OG card composition (satori, etc.)
- Long-form MDX/markdown lore
- `schema.org/Character` JSON-LD
- Per-character meta title customization beyond `{character.name}`
- Image lightbox / fullscreen viewer
- Cast member's social handles via Person.url / sameAs (deferred unless cast.json already has them — IT DOES, see verified shape below; planner may opt in cheaply)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAR-01 | Extended lore (background, motivations, arc summary) on every character page | Schema migration (§Zod) + new `<Card>` sections in CharacterDetail (§Integration Points) |
| CHAR-02 | Official-art / fan-art badge taxonomy + AI-generated artwork disclosure | `images[].source` enum + AI badge UX (§shadcn/ui Badge + §Image Source Taxonomy UX) |
| CHAR-03 | Dynamic Open Graph + Twitter Card meta via SEO.tsx | **ALREADY IMPLEMENTED** — CharacterDetail.tsx lines 119–129 pass `ogImage`, `ogImageAlt`, `ogType`, `twitterCard="summary_large_image"` (§OG Verification) |
| CHAR-04 | Valid Person JSON-LD verifiable in Google Rich Results test | Reuse existing `getPersonSchema` + extend existing `@graph` (§Person JSON-LD) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Character/cast data load | Browser (static JSON import) | Vite (build-time bundle) | LOCKED: identical pattern to Phase 1 |
| Person JSON-LD generation | Browser (factory called in component, injected via SEO `useEffect`) | — | Existing SEO.tsx pattern |
| Image badges (AI / source) | Browser (React JSX with shadcn Badge) | — | Pure presentation; data drives variant |
| OG image absolute URL | Browser (SEO.tsx prepends host for relative paths) | — | LOCKED — already working |
| Build-time character data validation | Build (Vitest in CI) | — | Mirror Phase 1 `test/data/campaigns-data.test.ts` |

## Standard Stack

All packages already in `package.json` — **zero new dependencies**.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` 18 + TS | per package.json | Page components | LOCKED |
| `wouter` | per package.json | `useRoute("/characters/:id")` already in CharacterDetail.tsx line 63 | LOCKED |
| `tailwindcss` + `shadcn/ui` | per package.json | `Badge`, `Card`, `Button`, `Tooltip` — all already used | LOCKED |
| `lucide-react` | per package.json | `Sparkles` (AI), `Image` (Official), `Users` (Fan), etc. | Already used throughout |
| `zod` | per package.json | Schema migration in `shared/schema.ts` | Mirror Phase 1 pattern |
| `vitest` | per package.json | Build-time data integrity test + new factory snapshot tests | Mirror Phase 1 |
| `react-markdown` + `remark-gfm` + `rehype-sanitize` | already imported in CharacterDetail.tsx lines 10–12 | If planner chooses markdown rendering for `motivations` / `arcSummary` | Already imported on this page — no extra weight |

[VERIFIED: all imports present in CharacterDetail.tsx]

## cast.json Shape (verified)

```ts
{ cast: Array<{
  id: string;            // join key — e.g., "preston-farr"
  name: string;          // real player name — e.g., "Preston Farr"
  role: string;          // "Game Master" | "Player"
  characters: string[];  // free-text character names (NOT the join key for characters.json)
  isCurrent: boolean;
  avatar: string;        // file basename — e.g., "cast-preston.webp"
  socialLinks: {
    youtube: string;     // may be ""
    twitter: string;
    instagram: string;
    twitch: string;
    website: string;
  };
}> }
```
[VERIFIED by reading `client/src/data/cast.json` in full]

**Join key:** `characters[i].playerId` → `cast[j].id` (string equality).

**Person JSON-LD field selection from cast.json:**
- `name` ← `cast.name` (always present)
- `image` ← `/cast/${cast.avatar}` (always present per cast.json shape — but file path convention needs verification; AboutSection.tsx is the canonical reference per Phase 1 RESEARCH)
- `sameAs` ← `Object.values(cast.socialLinks).filter(url => url.length > 0)` — Preston Farr has 5 populated; Cory Avis has 0; most have 0. Planner: only emit `sameAs` when array non-empty (existing factory already conditionally emits via `person.sameAs` being `undefined`).
- `description` ← deterministic template from character + cast (see §Person JSON-LD)
- `url` ← optional. Could be `cast.socialLinks.website` when populated (Preston has `https://prestonfarr.com`). Planner discretion.

### Orphan playerId audit (CRITICAL — blocks Person JSON-LD on these entries)

[VERIFIED by cross-referencing `characters.json` playerIds against `cast.json` ids]

| character.id | playerId in characters.json | Resolves in cast.json? |
|--------------|---------------------------|-----------------------|
| wayne-archivist | `preston-farr` | ✓ |
| carine-sol | `scott-avis` | ✓ |
| erys-leandorian | `dallin-rogers` | ✓ |
| freya-fenrir | `torrey-woolsey` | ✓ |
| porphan-valaritas | `jake` | ✓ |
| titheus-cillbrost | `ian` | ✓ |
| eve-faraque | `torrey-woolsey` | ✓ |
| bolt | `scott-avis` | ✓ |
| victor-udonta | `preston-farr` | ✓ |
| winifred-fred-blodbane | `torrey-woolsey` | ✓ |
| alomah-stargazer | `colby-poulsen` | ✓ |
| aramis-alderhelm | `dallin-rogers` | ✓ |
| locke-lirien | `preston-farr` | ✓ |
| s-redan-fallowshield | `colby-poulsen` | ✓ |
| whu-mungus | `preston-farr` | ✓ |
| maggie-bramblecheeks | `torrey-woolsey` | ✓ |
| cilin-meekmarrow | `scott-avis` | ✓ |
| ezra | `dallin-rogers` | ✓ |
| ahri-flowers | `preston-farr` | ✓ |
| alan-mcmichaelson | `scott-avis` | ✓ |
| mabel-crosscore | `torrey-woolsey` | ✓ |
| **melly** | **`brigette-s`** | **✗ — cast.json id is `brigette-streeper`** |
| buck-calhoun | `dallin-rogers` | ✓ |
| **holiday-special-1** | **`tbd`** | **✗ — placeholder, no cast entry exists** |

**24 characters → 22 join cleanly, 2 orphans.**

**Resolution options for the planner:**
1. **Fix the data (recommended):** change `melly.playerId` from `"brigette-s"` to `"brigette-streeper"`. The `holiday-special-1` entry is a TBD placeholder — leave its playerId as `"tbd"` and rely on the conditional skip.
2. **Code-only fix:** purely conditional skip in CharacterDetail.tsx — Person JSON-LD just isn't emitted for these two pages. Logging the orphan to `console.warn` (per CONTEXT) is fine.
3. **Both:** fix `melly` (cheap data correction in the same migration commit) and rely on conditional skip for `holiday-special-1`. **This is my recommendation.**

The `test/data/characters-data.test.ts` integrity test should ENFORCE that every non-`tbd` `playerId` resolves — letting `tbd` slide as a known content-authoring placeholder, or asserting strictly and forcing the `melly` fix. Strict assertion is cleaner.

## shadcn/ui Badge Usage and Accessibility

`@/components/ui/badge` exists [VERIFIED — read in full]. It's a `cva`-driven `<div>` with variants `default | secondary | destructive | outline`. No built-in icon support — accepts `children`, `className`, and arbitrary HTML attributes via spread.

```tsx
// Source: client/src/components/ui/badge.tsx (read in full)
<Badge variant="secondary">Fan Art</Badge>
<Badge variant="outline">Official</Badge>
```

**Accessibility:**
- Render order: badges are `<div>` (not `<button>`/`<a>`) — they have no implicit role.
- Add `role="img"` + `aria-label="AI-generated image"` on the AI badge per CONTEXT.
- For source badges (Official/Fan), the visible text serves as the accessible label — no extra `aria-label` needed unless the badge is icon-only.
- shadcn already includes `focus:outline-none focus:ring-2 focus:ring-ring` for keyboard focus.

### Concrete JSX

**AI badge (corner overlay on the gallery image):**
```tsx
// Place inside the existing image wrapper at CharacterDetail.tsx line 246
{image.isAiGenerated && (
  <Badge
    variant="secondary"
    role="img"
    aria-label="AI-generated image"
    className="absolute top-2 right-2 z-10 bg-amber-500/95 text-white border-amber-600 backdrop-blur-sm shadow-md gap-1"
    data-testid={`badge-ai-${image.id}`}
  >
    <Sparkles className="h-3 w-3" aria-hidden="true" />
    AI
  </Badge>
)}
```

**Official / Fan badge (placed in the existing caption gradient overlay at line 264 area):**
```tsx
<Badge
  variant={image.source === "fan" ? "secondary" : "outline"}
  className={cn(
    "text-xs",
    image.source === "official" && "bg-white/10 text-white border-white/40 backdrop-blur-sm"
  )}
  data-testid={`badge-source-${image.id}`}
>
  {image.source === "fan" ? "Fan Art" : "Official Art"}
</Badge>
```

**Page-level legend (above the gallery grid, inside the gallery Card before line 244):**
```tsx
{allImages.some(img => img.isAiGenerated) && (
  <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2" data-testid="text-ai-legend">
    <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
    Images marked AI are AI-generated. We disclose this for transparency; AI-generated images are never used commercially.
  </p>
)}
```

**Contrast check:** `bg-amber-500/95` on `text-white` = 4.55:1 [ASSUMED] — passes WCAG AA for normal text. If image background is also light, the `border-amber-600` + `shadow-md` provide separation. The existing CharacterDetail.tsx already uses the exact same `bg-amber-500 text-white border-amber-600` combo at lines 178–180 for the hero AI badge — so this is consistent and already battle-tested in the codebase.

## CharacterDetail.tsx Integration Points

[VERIFIED — read all 432 lines]

| Concern | Line(s) | Action |
|---------|---------|--------|
| `useRoute("/characters/:id")` + 404 fallback | 63–90 | No change |
| `featuredImage` lookup | 92 | No change |
| **Existing `@graph` JSON-LD** | 97–113 | **EXTEND**: add Person node when `playerId` resolves |
| **`<SEO>` mount with ogImage already passed** | 119–129 | **No change for OG** — CHAR-03 is effectively already done |
| Hero section + AI hero-badge | 132–194 | No change (already shows `featuredImage.isAiGenerated`) |
| **Backstory section** | 202–219 | Insert new **Motivations** card BEFORE / AFTER (recommendation: AFTER backstory, BEFORE personality) |
| **Personality section** | 222–234 | Insert new **Arc Summary** card AFTER personality |
| **Gallery rendering** | 237–336 | Insert AI corner badge + Source badge inside the image wrapper. Also: insert page-level legend above the grid (line 243) |
| Sidebar character info | 340–379 | No change |
| D&D Beyond outbound (pattern source) | 382–402 | No change — the pattern source for any new outbound buttons (none planned in Phase 2) |
| Playlist outbound | 405–425 | No change |

**Existing `@graph` extension (line 110–113):**

```tsx
// BEFORE (current)
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [characterSchema, breadcrumbData]
};

// AFTER (Phase 2)
const player = castData.cast.find(c => c.id === character.playerId);
const personSchema = player ? getPersonSchema({
  name: player.name,
  description: `${player.name} plays ${character.name}, a ${character.race} ${character.class}, in Tales of Aneria.`,
  image: `/cast/${player.avatar}`,            // confirm path in AboutSection.tsx during planning
  sameAs: Object.values(player.socialLinks).filter(u => u.length > 0),
}) : null;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [characterSchema, breadcrumbData, ...(personSchema ? [personSchema] : [])]
};
```

**Graceful-handling audit of existing component for missing/undefined fields:**
- Line 92: `character.images.find(img => img.isFeatured)` — returns `undefined` for entries with no featured image. Subsequent line 173 `featuredImage?.isAiGenerated` uses optional chaining. ✓
- Line 134: `{character.featuredImage && ...}` already guards. ✓ But `featuredImage: ""` is **truthy as a check but breaks `<img src="">` rendering** — see Risks.
- Line 250: `{image.url ? ... : ...}` already handles missing image URL. ✓
- Lines 266, 275, 291: existing `image.artist`, `image.isAiGenerated`, `image.copyright` already optional-guarded. ✓

**The component already handles undefined optional fields gracefully.** Adding `motivations?` and `arcSummary?` will follow the same pattern: `{character.motivations && <Card>...</Card>}`.

## Zod Schema Migration

Mirror Phase 1's pattern in `shared/schema.ts` (lines 168–229). Add a new section below the existing campaigns block.

### Diff

```ts
// =============================================================================
// Character Page Enhancements (Phase 2) — characters.json static-data schema
// =============================================================================

const characterImageSourceEnum = z.enum(["official", "fan"]);

export const CharacterImageSchema = z.object({
  id: z.string().min(1),
  url: z.string().optional(),                // existing entries can have "" or be omitted
  caption: z.string().min(1),
  type: z.string().min(1),                   // "portrait" today; could expand
  isFeatured: z.boolean().optional(),
  artist: z.string().optional(),
  artistUrl: z.string().url().optional(),
  copyright: z.string().optional(),
  isAiGenerated: z.boolean().optional(),
  source: characterImageSourceEnum.default("official"),  // NEW — defaults applied at parse
});

export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  player: z.string().min(1),
  playerId: z.string().min(1),
  campaign: z.string().min(1),
  race: z.string().min(1),
  class: z.string().min(1),
  level: z.number().int().nonnegative(),
  alignment: z.string().min(1),
  featuredImage: z.string().optional(),
  images: z.array(CharacterImageSchema),
  backstory: z.string(),                     // existing entries have non-empty; min(1) optional
  personality: z.string(),
  dndbeyond: z.string().optional(),          // some are "https://...NA" — keep loose, refine later
  dndbeyondId: z.string().optional(),
  playlist: z.string().url().optional(),
  status: z.string().min(1),                 // "active" | "inactive" | "pending"
  motivations: z.string().optional(),         // NEW
  arcSummary: z.string().optional(),          // NEW
});

export const CharactersFileSchema = z.object({
  characters: z.array(CharacterSchema),
});

export type Character = z.infer<typeof CharacterSchema>;
export type CharacterImage = z.infer<typeof CharacterImageSchema>;
```

**Migration note on `source` default:** Zod's `.default("official")` populates the field when missing, so the in-place edit of `characters.json` does NOT have to add `"source": "official"` to every existing image — Zod's `parse()` will inject it. **However**, CONTEXT explicitly states "Migration: every existing image entry defaults to `source: 'official'` when the field is added — these images predate the schema change." This implies the **JSON file** should physically have the field after migration, not just rely on Zod default. Recommend the planner: write the field explicitly in `characters.json` so the data is self-describing without needing to run it through Zod, but keep `.default("official")` as defense-in-depth for any future entries that omit it.

### Mirror Phase 1's data integrity test

Create `test/data/characters-data.test.ts` (mirror of `test/data/campaigns-data.test.ts` lines 1–84):

```ts
import { describe, it, expect } from "vitest";
import charactersData from "@/data/characters.json";
import castData from "@/data/cast.json";
import { CharactersFileSchema } from "@shared/schema";

describe("characters static data", () => {
  it("characters.json matches CharactersFileSchema", () => {
    expect(() => CharactersFileSchema.parse(charactersData)).not.toThrow();
  });

  it("every character.playerId resolves to a cast member or is the 'tbd' placeholder", () => {
    const ids = new Set(castData.cast.map(c => c.id));
    for (const ch of charactersData.characters) {
      if (ch.playerId === "tbd") continue;  // documented placeholder for Holiday Special TBD
      expect(
        ids.has(ch.playerId),
        `character "${ch.id}" has playerId "${ch.playerId}" not in cast.json`
      ).toBe(true);
    }
  });

  it("every character has at least one image entry", () => {
    for (const ch of charactersData.characters) {
      expect(ch.images.length).toBeGreaterThan(0);
    }
  });

  it("every image source is 'official' or 'fan'", () => {
    for (const ch of charactersData.characters) {
      for (const img of ch.images) {
        // After migration, this should be non-default — but Zod default makes the assertion redundant.
        // Keep as a doc-test for future entries that might forget the field.
        const parsed = CharacterImageSchema.parse(img);
        expect(["official", "fan"]).toContain(parsed.source);
      }
    }
  });
});
```

This test catches: malformed entries (Zod), the `melly`/`brigette-s` join failure (forces planner to fix the data), missing images, wrong source enum.

## Snapshot Test Pattern for Person Schema

Phase 1's `test/structured-data.snapshot.test.ts` already has a complete `Person Schema` describe block (lines 190–237) that covers:
- Complete person (with description, image, sameAs)
- Minimal person (name only)
- `memberOf` is "Tales of Aneria"

**Phase 2 must add these new test cases** for the character-context use:

```ts
describe("Person Schema (character page integration)", () => {
  it("includes character context in description", () => {
    const player = { name: "Preston Farr", avatar: "cast-preston.webp", socialLinks: { /* ... */ } };
    const character = { name: "Wayne \"Archivist of Lies\"", race: "Changeling", class: "Wizard" };
    const schema = getPersonSchema({
      name: player.name,
      description: `${player.name} plays ${character.name}, a ${character.race} ${character.class}, in Tales of Aneria.`,
      image: `/cast/${player.avatar}`,
      sameAs: ["https://prestonfarr.com"],
    });
    expect(schema.description).toContain("Wayne");
    expect(schema.description).toContain("Changeling Wizard");
    expect(schema.description).toContain("Tales of Aneria");
    expect(schema.name).toBe("Preston Farr");  // Person is the player, not the character
    expect(schema).toMatchSnapshot();
  });

  it("emits sameAs only when social URLs are non-empty", () => {
    const schemaWithSocials = getPersonSchema({
      name: "Preston Farr",
      sameAs: ["https://prestonfarr.com", "https://x.com/prestonbfarr"],
    });
    expect(schemaWithSocials.sameAs).toHaveLength(2);

    const schemaWithoutSocials = getPersonSchema({ name: "Cory Avis" });
    expect(schemaWithoutSocials.sameAs).toBeUndefined();
  });
});
```

The orphan-playerId case (Person returns null) is a **CharacterDetail.tsx** responsibility, not the factory's — test it in `test/pages/CharacterDetail.test.tsx`:

```ts
it("does not emit Person JSON-LD when playerId does not resolve", () => {
  // render CharacterDetail for the holiday-special-1 entry
  // assert the @graph contains CreativeWork + BreadcrumbList but NOT Person
});
```

## Person JSON-LD: Google Rich Results validation

[CITED: developers.google.com/search/docs/appearance/structured-data/search-gallery — Person is NOT a documented rich-result type]
[CITED: schema.org/Person — name, description, image, url, sameAs, jobTitle, affiliation are all valid Person properties]

**Key finding:** `Person` is **not** in Google's documented rich-result types list (the gallery lists 30+ types including Profile page, Organization, etc., but standalone `Person` is not). However:

1. **Google Rich Results Test will still parse and validate `Person` markup as legal schema.org** — it just won't generate a rich snippet. This is what CHAR-04 is asking for: "valid Person JSON-LD verifiable in Google Rich Results test." [CITED: Google's tool tagline — "verifies your structured data is well-formed"]
2. **Schema.org Validator (validator.schema.org)** is the stricter test for general schema.org compliance — recommend manual verification against BOTH (matches Phase 1's success criterion).
3. **Profile page** (which IS a Google rich-result type) wraps a Person — could be a future enhancement but is out of scope per CONTEXT (no `Character` and no `@graph` re-architecture).

### Concrete Person example (Wayne / Preston Farr)

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Preston Farr",
  "description": "Preston Farr plays Wayne \"Archivist of Lies\", a Changeling Wizard, in Tales of Aneria.",
  "image": "/cast/cast-preston.webp",
  "sameAs": [
    "https://www.youtube.com/@fuzzysquirrel",
    "https://x.com/prestonbfarr",
    "https://www.instagram.com/fuzzysquirreltv",
    "https://www.twitch.tv/fuzzysquirrel",
    "https://prestonfarr.com"
  ],
  "memberOf": {
    "@type": "Organization",
    "name": "Tales of Aneria"
  }
}
```

This matches the existing `getPersonSchema` factory output exactly — **no factory changes needed**. The deterministic description template is:

> `${player.name} plays ${character.name}, a ${character.race} ${character.class}, in Tales of Aneria.`

The character's `name` already includes quoted epithets (e.g., `Wayne "Archivist of Lies"`) — JSON.stringify handles the escaping. JSON-LD spec accepts escaped quotes inside string values.

### Image absolute-URL handling for Person

[VERIFIED: SEO.tsx lines 33–36 prepend `https://talesofaneria.com` for `og:image` only]

The `og:image` absolute-URL prepend logic in `SEO.tsx` does **not** apply to JSON-LD. The Person factory currently emits `image` as whatever the caller passes. Schema.org allows both relative and absolute URLs for image, but Google's documentation generally recommends absolute URLs.

**Recommendation:** when calling the factory from CharacterDetail.tsx, pass the absolute URL:

```ts
image: `https://talesofaneria.com/cast/${player.avatar}`,
```

This avoids ambiguity in the validator. Same applies to the `image` on the existing `getCreativeWorkSchema` call (currently relative — line 102 passes `character.featuredImage` which can be a relative path like `/characters/wayne-archivist.webp`). **Phase 2 does NOT need to fix the existing relative image — it's pre-existing — but the new Person.image should be absolute from the start.** Note this as a consistency-improvement opportunity for a follow-up.

### Twitter Card

Per CHAR-03: `twitterCard="summary_large_image"` is appropriate for character pages. **Already set** in CharacterDetail.tsx line 128. No change.

## Open Graph: CHAR-03 status

[VERIFIED: CharacterDetail.tsx lines 119–129]

```tsx
<SEO
  title={`${character.name} - ${character.race} ${character.class} | Tales of Aneria`}
  description={metaDescription}
  canonical={`https://talesofaneria.com/characters/${character.id}`}
  ogImage={character.featuredImage}                // ← already passes featuredImage
  ogImageAlt={`${character.name} - ${character.race} ${character.class} character portrait`}
  ogType="profile"
  keywords={...}
  jsonLd={structuredData}
  twitterCard="summary_large_image"
/>
```

**CHAR-03 is effectively already implemented.** The only gap relative to CONTEXT is:
- CONTEXT specifies `ogImageAlt={`${character.name} — official character art`}` (em dash, "official character art" wording).
- Current code uses `ogImageAlt={`${character.name} - ${character.race} ${character.class} character portrait`}` (hyphen, race+class wording).

Either is valid. Planner picks. The CONTEXT wording is more aligned with the new image-source taxonomy ("official"). Recommend updating to match CONTEXT.

**One real fix needed:** when `character.featuredImage` is `""` (empty string — e.g., `eve-faraque` and `holiday-special-1` and `alan-mcmichaelson` have empty or omitted `featuredImage`), `<SEO ogImage="">` will trigger SEO.tsx line 34's `''.startsWith('http')` → false, then prepend host → `https://talesofaneria.com` (no path). That's a broken og:image. The fix: `ogImage={character.featuredImage || undefined}` so SEO.tsx falls back to its default `og-image.png`.

## Risks and Unknowns

### R1: `featuredImage: ""` triggers a broken og:image URL [HIGH severity, easy fix]

[VERIFIED: 3 of 24 character entries have `featuredImage: ""` or omit it: `eve-faraque`, `alan-mcmichaelson`, `holiday-special-1`]

`<SEO ogImage={character.featuredImage}>` passes the empty string. SEO.tsx line 34 (`ogImage.startsWith('http')`) is false, so line 36 builds `https://talesofaneria.com${''}` → `https://talesofaneria.com`, which is not a valid OG image. Crawlers fall back to the page's text-only card.

**Fix:** in CharacterDetail.tsx, pass `ogImage={character.featuredImage || undefined}` so SEO.tsx uses its default `og-image.png`. This is a **one-line change** but should land in Phase 2 explicitly.

### R2: `playerId` orphan resolution [MEDIUM, decided above]

22/24 resolve. The `melly` entry has `brigette-s` (cast.json id is `brigette-streeper`) — recommend fixing in the same migration commit. `holiday-special-1` has `tbd` placeholder — skip Person JSON-LD for that page conditionally and add a `console.warn` for visibility.

### R3: `images[].url === ""` in `eve-faraque` [LOW]

The component already handles this at line 250 (`{image.url ? ... : ...}`). Phase 2's badges should also conditionally render — only show source/AI badges when an actual image is rendered (i.e., inside the `image.url ? <>...</> : ...` block). Don't apply badges to the placeholder Sword icon.

### R4: Existing `@graph` already injects `CreativeWork` for the character [MEDIUM — design decision]

CharacterDetail.tsx already creates a `CreativeWork` for the character at line 97 and passes it through SEO.tsx. CONTEXT's "no `Character` schema.org type" decision was about not adding a NEW `Character` type — it does not require removing the existing `CreativeWork`. The new Person schema **adds to** the existing `@graph`. Both can coexist. If the planner chooses to remove `getCreativeWorkSchema` to make Person-only output cleaner, that's an unscoped behavior change — recommend KEEPING the CreativeWork and ADDING Person.

### R5: Person.image path convention not yet verified

CONTEXT says cast.json has `avatar: "cast-preston.webp"` (verified). The path the public site serves these from is unverified in this research session — Phase 1 RESEARCH (line 304) noted "image path conventions match AboutSection.tsx". **Planner must read AboutSection.tsx during Task 1** (one read, ~15 sec) and use the verified path prefix (likely `/cast/` based on naming). Same convention applies to the new Person.image and to any author-supplied avatar paths.

### R6: Bundle bloat from optional fields [NONE]

Adding `motivations?: string` and `arcSummary?: string` to 24 entries adds at most ~15KB to the JSON bundle (estimate: ~250 words × 24 × 2 fields × ~6 bytes/char). Phase 1 RESEARCH already accepted this category of bloat as fine at this scale. ✓

### R7: Existing `Person Schema` snapshot tests will be updated when description text changes [LOW]

The snapshot tests in `test/structured-data.snapshot.test.ts` lines 190–237 use abstract person data ("John Smith"). Phase 2 doesn't change the factory — just adds new test cases for character context — so the existing snapshots won't be invalidated. Run `npx vitest run test/structured-data.snapshot.test.ts` after to confirm.

### R8: Component refactor pressure [DEFERRED]

The image-rendering loop (CharacterDetail.tsx lines 244–333, 90 lines of JSX) is approaching the "extract a component" threshold CONTEXT mentioned (>80 LoC of badge logic). Adding the AI corner badge + Source badge + legend pushes it past 100 lines. **Recommendation: extract `<CharacterGalleryImage image={image} />` into a sibling file** `client/src/components/characters/CharacterGalleryImage.tsx` (matching Phase 1's optional-component placement convention `client/src/components/campaigns/`). The planner judges; CONTEXT defers to planner. Skipping the extraction is also fine — the file is still under 600 lines and the image loop is self-contained.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (unit + snapshot) + Playwright (E2E w/ axe) |
| Config file | `vitest.config.ts`, `playwright.config.ts` (verified by Phase 1) |
| Quick run command | `npm run test:quick` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAR-01 | Motivations + arcSummary render when present, hidden when absent | unit (component) | `vitest run test/pages/CharacterDetail.test.tsx` | ❌ Wave 0 (or extend if exists) |
| CHAR-02 | AI corner badge renders when `image.isAiGenerated === true` and has correct `aria-label` | unit | same | ❌ Wave 0 |
| CHAR-02 | Official/Fan badge renders correct text per `image.source` | unit | same | ❌ Wave 0 |
| CHAR-02 | Page-level legend appears when at least one image is AI; hidden otherwise | unit | same | ❌ Wave 0 |
| CHAR-03 | `<SEO>` receives `ogImage`, `ogImageAlt`, `twitterCard="summary_large_image"` | unit | same — assert props passed to mocked SEO | ❌ Wave 0 (verify ALREADY GREEN — this works today) |
| CHAR-03 | When `featuredImage === ""`, ogImage is undefined (falls back to site default) | unit | same | ❌ Wave 0 |
| CHAR-04 | Person schema includes name, description (with character context), image, sameAs (when populated) | unit (factory) | `vitest run test/structured-data.snapshot.test.ts` | ✓ Phase 1 file — extend with new describes |
| CHAR-04 | When playerId orphans, no Person node in @graph | unit (component) | `vitest run test/pages/CharacterDetail.test.tsx` | ❌ Wave 0 |
| (cross-cutting) | `characters.json` validates against CharactersFileSchema; every non-tbd playerId resolves | unit | `vitest run test/data/characters-data.test.ts` | ❌ Wave 0 |
| (a11y) | Character page passes axe; AI badge has accessible label | E2E | `npm run test:e2e -- characters.spec.ts` | Existing `e2e/characters.spec.ts` — extend |

### Sampling Rate

- **Per task commit:** `npm run test:quick` (pre-commit `vitest related --run` covers changed files automatically)
- **Per wave merge:** `npm run test` (full unit suite + 40% global coverage threshold)
- **Phase gate:** Full suite green + manual Google Rich Results Test on a sample character URL

### Wave 0 Gaps

- [ ] `test/data/characters-data.test.ts` — schema integrity guard (mirror Phase 1)
- [ ] `test/pages/CharacterDetail.test.tsx` — extend or create; cover CHAR-01..04 component-level behavior
- [ ] `test/structured-data.snapshot.test.ts` — add new `Person Schema (character page integration)` describe block
- [ ] `e2e/characters.spec.ts` — verify exists; if so, extend axe + JSON-LD shape assertions; if not, create

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No new auth surface |
| V3 Session Management | no | No session interaction |
| V4 Access Control | no | All content public |
| V5 Input Validation | yes | Zod at build time on `characters.json`; image `source` enum constrained; `artistUrl` validated `.url()` |
| V6 Cryptography | no | None introduced |
| V11 Business Logic | yes (light) | Author-curated content; risk surface minimal |
| V13 API & Web Service | no | No new endpoints |

### Known Threat Patterns for static-content + outbound-link pages

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via authored fields rendered as HTML | Tampering | `motivations`/`arcSummary` should follow the same `ReactMarkdown + rehypeSanitize` stack already used at line 211–214 — OR be rendered as plain text with `<p>{character.motivations}</p>`. Plain text is safer and matches CONTEXT ("no MDX, no markdown rendering"). Recommend plain `<p>` until any character has lore exceeding plain text |
| Open-redirect / tabnabbing on `image.artistUrl` outbound | Tampering | Existing pattern at line 305–308 already includes `target="_blank" rel="noopener noreferrer"`. Phase 2 adds no new outbound links |
| URL scheme injection in `artistUrl` (e.g., `javascript:`) | Tampering | New Zod `CharacterImageSchema.artistUrl: z.string().url().optional()` enforces URL shape (z.url rejects `javascript:` schemes by default per zod's URL definition) |
| Person JSON-LD `<script>` content | Tampering | SEO.tsx uses `JSON.stringify(jsonLd)` and `textContent` (not innerHTML). Even malicious content cannot break out of `<script type="application/ld+json">` (browsers don't execute it as JS) |
| Malformed JSON crashes page render | DoS | Build-time Zod test (Wave 1) blocks; runtime defensive `if (!character) return <NotFound />` already present (line 70) |
| Bundle disclosure | InfoDisc | Public data only; no PII added by Phase 2 |

**No human-review-required code zones touched.** Phase 2 modifies `client/src/pages/`, `client/src/lib/`, `client/src/data/`, `shared/schema.ts` (additive Zod only). All AI-Safe per CLAUDE.md.

## Project Constraints (from CLAUDE.md)

- **Wouter only — `useNavigate` is forbidden.** Phase 2 introduces no new navigation; existing CharacterDetail.tsx uses `<Link>` and `useRoute`. ✓
- **Path aliases:** `@/` = `client/src/`, `@shared/` = `shared/`. Use throughout.
- **Conventional Commits.** Single-commit migration per CONTEXT lines 80–82 → `feat(characters): expand lore + image taxonomy + Person JSON-LD`.
- **WCAG 2.1 AA** — every E2E test on the character page MUST include `await expect(page).toPassAxeCheck()`. The new AI badge needs the documented `aria-label="AI-generated image"`.
- **Pre-commit:** ESLint, related Vitest, markdown secret scan. Pre-push: full suite + 40% line / 47% function coverage on `server/routes.ts` (untouched by this phase).
- **No raw SQL.** N/A.
- **`shared/schema.ts`** is shared — additive Zod only; do not modify existing exports.
- **Script parity (`*.ps1` ↔ `*.sh`).** No new scripts in this phase.
- **Markdown secret prevention.** Author-supplied lore is plain string in JSON; `npm run check:markdown-secrets` does not target JSON. Risk is low (data is public). No additional control needed.
- **Git status reporting.** End each task summary with the Git Status block.

## Code Examples (verified patterns to mirror)

### Reading playerId → cast member

```ts
// client/src/lib/cast.ts (NEW — recommended; keeps lookup pure and testable)
import castData from "@/data/cast.json";

export function getCastMemberById(playerId: string) {
  if (!playerId || playerId === "tbd") return undefined;
  return castData.cast.find(c => c.id === playerId);
}

export function getCastSocialUrls(socialLinks: Record<string, string>): string[] {
  return Object.values(socialLinks).filter(u => typeof u === "string" && u.length > 0);
}
```

### Person JSON-LD assembly (in CharacterDetail.tsx)

```tsx
import { getCastMemberById, getCastSocialUrls } from "@/lib/cast";

// Inside the component, replacing line 110-113:
const player = getCastMemberById(character.playerId);
const personSchema = player
  ? getPersonSchema({
      name: player.name,
      description: `${player.name} plays ${character.name}, a ${character.race} ${character.class}, in Tales of Aneria.`,
      image: `https://talesofaneria.com/cast/${player.avatar}`,
      sameAs: getCastSocialUrls(player.socialLinks),
    })
  : null;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    characterSchema,
    breadcrumbData,
    ...(personSchema ? [personSchema] : []),
  ],
};
```

### og:image safe pass-through

```tsx
// CharacterDetail.tsx line 123, change:
ogImage={character.featuredImage || undefined}
ogImageAlt={`${character.name} — official character art`}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `bg-amber-500/95` on `text-white` is ≥4.5:1 contrast | shadcn Badge UX | Low — visual QA at E2E time; existing CharacterDetail.tsx already uses the same color combo at line 178 with no reported issue |
| A2 | Cast avatar files are served from `/cast/` (matching Phase 1's note about AboutSection.tsx) | Person.image path | Low — planner confirms by reading AboutSection.tsx during Task 1 |
| A3 | Google Rich Results Test parses Person markup successfully (even though Person is not a documented rich-result type, the validator still flags malformed schema.org) | Person JSON-LD | Low — verified manually at the human checkpoint at the end of the phase |
| A4 | Schema.org Person allows escaped quotes inside string values (e.g., character name `Wayne "Archivist of Lies"`) | Person.description template | Very low — JSON spec |
| A5 | `motivations` and `arcSummary` will be authored as plain text, not markdown, in v1 | Security § | Low — if markdown is later wanted, add `ReactMarkdown + rehypeSanitize` rendering. The stack is already imported on this page |
| A6 | `holiday-special-1` will remain a placeholder in v1 (planner does NOT need to populate it) | Orphan playerId resolution | Low — CONTEXT scopes population as a content-authoring follow-up |

## Open Questions (RESOLVED)

> Mark RESOLVED when planner closes them in PLAN.md (Phase 1 lesson learned).

1. **Should `motivations` / `arcSummary` render via ReactMarkdown or plain `<p>`?** — **RESOLVED:** Render motivations and arcSummary as plain `<p>` (mirrors existing Personality block); ReactMarkdown stays scoped to Backstory.

2. **Should the planner extract `<CharacterGalleryImage>` into its own file?** — **RESOLVED:** Do NOT extract `<CharacterGalleryImage>` in Phase 2; defer to a follow-up cleanup commit.

3. **Fix `melly.playerId` from `"brigette-s"` to `"brigette-streeper"` in the same migration commit?** — **RESOLVED:** Fix `melly.playerId` to `"brigette-streeper"` in the migration commit (Task 3).

4. **Use absolute URLs (`https://talesofaneria.com/cast/...`) for Person.image and emit a follow-up to also fix `getCreativeWorkSchema` image to be absolute?** — **RESOLVED:** Omit `image` from Person JSON-LD in v1 — cast avatars are bundled assets with no public URL; revisit when public cast portraits ship.

5. **Add `cast.socialLinks.website` as `Person.url` (in addition to `sameAs`)?** — **RESOLVED:** Pass `cast.socialLinks.website` (when populated) into `sameAs` alongside socials; do NOT modify `getPersonSchema` factory.

## Environment Availability

No new external dependencies. All required tools already in the project.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 18+ | Build, test | ✓ | per project | — |
| `wouter`, `zod`, `vitest`, `react-markdown`, `lucide-react` | Phase 2 | ✓ | per package.json | — |
| Google Rich Results Test (https://search.google.com/test/rich-results) | Manual post-deploy verification (CHAR-04) | ✓ web tool | n/a | Schema.org Validator (validator.schema.org) |

**Missing dependencies with no fallback:** None.

## Sources

### Primary (HIGH confidence)
- `client/src/data/characters.json` (read in full — all 24 entries, 665 lines) — orphan-playerId audit
- `client/src/data/cast.json` (read in full — 9 cast members, 153 lines) — join-key verification
- `client/src/pages/CharacterDetail.tsx` (read in full — 432 lines) — integration points
- `client/src/components/SEO.tsx` (read in full — 109 lines) — OG/JSON-LD injection mechanics
- `client/src/lib/structuredData.ts` (read in full — 202 lines) — `getPersonSchema` already exists at lines 77–93
- `client/src/components/ui/badge.tsx` (read in full) — variants and accessibility
- `shared/schema.ts` (read in full — 229 lines) — Zod migration target + Phase 1 pattern
- `test/structured-data.snapshot.test.ts` (read in full — 526 lines) — snapshot test pattern
- `test/data/campaigns-data.test.ts` (read in full — 84 lines) — data integrity test pattern
- `.planning/phases/02-character-page-enhancements/02-CONTEXT.md` (read in full)
- `.planning/phases/01-campaign-archive/01-PLAN.md` (read in full)
- `.planning/phases/01-campaign-archive/01-RESEARCH.md` (read in full)
- `CLAUDE.md` — project standards

### Secondary (MEDIUM confidence)
- schema.org Person property list (fetched live) — `name`, `description`, `image`, `url`, `sameAs`, `jobTitle`, `affiliation` confirmed as standard
- Google Search Central — Structured data feature gallery (fetched live) — Person is NOT in the documented rich-result type list; Profile page is (deferred)

### Tertiary (LOW confidence)
- Cast avatar path prefix (`/cast/`) — assumed based on Phase 1 RESEARCH note; planner verifies by reading `client/src/components/AboutSection.tsx` during execution

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in package.json and used.
- Architecture: HIGH — direct extension of an existing pattern; the factory already exists.
- Pitfalls/risks: HIGH for R1 (data audit done), R2 (orphan audit done), R3 (verified), R4 (decided). MEDIUM for R5 (avatar path — quick verify needed).
- JSON-LD selection: HIGH — Person factory already in repo, schema.org Person properties verified live, Google rich-result eligibility researched live.
- Image taxonomy UX: HIGH — Badge component verified; existing AI-badge styling at line 178 provides a contrast precedent.

**Research date:** 2026-05-08
**Valid until:** 2026-06-07 (30 days — domain stable; schema.org Person, shadcn Badge API, and the static-data pattern all change rarely)
