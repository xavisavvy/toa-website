---
phase: 04-fan-engagement
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/04-fan-engagement/04-RESEARCH.md
  - shared/schema.ts
  - client/src/data/cast.json
  - client/src/lib/cast.ts
  - client/src/components/SocialStrip.tsx
  - client/src/pages/Cast.tsx
  - client/src/pages/Community.tsx
  - client/src/pages/Home.tsx
  - client/src/components/Navigation.tsx
  - client/src/App.tsx
  - server/routes.ts
  - .env.example
  - test/data/cast-data.test.ts
  - test/lib/cast.test.ts
  - test/components/SocialStrip.test.tsx
  - test/pages/Cast.test.tsx
  - test/pages/Community.test.tsx
  - test/server/community-submit.test.ts
  - e2e/fan-engagement.spec.ts
autonomous: false
requirements:
  - FAN-01
  - FAN-02
  - FAN-03
tags: [fan-engagement, cast-page, social-strip, community-form, ses-email, react-hook-form, accessibility]

must_haves:
  truths:
    - "Visitor opens /cast and sees each cast member with isCurrent:true rendered as a card showing avatar, name, role, character chips (linked to /characters/<id> when resolvable, plain-text spans for unresolved free-text strings), and per-cast public socials (only non-empty URLs render)"
    - "Cast page omits cast members where isCurrent:false (alumni hidden in v1)"
    - "Home page shows a SocialStrip horizontal band placed between <Hero /> and <LatestEpisodes />, with icon-buttons linking to youtube/twitter/discord/reddit/patreon/etsy from social-links.json — each opens in a new tab with rel=\"noopener noreferrer\""
    - "SocialStrip filters non-empty URLs only (drop email; if a future channel adds an empty string it does not render)"
    - "Visitor opens /community and sees a react-hook-form + zodResolver form (name, email, message) with a visually-hidden honeypot 'website' field positioned off-screen via the sr-only Tailwind class (NOT display:none)"
    - "Visitor submits a valid form on /community → fetch POST /api/community/submit returns 200 → inline aria-live success message renders + Toast fires; the form resets; no redirect"
    - "Visitor submits an invalid form (e.g. message under 20 chars) → inline FormMessage errors render under each invalid field; no network request fires; no Toast"
    - "POST /api/community/submit applies expensiveLimiter (10/hr/IP) BEFORE Zod parse"
    - "POST /api/community/submit Zod-rejects payloads outside name(1-80) / email(optional valid) / message(20-2000) / website(max-0) bounds, returning 400 { success:false, error:'Invalid submission' }"
    - "POST /api/community/submit honeypot rejection — when website field is non-empty, server returns 200 { success:true } WITHOUT calling sendAdminAlert (silent success); a logSecurityEvent('COMMUNITY_SUBMIT_HONEYPOT', {...}) is emitted"
    - "POST /api/community/submit on the happy path calls sendAdminAlert(subject, body, metadata) — metadata includes truncated IP (last octet stripped to 'xxx') and source '/community' and an ISO timestamp"
    - "POST /api/community/submit returns 503 { success:false, error:'Submission endpoint not configured' } when neither FAN_SUBMISSIONS_RECIPIENT nor ADMIN_EMAIL nor SUPPORT_EMAIL is set, AND when sendEmail (under sendAdminAlert) returns false (SES misconfigured)"
    - "POST /api/community/submit sanitizes via validator.trim ONLY (no validator.escape) so the text/plain SES email body preserves & < > as literal characters per RESEARCH OQ #2 resolution"
    - "Header Navigation includes a 'Cast' route entry and a 'Community' route entry — placed between 'Podcast' and 'Shop' (after Phase 3's Videos+Podcast additions)"
    - "/cast and /community pass axe (WCAG 2.1 AA) on the rendered page"
    - "Honeypot field on /community has aria-hidden='true', tabIndex={-1}, autoComplete='off', type='text' (not 'hidden'), and the sr-only class — verified by DOM assertion in the unit test"
    - "shared/schema.ts exports CommunitySubmissionSchema (used by both client and server) and CastMemberSchema / CastFileSchema (validates cast.json at build time)"
    - "cast.json schema-validates: every cast member's characterIds[] entry resolves to an entry in characters.json (enforced by build-time test test/data/cast-data.test.ts)"
    - "All 4 RESEARCH Open Questions (#1-#4) carry RESOLVED markers in 04-RESEARCH.md"
    - "Existing CommunitySection home component is NOT modified or repurposed — the new /community route is independent (RESEARCH risk #7)"
    - "Sponsorship.tsx is NOT modified by this phase (intentional pattern divergence; backlog item)"
  artifacts:
    - path: "shared/schema.ts"
      provides: "CommunitySubmissionSchema (Zod), CastMemberSchema, CastFileSchema exports"
      contains: "export const CommunitySubmissionSchema"
    - path: "client/src/data/cast.json"
      provides: "Cast file extended with characterIds[] per cast member; existing characters[] free-text array preserved for backward compat"
      contains: "characterIds"
    - path: "client/src/lib/cast.ts"
      provides: "resolveCastCharacters helper: returns { resolved: {id, name}[], unresolved: string[] } per cast member by joining characterIds against characters.json and filtering characters[] strings whose names do not match resolved entries"
      contains: "resolveCastCharacters"
    - path: "client/src/components/SocialStrip.tsx"
      provides: "Home-page horizontal social band: icon-buttons for youtube/twitter/discord/reddit/patreon/etsy from social-links.json; non-empty URL filter; SiEtsy added"
      contains: "SiEtsy"
    - path: "client/src/pages/Cast.tsx"
      provides: "Public /cast page: list of isCurrent cast members with character chips + per-cast socials, mirrors Campaigns.tsx chrome"
      min_lines: 100
    - path: "client/src/pages/Community.tsx"
      provides: "Public /community page: react-hook-form + zodResolver + shadcn <Form>; honeypot via sr-only; success Toast + inline aria-live region"
      min_lines: 120
    - path: "server/routes.ts"
      provides: "POST /api/community/submit endpoint with expensiveLimiter, Zod, honeypot, validator.trim, sendAdminAlert, 503-on-misconfig, logSecurityEvent on rejections"
      contains: "/api/community/submit"
    - path: "test/server/community-submit.test.ts"
      provides: "Unit coverage for the endpoint: Zod boundaries, honeypot silent-success, sendAdminAlert called on happy path, 503 when SES misconfigured, 503 when recipient unset, rate-limit boundary smoke"
    - path: "test/pages/Community.test.tsx"
      provides: "Unit coverage for the form: valid submit fires fetch + Toast, invalid submit shows FormMessage errors, honeypot DOM attributes correct, error response shows inline error"
    - path: "test/pages/Cast.test.tsx"
      provides: "Unit coverage for /cast: filters isCurrent, renders avatar/name/role, character chips render as <Link> when characterIds resolves and as <span> for unresolved free-text, hides empty social-link entries"
    - path: "test/components/SocialStrip.test.tsx"
      provides: "Unit coverage for SocialStrip: renders all 6 channels with safe rel, filters empty URLs, omits the email entry"
    - path: "test/lib/cast.test.ts"
      provides: "Unit coverage for resolveCastCharacters: handles cast members with full resolution, partial resolution, empty characterIds (e.g. cory-avis only has 'The Storyteller')"
    - path: "test/data/cast-data.test.ts"
      provides: "Build-time JSON validation: CastFileSchema parse + every characterIds[] resolves to characters.json"
    - path: "e2e/fan-engagement.spec.ts"
      provides: "Playwright spec: /cast (load + character link click + axe), home (SocialStrip present + outbound rel + axe), /community (fill + submit + success state + axe; separate honeypot test asserts no email mock fires)"
  key_links:
    - from: "client/src/App.tsx"
      to: "Cast / Community pages"
      via: "<Route path=\"/cast\" component={Cast} /> and <Route path=\"/community\" component={Community} />"
      pattern: "path=\"/cast"
    - from: "client/src/components/Navigation.tsx"
      to: "navItems array"
      via: "Adds { label: 'Cast', href: '/cast', isRoute: true } and { label: 'Community', href: '/community', isRoute: true } between Podcast and Shop"
      pattern: "/cast"
    - from: "client/src/pages/Home.tsx"
      to: "client/src/components/SocialStrip.tsx"
      via: "<SocialStrip /> rendered between <Hero /> and <LatestEpisodes />"
      pattern: "<SocialStrip"
    - from: "client/src/components/SocialStrip.tsx"
      to: "client/src/data/social-links.json"
      via: "static import + non-empty URL filter"
      pattern: "from \"@/data/social-links.json\""
    - from: "client/src/pages/Cast.tsx"
      to: "client/src/lib/cast.ts (resolveCastCharacters) + client/src/data/cast.json + client/src/data/characters.json"
      via: "static imports + per-cast resolveCastCharacters call"
      pattern: "resolveCastCharacters"
    - from: "client/src/pages/Community.tsx"
      to: "POST /api/community/submit"
      via: "fetch in form onSubmit handler with JSON body { name, email, message, website }"
      pattern: "/api/community/submit"
    - from: "server/routes.ts"
      to: "server/notification-service.ts (sendAdminAlert)"
      via: "import { sendAdminAlert } from './notification-service'; called inside the route after Zod + honeypot pass"
      pattern: "sendAdminAlert"
    - from: "server/routes.ts"
      to: "server/rate-limiter.ts (expensiveLimiter)"
      via: "app.post('/api/community/submit', expensiveLimiter, ...)"
      pattern: "expensiveLimiter"
    - from: "shared/schema.ts"
      to: "client/src/pages/Community.tsx + server/routes.ts"
      via: "single Zod source-of-truth: CommunitySubmissionSchema imported by both"
      pattern: "CommunitySubmissionSchema"
---

<objective>
Ship Phase 4 of the Tales of Aneria milestone: three thin engagement surfaces — `/cast`, a home-page `<SocialStrip>`, and `/community` — satisfying FAN-01..03.

Purpose: All backend infrastructure (`expensiveLimiter`, `sendAdminAlert`, shadcn `<Form>` primitive, `validator`) already exists. Phase 4 stitches these primitives into three new public surfaces, plus one migration (cast.json characterIds) and one new server endpoint (`POST /api/community/submit`). No DB schema changes. No file uploads. No persistence beyond the SES email itself. Mirrors Phase 1/2/3's "extension over construction" discipline.

Output: One Zod schema export pair (Community + CastMember), one cast.json data migration, one resolution helper, one new shared component (`SocialStrip`), two new wouter routes (`/cast`, `/community`), one Home.tsx integration, one Navigation update, one new server endpoint, six new test files, one E2E spec, and a back-edit of 04-RESEARCH.md to mark Open Questions resolved (Phase 1/2/3 lesson).

Scope guardrails (LOCKED from CONTEXT / RESEARCH):
- No DB schema changes; no submission persistence beyond SES.
- No file uploads, no URL link field on the form, no auth, no CAPTCHA.
- No `sanitize-html` install. Use `validator.trim` only (NOT `validator.escape`) per RESEARCH OQ #2 — `escape` would mangle `&` `<` `>` in the text/plain email body.
- The new `/api/community/submit` endpoint MUST NOT mirror the broken `/api/contact/sponsor` stub (no rate limit, no Zod, no real SES). Build correctly per RESEARCH Pattern 3.
- Honeypot is visually-hidden via `sr-only` (off-screen positioning) — NEVER `display:none`.
- Wouter only — `useNavigate` is forbidden. Internal nav uses `<Link>`; programmatic nav uses `useLocation`.
- The existing `<CommunitySection>` home component is unrelated to the new `/community` page. Do NOT modify or repurpose it.
- The existing `Sponsorship.tsx` form remains on its `useState` pattern. Do NOT refactor in this phase (backlog item).
- Phase 5 (SEO-01) will need `/cast` and `/community` in `sitemap.xml` — keep route definitions discoverable.

Open Questions resolved (back-edited in Task 1):
1. **RESOLVED:** Recipient resolution uses `process.env.FAN_SUBMISSIONS_RECIPIENT || process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL`. `FAN_SUBMISSIONS_RECIPIENT` is documented in `.env.example` as an OPTIONAL override; absent, `sendAdminAlert`'s built-in recipient fallback chain takes over. The endpoint additionally pre-checks for at least one of these to be set; otherwise returns 503.
2. **RESOLVED:** Sanitize via `validator.trim` only — skip `validator.escape`. The SES body is text/plain end-to-end; escape would corrupt legitimate punctuation. Defense-in-depth comes from Zod length clamps + plain-text-only SES body (not HTML rendered) + honeypot rejection + rate limit.
3. **RESOLVED:** Add `CastMemberSchema` and `CastFileSchema` Zod exports to `shared/schema.ts` (matches Phase 1 precedent). Build-time `test/data/cast-data.test.ts` enforces schema + referential integrity (every `characterIds[]` entry resolves in `characters.json`).
4. **RESOLVED:** Render orphan `cast.characters[]` strings as plain `<span>` chips (visually distinct from linked chips). Cast members whose `characterIds[]` is empty (e.g. `cory-avis`) render the avatar/name/role/socials with no character chips at all — the card is still useful.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/phases/04-fan-engagement/04-CONTEXT.md
@.planning/phases/04-fan-engagement/04-RESEARCH.md
@.planning/phases/01-campaign-archive/01-PLAN.md
@.planning/phases/02-character-page-enhancements/02-PLAN.md
@.planning/phases/03-podcast-and-youtube-discovery/03-PLAN.md
@CLAUDE.md
@.github/copilot-instructions.md

# Pages and components to mirror line-for-line
@client/src/pages/Campaigns.tsx
@client/src/components/SEO.tsx
@client/src/components/Footer.tsx
@client/src/components/Navigation.tsx
@client/src/App.tsx
@client/src/pages/Home.tsx

# Existing form (do NOT mirror — read for divergence)
@client/src/pages/Sponsorship.tsx

# Server primitives (read-only — no edits to these files)
@server/notification-service.ts
@server/rate-limiter.ts
@server/security.ts
@server/routes.ts

# Shadcn primitives already vendored
@client/src/components/ui/form.tsx
@client/src/components/ui/input.tsx
@client/src/components/ui/textarea.tsx
@client/src/components/ui/button.tsx
@client/src/hooks/use-toast.ts

# Data sources
@client/src/data/cast.json
@client/src/data/characters.json
@client/src/data/social-links.json

# Schema home
@shared/schema.ts

# Test patterns to mirror
@test/helpers/test-utils.tsx
@e2e/campaigns.spec.ts

<interfaces>
<!-- Contracts the executor needs. Extracted from codebase. Do not re-explore. -->

From server/notification-service.ts (verified line 187):
```ts
export async function sendAdminAlert(
  subject: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void>;
// Recipient resolution: process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || 'admin@talesofaneria.com'
// Internally calls sendEmail({ to, subject, body, metadata }); body emitted as text/plain when no html supplied
```

From server/notification-service.ts (sendEmail return contract):
```ts
// Returns Promise<boolean>; returns FALSE (no throw) when AWS_SES_FROM_EMAIL or AWS_SES_ACCESS_KEY_ID is unset
// sendAdminAlert swallows the boolean — to surface 503 to the client, the planner's endpoint
// MUST either pre-check process.env.AWS_SES_FROM_EMAIL OR call sendEmail directly and inspect the boolean.
// Recommended: pre-check + use sendAdminAlert for clarity. See Task 6.
```

From server/rate-limiter.ts:
```ts
export const expensiveLimiter; // 10 requests / 1 hour / IP; Redis-backed if REDIS_URL else in-memory; prefix 'rl:expensive:'
```

From server/security.ts:
```ts
export async function logSecurityEvent(
  eventType: string,
  details: { ip?: string; status?: 'success' | 'failure' | string; reason?: string; [k: string]: unknown }
): Promise<void>;
```

From client/src/components/ui/form.tsx (shadcn primitive — already installed):
```ts
export const Form;          // alias for FormProvider from react-hook-form
export const FormField;     // wraps Controller
export const FormItem;      // div with id context
export const FormLabel;
export const FormControl;
export const FormMessage;   // renders fieldState.error?.message
export const FormDescription;
```

From client/src/hooks/use-toast.ts:
```ts
export function useToast(): { toast: (opts: { title?: string; description?: string; variant?: 'default'|'destructive' }) => void };
```

From validator (server-side):
```ts
import validator from 'validator';
validator.trim(input: string): string;             // strips leading/trailing whitespace
validator.normalizeEmail(input: string): string|false;
validator.isEmail(input: string): boolean;
// DO NOT use validator.escape (RESEARCH Pitfall #3)
```

From client/src/data/cast.json (post-migration shape — Task 3 produces this):
```ts
{ cast: Array<{
  id: string; name: string; role: string;
  characters: string[];          // unchanged free-text — preserved for backward compat
  characterIds?: string[];       // NEW — explicit cross-link to characters.json[i].id
  isCurrent: boolean;
  avatar: string;
  socialLinks: { youtube: string; twitter: string; instagram: string; twitch: string; website: string };
}> }
```

From client/src/data/social-links.json (verified):
```json
{ "youtube": "...", "twitter": "...", "discord": "...", "reddit": "...", "patreon": "...", "etsy": "...", "email": "..." }
```
SocialStrip renders youtube/twitter/discord/reddit/patreon/etsy. The `email` entry is intentionally skipped (Footer convention).

react-icons/si imports the SocialStrip needs:
```ts
import { SiYoutube, SiX, SiDiscord, SiReddit, SiPatreon, SiEtsy } from 'react-icons/si';
// SiEtsy is NEW vs Footer.tsx — verify import succeeds (RESEARCH Assumption A2)
```

Cast → character resolution table (RESEARCH Section 5; LOCKED):
```
preston-farr → [wayne-archivist, victor-udonta, locke-lirien, whu-mungus, ahri-flowers]
torrey-woolsey → [freya-fenrir, winifred-fred-blodbane, maggie-bramblecheeks, mabel-crosscore]
scott-avis → [carine-sol, bolt, cilin-meekmarrow]
dallin-rogers → [erys-leandorian, aramis-alderhelm, ezra]
ian → [titheus-cillbrost]
jake → [porphan-valaritas]
cory-avis → []   // The Storyteller is GM persona, not a character
```
Cast members with isCurrent:false (alumni) are filtered out of /cast in v1.

Wouter usage (CLAUDE.md):
```ts
import { Link, useLocation } from 'wouter';   // useNavigate is FORBIDDEN — runtime crash
```

SEO contract (client/src/components/SEO.tsx):
```ts
interface SEOProps { title?: string; description?: string; canonical?: string;
  ogImage?: string; keywords?: string; jsonLd?: object; ogType?: string; }
```
</interfaces>

<navigation_target_state>
Final navItems shape after Task 9 (LOCKED):
```ts
const navItems = [
  { label: "Episodes", href: "#episodes" },
  { label: "Characters", href: "#characters" },
  { label: "Campaigns", href: "/campaigns", isRoute: true },
  { label: "Videos", href: "/videos", isRoute: true },
  { label: "Podcast", href: "/podcast", isRoute: true },
  { label: "Cast", href: "/cast", isRoute: true },          // NEW (Phase 4)
  { label: "Community", href: "/community", isRoute: true },// NEW (Phase 4)
  { label: "Lore", href: "#lore" },
  { label: "Shop", href: "/shop", isRoute: true },
  { label: "Sponsorship", href: "/sponsorship", isRoute: true, highlight: true },
  { label: "About", href: "#about" },
];
```
Note: This shape ASSUMES Phase 3 has shipped its Videos+Podcast nav entries. If the working tree differs, preserve the existing nav order and slot Cast+Community immediately after the last route-style entry but before `Lore` (per CONTEXT placement intent: "between Podcast and Shop").
</navigation_target_state>
</context>

<tasks>

<!-- =========================================================================
WAVE 1 — DOC HYGIENE
Phase 1/2/3 lesson: never ship a phase plan with unresolved RESEARCH Open
Questions. Land first so RESEARCH.md is canonical before any code lands.
========================================================================= -->

<task type="auto" tdd="false">
  <name>Task 1: Verify RESEARCH.md Open Questions are sealed (no-op gate — already back-edited during planning)</name>
  <files>.planning/phases/04-fan-engagement/04-RESEARCH.md</files>
  <action>
    No-op. The 4 Open Questions in `04-RESEARCH.md` were back-edited with `**RESOLVED:**` markers during the planning step (matching Phase 1/2/3 convention — back-edit completes before plan-checker runs, not as a runtime task). This task is a verification gate only; the executor confirms the markers are present and proceeds.

    If the verify command fails, the executor should re-apply the 4 RESOLVED lines from this PLAN's <objective> "Open Questions resolved" block and update the heading to `## Open Questions (RESOLVED)`. Do NOT modify any other section of RESEARCH.md.
  </action>
  <verify>
    <automated>node -e "const c=require('fs').readFileSync('.planning/phases/04-fan-engagement/04-RESEARCH.md','utf8');const resolved=(c.match(/RESOLVED/g)||[]).length;const heading=c.includes('## Open Questions (RESOLVED)');process.exit(resolved>=5&&heading?0:1)"</automated>
  </verify>
  <done>
    Verify command exits 0. RESEARCH.md heading is `## Open Questions (RESOLVED)` and all 4 questions carry RESOLVED markers.
  </done>
</task>

<!-- =========================================================================
WAVE 2 — SCHEMAS + DATA MIGRATION
Lay the contracts before any consumer renders. CommunitySubmissionSchema is
imported by both client (Community.tsx) and server (routes.ts). CastMemberSchema
+ data migration unblock Cast.tsx.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 2: Add CommunitySubmissionSchema + CastMemberSchema/CastFileSchema to shared/schema.ts</name>
  <files>shared/schema.ts, test/data/cast-data.test.ts</files>
  <behavior>
    - `CommunitySubmissionSchema` is a Zod object with:
      - `name`: `z.string().trim().min(1).max(80).regex(/^[^\r\n]*$/)` (newline-free — email-header injection defense per RESEARCH Security Domain).
      - `email`: `z.string().email().max(254).optional().or(z.literal(''))` (accepts empty string from RHF defaultValues).
      - `message`: `z.string().trim().min(20).max(2000)`.
      - `website`: `z.string().max(0).optional()` (honeypot — must be empty or absent).
    - Inferred TypeScript type exported as `CommunitySubmissionInput`.
    - `CastMemberSchema` validates each entry of `cast.json`:
      - `id`: non-empty string
      - `name`: non-empty string
      - `role`: non-empty string
      - `characters`: array of strings (preserved free-text)
      - `characterIds`: optional array of strings (NEW)
      - `isCurrent`: boolean
      - `avatar`: non-empty string
      - `socialLinks`: object with youtube/twitter/instagram/twitch/website all `z.string()` (empty string allowed)
    - `CastFileSchema = z.object({ cast: z.array(CastMemberSchema) })`.

    **Build-time test (test/data/cast-data.test.ts) — mirrors test/data/campaigns-data.test.ts:**
    - Imports `cast.json` and `characters.json` and parses cast with `CastFileSchema.parse(...)` — must throw on malformed input.
    - For every cast member, asserts `characterIds.every(id => characters.some(c => c.id === id))` (referential integrity).
    - Asserts that the schema accepts a member with empty `characterIds: []` (cory-avis case).
    - Asserts a NEGATIVE case: a hand-mutated copy with a dangling characterId fails the integrity check.
  </behavior>
  <action>
    Append to `shared/schema.ts`:
    ```ts
    export const CommunitySubmissionSchema = z.object({
      name: z.string().trim().min(1).max(80).regex(/^[^\r\n]*$/, 'name must not contain line breaks'),
      email: z.string().email().max(254).optional().or(z.literal('')),
      message: z.string().trim().min(20).max(2000),
      website: z.string().max(0).optional(),
    });
    export type CommunitySubmissionInput = z.infer<typeof CommunitySubmissionSchema>;

    export const CastMemberSchema = z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      role: z.string().min(1),
      characters: z.array(z.string()),
      characterIds: z.array(z.string()).optional(),
      isCurrent: z.boolean(),
      avatar: z.string().min(1),
      socialLinks: z.object({
        youtube: z.string(), twitter: z.string(), instagram: z.string(), twitch: z.string(), website: z.string(),
      }),
    });
    export const CastFileSchema = z.object({ cast: z.array(CastMemberSchema) });
    ```

    Build the test mirroring `test/data/campaigns-data.test.ts` exactly — same describe/it skeleton, same negative-case mutation pattern.

    Do NOT touch existing schemas. Do NOT modify cast.json yet (Task 3 owns that).

    Verify `npm run check` passes (TypeScript across client+server picks up the new exports cleanly).
  </action>
  <verify>
    <automated>npx vitest run test/data/cast-data.test.ts &amp;&amp; npm run check</automated>
  </verify>
  <done>
    `shared/schema.ts` exports `CommunitySubmissionSchema`, `CommunitySubmissionInput` type, `CastMemberSchema`, `CastFileSchema`. `test/data/cast-data.test.ts` passes (positive + negative paths). `npm run check` clean. cast.json NOT yet migrated — Task 3 will fill `characterIds` AFTER this schema lands. The build-time test currently passes against the un-migrated cast.json because `characterIds` is OPTIONAL on the schema.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Migrate cast.json — hand-author characterIds[] per cast member + resolveCastCharacters helper</name>
  <files>client/src/data/cast.json, client/src/lib/cast.ts, test/lib/cast.test.ts</files>
  <action>
    1. **Migrate `client/src/data/cast.json`**: For each cast member, add a `characterIds` field immediately after `characters`. Use the LOCKED resolution table from RESEARCH Section 5 (verified via direct join of cast.characters[] strings against characters.json[i].name):
       ```
       cory-avis           → []
       preston-farr        → ["wayne-archivist", "victor-udonta", "locke-lirien", "whu-mungus", "ahri-flowers"]
       torrey-woolsey      → ["freya-fenrir", "winifred-fred-blodbane", "maggie-bramblecheeks", "mabel-crosscore"]
       scott-avis          → ["carine-sol", "bolt", "cilin-meekmarrow"]
       dallin-rogers       → ["erys-leandorian", "aramis-alderhelm", "ezra"]
       ian                 → ["titheus-cillbrost"]
       jake                → ["porphan-valaritas"]
       ```
       Apply the same pattern to alumni entries (`colby-poulsen`, `brigette-streeper` if present) — use empty `[]` if their character names don't resolve in characters.json (verify by reading characters.json once before authoring). Do NOT alter the `characters` free-text array, `socialLinks`, `avatar`, or any other field.

       After editing, run `node -e "JSON.parse(require('fs').readFileSync('client/src/data/cast.json'))"` to confirm valid JSON, and re-run `npx vitest run test/data/cast-data.test.ts` (Task 2's test) — the referential-integrity assertion now exercises every populated `characterIds[]` and MUST pass. If a characterId you authored doesn't exist in characters.json, fix the typo (do NOT loosen the test).

    2. **Create `client/src/lib/cast.ts`** exporting:
       ```ts
       import castData from '@/data/cast.json';
       import charactersData from '@/data/characters.json';

       export type CastResolved = { resolved: { id: string; name: string }[]; unresolved: string[] };

       /**
        * For a given cast member, returns:
        * - resolved: { id, name } pairs for each id in characterIds[] that matches a characters.json entry
        * - unresolved: cast.characters[] strings whose names do NOT match any resolved entry's name
        * Renders the linkable chips + the orphan free-text chips per RESEARCH OQ #4.
        */
       export function resolveCastCharacters(
         castMember: typeof castData.cast[number]
       ): CastResolved;

       export function getCurrentCast(): typeof castData.cast;  // filter isCurrent === true
       ```
       The `unresolved` list is built by name-matching the `characters[]` free-text against the names of the resolved entries (case-insensitive; tolerates the spelling drift documented in RESEARCH e.g. Lirian/Lirien). For each cast member, a free-text string is "unresolved" iff NO entry in `resolved` has a matching name. Fall back: if a cast.characters[] string has no characters.json match by name OR characterIds source, it's pushed to `unresolved`.

       Pure data — no React imports. No DOM access.

    3. **Create `test/lib/cast.test.ts`** covering:
       - Cast member with all characters resolved (e.g. `torrey-woolsey`): `resolved` length matches `characterIds` length; `unresolved` is empty when characters[] names match resolved[].name.
       - Cast member with partial resolution (e.g. `preston-farr` who has 7 characters[] but only 5 characterIds[] — "Zeff the Bastard" and "Tazer Face" should land in `unresolved`).
       - Cast member with empty characterIds (e.g. `cory-avis`): `resolved` is empty; `unresolved` contains `["The Storyteller"]`.
       - `getCurrentCast()` filters `isCurrent === false` entries.
  </action>
  <verify>
    <automated>npx vitest run test/lib/cast.test.ts test/data/cast-data.test.ts</automated>
  </verify>
  <done>
    cast.json has `characterIds[]` populated per the LOCKED resolution table. `client/src/lib/cast.ts` exports `resolveCastCharacters` + `getCurrentCast`. Both unit tests + the build-time data test pass. `npm run check` clean.
  </done>
</task>

<!-- =========================================================================
WAVE 3 — SOCIAL STRIP (HOME-PAGE INTEGRATION)
Smallest visible new component. Lands BEFORE Cast.tsx (Task 5) so executor
warms up on the simpler component first; Cast.tsx is the heavier surface.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 4: Implement SocialStrip component + Home.tsx integration + unit tests</name>
  <files>client/src/components/SocialStrip.tsx, client/src/pages/Home.tsx, test/components/SocialStrip.test.tsx</files>
  <behavior>
    - SocialStrip renders a horizontal `<nav aria-label="Show social channels">` band, ~60-80px tall, with icon-buttons for each non-empty URL in `social-links.json`.
    - Channels rendered: `youtube → SiYoutube`, `twitter → SiX`, `discord → SiDiscord`, `reddit → SiReddit`, `patreon → SiPatreon`, `etsy → SiEtsy`. The `email` entry is INTENTIONALLY skipped (Footer convention; mailto: would behave inconsistently in this surface).
    - Empty-URL filter: any channel whose URL is `''` (or whitespace-only) is omitted entirely.
    - Each button mirrors the Footer.tsx visual treatment (verified at Footer.tsx:107-119): `className="w-10 h-10 rounded-md bg-background hover-elevate flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"`. data-testid: `button-strip-${channel}` (e.g. `button-strip-youtube`). aria-label: e.g. `"Follow on YouTube"` (one per icon).
    - Click opens URL in new tab via `window.open(url, '_blank', 'noopener,noreferrer')` (mirrors Footer pattern; consistent with phase's safe-rel rule).
    - Home integration: place `<SocialStrip />` in `Home.tsx` between `<Hero />` and `<LatestEpisodes />` (RESEARCH Q8 placement). Do NOT modify any other Home composition; `<CommunitySection />` (the unrelated existing component) stays where it is.

    **Unit tests (test/components/SocialStrip.test.tsx) using `renderWithProviders`:**
    - Renders 6 buttons (`button-strip-youtube|x|discord|reddit|patreon|etsy`) when all 6 URLs in social-links.json are non-empty (verified at research time — they are).
    - Email entry is NOT rendered as a button (assert `queryByTestId('button-strip-email')` is null).
    - Empty-URL filter: mock the social-links module with `{ youtube: '', twitter: 'https://x.com/...', ...}` and assert the youtube button is absent while twitter renders. Use `vi.mock('@/data/social-links.json', () => ({ default: {...} }))` or pass a `links` prop variant — whichever minimizes mock complexity. PREFER: extract a `socialsFromData(data)` selector and unit-test it directly so the component test can use the real JSON.
    - Each rendered button has `aria-label` set and a data-testid; clicking calls `window.open` with the right URL + `'_blank'` + `'noopener,noreferrer'`.
    - Renders inside a `<nav aria-label="Show social channels">` (DOM assertion).
  </behavior>
  <action>
    1. Create `client/src/components/SocialStrip.tsx`. Export a default React component with no props (reads `social-links.json` directly via static import, matching Footer.tsx convention). Optional: also export a tiny pure helper `selectStripChannels(data: SocialLinksJson): { channel: string; url: string; Icon: IconType; label: string }[]` that's easier to unit-test than the rendered DOM.

    2. Verify `SiEtsy` exists at import time: `node -e "console.log(typeof require('react-icons/si').SiEtsy)"` should print `function`. If it's `undefined`, fall back to a Lucide `ShoppingBag` icon for the etsy slot and document the fallback in the SUMMARY (RESEARCH Assumption A2).

    3. Edit `client/src/pages/Home.tsx`. Add `import SocialStrip from '@/components/SocialStrip';` at the top with the other component imports. Render `<SocialStrip />` immediately after `<Hero />` and before `<LatestEpisodes ... />`. Do NOT touch any other JSX in Home.tsx — keep the diff minimal and reviewable.

    4. Author `test/components/SocialStrip.test.tsx` per <behavior>. Use `vi.spyOn(window, 'open').mockImplementation(() => null)` for click assertions.

    5. Run `npm run lint` and `npm run check` after the edits.
  </action>
  <verify>
    <automated>npx vitest run test/components/SocialStrip.test.tsx &amp;&amp; npm run check</automated>
  </verify>
  <done>
    SocialStrip renders 6 channel icons (or fallback for Etsy if SiEtsy unavailable). Empty-URL filter works. Home.tsx integrates the strip between Hero and LatestEpisodes. All unit tests green. axe coverage will be added in the E2E task.
  </done>
</task>

<!-- =========================================================================
WAVE 4 — /CAST PAGE (FAN-01)
Largest content surface in the phase. Mirrors Campaigns.tsx chrome.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 5: Implement /cast page (Cast.tsx) + unit tests</name>
  <files>client/src/pages/Cast.tsx, test/pages/Cast.test.tsx</files>
  <behavior>
    - Renders Navigation, SEO (title `"Cast - Tales of Aneria"`, canonical `https://talesofaneria.com/cast`, BreadcrumbList JSON-LD via `getBreadcrumbSchema`, NO custom `ogImage`), Footer.
    - Page header mirrors Campaigns.tsx: circle icon (Lucide `Users`), `<h1>Meet the Cast</h1>`, lede "The voices, faces, and characters behind every Tales of Aneria session.".
    - Source: `getCurrentCast()` from `client/src/lib/cast.ts` (returns only `isCurrent === true`).
    - Layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` of cast `<Card>` entries. Each card contains:
      - Avatar `<img src="/cast/${castMember.avatar}" alt="${castMember.name}" loading="lazy" className="w-32 h-32 rounded-full object-cover">` (or whatever the existing `/cast/` asset path convention is — verify by reading `AboutSection.tsx` once during implementation).
      - `<h2 data-testid="text-cast-name-${id}">{name}</h2>` (h2 because h1 is the page title).
      - `<p data-testid="text-cast-role-${id}" className="text-muted-foreground">{role}</p>`.
      - **Character chips row**: per `resolveCastCharacters(castMember)`:
        - For each `{id, name}` in `resolved`: render `<Link href="/characters/${id}" data-testid="link-cast-character-${id}" className="...badge classes...">{name}</Link>` (wouter `<Link>`).
        - For each free-text in `unresolved`: render `<span data-testid="text-cast-character-orphan-${slugify(text)}" className="...badge classes (visually distinct, e.g. muted/no-hover)...">{text}</span>`.
        - If both arrays are empty (cory-avis post-migration): render NOTHING for the chips row (no empty container — `cast member.unresolved` will contain "The Storyteller", so this branch only triggers if data fully empty).
      - **Per-cast socials row**: iterate `socialLinks` entries (`youtube`, `twitter`, `instagram`, `twitch`, `website`). For each non-empty URL, render an icon-button (mirror SocialStrip visual treatment). Icon mapping: youtube→SiYoutube, twitter→SiX, instagram→SiInstagram, twitch→SiTwitch, website→Lucide `Globe`. data-testid: `link-cast-social-${id}-${platform}`. aria-label: e.g. `"${name} on YouTube"`. Open in new tab with safe rel.
    - Empty isCurrent list: render a graceful "Cast announcements coming soon." message (defensive — production will always have entries).

    **Unit tests (test/pages/Cast.test.tsx) using `renderWithProviders`:**
    - Renders all `isCurrent: true` cast members; alumni entries (e.g. mock a member with `isCurrent: false`) are NOT rendered.
    - Per cast: avatar, h2 with name, role paragraph all render with correct testids.
    - Resolved character chips render as `<Link>` to `/characters/<id>`: assert `link-cast-character-wayne-archivist` exists with `href="/characters/wayne-archivist"` for preston-farr.
    - Unresolved character strings render as `<span>` (NOT `<a>` — verify via tagName check): for preston-farr, "Zeff the Bastard" lands as a span, not a link.
    - Cast member with empty resolved AND unresolved (mock `cory-avis`-style fixture but with empty characters[]): no character chips render at all, no crash.
    - Per-cast socials: a cast member with `socialLinks.twitter: "https://x.com/..."` and all other fields `""` renders ONLY the twitter icon — no instagram/youtube/twitch/website buttons.
    - Click on a resolved chip uses wouter routing (assert `<Link>` is present; do NOT assert window.open since these are internal).
    - Click on a per-cast social calls `window.open` with the URL + `'_blank'` + `'noopener,noreferrer'`.
    - axe pass — call `axe(container)` from `vitest-axe` if installed; otherwise defer to E2E (Task 8). Confirm via existing test pattern in the codebase.
  </behavior>
  <action>
    Mirror `client/src/pages/Campaigns.tsx` line-for-line for the page chrome (SEO + Navigation + page header + Footer). Substitute the body per <behavior>.

    Use `getCurrentCast()` and `resolveCastCharacters()` from Task 3. Do NOT inline the resolution logic — keep it in the helper for testability.

    Verify the `/cast/${avatar}` asset path by reading AboutSection.tsx once. If AboutSection uses a different convention (e.g. an asset import map), match it.

    Tests use static imports of cast.json (the real, post-migration data) — DO NOT mock cast.json. Mock `vi.mock('@/data/cast.json', ...)` ONLY for the alumni-filter and empty-state tests where you need a synthetic fixture. The realistic-data tests assert against current Preston/Torrey/Cory entries.

    No `useNavigate`. No new server endpoints.
  </action>
  <verify>
    <automated>npx vitest run test/pages/Cast.test.tsx</automated>
  </verify>
  <done>
    `/cast` renders only `isCurrent: true` cast members with avatar/name/role, character chips (linked when resolved, plain spans when free-text), per-cast socials (only non-empty URLs). All unit tests green. `npm run check` and `npm run check:mistakes` clean.
  </done>
</task>

<!-- =========================================================================
WAVE 5 — /COMMUNITY ENDPOINT (FAN-03 SERVER)
Server first so the form (Task 7) has a real endpoint to wire. The endpoint is
written CORRECTLY per RESEARCH Pattern 3 — NOT a mirror of /api/contact/sponsor.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 6: Implement POST /api/community/submit endpoint + unit tests + .env.example update</name>
  <files>server/routes.ts, .env.example, test/server/community-submit.test.ts</files>
  <behavior>
    - Route registered as `app.post('/api/community/submit', expensiveLimiter, async (req, res) => {...})` — middleware order is `expensiveLimiter` BEFORE the handler so rate-limited requests never enter validation.
    - Handler flow:
      1. `CommunitySubmissionSchema.safeParse(req.body)` (imported from `shared/schema.ts`). On failure: `await logSecurityEvent('COMMUNITY_SUBMIT_INVALID', { ip: req.ip, status: 'failure', reason: parsed.error.message })`; respond `400 { success: false, error: 'Invalid submission' }` (NO Zod path leak).
      2. Honeypot check: if `parsed.data.website && parsed.data.website.length > 0` → `await logSecurityEvent('COMMUNITY_SUBMIT_HONEYPOT', { ip: req.ip, status: 'failure', reason: 'honeypot filled' })`; respond `200 { success: true }` (silent success — bot doesn't learn). DO NOT call sendAdminAlert.
      3. Recipient pre-check: `const recipient = process.env.FAN_SUBMISSIONS_RECIPIENT || process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL;` If unset, `await logSecurityEvent('COMMUNITY_SUBMIT_MISCONFIG', { ip: req.ip, status: 'failure', reason: 'no recipient configured' })`; respond `503 { success: false, error: 'Submission endpoint not configured' }`.
      4. SES configuration pre-check: if `!process.env.AWS_SES_FROM_EMAIL` → `503` with the same body + `logSecurityEvent('COMMUNITY_SUBMIT_MISCONFIG', { reason: 'SES not configured' })`. (sendAdminAlert internally swallows the boolean — pre-check is the cleanest way to surface 503 to the client.)
      5. Sanitize: `const safeName = validator.trim(parsed.data.name); const safeMessage = validator.trim(parsed.data.message); const safeEmail = parsed.data.email ? (validator.normalizeEmail(parsed.data.email) || '') : '';` — NO `validator.escape` (RESEARCH OQ #2).
      6. Truncated IP: `const truncatedIp = (req.ip || '').replace(/\.\d+$/, '.xxx');` (privacy; full IP only in audit log).
      7. Body composition (text/plain only):
         ```
         Name: ${safeName}
         Email: ${safeEmail || '(not provided)'}

         Message:
         ${safeMessage}
         ```
         Subject: `[Fan submission] from ${safeName}`.
         Metadata: `{ source: '/community', ip: truncatedIp, timestamp: new Date().toISOString() }`.
      8. Try/catch wrapping the `await sendAdminAlert(subject, body, metadata)` call. On thrown error: `logSecurityEvent('COMMUNITY_SUBMIT_SEND_FAIL', {...})` then `503 { success: false, error: 'Submission could not be delivered' }`.
      9. Success: `res.json({ success: true })`.

    - `.env.example` documents the new optional override:
      ```
      # Optional override; falls back to ADMIN_EMAIL || SUPPORT_EMAIL when unset
      FAN_SUBMISSIONS_RECIPIENT=
      ```

    **Unit tests (test/server/community-submit.test.ts) using supertest + vi.mock:**
    - Mock `../../server/notification-service` to spy on `sendAdminAlert`. Mock `../../server/security` to spy on `logSecurityEvent`.
    - **Happy path**: ADMIN_EMAIL + AWS_SES_FROM_EMAIL set; valid payload; assert `sendAdminAlert` called once with subject `[Fan submission] from Alice`, body containing the literal message, metadata with `source: '/community'` and a truncated IP. Response: `200 { success: true }`.
    - **Honeypot**: payload with `website: 'http://spam.example'`; assert `sendAdminAlert` NOT called; assert `logSecurityEvent` called with `'COMMUNITY_SUBMIT_HONEYPOT'`; response `200 { success: true }`.
    - **Zod boundary — message too short**: `message: 'too short'` (9 chars); response `400 { success: false, error: 'Invalid submission' }`; assert no Zod path leak (response.error is the literal string, not a stringified ZodError); assert `logSecurityEvent('COMMUNITY_SUBMIT_INVALID', ...)`.
    - **Zod boundary — name with newline**: `name: 'Alice\nBob'`; response 400 (regex rejects); email-header injection defense covered.
    - **Zod boundary — name too long**: 81 chars → 400.
    - **Zod boundary — message too long**: 2001 chars → 400.
    - **Email empty string is accepted**: `email: ''` with otherwise-valid payload → 200.
    - **Email invalid is rejected**: `email: 'not-an-email'` → 400.
    - **Recipient unset (503)**: temporarily delete `process.env.ADMIN_EMAIL`, `process.env.FAN_SUBMISSIONS_RECIPIENT`, `process.env.SUPPORT_EMAIL`; valid payload → 503; assert `sendAdminAlert` NOT called.
    - **SES unconfigured (503)**: ADMIN_EMAIL set, AWS_SES_FROM_EMAIL unset; valid payload → 503; assert `sendAdminAlert` NOT called.
    - **sendAdminAlert throws (503)**: mock implementation throws; valid payload + all env set → 503 + `logSecurityEvent('COMMUNITY_SUBMIT_SEND_FAIL', ...)`.
    - **Sanitization preserves punctuation**: `message: 'Hello & welcome <3 — looks great!'.padEnd(20, '.')` → assert sendAdminAlert body contains the literal `&` and `<` (NOT `&amp;` / `&lt;`), proving validator.escape was NOT applied (this is the key OQ #2 regression test).
    - **Truncated IP**: spy assertion that metadata.ip ends with `.xxx` and never contains the full last octet.
    - Rate-limit boundary smoke: send 11 requests in quick succession from the same simulated IP; the 11th returns 429. (If express-rate-limit + supertest don't share IP cleanly, mark this with `it.skip` and document — the manual checkpoint covers it.)
  </behavior>
  <action>
    Append the route to `server/routes.ts` near line ~1885 (just before `return createServer(app)`, or wherever the file's "near-end public endpoints" cluster is — match the pattern of /api/contact/sponsor's location for proximity even though the implementation differs).

    Imports to add at the top of `server/routes.ts`:
    ```ts
    import validator from 'validator';
    import { CommunitySubmissionSchema } from '../shared/schema';
    import { sendAdminAlert } from './notification-service';
    // logSecurityEvent and expensiveLimiter likely already imported — verify at edit time
    ```

    Document the new env var in `.env.example` near the existing `ADMIN_EMAIL` entry (line ~174 per RESEARCH).

    Write the test using the existing test pattern. If the project has a supertest setup for routes (search for `import request from 'supertest'`), use it. If routes tests use a different harness, mirror that harness — DO NOT spin up a brand-new pattern.

    The test must `vi.mock('../../server/notification-service', () => ({ sendAdminAlert: vi.fn(...), sendEmail: vi.fn(() => true) }))` to avoid hitting real SES.

    Do NOT modify `/api/contact/sponsor`. Do NOT introduce a new helper module — keep the route's logic inline (matches sponsor pattern's structural simplicity even though sponsor's implementation is the broken one we're not copying).

    Run `npm run check` after edits.
  </action>
  <verify>
    <automated>npx vitest run test/server/community-submit.test.ts</automated>
  </verify>
  <done>
    POST /api/community/submit registered with expensiveLimiter, Zod validation, honeypot silent-success, validator.trim sanitization, sendAdminAlert delivery, 503 on misconfig or send failure, logSecurityEvent on every rejection branch. .env.example documents FAN_SUBMISSIONS_RECIPIENT. All unit tests pass. No regression in existing route tests (run `npm run test:quick` to confirm). `npm run check` clean.
  </done>
</task>

<!-- =========================================================================
WAVE 6 — /COMMUNITY PAGE (FAN-03 CLIENT)
Form lives at /community; talks to the endpoint from Task 6.
========================================================================= -->

<task type="auto" tdd="true">
  <name>Task 7: Implement /community page (Community.tsx) + unit tests</name>
  <files>client/src/pages/Community.tsx, test/pages/Community.test.tsx</files>
  <behavior>
    - Renders Navigation, SEO (title `"Community - Tales of Aneria"`, canonical `https://talesofaneria.com/community`, NO custom ogImage), Footer.
    - Page header mirrors Campaigns.tsx: circle icon (Lucide `MessagesSquare`), `<h1>Share your story</h1>`, lede "Send us fan art links, theories, character ideas, or anything else you want the cast to see.".
    - Form built with react-hook-form + zodResolver, sharing `CommunitySubmissionSchema` from `shared/schema.ts` (single source of truth):
      ```tsx
      const form = useForm<CommunitySubmissionInput>({
        resolver: zodResolver(CommunitySubmissionSchema),
        defaultValues: { name: '', email: '', message: '', website: '' },
      });
      ```
    - Composition uses shadcn `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>` from `@/components/ui/form`. Visible fields:
      - Name: `<Input>` with `data-testid="input-community-name"`, label "Your name".
      - Email: `<Input type="email">` with `data-testid="input-community-email"`, label "Your email (optional)".
      - Message: `<Textarea rows={6}>` with `data-testid="input-community-message"`, label "Your message".
    - Honeypot field — visually hidden via Tailwind's `sr-only` (RESEARCH Q6 final recommendation). EXACT JSX:
      ```tsx
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="community-website-honeypot">Leave this field empty</label>
        <input
          id="community-website-honeypot"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-testid="input-community-website"
          {...form.register('website')}
        />
      </div>
      ```
      (Note: `type="text"` — NOT `type="hidden"` — per RESEARCH Q6 critical attributes.)
    - Submit handler:
      ```ts
      async (data: CommunitySubmissionInput) => {
        try {
          const res = await fetch('/api/community/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error(`status ${res.status}`);
          const json = await res.json();
          if (!json.success) throw new Error('submission rejected');
          setStatus('success');
          toast({ title: 'Thanks for sharing!', description: 'We received your submission.' });
          form.reset();
        } catch (err) {
          setStatus('error');
          toast({ title: 'Could not send', description: 'Please try again or email us directly.', variant: 'destructive' });
        }
      }
      ```
    - Status region (above the form):
      ```tsx
      <div role="status" aria-live="polite" data-testid="community-status">
        {status === 'success' && <Alert>Thanks for sharing! We received your submission.</Alert>}
        {status === 'error' && <Alert variant="destructive">Couldn't send — please try again or email contact@talesofaneria.com.</Alert>}
      </div>
      ```
    - Submit button: `<Button type="submit" data-testid="button-community-submit">Send</Button>`. Disabled while `form.formState.isSubmitting`.
    - NO redirect on success. Stay on `/community`.

    **Unit tests (test/pages/Community.test.tsx) using `renderWithProviders`:**
    - **Renders all four fields including the honeypot**: assert testids exist; assert honeypot input has `aria-hidden`-ancestor and `tabIndex=-1` and `autoComplete="off"` and `type="text"` (DOM attribute checks).
    - **Honeypot is visually hidden via sr-only**: assert the parent div has `className` containing `sr-only` (verifies we're using the Tailwind utility, not display:none).
    - **Valid submit fires fetch + Toast + resets form**: mock `fetch` to return `{ ok: true, json: async () => ({ success: true }) }`; fill name/email/message with valid values; click submit; assert one fetch call with URL `/api/community/submit`, method POST, body matching the input; assert `community-status` shows the success Alert; assert toast was triggered (spy on `useToast`); assert form fields are cleared (`form.reset` was called — assert visible field values are empty).
    - **Invalid submit (message too short) shows FormMessage errors and does NOT fetch**: fill message with `'short'` (5 chars); click submit; assert `fetch` was NOT called; assert FormMessage error rendered under the message field (look for the Zod error text or a generic field-error testid).
    - **Server 400 shows error Alert + destructive Toast**: fetch returns `{ ok: false, status: 400 }`; submit valid form; assert `community-status` shows destructive Alert.
    - **Server 503 shows error Alert**: fetch returns `{ ok: false, status: 503 }`; same assertion.
    - **Network error shows error Alert**: fetch rejects; same assertion.
    - **Empty email is accepted client-side**: fill name + message + empty email; assert fetch IS called (RHF + zodResolver path: empty string is `.or(z.literal(''))`).

    The honeypot endpoint behavior is owned by Task 6's server tests; this client-side test does NOT need to send a honeypot-filled payload (RHF defaults to empty string, and the schema allows `max(0)`).
  </behavior>
  <action>
    Build `client/src/pages/Community.tsx` per <behavior>. Mirror `Campaigns.tsx` for SEO + Navigation + Footer chrome. Use the shadcn `<Form>` primitive — DO NOT hand-roll form state. Import `CommunitySubmissionSchema` and `CommunitySubmissionInput` directly from `@shared/schema`.

    Use `useToast` from `@/hooks/use-toast`. `<Toaster />` is already mounted in App.tsx (verified RESEARCH).

    Build `test/pages/Community.test.tsx` using `vi.spyOn(global, 'fetch')` (or `mockFetch` if `test/helpers/test-utils.tsx` exposes a flexible enough variant). Use `userEvent` from `@testing-library/user-event` for typing into the form.

    Do NOT mirror `Sponsorship.tsx`'s useState pattern — this is the upgrade path (RESEARCH Risk #5).

    Do NOT modify `Sponsorship.tsx`, `<CommunitySection />` (the existing home component), or any unrelated form.

    `npm run check && npm run lint` after edits.
  </action>
  <verify>
    <automated>npx vitest run test/pages/Community.test.tsx</automated>
  </verify>
  <done>
    `/community` renders form + honeypot via sr-only; valid submit calls /api/community/submit and shows success Alert + Toast; invalid submit shows inline FormMessage errors; error responses surface a destructive Alert + Toast. All unit tests pass. `npm run check` and `npm run check:mistakes` clean.
  </done>
</task>

<!-- =========================================================================
WAVE 7 — ROUTES + NAV WIRING + E2E
Wires the new pages into App.tsx + Navigation.tsx, then runs the cross-surface
Playwright spec covering all three FAN-* requirements with axe.
========================================================================= -->

<task type="auto" tdd="false">
  <name>Task 8: Wire wouter routes + Navigation entries + Playwright + axe E2E</name>
  <files>client/src/App.tsx, client/src/components/Navigation.tsx, e2e/fan-engagement.spec.ts</files>
  <action>
    1. **client/src/App.tsx**: add the two new routes alongside the existing route block. Mirror the pattern used for Campaigns/Videos/Podcast routes (verify by reading App.tsx once at edit time):
       ```tsx
       import Cast from '@/pages/Cast';
       import Community from '@/pages/Community';
       // ...
       <Route path="/cast" component={Cast} />
       <Route path="/community" component={Community} />
       ```
       Order: place these route entries near the other route-style entries (after Podcast, before Shop) for grep-ability.

    2. **client/src/components/Navigation.tsx**: extend `navItems` with two new entries placed between `Podcast` and `Shop` (matching <navigation_target_state> above):
       ```ts
       { label: 'Cast', href: '/cast', isRoute: true },
       { label: 'Community', href: '/community', isRoute: true },
       ```
       If Phase 3's `Videos` and `Podcast` route entries are NOT yet present (working-tree skew), slot Cast+Community immediately after the last `isRoute: true` non-Shop entry but BEFORE the `Shop` entry. Do NOT remove or reorder existing entries.

    3. **e2e/fan-engagement.spec.ts**: mirror `e2e/campaigns.spec.ts` for harness shape. Cover three scenarios — keep them under three `test(...)` blocks for readability:

       ```ts
       test('Cast page lists current cast and links to character details', async ({ page }) => {
         await page.goto('/cast');
         // assert at least one cast card visible
         await expect(page.getByTestId('text-cast-name-preston-farr')).toBeVisible();
         // click a known resolved character chip
         await page.getByTestId('link-cast-character-wayne-archivist').click();
         await expect(page).toHaveURL(/\/characters\/wayne-archivist/);
         // axe — return to /cast first
         await page.goto('/cast');
         await expect(page).toPassAxeCheck();
       });

       test('Home page renders SocialStrip with safe rel outbound links', async ({ page }) => {
         await page.goto('/');
         await expect(page.getByTestId('button-strip-youtube')).toBeVisible();
         // verify rel via window.open arg — easier: assert an <a> exists with rel="noopener noreferrer" if SocialStrip uses anchors;
         // if it uses window.open buttons, override window.open and capture args.
         await page.exposeFunction('captureOpen', () => {});
         await page.evaluate(() => { (window as any).open = (url: string, target: string, features: string) => { (window as any).__lastOpen = { url, target, features }; }; });
         await page.getByTestId('button-strip-youtube').click();
         const captured = await page.evaluate(() => (window as any).__lastOpen);
         expect(captured.target).toBe('_blank');
         expect(captured.features).toContain('noopener');
         expect(captured.features).toContain('noreferrer');
         await expect(page).toPassAxeCheck();
       });

       test('Community form: valid submit shows success; honeypot-filled submit returns 200 without delivery', async ({ page, context }) => {
         // happy path
         await page.route('**/api/community/submit', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }));
         await page.goto('/community');
         await page.getByTestId('input-community-name').fill('Alice');
         await page.getByTestId('input-community-email').fill('alice@example.com');
         await page.getByTestId('input-community-message').fill('I just discovered Tales of Aneria and the world-building blew my mind!');
         await page.getByTestId('button-community-submit').click();
         await expect(page.getByTestId('community-status')).toContainText(/thanks/i);
         await expect(page).toPassAxeCheck();

         // honeypot — exercise the schema rejection path on a real fetch by sending the payload via page.request
         // (Skipping route mock so this can exercise the real server behavior in CI envs that boot the server.)
         // If E2E does NOT boot the server, mock with the silent-success contract documented in Task 6:
         await page.route('**/api/community/submit', route => {
           // assert no honeypot-bearing requests are honored as side-effecting
           // — the assertion lives in Task 6's server test; here we only assert client UX
           route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
         });
         // The visible UX is identical for honeypot vs success — that's by design (silent rejection).
         // No additional E2E assertion needed beyond Task 6's server-side coverage.
       });
       ```

       Note: the honeypot E2E case is intentionally minimal because Task 6's server test owns the deep behavior assertion (no email fired). The E2E spec exists primarily to prove the cross-surface integration plus axe coverage on three pages.

    4. Run `npm run lint && npm run check`. Run the new E2E spec:
       ```
       npx playwright install chromium  # if not already cached
       npx playwright test e2e/fan-engagement.spec.ts
       ```
       If the local environment lacks Playwright browsers, document and let CI run the spec.
  </action>
  <verify>
    <automated>npm run check &amp;&amp; npx playwright test e2e/fan-engagement.spec.ts</automated>
  </verify>
  <done>
    `/cast` and `/community` are reachable wouter routes. Navigation surfaces both new entries. Playwright spec passes (3 scenarios) with axe checks on /cast, /, and /community. `npm run check` clean.
  </done>
</task>

<!-- =========================================================================
WAVE 8 — MANUAL CHECKPOINT
Final human verification of the three surfaces against a deployed (or local
preview) environment, including a real /community submission with mocked SES
or real SES depending on env.
========================================================================= -->

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    - `/cast` page listing current cast members with linked characters and per-cast socials (FAN-01)
    - Home page `<SocialStrip>` between Hero and LatestEpisodes (FAN-02)
    - `/community` page with rate-limited, sanitized submission form delivering via SES (FAN-03)
    - Navigation entries for Cast and Community
  </what-built>
  <how-to-verify>
    Run a local preview (`npm run dev`) or use the deployed preview URL:

    1. **`/cast`**:
       - Visit `/cast`. Confirm 7 current cast members render (Cory, Preston, Torrey, Scott, Dallin, Ian, Jake — verify the count by counting cards). No alumni cards.
       - For Preston Farr's card, confirm linked chips for Wayne the Archivist of Lies, Victor Udonta, Locke Lirian, Hu Mungus, Ahri Flowers (5 chips), AND plain-text spans for Zeff the Bastard and Tazer Face (2 chips). Total 7.
       - Click "Wayne the Archivist of Lies" — should navigate to `/characters/wayne-archivist`.
       - For Cory Avis, confirm only "The Storyteller" renders as a plain-text span (no link).
       - Confirm any cast member with populated socials renders only the icons whose URL is non-empty (Preston has 5 social icons; Cory has 0).
       - Tab through the page; focus rings are visible on all interactive elements.

    2. **Home SocialStrip**:
       - Visit `/`. Confirm a horizontal band of 6 icons (YouTube, X, Discord, Reddit, Patreon, Etsy) appears between the Hero and the latest episodes section. Email is NOT shown.
       - Click each icon — opens in a new tab to the correct URL with no warning about insecure rel (browser console clean).

    3. **`/community`**:
       - Visit `/community`. Confirm the form has Name, Email, Message fields plus a submit button. Honeypot field is invisible (run DevTools → Elements → search for `community-website-honeypot` to confirm it exists in the DOM but is sr-only).
       - Try submitting with a 5-char message — confirm inline error appears under the message field; no network request fires.
       - Submit a valid form. Confirm success Alert + Toast. Form fields clear. Stay on /community.
       - In DevTools Network tab, confirm `POST /api/community/submit` returned 200 with `{success: true}` in the body.
       - **If running with real SES configured**: confirm an email arrived at the configured admin address with the literal `&` `<` `>` characters preserved (NOT escaped to `&amp;` etc.) — this is the OQ #2 visual proof.
       - **If running without SES**: confirm endpoint returns 503 when you submit a valid form (DevTools Network).
       - Tab through the form; focus rings visible; honeypot field is NEVER reachable via Tab (tabIndex=-1).

    4. **Lighthouse / axe quick check (optional, ~2 min)**:
       - Run Lighthouse on `/cast` and `/community` — Accessibility score should be ≥ 95.
  </how-to-verify>
  <resume-signal>Type "approved" if all four scenarios pass, or describe issues per scenario number (e.g., "Cast page issue: Cory's Storyteller chip is rendering as a link").</resume-signal>
</task>

</tasks>

<verification>
- `npm run check` — clean
- `npm run lint` — clean
- `npm run check:mistakes` — clean (no `useNavigate` imports leaked)
- `npm run check:markdown-secrets` — clean (PLAN.md and RESEARCH.md back-edits are scanned)
- `npx vitest run` — all unit tests green; new tests cover Cast / Community / SocialStrip / cast helper / cast data / community endpoint
- `npx playwright test e2e/fan-engagement.spec.ts` — green with axe pass on /cast, /, /community
- `npm run test:coverage` — global threshold (40%) maintained or improved; `server/routes.ts` thresholds (40 lines / 47 functions) maintained or improved by the new endpoint + tests
</verification>

<success_criteria>
1. **FAN-01**: Visitor opens `/cast` and sees each `isCurrent` cast member's character link plus public socials. Resolved characters link to `/characters/<id>`; orphans render as plain text.
2. **FAN-02**: Home page shows a SocialStrip linking to the show's official channels above-the-fold.
3. **FAN-03**: Visitor submits fan content via a rate-limited, sanitized, no-auth form on `/community`; submission delivered via SES email (when configured) and acknowledged in the UI; honeypot rejections silent; misconfig returns 503.
4. All RESEARCH Open Questions (#1-#4) carry RESOLVED markers in 04-RESEARCH.md.
5. `cast.json` migrated with `characterIds[]` per the LOCKED resolution table; build-time test enforces referential integrity.
6. `/api/community/submit` is the FIRST CORRECTLY-IMPLEMENTED public form endpoint in this codebase: rate-limit + Zod + honeypot + validator.trim + sendAdminAlert + 503 on misconfig + audit logging on every rejection branch. The broken `/api/contact/sponsor` stub is NOT mirrored.
7. `<CommunitySection />` (existing home component) and `Sponsorship.tsx` (existing form) are NOT modified by this phase.
8. axe (WCAG 2.1 AA) passes on `/cast`, `/`, and `/community`.
</success_criteria>

<output>
After completion, create `.planning/phases/04-fan-engagement/04-01-SUMMARY.md` per `$HOME/.claude/get-shit-done/templates/summary.md`. Include:
- Final task counts: 9 tasks, 1 checkpoint, ~6 atomic commits.
- Resolution-table audit: which characterIds[] values were added per cast member and which orphans remained.
- SocialStrip Etsy decision: confirmed `SiEtsy` available in react-icons/si v5.4.0, OR fell back to Lucide `ShoppingBag`.
- Endpoint verification: confirmed expensiveLimiter + Zod + honeypot + validator.trim + sendAdminAlert + 503 paths all wired.
- Note for Phase 5 (SEO-01): the new routes `/cast` and `/community` should be added to `sitemap.xml` in that phase.
- Backlog items surfaced: (a) retrofit `/api/contact/sponsor` to match the new pattern, (b) convert `Sponsorship.tsx` to react-hook-form, (c) consider Cloudflare Turnstile if real spam volume materializes (RESEARCH Risk #3), (d) per-IP `communityLimiter` if `expensiveLimiter` bucket exhaustion becomes real (RESEARCH Risk #2).
</output>
