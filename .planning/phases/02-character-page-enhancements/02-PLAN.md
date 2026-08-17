---
phase: 02-character-page-enhancements
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - shared/schema.ts
  - client/src/data/characters.json
  - client/src/lib/cast.ts
  - client/src/pages/CharacterDetail.tsx
  - test/data/characters-data.test.ts
  - test/lib/cast.test.ts
  - test/structured-data.snapshot.test.ts
  - test/pages/CharacterDetail.test.tsx
  - e2e/characters.spec.ts
autonomous: false
requirements:
  - CHAR-01
  - CHAR-02
  - CHAR-03
  - CHAR-04
tags: [character-pages, seo, json-ld, image-taxonomy, ai-disclosure, structured-data]

must_haves:
  truths:
    - "Visitor opens any character page and sees Backstory + Personality + (when populated) Motivations + (when populated) Arc Summary, with empty optional sections fully hidden (no orphan headings)"
    - "Every gallery image renders an Official Art / Fan Art badge derived from images[].source; AI-generated images additionally render a high-contrast corner AI badge with aria-label=\"AI-generated image\""
    - "Above the gallery grid, a one-sentence legend appears IF AND ONLY IF at least one rendered image is AI-generated"
    - "Sharing a character page on a social platform renders the character-specific featuredImage as og:image (when present); when featuredImage is empty/missing, the site default og-image.png is used (never an empty/broken og:image URL)"
    - "Character pages whose playerId resolves in cast.json emit a Person JSON-LD node inside the existing @graph, alongside the existing CreativeWork + BreadcrumbList nodes"
    - "Character pages whose playerId does NOT resolve in cast.json (only holiday-special-1 today) emit @graph WITHOUT a Person node and do not crash"
    - "characters.json validates against CharactersFileSchema at build time; every non-tbd playerId resolves to cast.json; every image entry has source ∈ { 'official', 'fan' }; character ids are unique"
    - "All E2E character-page traversals pass axe (WCAG 2.1 AA) and a parsed JSON-LD assertion"
  artifacts:
    - path: "shared/schema.ts"
      provides: "Extended CharacterSchema with motivations?, arcSummary?, images[].source enum (default 'official'); CharactersFileSchema; CharacterImageSchema; Character / CharacterImage type exports"
      contains: "CharactersFileSchema"
    - path: "client/src/data/characters.json"
      provides: "Migrated character data: every image has explicit source: 'official'; melly.playerId fixed from 'brigette-s' to 'brigette-streeper'; holiday-special-1 retained as documented placeholder"
      contains: "\"source\": \"official\""
    - path: "client/src/lib/cast.ts"
      provides: "getCastMemberById(playerId) and getCastSocialUrls(socialLinks) pure helpers — testable without coupling to rendering"
      contains: "getCastMemberById"
    - path: "client/src/pages/CharacterDetail.tsx"
      provides: "Lore sections (Motivations / Arc Summary), gallery badges (AI corner + Official/Fan), gallery legend, og:image safety guard, Person JSON-LD graph node"
      contains: "getPersonSchema"
    - path: "test/data/characters-data.test.ts"
      provides: "Build-time integrity guard: schema validation, playerId referential integrity (with documented tbd exception), unique character ids, image source enum"
      contains: "CharactersFileSchema.parse"
    - path: "test/lib/cast.test.ts"
      provides: "Unit coverage for getCastMemberById (hit / miss / 'tbd' / undefined / empty) and getCastSocialUrls (filters empties, preserves order)"
    - path: "test/structured-data.snapshot.test.ts"
      provides: "Extended with 'Person Schema (character page integration)' describe block — character-context description template + sameAs presence/absence"
      contains: "Person Schema (character page integration)"
    - path: "test/pages/CharacterDetail.test.tsx"
      provides: "Component tests for CHAR-01..04: lore conditional rendering, AI badge presence + a11y, source badge text per image.source, legend conditional, og:image fallback when featuredImage empty, Person JSON-LD inclusion/exclusion based on playerId resolution"
    - path: "e2e/characters.spec.ts"
      provides: "Extended with: lore sections render, AI badge visible+accessible on a known AI-generated character, parsed Person JSON-LD assertion, og:image meta uses character image, axe pass on the character detail page"
  key_links:
    - from: "client/src/pages/CharacterDetail.tsx"
      to: "client/src/lib/cast.ts"
      via: "getCastMemberById(character.playerId)"
      pattern: "getCastMemberById"
    - from: "client/src/pages/CharacterDetail.tsx"
      to: "client/src/lib/structuredData.ts (existing getPersonSchema)"
      via: "@graph composition: [characterSchema, breadcrumbData, ...(personSchema ? [personSchema] : [])]"
      pattern: "getPersonSchema"
    - from: "client/src/pages/CharacterDetail.tsx"
      to: "client/src/components/SEO.tsx"
      via: "ogImage={character.featuredImage || undefined} so empty strings fall back to site default"
      pattern: "featuredImage \\|\\| undefined"
    - from: "test/data/characters-data.test.ts"
      to: "shared/schema.ts (CharactersFileSchema) + client/src/data/cast.json"
      via: "Zod parse + playerId set membership check"
      pattern: "CharactersFileSchema.parse"
---

<objective>
Ship Phase 2 of Tales of Aneria's content milestone: each character page becomes a richer, share-friendly destination with extended lore (motivations, arc summary), an image gallery that visibly distinguishes Official Art from Fan Art and discloses AI-generated artwork accessibly, an og:image that always resolves to a real picture (or the site default — never an empty URL), and a Person JSON-LD node embedded inside the existing @graph that describes the real cast member behind the character.

Purpose: Satisfy CHAR-01..04 from REQUIREMENTS.md and the four phase success criteria from ROADMAP. Do this as an extension of existing infrastructure, not a rewrite — getPersonSchema already exists; the @graph already mounts; SEO already absolute-URL-prepends; ogImage is already wired (with one empty-string bug to fix).

Output: One Zod migration, one in-place data migration commit, one new helper module, one extended CharacterDetail.tsx, three extended/created test surfaces (data integrity, helpers, snapshot), one extended component test file, one extended E2E spec, plus one human checkpoint for Google Rich Results validation.

Scope guardrails (LOCKED from CONTEXT.md / RESEARCH.md):
- No DB schema changes (CharacterSchema is pure Zod over the static JSON).
- No new component library; use shadcn/ui Badge already installed; Lucide Sparkles for AI icon.
- Wouter only — `useNavigate` is forbidden (Phase 2 introduces no new navigation; existing `<Link>` and `useRoute` patterns remain).
- ReactMarkdown stack already imported on the page is reused for Backstory only; new lore fields render as plain `<p>` per Open Question #1 resolution below.
- No new factory in structuredData.ts — `getPersonSchema` already exists; reuse it.
- No removal of the existing CreativeWork node; Person is ADDED to the @graph (per RESEARCH R4).
- Phase 3 (Discovery) note: keep changes contained to the character page + structuredData.ts surface so Phase 3 can land independently.

Open Questions resolved (back-edit RESEARCH.md to add (RESOLVED) suffix in Task 1):
1. Lore rendering — **PLAIN `<p>`**, mirroring the existing Personality block (CharacterDetail.tsx line 230). Avoids new XSS surface; ReactMarkdown remains for Backstory only. Markdown can be opted in per-field later if any character's lore needs it.
2. Extract `<CharacterGalleryImage>` subcomponent — **NO** for Phase 2. The image-loop additions are ~25 LoC of new badge JSX; total stays under 500 lines per file. Defer extraction to a future cleanup commit; keeping the change surface tight reduces blast radius and snapshot churn.
3. Fix `melly.playerId` from `"brigette-s"` to `"brigette-streeper"` in the same migration commit — **YES**. Cleaner data; the integrity test then strictly enforces resolution for all entries except the documented `"tbd"` placeholder.
4. Absolute URL for Person.image — **OMIT image entirely** for Person JSON-LD in v1. Cast avatars are bundled assets (verified at `client/src/assets/cast-*.webp`, imported via Vite into a lookup map in AboutSection.tsx) — no public `/cast/...` URL exists, so we cannot emit a publicly-resolvable URL without authoring new public assets. Schema.org Person.image is optional. Re-evaluate if we publish cast portraits to `/public/` in a future content pass.
5. Add `cast.socialLinks.website` as `Person.url` — **YES**, cheap opt-in. The current factory does not have a `url` field; we will pass `website` (when populated) into `sameAs` alongside socials. One-line cost; matches the factory's current shape with zero new code in `structuredData.ts`. (Net effect: Preston Farr's `https://prestonfarr.com` lands inside `sameAs` — schema.org permits this.)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/phases/02-character-page-enhancements/02-CONTEXT.md
@.planning/phases/02-character-page-enhancements/02-RESEARCH.md
@.planning/phases/01-campaign-archive/01-PLAN.md
@CLAUDE.md
@.github/copilot-instructions.md

# Files to read for the implementation surface
@client/src/pages/CharacterDetail.tsx
@client/src/lib/structuredData.ts
@client/src/components/SEO.tsx
@client/src/data/characters.json
@client/src/data/cast.json
@client/src/components/ui/badge.tsx
@shared/schema.ts

# Test patterns to mirror
@test/structured-data.snapshot.test.ts
@test/data/campaigns-data.test.ts
@e2e/characters.spec.ts

<interfaces>
<!-- Contracts the executor needs. Extracted from codebase. Do not re-explore. -->

EXISTING getPersonSchema (client/src/lib/structuredData.ts:77-93) — REUSE, DO NOT DUPLICATE:
```ts
export const getPersonSchema: (person: {
  name: string;
  description?: string;
  image?: string;          // omit in Phase 2 per Open Question #4 resolution
  sameAs?: string[];       // include cast.socialLinks values that are non-empty
}) => {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  description?: string;
  image?: string;
  sameAs?: string[];
  memberOf: { "@type": "Organization"; name: "Tales of Aneria" };
};
```

EXISTING @graph at CharacterDetail.tsx:97-113 — EXTEND, do not replace:
```ts
const characterSchema = getCreativeWorkSchema({...});
const breadcrumbData = getBreadcrumbSchema([...]);
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [characterSchema, breadcrumbData]   // ← add Person here, conditionally
};
```

EXISTING SEO contract (client/src/components/SEO.tsx) — already supports ogImage absolute-URL prepend; an empty-string ogImage is the bug we fix in Task 6:
```ts
interface SEOProps { ogImage?: string; ogImageAlt?: string; jsonLd?: object; ... }
```

cast.json entry shape (verified):
```ts
{ id: string; name: string; role: string; characters: string[]; isCurrent: boolean;
  avatar: string; socialLinks: { youtube, twitter, instagram, twitch, website: string } }
```

Avatar path reality (verified by reading AboutSection.tsx:55-65):
- `cast.avatar` is the basename ("cast-preston.webp"); avatars are imported as Vite modules into a lookup map.
- There is NO public `/cast/<file>.webp` URL. Hence Person JSON-LD MUST omit `image` for Phase 2 (Open Question #4).

Wouter rule (CLAUDE.md):
```ts
import { useRoute, Link, useLocation } from "wouter";
// useNavigate does NOT exist — runtime crash. Phase 2 adds NO navigation; this is a guard against drift.
```
</interfaces>

<data_audit>
Verified by RESEARCH.md (lines 111-148):
- 24 total characters; 22 playerIds resolve cleanly; 2 orphans:
  - **`melly.playerId === "brigette-s"`** → fix in Task 3 to `"brigette-streeper"` (cast.json id)
  - **`holiday-special-1.playerId === "tbd"`** → keep; integrity test allows tbd as documented placeholder; Person JSON-LD skipped at runtime via `getCastMemberById` returning undefined
- 3 entries with empty/missing `featuredImage`: `eve-faraque` (`""`), `alan-mcmichaelson` (omitted), `holiday-special-1` (omitted) → Task 6 fixes via `featuredImage || undefined`
- 1 entry with `images[0].url === ""` (eve-faraque) → existing component already guards via `image.url ? ... : ...`; Task 6 ensures badges render only inside the truthy branch (no badges on the placeholder Sword icon block)
- AI-generated images present on: `winifred-fred-blodbane`, `alomah-stargazer`, `locke-lirien`, `maggie-bramblecheeks`, `mabel-crosscore`, `melly` (6 entries) → all become test fixtures for the AI badge assertion in Tasks 6 and 7
</data_audit>
</context>

<tasks>

<!-- =========================================================================
WAVE 1 — DOC HYGIENE + DATA & SCHEMA FOUNDATION
Open Question resolutions sealed first so RESEARCH.md is canonical before
any code lands. Then schema migration, then data migration locked behind
the integrity test.
========================================================================= -->

<task type="auto" tdd="false">
  <name>Task 1: Resolve and seal Open Questions in 02-RESEARCH.md</name>
  <files>.planning/phases/02-character-page-enhancements/02-RESEARCH.md</files>
  <action>
    Edit `02-RESEARCH.md` "Open Questions (RESOLVED)" section (lines 680-692). For each of the 5 questions, replace the trailing `**PENDING planner decision.**` with `**RESOLVED:** <one-sentence decision>` matching the resolutions in this PLAN's <objective> block:
    1. **RESOLVED:** Render motivations and arcSummary as plain `<p>` (mirrors existing Personality block); ReactMarkdown stays scoped to Backstory.
    2. **RESOLVED:** Do NOT extract `<CharacterGalleryImage>` in Phase 2; defer to a follow-up cleanup commit.
    3. **RESOLVED:** Fix `melly.playerId` to `"brigette-streeper"` in the migration commit (Task 3).
    4. **RESOLVED:** Omit `image` from Person JSON-LD in v1 — cast avatars are bundled assets with no public URL; revisit when public cast portraits ship.
    5. **RESOLVED:** Pass `cast.socialLinks.website` (when populated) into `sameAs` alongside socials; do NOT modify `getPersonSchema` factory.

    No code changes in this task. Pure documentation hygiene matching the Phase 1 lesson learned (RESEARCH should never ship with PENDING items).
  </action>
  <verify>
    <automated>node -e "const c=require('fs').readFileSync('.planning/phases/02-character-page-enhancements/02-RESEARCH.md','utf8');const pending=(c.match(/PENDING planner decision/g)||[]).length;const resolved=(c.match(/\*\*RESOLVED:\*\*/g)||[]).length;process.exit(pending===0 && resolved>=5 ? 0 : 1)"</automated>
  </verify>
  <done>
    All 5 Open Questions in 02-RESEARCH.md carry `**RESOLVED:**` markers and zero `**PENDING planner decision.**` strings remain. Decisions match this PLAN's <objective> resolutions verbatim.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extend Zod schemas (CharacterSchema / CharacterImageSchema / CharactersFileSchema) in shared/schema.ts</name>
  <files>shared/schema.ts</files>
  <behavior>
    - `CharacterImageSchema` parses every existing image entry in characters.json (after Task 3's data migration); accepts optional `url`, `artist`, `artistUrl` (z.string().url()), `copyright`, `isAiGenerated`, plus a NEW `source: z.enum(["official","fan"]).default("official")` and existing `id` (min 1), `caption` (min 1), `type` (min 1), `isFeatured` (optional).
    - `CharacterSchema` parses every entry in characters.json with NEW optional fields `motivations?: string` and `arcSummary?: string`; existing required fields (id, name, player, playerId, campaign, race, class, level, alignment, status) preserved; `featuredImage`, `dndbeyond`, `dndbeyondId`, `playlist` remain optional; `images: z.array(CharacterImageSchema)` (min length asserted in the integrity test, not the schema, to keep the schema reusable).
    - `CharactersFileSchema = z.object({ characters: z.array(CharacterSchema) })`.
    - Type exports: `Character = z.infer<typeof CharacterSchema>` and `CharacterImage = z.infer<typeof CharacterImageSchema>`.
    - Schema rejects: `source: "ai"` (not in enum), missing `caption`, non-URL `artistUrl`.
  </behavior>
  <action>
    Append a new section to `shared/schema.ts` BELOW the existing Phase 1 campaigns block (after line 229), with a section header comment matching the Phase 1 banner style. Additive only — do not touch any existing exports.

    Specific shape (mirrors RESEARCH.md "Zod Schema Migration" section verbatim, with one tweak: `dndbeyond` is `.optional()` plain string because some entries store `"https://www.dndbeyond.com/characters/NA"` and `dndbeyondId: "NA"` — the data is loose; keep loose now, tighten later):
    ```ts
    // =============================================================================
    // Character Page Enhancements (Phase 2) — characters.json static-data schema
    // =============================================================================

    const characterImageSourceEnum = z.enum(["official", "fan"]);

    export const CharacterImageSchema = z.object({
      id: z.string().min(1),
      url: z.string().optional(),
      caption: z.string().min(1),
      type: z.string().min(1),
      isFeatured: z.boolean().optional(),
      artist: z.string().optional(),
      artistUrl: z.string().url().optional(),
      copyright: z.string().optional(),
      isAiGenerated: z.boolean().optional(),
      source: characterImageSourceEnum.default("official"),
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
      backstory: z.string(),
      personality: z.string(),
      dndbeyond: z.string().optional(),
      dndbeyondId: z.string().optional(),
      playlist: z.string().url().optional(),
      status: z.string().min(1),
      motivations: z.string().optional(),
      arcSummary: z.string().optional(),
    });

    export const CharactersFileSchema = z.object({
      characters: z.array(CharacterSchema),
    });

    export type Character = z.infer<typeof CharacterSchema>;
    export type CharacterImage = z.infer<typeof CharacterImageSchema>;
    ```
    Run `npm run check` after to confirm no TS regressions.
  </action>
  <verify>
    <automated>npm run check</automated>
  </verify>
  <done>
    `shared/schema.ts` exports `CharacterSchema`, `CharacterImageSchema`, `CharactersFileSchema`, plus the two type aliases. `npm run check` passes. No existing exports removed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Migrate characters.json + lock with build-time integrity test</name>
  <files>client/src/data/characters.json, test/data/characters-data.test.ts</files>
  <behavior>
    - Every entry in `characters.json` `images[]` has an explicit `"source": "official"` field after migration (defense-in-depth: do not rely solely on Zod's `.default()` so the data is self-describing).
    - `melly.playerId` is `"brigette-streeper"` (was `"brigette-s"`).
    - `holiday-special-1.playerId` remains `"tbd"`; the integrity test treats this as the only permitted unresolved placeholder.
    - No `motivations` or `arcSummary` are populated in this migration (left to a content-authoring follow-up); fields remain absent everywhere — this exercises the `optional()` Zod path and makes the conditional-render UI work in Task 6.
    - `test/data/characters-data.test.ts` mirrors `test/data/campaigns-data.test.ts` and contains: (a) `CharactersFileSchema.parse(charactersData)` does not throw; (b) every non-`tbd` `playerId` resolves to a `cast.json` id; (c) every character `id` is unique; (d) every `images[]` entry parses to `source ∈ {official, fan}` post-Zod-default; (e) every character has at least one image entry; (f) `melly` resolves to `brigette-streeper` (regression test for R2).
  </behavior>
  <action>
    1. Edit `client/src/data/characters.json` in-place:
       - Add `"source": "official"` to every existing image object (24 characters x 1+ images each).
       - Change `melly.playerId` from `"brigette-s"` to `"brigette-streeper"`.
       - Do NOT add `motivations` or `arcSummary` to any entry — these stay absent for v1.
       - Do NOT modify `holiday-special-1` other than (implicitly) the image source field. Leave `playerId: "tbd"`.
    2. Create `test/data/characters-data.test.ts` mirroring the structure of `test/data/campaigns-data.test.ts`:
       ```ts
       import { describe, it, expect } from "vitest";
       import charactersData from "@/data/characters.json";
       import castData from "@/data/cast.json";
       import { CharactersFileSchema, CharacterImageSchema } from "@shared/schema";

       describe("characters static data", () => {
         it("characters.json matches CharactersFileSchema", () => {
           expect(() => CharactersFileSchema.parse(charactersData)).not.toThrow();
         });

         it("every non-tbd character.playerId resolves to a cast member", () => {
           const ids = new Set(castData.cast.map(c => c.id));
           const orphans: string[] = [];
           for (const ch of charactersData.characters) {
             if (ch.playerId === "tbd") continue; // documented holiday-special-1 placeholder
             if (!ids.has(ch.playerId)) orphans.push(`${ch.id} -> ${ch.playerId}`);
           }
           expect(orphans).toEqual([]);
         });

         it("character ids are unique", () => {
           const ids = charactersData.characters.map(c => c.id);
           expect(new Set(ids).size).toBe(ids.length);
         });

         it("every image entry has a valid source enum after Zod parse", () => {
           for (const ch of charactersData.characters) {
             for (const img of ch.images) {
               const parsed = CharacterImageSchema.parse(img);
               expect(["official", "fan"]).toContain(parsed.source);
             }
           }
         });

         it("every character has at least one image entry", () => {
           for (const ch of charactersData.characters) {
             expect(ch.images.length).toBeGreaterThan(0);
           }
         });

         it("melly.playerId resolves to brigette-streeper (regression for R2)", () => {
           const melly = charactersData.characters.find(c => c.id === "melly");
           expect(melly?.playerId).toBe("brigette-streeper");
         });
       });
       ```
    3. Confirm pre-commit `vitest related --run` will pick up edits to characters.json (it will — the test imports the JSON file directly).
  </action>
  <verify>
    <automated>npx vitest run test/data/characters-data.test.ts</automated>
  </verify>
  <done>
    All 6 integrity tests pass. characters.json has explicit `source: "official"` on every image entry. melly fix is in place. Subsequent malformed edits will fail CI on this test alone.
  </done>
</task>

<!-- =========================================================================
WAVE 2 — HELPERS + JSON-LD SNAPSHOT EXTENSION
Pure-function helper module + extension of existing snapshot test. These
deliberately precede UI work so CharacterDetail.tsx imports stable, tested
contracts in Wave 3.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 4: Add client/src/lib/cast.ts helpers + unit tests</name>
  <files>client/src/lib/cast.ts, test/lib/cast.test.ts</files>
  <behavior>
    - `getCastMemberById(playerId: string | undefined): Cast | undefined`
      - returns the cast entry whose `id === playerId`
      - returns `undefined` for: empty string, `undefined`, the literal `"tbd"`, or any id not present in cast.json
    - `getCastSocialUrls(socialLinks: Record<string,string>): string[]`
      - returns only non-empty string values (drops `""`)
      - preserves insertion order from the input object
    - Both pure functions, no side effects, no React imports.
  </behavior>
  <action>
    Create `client/src/lib/cast.ts`:
    ```ts
    import castData from "@/data/cast.json";

    export type Cast = (typeof castData.cast)[number];

    export function getCastMemberById(playerId: string | undefined): Cast | undefined {
      if (!playerId || playerId === "tbd") return undefined;
      return castData.cast.find((c) => c.id === playerId);
    }

    export function getCastSocialUrls(
      socialLinks: Record<string, string>
    ): string[] {
      return Object.values(socialLinks).filter(
        (u) => typeof u === "string" && u.length > 0
      );
    }
    ```
    Create `test/lib/cast.test.ts` covering: hit (`preston-farr` returns Preston), miss (`does-not-exist`), `"tbd"` returns undefined, undefined input returns undefined, empty-string input returns undefined, social URL filter returns 5 for Preston / 0 for Cory / preserves insertion order on a fixture object.
  </action>
  <verify>
    <automated>npx vitest run test/lib/cast.test.ts</automated>
  </verify>
  <done>
    Both helpers exported, all 6+ test cases green. No JSON imports inside the helpers' call sites in tests other than the module's own.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 5: Extend test/structured-data.snapshot.test.ts with character-context Person tests</name>
  <files>test/structured-data.snapshot.test.ts</files>
  <behavior>
    - New describe block `Person Schema (character page integration)` covering:
      - description template includes both the player real name and the character name + race + class + "Tales of Aneria"
      - `name` is the player's real name (NOT the fictional character name)
      - `sameAs` contains the URLs passed in (count + content) when populated
      - When `sameAs` is omitted from the input, the schema's `sameAs` key is `undefined` (existing factory passes it through; schema.org consumers will omit on stringify if undefined)
      - Calling with no `image` produces an output where `image` is `undefined` (Phase 2 omits avatar URLs — Open Question #4)
      - Snapshot of the assembled "Wayne / Preston Farr" example for regression stability
    - Existing factory snapshots are untouched and still pass (no `-u` regeneration required).
  </behavior>
  <action>
    Append a new describe block to `test/structured-data.snapshot.test.ts` (factory is already imported at the top — see line 9). Mirror the existing `Person Schema` block's style. Use the Wayne example shown in 02-RESEARCH.md "Concrete Person example" verbatim for the snapshot test:
    ```ts
    describe("Person Schema (character page integration)", () => {
      const wayne = {
        playerName: "Preston Farr",
        characterName: 'Wayne "Archivist of Lies"',
        race: "Changeling",
        class: "Wizard",
        sameAs: [
          "https://www.youtube.com/@fuzzysquirrel",
          "https://x.com/prestonbfarr",
          "https://www.instagram.com/fuzzysquirreltv",
          "https://www.twitch.tv/fuzzysquirrel",
          "https://prestonfarr.com",
        ],
      };

      it("description template includes player + character context", () => {
        const description = `${wayne.playerName} plays ${wayne.characterName}, a ${wayne.race} ${wayne.class}, in Tales of Aneria.`;
        const schema = getPersonSchema({
          name: wayne.playerName,
          description,
          sameAs: wayne.sameAs,
        });
        expect(schema.name).toBe("Preston Farr");
        expect(schema.description).toContain("Wayne");
        expect(schema.description).toContain("Changeling Wizard");
        expect(schema.description).toContain("Tales of Aneria");
        expect(schema).toMatchSnapshot();
      });

      it("emits sameAs only when input array is provided", () => {
        const withSameAs = getPersonSchema({ name: "Preston Farr", sameAs: ["https://prestonfarr.com"] });
        expect(withSameAs.sameAs).toEqual(["https://prestonfarr.com"]);

        const withoutSameAs = getPersonSchema({ name: "Cory Avis" });
        expect(withoutSameAs.sameAs).toBeUndefined();
      });

      it("omits image when not provided (Phase 2 cast avatars are bundled assets)", () => {
        const schema = getPersonSchema({ name: "Preston Farr" });
        expect(schema.image).toBeUndefined();
      });
    });
    ```
    Run `npx vitest run test/structured-data.snapshot.test.ts -u` ONE TIME to capture the new snapshot, then re-run without `-u` to confirm stable. Commit the snapshot file.
  </action>
  <verify>
    <automated>npx vitest run test/structured-data.snapshot.test.ts</automated>
  </verify>
  <done>
    All existing snapshot tests still pass without `-u`. Three new Person-character-integration tests pass. Snapshot file updated with one new Wayne entry.
  </done>
</task>

<!-- =========================================================================
WAVE 3 — UI INTEGRATION (CharacterDetail.tsx)
The single largest task: lore sections + gallery badges + legend + og:image
fix + Person JSON-LD graph extension. ~25 LoC of net new JSX plus the
@graph diff. Component tests live alongside the implementation.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 6: Extend CharacterDetail.tsx — lore sections, gallery badges, AI legend, og:image guard, Person JSON-LD</name>
  <files>client/src/pages/CharacterDetail.tsx, test/pages/CharacterDetail.test.tsx</files>
  <behavior>
    Six concrete behaviors land in this single component edit:

    **B1. Type extensions (matches Task 2 Zod schema):**
    - The local `CharacterImage` interface gains `source?: "official" | "fan"` (post-migration always present, but typed optional for safety).
    - The local `Character` interface gains `motivations?: string` and `arcSummary?: string`.

    **B2. Lore sections:**
    - When `character.motivations` is truthy, render a new `<Card data-testid="card-motivations">` AFTER the Backstory card (line 219) and BEFORE the Personality card (line 222). Title "Motivations", Lucide icon `Compass`. Body: `<p className="text-muted-foreground leading-relaxed">{character.motivations}</p>` (mirrors Personality, NOT ReactMarkdown — Open Question #1 resolution).
    - When `character.arcSummary` is truthy, render a new `<Card data-testid="card-arc-summary">` AFTER the Personality card. Title "Arc Summary", Lucide icon `BookOpen`. Body: same plain `<p>` pattern.
    - Empty/undefined values produce ZERO DOM (no orphan headings). This is the per-character v1 reality (no entry has motivations or arcSummary populated yet) — the guard is what unblocks the content-authoring follow-up.

    **B3. Gallery AI corner badge:**
    - Inside each gallery image's truthy `image.url ?` branch (after the `<img>` element, around line 260), render `{image.isAiGenerated && <Badge ... role="img" aria-label="AI-generated image" data-testid={`badge-ai-${image.id}`}>...</Badge>}` positioned `absolute top-2 right-2 z-10` with `bg-amber-500/95 text-white border-amber-600 backdrop-blur-sm shadow-md gap-1` and a Lucide `Sparkles` icon (`h-3 w-3`, `aria-hidden="true"`) followed by the text `AI`.
    - Replaces the existing in-caption AI Tooltip (lines 275-289) — the corner badge subsumes that disclosure. The page-level legend (B5) carries the same explanatory copy that was inside the tooltip.

    **B4. Gallery Official/Fan source badge:**
    - Inside each gallery image's truthy branch, in the existing caption gradient overlay block (line 261 area), REPLACE the current `{image.artist && <Badge>Fan Art</Badge>}` (lines 266-274 — buggy: uses `image.artist` as the proxy for fan art). Replace with `<Badge variant={image.source === "fan" ? "secondary" : "outline"} ... data-testid={`badge-source-${image.id}`}>{image.source === "fan" ? "Fan Art" : "Official Art"}</Badge>`.
    - Style for `official`: `bg-white/10 text-white border-white/40 backdrop-blur-sm text-xs` (sits inside the dark gradient).
    - Style for `fan`: shadcn default `secondary` variant + `text-xs`.

    **B5. Page-level AI legend:**
    - Above the gallery grid (just before line 243's `<div className="grid ...">`), render `{allImages.some(img => img.isAiGenerated) && <p data-testid="text-ai-legend" ...>...</p>` containing one Lucide `Sparkles` icon (`aria-hidden="true"`) and the text `Images marked AI are AI-generated. We disclose this for transparency; AI-generated images are never used commercially.` — taken verbatim from RESEARCH.md.
    - When NO image is AI-generated for that character, the legend MUST NOT render (the `some(...)` guard handles this).

    **B6. og:image safety + Person JSON-LD graph node:**
    - Change CharacterDetail.tsx line 123 from `ogImage={character.featuredImage}` to `ogImage={character.featuredImage || undefined}` (R1 fix — empty strings on `eve-faraque`, `alan-mcmichaelson`, `holiday-special-1` no longer produce a broken og:image).
    - Update line 124 ogImageAlt template to match CONTEXT wording: `ogImageAlt={`${character.name} — official character art`}` (em dash). Document the choice in the Task summary.
    - Replace the @graph block (lines 110-113) with the Person-extended version:
      ```tsx
      import { getCastMemberById, getCastSocialUrls } from "@/lib/cast";
      import { getPersonSchema, getCreativeWorkSchema, getBreadcrumbSchema } from "@/lib/structuredData";

      const player = getCastMemberById(character.playerId);
      const socials = player ? getCastSocialUrls(player.socialLinks) : [];
      const personSchema = player
        ? getPersonSchema({
            name: player.name,
            description: `${player.name} plays ${character.name}, a ${character.race} ${character.class}, in Tales of Aneria.`,
            ...(socials.length > 0 ? { sameAs: socials } : {}),
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
    - Note: the spread-conditional on `sameAs` ensures empty social arrays do not produce `"sameAs": []` in the rendered JSON-LD (cleaner output for Schema.org Validator).

    **Component tests (test/pages/CharacterDetail.test.tsx) — create or extend:**
    Cover, with React Testing Library + wouter `<Router>` shim:
    - Renders backstory, personality always.
    - Renders motivations card ONLY when `motivations` set (synthetic Character fixture; do not depend on real data).
    - Renders arc-summary card ONLY when `arcSummary` set.
    - On a character with at least one AI image, asserts `[data-testid^="badge-ai-"]` exists with `aria-label="AI-generated image"`.
    - On a character with NO AI image, asserts `[data-testid="text-ai-legend"]` is NOT in the DOM.
    - Asserts every gallery image with a non-empty `url` has a `[data-testid^="badge-source-"]` matching its `source` text.
    - Asserts the `<SEO>` mock receives `ogImage: undefined` for `eve-faraque` (empty featuredImage) and `ogImage: "/characters/wayne-archivist.webp"` for `wayne-archivist`.
    - Asserts the `jsonLd` prop's `@graph` contains a Person node for `wayne-archivist` (playerId resolves) and does NOT contain a Person node for `holiday-special-1` (playerId === "tbd").
    - Mock `@/components/SEO` so we can spy on the props. Pattern reference: any existing test in `test/` that does similar (search for `vi.mock` against SEO).
  </behavior>
  <action>
    1. Read `client/src/pages/CharacterDetail.tsx` once before editing (the contract is in <interfaces> above; a single Read confirms current line numbers if anything shifted).
    2. Apply B1-B6 in a single coherent edit. Maintain existing import-grouping convention (alphabetical within group).
    3. Add Lucide imports `Compass, BookOpen, Sparkles` alongside existing icons.
    4. Run `npm run check:mistakes` to confirm no `useNavigate` slipped in.
    5. Create `test/pages/CharacterDetail.test.tsx` (verify it doesn't already exist; if it does, extend rather than overwrite). Tests use real characters.json fixtures where convenient (e.g., `wayne-archivist` for has-AI=false has-social=yes resolved-playerId; `winifred-fred-blodbane` for has-AI=true; `holiday-special-1` for orphan-playerId; `eve-faraque` for empty-featuredImage). For motivations/arcSummary coverage, construct a synthetic Character object inline (since no real entry has those fields populated yet — that's the v1 reality).
    6. Run `npm run check && npm run lint` to gate on TS + ESLint.
  </action>
  <verify>
    <automated>npx vitest run test/pages/CharacterDetail.test.tsx &amp;&amp; npm run check &amp;&amp; npm run check:mistakes</automated>
  </verify>
  <done>
    All component tests pass. `npm run check` passes. `npm run check:mistakes` clean. CharacterDetail.tsx renders new lore sections conditionally, AI corner badge with proper a11y, source badge per image, page-level legend conditionally, og:image fallback safe, Person JSON-LD in @graph when playerId resolves.
  </done>
</task>

<!-- =========================================================================
WAVE 4 — END-TO-END + ACCESSIBILITY
Real-browser pass over the full character detail page. Asserts the new
behaviors integrate with SEO injection and that axe finds zero violations.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 7: Extend e2e/characters.spec.ts with Phase 2 behaviors + axe checks</name>
  <files>e2e/characters.spec.ts</files>
  <behavior>
    Add four new tests to the existing `e2e/characters.spec.ts` (Playwright; uses existing axe helper per CLAUDE.md WCAG 2.1 AA requirement):

    1. `test('character page renders extended-lore sections only when populated')` — visit `/characters/wayne-archivist`; assert backstory + personality cards visible; motivations + arc-summary cards NOT visible (no entry has those fields populated in v1). Confirm the absence is silent (no orphan headings).

    2. `test('AI badge is visible and accessible on AI-generated character art')` — visit `/characters/winifred-fred-blodbane` (has `images[0].isAiGenerated: true`); assert `[data-testid^="badge-ai-"]` is visible; the badge's accessible name is `AI-generated image` (Playwright `getByLabel` or `accessibleName`); assert the page-level legend `[data-testid="text-ai-legend"]` is also visible. Run `expect(page).toPassAxeCheck()` on this URL.

    3. `test('character page emits parseable Person JSON-LD when playerId resolves')` — visit `/characters/wayne-archivist`; read every `<script type="application/ld+json">` content; `JSON.parse` it; assert `@graph` is an array; assert `@graph` contains an item with `@type === "Person"` and `name === "Preston Farr"`; assert that Person item's `description` contains both `"Wayne"` and `"Tales of Aneria"`. Then visit `/characters/holiday-special-1`; parse the same script; assert NO item has `@type === "Person"` (orphan playerId path).

    4. `test('og:image meta uses character featuredImage when present, site default when empty')` — visit `/characters/wayne-archivist`; read `meta[property="og:image"]` content; assert it ends with `/characters/wayne-archivist.webp`. Visit `/characters/eve-faraque` (empty featuredImage); assert og:image content is the site default (`/og-image.png`-suffixed URL — exact match per SEO.tsx default).

    Plus: ensure every newly-navigated URL runs `expect(page).toPassAxeCheck()` at least once per CLAUDE.md.
  </behavior>
  <action>
    Read `e2e/characters.spec.ts` first to confirm the existing `toPassAxeCheck` import pattern. Mirror it exactly. If the existing spec file uses `test.describe` blocks, append a new `test.describe('Phase 2 enhancements', ...)` block.
    For the JSON-LD parse test, use Playwright's `page.locator('script[type="application/ld+json"]').first().textContent()` then `JSON.parse(...)`. Use `(parsed['@graph'] as any[]).find(node => node['@type'] === 'Person')` for the Person assertion.
    For the og:image test, use `page.locator('meta[property="og:image"]').getAttribute('content')`.
    Avoid hard-coding deployed URLs — base URL comes from `playwright.config.ts` (Phase 1 already runs against the dev server).
  </action>
  <verify>
    <automated>npm run test:e2e -- e2e/characters.spec.ts</automated>
  </verify>
  <done>
    All four new E2E tests pass. Axe finds zero violations on `/characters/wayne-archivist` and `/characters/winifred-fred-blodbane`. JSON-LD parse + Person presence/absence assertions green.
  </done>
</task>

<!-- =========================================================================
WAVE 5 — PHASE GATE
Final human verification: success criterion #4 ("verifiable in Google Rich
Results test") requires Google's hosted validator with no public API. Mirrors
Phase 1's gate — the only genuinely human-only step.
========================================================================= -->

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Phase 2 ships:
    - Zod migration (`shared/schema.ts`) for character lore fields and image source taxonomy.
    - In-place data migration (`characters.json`) — every image has `source: "official"`; `melly` orphan fixed.
    - `client/src/lib/cast.ts` helpers + tests.
    - Extended `CharacterDetail.tsx` with: Motivations + Arc Summary cards (conditional), gallery AI corner badge with `aria-label="AI-generated image"`, gallery Official/Fan source badge, page-level AI legend (conditional), og:image safety guard, Person JSON-LD node embedded in the existing @graph.
    - Build-time integrity test (`test/data/characters-data.test.ts`) — schema + referential integrity guard.
    - Extended snapshot test (`test/structured-data.snapshot.test.ts`) — character-context Person tests.
    - Component tests (`test/pages/CharacterDetail.test.tsx`) — CHAR-01..04 component-level coverage.
    - Extended E2E spec (`e2e/characters.spec.ts`) — lore conditional, AI badge a11y, parsed Person JSON-LD, og:image meta, axe pass.
    Success criteria #1, #2, #3 are automatically verified by the test suite.
  </what-built>
  <how-to-verify>
    Success criterion #4 ("Character pages emit valid Person JSON-LD verifiable in Google Rich Results test") is the only remaining gate. After this PR is merged or against a public preview URL:

    1. Run `npm run dev` locally (or use the staging URL).
    2. Open https://search.google.com/test/rich-results.
    3. Paste the public URL of a character whose playerId resolves cleanly (e.g., `https://talesofaneria.com/characters/wayne-archivist`). Expect: BreadcrumbList detected (rich-result eligible) + CreativeWork detected + **Person detected with no errors**. Person is not a documented Google rich-result type — that's expected; the validator should still parse it as well-formed schema.org. Warnings about optional fields (e.g., missing `image`) are acceptable.
    4. Repeat for one AI-marked character (e.g., `winifred-fred-blodbane`) to confirm the badge UI doesn't break the JSON-LD emission. Same expected outcome.
    5. Repeat for `holiday-special-1` (orphan playerId). Expect: BreadcrumbList + CreativeWork detected; **NO Person node** — the validator should not flag a missing-required-fields error because Person was correctly omitted.
    6. Confirm the Schema.org Validator (https://validator.schema.org/) shows no critical issues for the resolving-playerId URL.

    Optional smoke checks while you're there:
    - View page source on `/characters/wayne-archivist` and confirm exactly ONE `<script type="application/ld+json">` element in `<head>`.
    - Discord/Twitter URL preview on `/characters/wayne-archivist` should show the character's official art (og:image guard at work).
    - Same preview on `/characters/eve-faraque` should show the site default `og-image.png` (no broken image — the R1 fix at work).

    If any required-field validation error appears for Person, open a follow-up plan rather than amending this one (e.g., to add `image` once cast portraits ship to `/public/`).
  </how-to-verify>
  <resume-signal>Type "approved" once both URLs validate cleanly in Google Rich Results test, or describe issues found for a follow-up plan.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Author -> repo | `characters.json` content (and the new optional `motivations` / `arcSummary` strings, when authored) crosses into the bundle on every build. Untrusted only insofar as authoring mistakes can ship. |
| Browser -> DOM (JSON-LD) | New Person JSON-LD node is rendered as part of the existing `<script type="application/ld+json">` whose textContent is `JSON.stringify(...)`. No HTML interpolation. |
| Browser -> external links | Existing `image.artistUrl` outbound links remain on the page. Phase 2 adds NO new outbound links. |
| Crawler -> page | Public read-only surface. No authentication, no PII added by Phase 2 (Person JSON-LD describes the publicly-known cast member). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Tampering | `characters.json` `images[].source` field | mitigate | New `CharacterImageSchema.source = z.enum(["official","fan"]).default("official")` (Task 2). `test/data/characters-data.test.ts` gates CI on schema parse (Task 3). Prevents arbitrary string values. |
| T-02-02 | Tampering | `characters.json` `images[].artistUrl` (already authored — defense-in-depth) | mitigate | `CharacterImageSchema.artistUrl = z.string().url().optional()` (Task 2). Zod's `.url()` rejects `javascript:` and other non-http(s) schemes. Existing rendering at CharacterDetail.tsx:305-308 already uses `target="_blank" rel="noopener noreferrer"` — unchanged in Phase 2. |
| T-02-03 | Tampering | New lore fields `motivations` / `arcSummary` rendered in DOM | mitigate | Rendered as plain text via React JSX `{character.motivations}` (NOT a raw-HTML sink, NOT ReactMarkdown) — Open Question #1 resolution. React auto-escapes string children. Stored-XSS via authored markup is impossible because no markup parser is in the path. |
| T-02-04 | Tampering | Person JSON-LD `<script>` content | mitigate | Re-uses existing SEO.tsx `JSON.stringify(jsonLd)` and `textContent` injection. `<script type="application/ld+json">` is not executed as JavaScript by browsers. Even hostile string content (e.g., `</script>` in a description) cannot break out — JSON.stringify escapes the closing tag. No change required. |
| T-02-05 | Tampering | Person `sameAs` URLs (sourced from cast.json `socialLinks`) | accept | These URLs are author-curated (cast.json is repo-tracked, not user-supplied). They appear in JSON-LD only — not as clickable links. Even hostile values can't cause execution. The `getCastSocialUrls` filter only drops empties; URL shape is not enforced. ACCEPT residual risk: any future change to cast.json that adds a non-URL string would be caught by Schema.org Validator at the human checkpoint. Add `z.string().url()` validation for cast.json in a future phase if cast becomes user-editable. |
| T-02-06 | Denial of Service (client) | Malformed characters.json crashes a page render | mitigate | Build-time Zod test (Task 3) blocks malformed entries. CharacterDetail.tsx already defensively renders Not Found at line 70 on missing lookup. The Person path adds `getCastMemberById` which returns `undefined` (not throw) on miss — no new crash surface. |
| T-02-07 | Information Disclosure | Person JSON-LD exposes cast member real names | accept | Cast names are already publicly displayed in the existing AboutSection.tsx and characters.json `player` field. JSON-LD adds no new disclosure. The `description` template uses only public, in-show metadata. |
| T-02-08 | Information Disclosure | `sameAs` links to cast members' personal social handles | accept | These URLs are already in repo-tracked cast.json (`socialLinks`) and are intended for public consumption (cast members chose to share). No PII expansion. |
| T-02-09 | Spoofing / Repudiation | n/a | n/a | No auth, no user-mutable state. Out of scope. |
| T-02-10 | Elevation of Privilege | n/a | n/a | No new server endpoints; pure client + static data. Out of scope. |
| T-02-11 | DoS (bundle bloat) | Adding `motivations` + `arcSummary` to 24 characters | accept | Estimate ~15KB added at full population (RESEARCH R6). Below any concerning threshold for a content-archive site. Re-evaluate at Phase 5 SHOP-04 perf budget. |
</threat_model>

<verification>
**Per-task verification:** the `<verify>` block on each task.

**Phase-level verification (run before Task 8 checkpoint approval):**
```bash
npm run check                                       # TS — clean (verifies Task 2 + Task 6 type extensions)
npm run lint                                        # ESLint — clean
npm run check:mistakes                              # No useNavigate
npm run test                                        # Full unit suite incl. coverage thresholds
npm run test:e2e -- e2e/characters.spec.ts          # E2E + axe
```

Coverage check: new files (`client/src/lib/cast.ts`, extended `CharacterDetail.tsx`, extended snapshot/data/component tests) contribute to the global 40% line threshold. Per-file thresholds (`server/routes.ts`, `server/security.ts`, `server/env-validator.ts`) are not touched by this phase, so no new server-side threshold pressure. The character page is a high-traffic surface — its component test additions strengthen overall coverage rather than creating regressions.
</verification>

<success_criteria>
Mapped 1:1 to ROADMAP success criteria for Phase 2:

1. **"Visitor can read extended lore (background, motivations, arc summary) on every character page"** — verified by Task 6 component tests (conditional render of Motivations + Arc Summary cards) + Task 7 E2E (lore section presence/absence). The fields are *available* on every character; *populated* on as many as the content-authoring follow-up authors. The schema migration unblocks population without further engineering.

2. **"Visitor sees official-art and fan-art badges in the character gallery, with AI-generated disclosure where applicable"** — verified by Task 6 component tests (source badge per image, AI corner badge when `isAiGenerated`, page-level legend when at least one AI image present) + Task 7 E2E (visible AI badge with `aria-label="AI-generated image"` on `winifred-fred-blodbane`).

3. **"Sharing a character page on social media renders a character-specific OG card (title, description, image)"** — already implemented pre-Phase-2 (RESEARCH §"Open Graph: CHAR-03 status") with one fix landing in Task 6 (R1: `featuredImage || undefined`). Verified by Task 6 component test (SEO mock receives correct ogImage) + Task 7 E2E (`<meta property="og:image">` content correctness for both happy path and empty-featuredImage path).

4. **"Character pages emit valid Person JSON-LD verifiable in Google Rich Results test"** — automated portion verified by Task 5 (factory snapshot stability for character-context inputs), Task 6 (page integration: graph contains Person when playerId resolves, omits when orphan), Task 7 E2E (parsed JSON-LD on rendered page contains the Person node with correct name + description); manual external-validator portion verified at the Task 8 human checkpoint.

Additional implicit success:
- Build-time integrity: malformed JSON or dangling playerId fails CI (Task 3).
- Accessibility: every new gallery badge has correct ARIA semantics; character page passes axe at the WCAG 2.1 AA bar required by CLAUDE.md (Task 7).
- Phase 3 readiness: `client/src/lib/structuredData.ts` remains the cohesive home for SEO factories; no Phase-2 cross-cutting changes that would block Phase 3 (Discovery) work.
</success_criteria>

<output>
After completion, create `.planning/phases/02-character-page-enhancements/02-01-SUMMARY.md` per the standard summary template, recording:
- Files created/modified (final list)
- Migration outcomes (count of image entries given explicit `source: "official"`; melly fix confirmed; integrity test green)
- Open Questions resolved (5 — see <objective>) and the matching RESEARCH.md back-edits
- Any newly populated `motivations` or `arcSummary` content (likely zero in this PR — content-authoring follow-up will populate)
- Google Rich Results Test outcomes (from Task 8 checkpoint) for at least one resolving-playerId character and the orphan placeholder
- Phase 3 hand-off notes: confirm `structuredData.ts` is unchanged in Phase 2 (no new factories added; Phase 2 is purely a consumer of existing `getPersonSchema`); Phase 3 (Discovery) can extend this file freely without conflict
</output>
</content>
