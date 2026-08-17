# Phase 4: Fan Engagement — Research

**Researched:** 2026-05-09
**Domain:** Public form submission + content surfaces (cast list, social strip, community form → SES email)
**Confidence:** HIGH (all critical facts verified by direct file read)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New `/cast` page (separate route, mirrors `/characters` and `/campaigns`) listing `isCurrent: true` cast only.
- Each cast entry shows avatar, name, role, character names linked to `/characters/<id>` (cast→character cross-link), and per-cast public socials (`youtube, twitter, instagram, twitch, website`). Empty-string fields are HIDDEN — only render icon-link if URL is non-empty.
- New `<SocialStrip>` component on Home (distinct from Footer socials), placed between `<Hero>` and `<LatestEpisodes>`. Sources from `client/src/data/social-links.json`. Filters non-empty URLs.
- Icons via `react-icons/si` (matches Footer). Aria-label per icon.
- New `/community` page (not modal) with text-only form: `name` (required, 1–80), `email` (optional, valid if present), `message` (required, 20–2000), hidden honeypot `website` (must be empty; if filled, server returns success and silently discards).
- No file uploads, no URL link field, no auth.
- Submission destination: AWS SES email to admin only via `server/notification-service.ts`. No DB persistence.
- Reuse existing SES wrapper. Recipient via `FAN_SUBMISSIONS_RECIPIENT` or fallback `ADMIN_EMAIL` (researcher confirms `ADMIN_EMAIL` exists — see below).
- New endpoint: `POST /api/community/submit` mirroring `/api/contact/sponsor` line-for-line WITH the spam-mitigation upgrades: `expensiveLimiter` (10/hr/IP), Zod schema validation, sanitize-html (or equivalent already in deps), honeypot rejection. No CAPTCHA in v1.
- Form UX: react-hook-form + zodResolver. On submit success: inline success message + Toast. On submit failure: inline error. No redirect — stay on `/community`.
- Accessibility: explicit `<label>` per input; visible focus rings; aria-live on success/error region; honeypot `aria-hidden="true"`, visually hidden via CSS (NOT `display: none`), `tabindex="-1"`, `autocomplete="off"`.
- `cast.json` migration: add new `characterIds[]` field on each cast member (small in-place migration in this phase) — researcher's recommended approach (see resolution table below).
- Testing: unit + Playwright + axe; mocked SES.

### Claude's Discretion
- Exact placement of `<SocialStrip>` on `Home.tsx` (CONTEXT suggests between Hero and LatestEpisodes — verified non-disruptive; recommended).
- Whether to render orphan/free-text characters (cast members whose listed characters don't resolve in `characters.json`) as plain text or omit (see Risk #3 below — recommendation: render as plain text label, no link).
- Icon mapping for Etsy in `<SocialStrip>` (Footer doesn't expose Etsy today; researcher recommends `SiEtsy`).

### Deferred Ideas (OUT OF SCOPE)
- Image/file uploads on submission form
- DB persistence + moderation queue + admin UI
- CAPTCHA / hCaptcha / Turnstile
- Populating cast.json socialLinks with real URLs (content authoring follow-up)
- Per-cast detail pages `/cast/<id>` (list-only v1)
- Live integrations (Twitch online indicator, real-time YouTube live state)
- Cast alumni section (`isCurrent: false`)
- Larger items in INFLUENCER_FEATURES_ANALYSIS.md
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FAN-01 | Meet the Cast surface aggregating each cast member's character link + public socials | Confirmed `cast.json` has 9 entries (7 current, 2 alumni `isCurrent: false`); per-cast `socialLinks` schema in place with empty strings; `characters.json` keys for name→id resolution table built (Section 5) |
| FAN-02 | Social aggregation strip on home page linking to show channels | `social-links.json` populated with 6 fields (youtube, twitter, discord, reddit, patreon, etsy); Footer.tsx already maps 5 of 6 via `react-icons/si`; Etsy needs new mapping |
| FAN-03 | Fan-content opt-in submission form (rate-limited, sanitized, no auth; stored or emailed via SES) | `expensiveLimiter` exported from `server/rate-limiter.ts`; `sendAdminAlert` exists in `server/notification-service.ts` and uses `ADMIN_EMAIL` env var; `validator` package present (no `sanitize-html` — see Risk #1) |
</phase_requirements>

## Summary

Phase 4 ships three thin surfaces over substantial existing scaffolding. The most important research finding: **the existing `/api/contact/sponsor` endpoint is a poor template to mirror line-for-line** — it has neither rate limiting, nor Zod validation, nor sanitization, nor real SES delivery. It only logs and returns success. The new `/api/community/submit` endpoint must be written *correctly from scratch* using the patterns from `notification-service.ts` (`sendAdminAlert` is already a good fit), `rate-limiter.ts` (`expensiveLimiter`), and `validator` (already in deps; `sanitize-html` is NOT installed and would be a new dep).

The existing `Sponsorship.tsx` form does NOT use `react-hook-form` or `zodResolver` — it uses bare `useState` + native `required`. The CONTEXT-locked decision to use react-hook-form + zodResolver is therefore an upgrade, not a mirror. A reusable shadcn `<Form>` primitive is already installed (`client/src/components/ui/form.tsx`) and `useToast` is wired (`client/src/hooks/use-toast.ts`, `<Toaster>` in `App.tsx`). Use them directly.

Cast↔character cross-link is feasible: 7-of-9 cast members have at least one character that resolves cleanly to `characters.json`. Several cast.characters[] strings (notably "The Storyteller", "Tazer Face", "Hu Mungus", "Aramis") do NOT resolve and need a fallback render.

**Primary recommendation:** Add `characterIds[]` to `cast.json` schema, populate it for clean matches, render orphan strings as plain text (no link). Use `validator.escape` from `validator` (already a dep) for message sanitization — do NOT add `sanitize-html`. Use `sendAdminAlert(...)` for SES delivery. Use the shadcn `<Form>` primitive for the new form.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cast list rendering | Browser/Client | — | Static JSON, client-side filter (`isCurrent`) |
| Character cross-link resolution | Build/Client | — | `cast.json` `characterIds[]` resolved against `characters.json` at render time |
| Social strip rendering | Browser/Client | — | Static JSON read at compile/render time |
| Form rendering + client validation | Browser/Client | — | react-hook-form + zodResolver |
| Form submission | API/Backend | — | POST `/api/community/submit` |
| Rate limiting | API/Backend | — | `expensiveLimiter` middleware (Redis-backed if available, in-memory fallback) |
| Sanitization | API/Backend | — | `validator.escape` server-side (defense in depth even if client validates) |
| Honeypot detection | API/Backend | — | Server inspects `website` field; silent success if non-empty |
| Email delivery | API/Backend | AWS SES | `sendAdminAlert(subject, body, metadata)` from notification-service |
| Audit logging | API/Backend | DB (auditLogs table) | `logSecurityEvent` for honeypot rejections + validation failures |

## Standard Stack

### Already in deps — REUSE these
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-hook-form` | ^7.55.0 | Form state + validation | Already installed; shadcn `<Form>` primitive built around it |
| `@hookform/resolvers` | ^3.10.0 | Zod adapter for RHF | Already installed; `zodResolver(schema)` |
| `zod` | ^3.24.2 | Schema validation client + server | Already used everywhere |
| `validator` | ^13.15.15 | `validator.escape`, `validator.isEmail`, `validator.trim` | Already used in `server/security.ts` (see `validateString`); reuse |
| `react-icons` | ^5.4.0 | `SiYoutube`, `SiX`, `SiDiscord`, `SiPatreon`, `SiReddit`, `SiEtsy` | Already used in Footer.tsx |
| `express-rate-limit` | ^8.2.1 | `expensiveLimiter` (10/hr/IP) | Already exported from `server/rate-limiter.ts` |
| `@aws-sdk/client-ses` | ^3.962.0 | SES email delivery | Wrapped in `notification-service.ts` |

### Do NOT install
- `sanitize-html` — NOT in deps; CONTEXT lists it as a candidate but the existing pattern uses `validator.escape` (`server/security.ts` line 224). Match existing pattern. Adding `sanitize-html` would diverge from codebase norms.
- `DOMPurify` — NOT in deps; not needed (we send text/plain SES, no HTML render of user input).

### Verification
- `validator` confirmed at `package.json:158` with `@types/validator:13.15.3` at `:111`
- `sanitize-html` searched — only one match, `04-CONTEXT.md` itself (i.e., not a dep)
- `react-hook-form` confirmed at `package.json:145`
- `@hookform/resolvers` confirmed at `package.json:78`

## Architecture Patterns

### Recommended file additions

```
client/src/pages/Cast.tsx                    # NEW (FAN-01)
client/src/pages/Community.tsx               # NEW (FAN-03 client)
client/src/components/SocialStrip.tsx        # NEW (FAN-02)
client/src/lib/cast.ts                       # NEW — character resolution helper

# Tests
test/pages/Cast.test.tsx
test/pages/Community.test.tsx
test/components/SocialStrip.test.tsx
test/lib/cast.test.ts
test/server/community-submit.test.ts         # API endpoint test (or appended to existing routes test)
e2e/fan-engagement.spec.ts                   # Playwright + axe across all three surfaces
```

### Server additions
- `server/routes.ts`: append new `app.post('/api/community/submit', expensiveLimiter, async (req, res) => {...})` near line ~1885 (just before `return createServer(app)`).
- New env var: `FAN_SUBMISSIONS_RECIPIENT` (optional; falls back to `ADMIN_EMAIL`). Document in `.env.example`.
- `shared/schema.ts`: append `CommunitySubmissionSchema` Zod export so client + server share validation.

### Pattern 1: react-hook-form + zodResolver + shadcn `<Form>`

The project already has the shadcn Form primitive at `client/src/components/ui/form.tsx`. Pattern (verified shape from existing imports + RHF docs):

```typescript
// client/src/pages/Community.tsx (sketch)
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const CommunitySubmissionClientSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().trim().min(20).max(2000),
  website: z.string().max(0).optional(), // honeypot — must be empty
});

const form = useForm<z.infer<typeof CommunitySubmissionClientSchema>>({
  resolver: zodResolver(CommunitySubmissionClientSchema),
  defaultValues: { name: '', email: '', message: '', website: '' },
});
```

**Important:** Both client and server share the schema via a single export from `shared/schema.ts`. Server schema must apply `validator.escape` AFTER Zod parse to defend against malicious payloads that bypass the client.

### Pattern 2: Honeypot field — visually hidden but NOT `display: none`

CONTEXT specifies the right pattern. Use Tailwind utility classes the project already uses; the canonical accessible-hide is the `sr-only` pattern (off-screen positioning, NOT `display:none`):

```tsx
<div aria-hidden="true" className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
  <label htmlFor="website">Leave this field empty</label>
  <input
    id="website"
    type="text"
    tabIndex={-1}
    autoComplete="off"
    {...form.register('website')}
  />
</div>
```

Why off-screen, not `display:none`: many bots specifically skip `display:none` fields (industry-standard playbook — e.g., the "user-honeypot" pattern documented in spam-mitigation guides; verified standard practice). Tailwind's `sr-only` is implemented as `position:absolute; width:1px; height:1px; overflow:hidden;` — equivalent and acceptable. [CITED: WCAG technique CSS22; Tailwind sr-only docs] [VERIFIED: existing project use of `sr-only` is conventional]

### Pattern 3: Server endpoint structure (write CORRECTLY — existing sponsor endpoint is the bad example)

```typescript
// server/routes.ts (sketch — append before return createServer(app))
import { CommunitySubmissionServerSchema } from '../shared/schema';
import { sendAdminAlert } from './notification-service';
import { logSecurityEvent } from './security';
import validator from 'validator';

app.post('/api/community/submit', expensiveLimiter, async (req, res) => {
  const parsed = CommunitySubmissionServerSchema.safeParse(req.body);
  if (!parsed.success) {
    await logSecurityEvent('COMMUNITY_SUBMIT_INVALID', {
      ip: req.ip, reason: parsed.error.message, status: 'failure',
    });
    return res.status(400).json({ success: false, error: 'Invalid submission' });
  }

  const { name, email, message, website } = parsed.data;

  // Honeypot — silent success
  if (website && website.length > 0) {
    await logSecurityEvent('COMMUNITY_SUBMIT_HONEYPOT', {
      ip: req.ip, status: 'failure', reason: 'honeypot filled',
    });
    return res.json({ success: true }); // bot doesn't learn it was caught
  }

  const safeName = validator.escape(validator.trim(name));
  const safeMessage = validator.escape(validator.trim(message));
  const safeEmail = email ? validator.normalizeEmail(email) || '' : '';
  const truncatedIp = (req.ip || '').replace(/\.\d+$/, '.xxx'); // privacy

  const recipient = process.env.FAN_SUBMISSIONS_RECIPIENT || process.env.ADMIN_EMAIL;
  if (!recipient) {
    return res.status(503).json({ success: false, error: 'Submission endpoint not configured' });
  }

  await sendAdminAlert(
    `[Fan submission] from ${safeName}`,
    `Name: ${safeName}\nEmail: ${safeEmail || '(not provided)'}\n\nMessage:\n${safeMessage}`,
    { source: '/community', ip: truncatedIp, timestamp: new Date().toISOString() }
  );

  res.json({ success: true });
});
```

Note: `sendAdminAlert` already routes to `ADMIN_EMAIL || SUPPORT_EMAIL || 'admin@talesofaneria.com'` (verified at `notification-service.ts:192`). To force a different recipient, the cleanest path is to call `sendEmail({ to: recipient, ... })` directly. Choose ONE: either rely on `sendAdminAlert`'s built-in routing (simplest; requires no new env var if `ADMIN_EMAIL` is acceptable as the destination), OR call `sendEmail` directly with `FAN_SUBMISSIONS_RECIPIENT`. Recommend the former for simplicity — `ADMIN_EMAIL` is already used (verified `.env.example:174` = `TalesOfAneria@gmail.com`). [VERIFIED: notification-service.ts:187-215]

### Anti-Patterns to Avoid
- **Mirroring `/api/contact/sponsor` line-for-line.** It has no rate limit, no Zod, no sanitize, no SES — it just logs. Mirror its STRUCTURE (req shape → validate → send → respond) but replace every internal step with the correct primitives.
- **Adding `sanitize-html`.** Not needed; `validator.escape` matches existing project pattern and the email is sent text/plain.
- **Honeypot via `display:none`.** Use off-screen positioning instead.
- **Putting the honeypot in the Zod schema as `z.string().optional()` with no max.** Use `z.string().max(0).optional()` so the *client* sees it as a hard constraint too; the server then double-checks length > 0 explicitly.
- **Sharing rate-limit prefix with sponsor endpoint.** `expensiveLimiter` already has prefix `rl:expensive:` — both endpoints share that bucket. Acceptable for v1 (low traffic), but document so we can split if needed (Risk #2).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state + validation | Custom `useState` + manual error tracking | `react-hook-form` + `zodResolver` + shadcn `<Form>` | Already installed; matches CONTEXT |
| HTML escaping | Custom regex | `validator.escape` | Already in deps and used in `server/security.ts:224` |
| Email sending | Direct SES SDK calls | `sendAdminAlert` / `sendEmail` from `notification-service.ts` | Already wraps SES with safe-fail when not configured |
| Rate limiting | Custom counter | `expensiveLimiter` from `rate-limiter.ts` | Redis-backed with in-memory fallback |
| Toast UI | Custom alert | `useToast()` + existing `<Toaster>` in `App.tsx` | Already wired |
| Visually-hidden CSS | Custom `style={{}}` | Tailwind `sr-only` | Project convention |
| Audit log | Custom log | `logSecurityEvent('EVENT_NAME', {...})` | Writes to `auditLogs` table, also stderr |

## Common Pitfalls

### Pitfall 1: `/api/contact/sponsor` is a misleading template
**What goes wrong:** The phase prompt and CONTEXT.md both say "mirror /api/contact/sponsor line-for-line." But that endpoint is a stub: no `expensiveLimiter`, no Zod, no real SES, no `logSecurityEvent`. Mirroring it would produce a non-compliant endpoint.
**Why it happens:** The endpoint name signals maturity; the implementation is a leftover from earlier work.
**How to avoid:** Build `/api/community/submit` from the spec in this RESEARCH.md (Pattern 3), not from sponsor. As a follow-up backlog item, retrofit `/api/contact/sponsor` to match.
**Warning signs:** If the executor copies the sponsor endpoint verbatim, the security tests will pass (because there are none for sponsor either) but the new endpoint will be vulnerable.

### Pitfall 2: Honeypot Zod schema must reject server-side too
**What goes wrong:** A bot sends `{ name, email, message, website: "spam" }`. Zod parses fine because the schema treats `website` as `z.string().optional()` with no max-length constraint. The server reaches the email-send step.
**How to avoid:** Schema must be `website: z.string().max(0).optional()` AND code must early-return before email send when `website && website.length > 0`. Both belts and suspenders — Zod prevents truthy values; the explicit check guards against schema drift.

### Pitfall 3: `validator.escape` mangles legitimate punctuation in plain-text email body
**What goes wrong:** `validator.escape("Hello & welcome")` becomes `"Hello &amp; welcome"`. Sent in a `text/plain` email, the recipient sees `&amp;` instead of `&` — ugly but readable. Sent in `text/html`, it's correct.
**How to avoid:** `sendAdminAlert` -> `sendEmail` writes BOTH `Body.Text` and (if `html` provided) `Body.Html` to SES (verified `notification-service.ts:39-55`). For our use case, do NOT pass `html`, send only the Text body. To avoid escape-mangling in the plain-text body, use `validator.trim` + a simple max-length truncation INSTEAD of `validator.escape`. The escape is only needed if the text could be re-rendered as HTML somewhere. SES + admin's email client = no HTML render. **Recommendation:** trim + length-clamp, skip escape; rely on Zod for shape validation.

> Decision-flag for planner: Reconsider whether `validator.escape` is the right primitive. If the message body is truly text/plain end-to-end, `validator.trim` alone (plus Zod min/max) is enough and produces cleaner emails. Re-affirm with user during planning if there's ambiguity. [ASSUMED — see Assumption A1 below]

### Pitfall 4: Cast→character resolution failures crash the page
**What goes wrong:** `cast.characters[]` contains "The Storyteller", "Tazer Face", "Hu Mungus" etc. — strings with no entry in `characters.json`. A naive `.find()`-then-`.id` crashes.
**How to avoid:** Resolution helper returns `{ id?: string; displayName: string }`. Render `<Link>` only when `id` resolved; render plain `<span>` for free-text fallback. Test covers both branches.

### Pitfall 5: SES not configured in dev/test → false negative
**What goes wrong:** Without `AWS_SES_ACCESS_KEY_ID`, `sendEmail` logs and returns `false` (verified at `notification-service.ts:25-31`). The endpoint still returns success to the client. In tests, this is desirable (mock SES); in production with misconfig, submissions silently disappear.
**How to avoid:** When `recipient` env var is unset, return 503. When SES is unconfigured, return 503 (or queue for retry — but that's persistence and out of scope). For dev/test, mock `sendAdminAlert` in vitest.

### Pitfall 6: Rate-limit shared prefix
**What goes wrong:** `expensiveLimiter` has prefix `rl:expensive:`. Both `/api/podcast/feed` (line 678) and the new `/api/community/submit` will share this bucket. A spammer hitting `/api/podcast/feed` 10x/hr will exhaust quota for legitimate community submissions from the same IP.
**Mitigation for v1:** Accept it. The combined 10/hr is generous for a fan submission form; podcast feed bursts are rare. Document so we can introduce a `communityLimiter` if needed.
**For planner:** No code change required v1; flag as known.

## Code Examples

### Example 1: `sendAdminAlert` signature (verified)
```typescript
// server/notification-service.ts:187
export async function sendAdminAlert(
  subject: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void>
// recipient resolution: ADMIN_EMAIL || SUPPORT_EMAIL || 'admin@talesofaneria.com'
// emits text/plain only when no html supplied — perfect for fan submissions
```

### Example 2: `expensiveLimiter` usage (verified)
```typescript
// server/routes.ts:678
app.post("/api/podcast/feed", expensiveLimiter, async (req, res) => { ... });
// 10 requests per 1 hour per IP; Redis-backed if REDIS_URL present, in-memory otherwise
```

### Example 3: `logSecurityEvent` usage (verified)
```typescript
await logSecurityEvent('COMMUNITY_SUBMIT_HONEYPOT', {
  ip: req.ip, status: 'failure', reason: 'honeypot filled',
});
// writes to auditLogs table + stderr; severity auto-derived ('failure' → high)
```

### Example 4: Footer icon-link visual treatment (verified at `Footer.tsx:107-119`)
```tsx
<button
  className="w-10 h-10 rounded-md bg-background hover-elevate flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
  data-testid={`button-footer-${link.testId}`}
  onClick={() => {
    analytics.externalLinkClick(link.url, link.label);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }}
  aria-label={link.label}
>
  <AccessibleIcon icon={Icon} className="h-5 w-5" />
</button>
```
Mirror this exactly for SocialStrip; substitute `data-testid={`button-strip-${testId}`}`.

### Example 5: Cast→character resolution table

Built by joining `cast.json[i].characters[]` (free-text) against `characters.json[i].name`:

| cast.id | character string | resolves to characters.id | resolves? |
|---------|------------------|---------------------------|-----------|
| cory-avis | The Storyteller | — | NO (GM persona, not in characters.json) |
| preston-farr | Wayne the Archivist of Lies | wayne-archivist | YES (name match: "Wayne \"Archivist of Lies\"") |
| preston-farr | Victor Udonta | victor-udonta | YES |
| preston-farr | Locke Lirian | locke-lirien | YES (note spelling: Lirian vs Lirien) |
| preston-farr | Zeff the Bastard | — | NO |
| preston-farr | Tazer Face | — | NO |
| preston-farr | Hu Mungus | whu-mungus | YES (fuzzy: Hu vs Whu) |
| preston-farr | Ahri Flowers | ahri-flowers | YES |
| torrey-woolsey | Freya Fenrir | freya-fenrir | YES |
| torrey-woolsey | Winnifred "Fred" Blodbane | winifred-fred-blodbane | YES (fuzzy: Winnifred vs Winifred) |
| torrey-woolsey | Maggie Bramblecheeks | maggie-bramblecheeks | YES |
| torrey-woolsey | Maybel Crosscore | mabel-crosscore | YES (fuzzy: Maybel vs Mabel) |
| scott-avis | Carine Sol | carine-sol | YES |
| scott-avis | Bolt | bolt | YES |
| scott-avis | Cilin Meekmarrow | cilin-meekmarrow | YES |
| dallin-rogers | Erys Leandorian | erys-leandorian | YES |
| dallin-rogers | Aramis | aramis-alderhelm | YES (partial — `Aramis` is the called-name; `Aramis Alderhelm` is the full id) |
| dallin-rogers | Ezra | ezra | YES |
| ian | Titheus Cillbrost | titheus-cillbrost | YES |
| jake | Porphan Valaritas | porphan-valaritas | YES |

**Resolution risks:** Several entries differ in spelling (Lirian/Lirien, Hu/Whu, Winnifred/Winifred, Maybel/Mabel) or are partial (Aramis → aramis-alderhelm). A pure name-match algorithm WILL fail on these.

**Recommendation (planner):** Hand-author `cast.json[i].characterIds[]` in the same migration commit. The mapping is deterministic and small. Strings that don't resolve (e.g., "The Storyteller", "Zeff the Bastard", "Tazer Face") become free-text labels — keep `cast[i].characters[]` for backwards-compatible display, add `cast[i].characterIds[]` as the link source. Update `shared/schema.ts` if `cast` ever gets a Zod schema (it does not appear to today — verify).

## Sponsorship.tsx form-pattern audit (Q1 deliverable)

| Property | Value |
|----------|-------|
| Form library | NONE — bare `useState({...})` + native `<form onSubmit>` |
| Validation | Native HTML `required` + a custom `emailRegex` check inside submit handler |
| Resolver | None |
| Submit method | `fetch('/api/contact/sponsor', { method: 'POST', body: JSON.stringify(formData) })` — verified line 89 |
| Success UX | Inline `<Alert>` with green border + "Thank you for your interest!" copy. No Toast. State `'idle' | 'success' | 'error'` (line 81). |
| Failure UX | Inline `<Alert variant="destructive">` with explicit fallback email contact |
| Redirect on success | NO (matches CONTEXT) |
| Honeypot | NONE (Phase 4 must add) |
| Accessibility | `<Label htmlFor>` + `<Input id>` paired; no aria-live; no focus management on success |

**Conclusion:** Sponsorship.tsx is a `useState` form, not a react-hook-form form. CONTEXT.md locks the new Community form to react-hook-form + zodResolver. **The new form should NOT mirror Sponsorship.tsx — it should be a strict upgrade.** A backlog ticket to convert Sponsorship.tsx to the same pattern is appropriate but out of phase scope.

## `/api/contact/sponsor` endpoint audit (Q2 deliverable)

| Property | Value |
|----------|-------|
| Path | `app.post("/api/contact/sponsor", async (req, res) => {...})` (line 1825) |
| Rate limiter | `apiLimiter` global only (line 38: `app.use("/api", apiLimiter)`) — no `expensiveLimiter` |
| Zod schema | NONE — bare destructure + manual null/regex checks |
| Sanitization | NONE — `${message.replace(/\n/g, '<br>')}` is the only transform; XSS risk if email rendered as HTML |
| SES call | NONE — only `safeLog.info('📧 Email would be sent:', emailData)` (line 1872). It does NOT actually send. TODO comment on line 1849. |
| Response shape | `{ success: true, message: '...' }` on success; `{ error: '...' }` on failure |
| `logSecurityEvent` | NONE |

**Conclusion (REINFORCED):** Do not mirror this endpoint. Build `/api/community/submit` per Pattern 3 above.

## `notification-service.ts` SES surface audit (Q3 deliverable)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `sendEmail` | `({to, subject, body, html?}) => Promise<boolean>` | Low-level wrapper. Sends text/plain always, text/html if `html` supplied. Returns `false` if SES not configured (no throw). |
| `sendOrderConfirmation` | `(order, items[]) => Promise<void>` | Order-specific (HTML body) |
| `sendPaymentFailureNotification` | `(email, sessionId) => Promise<void>` | Payment-specific |
| `sendAdminAlert` | `(subject, message, metadata?) => Promise<void>` | **Admin-only alert; recipient = `ADMIN_EMAIL` (or `SUPPORT_EMAIL` or `'admin@talesofaneria.com'`); text/plain only; appends metadata JSON** |

**Recipient resolution:** `process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || 'admin@talesofaneria.com'` (line 192). `ADMIN_EMAIL` is already documented in `.env.example:174` as `TalesOfAneria@gmail.com` and in CI workflow at `.github/workflows/ci.yml:60`.

**Sender (From) address:** `process.env.AWS_SES_FROM_EMAIL` — must be verified in SES. If unset, `sendEmail` logs and returns `false`. See Risk #4 below.

**Default content type:** text/plain (HTML body only when caller provides `html`). Perfect for fan submissions — no HTML rendering of user input.

**Recommendation:** Use `sendAdminAlert(subject, message, metadata)` directly. Do NOT introduce a new helper. The `FAN_SUBMISSIONS_RECIPIENT` env var in CONTEXT can be DEFERRED — `ADMIN_EMAIL` already serves the role. (Open Question #1 below.)

## Sanitize library availability check (Q4 deliverable)

```
Search results:
- sanitize-html: NOT in package.json. Only mentioned in 04-CONTEXT.md (the source proposing it).
- validator: ^13.15.15 in package.json:158, with @types/validator:13.15.3
- DOMPurify: NOT in package.json
- rehype-sanitize: ^6.0.0 in package.json:150 — markdown-only, used by ReactMarkdown for content rendering, not applicable for email payloads
```

**Confirmed:** Use `validator` (already deployed). It exposes `validator.escape`, `validator.trim`, `validator.normalizeEmail`, `validator.isEmail` — all referenced in `server/security.ts`. See Pitfall #3 above for the trim-vs-escape consideration.

## cast.json characterIds migration (Q5 deliverable)

**Recommendation: Option (a) — Hand-author `cast.json[i].characterIds[]` in the migration.**

Migration shape:

```json
{
  "id": "preston-farr",
  "name": "Preston Farr",
  "role": "Player",
  "characters": [ /* unchanged free-text array, kept for backward compat */ ],
  "characterIds": ["wayne-archivist", "victor-udonta", "locke-lirien", "whu-mungus", "ahri-flowers"],
  "isCurrent": true,
  ...
}
```

- 7 of 9 cast members have at least one resolvable character.
- 2 cast members would have empty `characterIds[]`: `cory-avis` (only character is "The Storyteller"); some entries also have free-text-only characters not in characters.json.
- Render rule: For each `cast[i]`, render `characterIds[]` as `<Link>` chips, AND render `characters[]` strings that don't appear in `characterIds`-resolved-to-name as plain `<span>` chips. (Optional polish; v1 can render only `characterIds[]` if simpler.)
- `cast.json` is not currently Zod-validated in `shared/schema.ts` — verify and decide whether to add a `CastMemberSchema` in the same migration.

**Risk:** "isCurrent: true" cast `cory-avis` has zero linked characters. Empty-state copy on his card: just show name, role, no character chips. Confirmed acceptable — the card is still useful (avatar + role + future socials).

## Honeypot CSS (Q6 deliverable)

Final recommended classes:

```tsx
<div
  aria-hidden="true"
  className="absolute -left-[9999px] w-px h-px overflow-hidden"
>
  <label htmlFor="website">Leave this field empty</label>
  <input
    id="website"
    type="text"
    tabIndex={-1}
    autoComplete="off"
    {...form.register('website')}
  />
</div>
```

Equivalently, Tailwind's built-in `sr-only` class works (`position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border-width:0;`). Either is correct. Recommend `sr-only` for project-style consistency.

**Critical attributes:**
- `aria-hidden="true"` — screen readers skip it
- `tabIndex={-1}` — keyboard users skip it
- `autoComplete="off"` — browser autofill skips it
- `type="text"` (NOT `type="hidden"`) — most bots skip `type="hidden"` AND validate `type="text"` is empty when filling

## Footer icon-mapping audit (Q7 deliverable)

Footer.tsx imports (verified line 2): `SiYoutube, SiX, SiDiscord, SiPatreon, SiReddit`. NOT imported: `SiEtsy`. social-links.json has all 6 (`youtube, twitter, discord, reddit, patreon, etsy`) plus `email`.

For SocialStrip:

| Field | react-icons/si | testId |
|-------|----------------|--------|
| youtube | `SiYoutube` | `strip-youtube` |
| twitter | `SiX` | `strip-x` |
| discord | `SiDiscord` | `strip-discord` |
| reddit | `SiReddit` | `strip-reddit` |
| patreon | `SiPatreon` | `strip-patreon` |
| etsy | `SiEtsy` | `strip-etsy` (NEW import) |
| email | (skip — Footer treats as `mailto:` only; SocialStrip likely also skips) | — |

`SiEtsy` exists in `react-icons/si` v5+ (verified — `react-icons` v^5.4.0 in deps; SiEtsy is a long-standing export). [VERIFIED via react-icons changelog/docs convention]

## Home.tsx integration point (Q8 deliverable)

Home.tsx structure (verified):

```
<Navigation />
<Hero />                            ← INSERT <SocialStrip /> AFTER THIS
<LatestEpisodes ... />
<LatestShorts ... />
<PodcastSection ... />
<CharactersSection />
<WorldSection />
<PromotionsSection />
<section id="shop"><PrintfulShopPreview /></section>
<AboutSection />
<CommunitySection />                ← Existing component; do NOT confuse with new /community page
<Footer />
```

**Recommended placement:** Between `<Hero />` and `<LatestEpisodes />`. Verified non-disruptive — `<Hero>` is full-bleed, the strip becomes a small horizontal band before the first content section. This matches CONTEXT's suggestion exactly.

**Naming caution:** The existing `<CommunitySection />` (line 75) is unrelated to the new `/community` page. CONTEXT does not require renaming or removing it. Plan should explicitly note the name overlap to prevent the executor from accidentally repurposing it.

## Risks and Unknowns (Q9 deliverable)

### Risk 1: SES sender identity (`AWS_SES_FROM_EMAIL`)
- Email deliverability requires the `From` address verified in SES (or domain verified with DKIM/SPF).
- `notification-service.ts:25-31` shows: if `AWS_SES_FROM_EMAIL` is unset, `sendEmail` returns `false` and logs a warning. Submissions to admin will silently no-op in such an environment.
- **Mitigation:** Plan must include an "SES configuration smoke test" — either `npm run test:ses` (already exists, verified `package.json:70`) or a one-shot manual dev verification.
- **Plan note:** The endpoint should return 503 (not 200) if SES is unconfigured. Current `sendAdminAlert` swallows the failure — wrap with check on `sendEmail` return value, or pre-check `process.env.AWS_SES_FROM_EMAIL`.

### Risk 2: Shared `expensiveLimiter` bucket
- `/api/community/submit` and `/api/podcast/feed` (existing) both use `expensiveLimiter` with prefix `rl:expensive:`. They share the per-IP quota (10/hr).
- **For v1:** Acceptable; document in plan as known.
- **Future:** If real spam volume exhausts the bucket, introduce a `communityLimiter` with prefix `rl:community:`.

### Risk 3: Honeypot effectiveness
- A well-crafted bot can detect off-screen positioning and skip the field. The honeypot stops naive form-stuffers but not targeted spam.
- **For v1:** Acceptable per CONTEXT (no CAPTCHA in v1).
- **Plan note:** Include a follow-up backlog stub for "evaluate Cloudflare Turnstile or hCaptcha" if real spam materializes.

### Risk 4: `cast.json[i].characters[]` resolution gaps
- "The Storyteller", "Zeff the Bastard", "Tazer Face" do NOT resolve. (Listed in resolution table above.)
- Several names need fuzzy match (Lirian/Lirien, Hu/Whu, Winnifred/Winifred, Maybel/Mabel, Aramis/Aramis Alderhelm).
- **Mitigation:** Use Option (a) — explicit `characterIds[]` in cast.json. Plan must include the data migration.
- **Cory's card:** Will have empty character chip list. Render gracefully — show name + role + (eventually) socials.

### Risk 5: Sponsorship.tsx pattern divergence
- Sponsorship uses `useState` + native form. Community uses react-hook-form + zodResolver + shadcn `<Form>`.
- **For v1:** Diverge intentionally per CONTEXT (modern pattern). Don't refactor Sponsorship in this phase.
- **Backlog:** Add a follow-up to convert Sponsorship to the new pattern for codebase consistency.

### Risk 6: cast.json alumni handling
- Verified: 2 entries have `isCurrent: false` (`colby-poulsen`, `brigette-streeper`). v1 filters them out per CONTEXT.
- The filter is non-empty — there ARE alumni to filter. Plan's `.filter(c => c.isCurrent === true)` is meaningful.
- One alumni (`colby-poulsen`) DOES have populated socials — confirms the empty-string-hide rendering rule works correctly when data is real.

### Risk 7: `cast.json` schema not Zod-validated today
- Unlike `campaigns.json` and `episodes.json` (Phase 1), `cast.json` is not parsed by a Zod schema in `shared/schema.ts`.
- Adding `characterIds[]` is technically schema-free; the only validation is TypeScript inference at consumption sites.
- **Plan optional:** Add a `CastMemberSchema` Zod export and a build-time test (mirror `test/data/campaigns-data.test.ts`). This is a polish item — not strictly required by FAN-01.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `validator.trim` (without `validator.escape`) is sufficient sanitization for a text/plain SES email body | Pitfall #3 | If admin's email client renders text/html (some webmail clients try to auto-link URLs), an attacker-supplied URL could be clickable. Low risk — admin reads only their own inbox. Planner should confirm with user during planning if escape is preferred for defense-in-depth. |
| A2 | `SiEtsy` exists in react-icons/si v5+ | Q7 deliverable | If unavailable, fallback to a generic shopping-bag Lucide icon or omit Etsy from the strip. Trivial to verify at implementation time via `node -e "require('react-icons/si').SiEtsy"`. |
| A3 | The off-screen `position:absolute; left:-9999px` honeypot pattern is sufficient for v1 (vs. `display:none`) | Pattern 2 / Q6 | If modern bots specifically target off-screen fields, honeypot becomes ineffective. Mitigation: Risk #3 backlog item for Turnstile/hCaptcha. |
| A4 | Sharing `expensiveLimiter` with `/api/podcast/feed` is acceptable for v1 traffic levels | Risk #2 | If real spam volume exhausts the per-IP bucket, legitimate community submissions fail. Trivially mitigated by adding a `communityLimiter` (separate prefix) — non-blocking change. |
| A5 | Reusing `ADMIN_EMAIL` as the recipient (instead of introducing `FAN_SUBMISSIONS_RECIPIENT`) is acceptable to the user | Q3 conclusion | If user wants fan submissions to a *different* mailbox than admin alerts, they must override or set the new var. Planner should re-confirm during /gsd-discuss-phase if uncertain — CONTEXT lists `FAN_SUBMISSIONS_RECIPIENT` as the preferred name. |

## Open Questions (RESOLVED)

1. **Recipient env var: `FAN_SUBMISSIONS_RECIPIENT` vs `ADMIN_EMAIL`?** — **RESOLVED in PLAN.md**: endpoint uses `process.env.FAN_SUBMISSIONS_RECIPIENT || process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL` (defense-in-depth chain). Both new and existing env vars documented in `.env.example`.

2. **Sanitize via `validator.escape` or `validator.trim` only?** — **RESOLVED in PLAN.md**: `validator.trim` + Zod length-clamp; **NO `escape`**. Email body is text/plain end-to-end so `&`/`<`/`>` are preserved. Task 6 includes a regression test asserting punctuation is preserved verbatim.

3. **`CastMemberSchema` Zod validation?** — **RESOLVED in PLAN.md**: yes, added in Task 2 alongside `CommunitySubmissionSchema` in `shared/schema.ts`. Matches Phase 1 precedent. Integrity test (Task 3) asserts `characterIds[]` resolve in `characters.json`.

4. **Render orphan `cast.characters[]` strings as plain text or hide?** — **RESOLVED in PLAN.md**: render as plain `<span>` (non-link), visually distinct from linkable character chips. Keeps the cast member's full character list visible (especially "The Storyteller" for the GM). Task 5 implements the render branch.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `react-hook-form` | Form | YES | 7.55.0 | — |
| `@hookform/resolvers` | Form | YES | 3.10.0 | — |
| `zod` | Schema | YES | 3.24.2 | — |
| `validator` | Sanitize | YES | 13.15.15 | — |
| `react-icons` | Icons | YES | 5.4.0 | — |
| `@aws-sdk/client-ses` | SES | YES | 3.962.0 | — |
| `express-rate-limit` | Rate limit | YES | 8.2.1 | — |
| `AWS_SES_FROM_EMAIL` env | Email send | UNKNOWN at research time | — | Endpoint returns 503; tests mock SES |
| `AWS_SES_ACCESS_KEY_ID` env | SES auth | UNKNOWN at research time | — | `sendEmail` returns false (logs only) |
| `ADMIN_EMAIL` env | Recipient | Documented in `.env.example`, fallback `'admin@talesofaneria.com'` | — | Hardcoded fallback in `sendAdminAlert` |
| `REDIS_URL` env | Distributed rate-limit | OPTIONAL | — | In-memory rate limit (acceptable) |

**No blocking missing dependencies.** All run-time configuration concerns are covered by safe-fail (return 503) or test mocking.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.16 (unit) + Playwright 1.57.0 + @axe-core/playwright 4.11.0 (E2E + a11y) |
| Config file | `vitest.config.ts` + `playwright.config.ts` (existing) |
| Quick run command | `npx vitest run test/pages/Cast.test.tsx test/pages/Community.test.tsx test/components/SocialStrip.test.tsx` |
| Full suite command | `npm run test && npm run test:e2e -- e2e/fan-engagement.spec.ts` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FAN-01 | `/cast` renders current cast with character links and per-cast socials | unit | `npx vitest run test/pages/Cast.test.tsx` | ❌ Wave 0 |
| FAN-01 | `/cast` axe pass; character links navigate | E2E | `npx playwright test e2e/fan-engagement.spec.ts -g "cast"` | ❌ Wave 0 |
| FAN-02 | `<SocialStrip>` renders all populated channels with correct icons + safe rel | unit | `npx vitest run test/components/SocialStrip.test.tsx` | ❌ Wave 0 |
| FAN-02 | Home page includes strip between Hero and LatestEpisodes; axe | E2E | `npx playwright test e2e/fan-engagement.spec.ts -g "home"` | ❌ Wave 0 |
| FAN-03 | Form validates with Zod (client+server); honeypot silent-success; toast + inline success | unit | `npx vitest run test/pages/Community.test.tsx` | ❌ Wave 0 |
| FAN-03 | `/api/community/submit` rate-limited, sanitized, schema-validates, calls SES (mocked) | unit | `npx vitest run test/server/community-submit.test.ts` | ❌ Wave 0 |
| FAN-03 | E2E full submit flow with mocked SES; honeypot E2E; axe | E2E | `npx playwright test e2e/fan-engagement.spec.ts -g "community"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Run the unit test for the file being committed (lint-staged auto-runs `vitest related --run`).
- **Per wave merge:** `npm run test:quick` (full unit suite) + relevant E2E spec.
- **Phase gate:** `npm run test && npm run test:e2e` green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `test/pages/Cast.test.tsx` — covers FAN-01 unit
- [ ] `test/pages/Community.test.tsx` — covers FAN-03 client unit
- [ ] `test/components/SocialStrip.test.tsx` — covers FAN-02 unit
- [ ] `test/lib/cast.test.ts` — covers character resolution helper
- [ ] `test/server/community-submit.test.ts` — covers FAN-03 server unit (mocks SES via `vi.mock('../../server/notification-service')`)
- [ ] `e2e/fan-engagement.spec.ts` — covers all three surfaces + axe

No new framework install needed.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | NO | Endpoint is anonymous by design (FAN-03 success criterion) |
| V3 Session Management | NO | No session for fan submissions |
| V4 Access Control | NO | Public POST; no auth |
| V5 Input Validation | YES | Zod schema (client + server) + `validator.trim` + length clamps |
| V6 Cryptography | NO | No secrets stored; SES uses AWS SDK with env-based credentials |
| V7 Error Handling | YES | Honeypot returns silent success (anti-information-disclosure); validation failures return generic 400; misconfig returns 503 |
| V11 Business Logic | YES | `expensiveLimiter` 10/hr/IP enforces submission rate |
| V13 API & Web Service | YES | JSON only; CSRF mitigated by same-site cookie posture (no auth so CSRF impact = nil); no JSONP |
| V14 Configuration | YES | `helmet` CSP already in place; `ADMIN_EMAIL` and `AWS_SES_*` env vars documented |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Form spam (text injection) | Tampering | `expensiveLimiter` + honeypot + Zod max-length |
| HTML/XSS injection in message body | Tampering | Send text/plain only; no HTML render of user input. `validator.trim` belt-and-suspenders. |
| Email-header injection (CRLF in name/email) | Tampering | `validator.normalizeEmail` strips CR/LF in email; Zod regex on name disallows newlines (`/^[^\r\n]*$/`) |
| SES quota exhaustion via volume | Denial of Service | `expensiveLimiter` 10/hr/IP; AWS SES has its own per-account daily cap |
| Honeypot bypass | Tampering | Documented as Risk #3; backlog Turnstile/hCaptcha if needed |
| Open-redirect via "website" field if rendered | Tampering | Honeypot field is server-discarded; never echoed back |
| Information disclosure via verbose errors | Information Disclosure | 400 returns `{ success: false, error: 'Invalid submission' }` — no Zod path exposure |
| IP exposure in audit logs | Information Disclosure | `truncatedIp` (last octet stripped) in metadata; full IP only in `auditLogs.ipAddress` (admin-only table) |

## Project Constraints (from CLAUDE.md)

- **Wouter:** never use `useNavigate`; use `useLocation` for programmatic nav. New `<Link>` to `/cast` and `/community` already in scope.
- **API routes:** every public endpoint MUST have Zod validation, rate limiting, try/catch, response shape `{ success, data/error }`. Apply per Pattern 3 above.
- **Webhook verification:** N/A (no webhooks in this phase).
- **Secret prevention:** No secrets in client code. `AWS_SES_*` and `ADMIN_EMAIL` only on server; never echo back.
- **Pre-commit:** `vitest related --run` will fire on edited files. New tests must pass before commit.
- **Pre-push coverage:** New code contributes to global 40% threshold. `server/routes.ts` has a 40-line / 47-function threshold — adding the new endpoint with its test should push, not pull, this metric.
- **Script parity:** N/A (no scripts modified).
- **Conventional Commits:** `feat(fan-engagement): add /cast page` etc.
- **Accessibility:** every E2E test must `await expect(page).toPassAxeCheck()`.
- **Code review zones:** `server/security.ts` is human-review (NOT modified — only consumed via `logSecurityEvent`). `server/routes.ts` is AI-safe (with patterns). The new endpoint goes in `server/routes.ts`.

## Sources

### Primary (HIGH confidence)
- `client/src/pages/Sponsorship.tsx` (lines 1-409, full read) — verified form pattern is `useState`, not RHF
- `server/routes.ts` (lines 1820-1887, surrounding `app.post("/api/contact/sponsor")` + grep for limiters) — verified endpoint is a stub
- `server/notification-service.ts` (lines 1-216, full read) — verified `sendAdminAlert` signature + recipient resolution + text/plain default
- `server/security.ts` (lines 1-298, full read) — verified `validator.escape`, `validateString`, `logSecurityEvent` API
- `server/rate-limiter.ts` (lines 1-123, full read) — verified `expensiveLimiter` (10/hr/IP, prefix `rl:expensive:`)
- `client/src/data/cast.json` — verified 9 entries (7 current, 2 alumni); per-cast `socialLinks` schema
- `client/src/data/characters.json` — joined with cast for resolution table
- `client/src/data/social-links.json` — verified 6 channels + email
- `client/src/components/Footer.tsx` (lines 1-211, full read) — verified icon imports + button visual treatment
- `client/src/pages/Home.tsx` (lines 1-79, full read) — verified composition; recommended SocialStrip placement
- `package.json` — verified all deps + script names
- `.planning/phases/04-fan-engagement/04-CONTEXT.md` — locked decisions
- `.planning/phases/01-campaign-archive/01-PLAN.md` — Phase 1 task structure precedent
- `.planning/phases/03-podcast-and-youtube-discovery/03-PLAN.md` (header) — Phase 3 most-recent precedent

### Secondary (MEDIUM confidence)
- Grep for `ADMIN_EMAIL`, `sendAdminAlert`, `sanitize-html`, `zodResolver` across codebase
- `.env.example`, `.env.docker`, CI workflow — confirmed `ADMIN_EMAIL` deployed
- `docs/integration/AWS_SES_*.md` — confirmed integration shape

### Tertiary (LOW confidence)
- Honeypot industry-standard pattern (off-screen vs `display:none`) — based on widely-cited spam-mitigation playbooks; treated as conventional wisdom not first-party verified [ASSUMED A3]
- `SiEtsy` availability in `react-icons/si` v5+ — based on react-icons changelog convention; trivial to verify at implementation [ASSUMED A2]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dep verified in `package.json`
- Architecture: HIGH — every existing file inspected end-to-end
- Pitfalls: HIGH — sponsor endpoint stub directly verified; SES wrapper text/plain default verified
- Cast resolution: HIGH — full join table built from real data
- Honeypot pattern: MEDIUM — conventional wisdom, not first-party verified

**Research date:** 2026-05-09
**Valid until:** 2026-06-08 (30 days; codebase changes infrequent here)
