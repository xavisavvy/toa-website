# Phase 4: Fan Engagement — Context

**Gathered:** 2026-05-09
**Status:** Ready for planning
**Source:** /gsd-discuss-phase
**Depends on:** Phase 2 (cast-id linkage convention; the cast↔character relationship was confirmed there)

<domain>
## Phase Boundary

Phase 4 ships three thin engagement surfaces over substantial existing infrastructure:

1. **`/cast` page (FAN-01)** — A new public page listing each cast member's name, role, character link(s), and per-cast public socials.
2. **Home-page social aggregation strip (FAN-02)** — A dedicated horizontal strip on the home page surfacing the show's official channels from `client/src/data/social-links.json`. (Footer already shows socials; this is an above-the-fold surface, distinct.)
3. **Fan content submission form (FAN-03)** — A text-only, no-auth form on a new `/community` page. Submission is sanitized, rate-limited, and emailed to the admin via existing AWS SES integration. Acknowledged in the UI on success.

This phase is intentionally narrow. The roadmap notes that the broader influencer-features backlog (`docs/INFLUENCER_FEATURES_ANALYSIS.md`) is forward context only — Phase 4 is the curated subset deemed shippable in this milestone.

**In scope:**
- New page `/cast` — list of cast members with characters + per-cast socials
- New home-page social aggregation strip (separate from existing Footer socials)
- New page `/community` with the fan submission form
- New POST endpoint `/api/community/submit` (text-only payload, rate-limited, sanitized, SES-routed)
- Navigation entries for `/cast` and `/community`
- Standard testing: unit + Playwright + axe; mocked SES in tests

**Out of scope (explicit):**
- Image / file uploads on the submission form
- DB persistence of submissions (email-only delivery)
- Moderation queue / admin UI for submissions
- CAPTCHA, hCaptcha, Turnstile (rate limit + honeypot via Zod alone)
- Populating cast.json socialLinks fields with real URLs (content-authoring follow-up; the schema and rendering go live with empty-string fallbacks gracefully hidden)
- Per-cast detail pages (`/cast/<id>`) — list-only for v1
- Live integrations (Twitch online indicator, real-time YouTube live state) — defer to a future engagement phase
- Larger items in `INFLUENCER_FEATURES_ANALYSIS.md` (gamification, member tiers, UGC moderation pipelines)

</domain>

<decisions>
## Implementation Decisions

### "Meet the Cast" Surface — LOCKED
- **New page at `/cast`** — distinct route, mirrors `/characters` and `/campaigns` patterns from Phases 1–2.
- Page lists current cast members (`cast.json` entries with `isCurrent: true`) in the order they appear in the JSON file. Past cast (`isCurrent: false`) are deferred — possibly a future "Cast Alumni" section, not v1.
- Each entry shows: avatar, name, role (e.g., "Game Master"), character names linked to `/characters/<id>` where the cast member's `characters[]` resolves against `characters.json` by name.
- Per-cast public socials rendered as icon links from `cast.json[i].socialLinks` (`youtube, twitter, instagram, twitch, website`). **Empty-string fields are hidden** — only render the icon-link if the URL is non-empty (zero-friction migration; cast.json populates over time).

### Home Social Aggregation Strip (FAN-02) — LOCKED
- New small component on the home page (e.g., `<SocialStrip>`) — a horizontal strip of icon buttons linking to the show's channels from `client/src/data/social-links.json`.
- **Distinct from Footer.tsx**, which also has socials. The strip is above-the-fold engagement; the footer socials are end-of-page navigation. Both coexist.
- Placement: `Home.tsx` — between two existing sections. Planner picks the exact position; suggested between `Hero` and `LatestEpisodes` so it greets visitors immediately. Not blocking.
- Icons sourced from `react-icons/si` (already used in Footer.tsx). Size, padding, and accessibility (aria-label per icon) match the project's existing icon-link conventions.
- Filters the same data Footer reads: only renders entries with non-empty URLs. If `social-links.json` adds a channel later (e.g., TikTok), the strip picks it up automatically when the planner adds the icon mapping.

### Fan Submission Form Scope — LOCKED
- **Text-only submission**. Fields:
  - `name`: required, trimmed, 1–80 chars
  - `email`: optional, valid email if present
  - `message`: required, trimmed, 20–2000 chars (give visitors room to actually share)
  - **Hidden honeypot field** (e.g., `website` or `url`) — must be empty on submission; if filled, server returns success but discards the message (silent rejection — bots don't learn they were caught)
- **No file uploads, no image attachments, no URL link field.** v1 is deliberately minimal.

### Submission Destination — LOCKED
- **AWS SES email to admin only.** No DB schema changes. No persistence beyond the email itself.
- Reuse existing `server/notification-service.ts` SES wrapper (the pattern that `server/order-service.ts` and `server/audit.ts` use, per the existing list of SES-using files).
- Recipient: a new env var `FAN_SUBMISSIONS_RECIPIENT` (or reuse `ADMIN_EMAIL` if it already exists — researcher confirms). Falls back to a clear error in dev when unset.
- Email subject: `[Fan submission] from <name>` or similar — planner picks the deterministic format.
- Email body includes: visitor's name, email (if present), full message body, plus metadata (timestamp, IP truncated for privacy, source URL `/community`).

### Spam Mitigation — LOCKED
- **Server-side**:
  - `expensiveLimiter` (10 req / hr per IP) — already exists in `server/rate-limiter.ts`
  - **Zod schema validation** — name/email/message bounds enforced at API boundary
  - **Honeypot rejection** — see field details above
  - **Sanitization** — message body sanitized via `sanitize-html` (or equivalent already in deps; researcher confirms what's available) before email send. Treat the email body as plain text where possible (rendered text/plain, not text/html) — sidesteps most XSS and HTML-injection risks
- **No CAPTCHA in v1.** Reassess only if real spam volume demands it.

### Form UX & Acknowledgement — LOCKED
- Form lives on `/community` (not a modal; a dedicated page so deep-linking and SEO work).
- Existing shadcn/ui form primitives (`<Form>`, `<Input>`, `<Textarea>`, `<Button>`) — already installed via the existing forms in the project (search for `react-hook-form` usage). Use `react-hook-form` + `zodResolver` matching the existing project pattern.
- **On submit success**: inline success message above (or replacing) the form, plus a toast notification (matches project's existing shadcn Toast usage).
- **On submit failure**: inline error message; the field-level errors come from the same Zod schema applied client-side.
- **No redirect** to a thank-you page. Stay on `/community` so the user can submit again or browse away on their own terms.

### No Authentication — LOCKED
- Per FAN-03 success criterion: "without creating an account." No login, no session, no user record. The form is fully anonymous (email is optional and used only for admin reply-to in the SES email).

### Accessibility — LOCKED (mirrors project standard)
- WCAG 2.1 AA: explicit `<label>` for every input; visible focus rings; aria-live for the success/error regions; honeypot field is `aria-hidden="true"` and visually hidden via CSS (not `display: none`, since some bots skip those). Mirror the existing form patterns in the project (`Sponsorship.tsx` likely has a similar form — researcher confirms).

### Testing — LOCKED (mirrors Phase 1–3)
- **Unit tests** for the new pages (`/cast`, `/community`) — use existing test-utils, mock fetch where needed.
- **Form-submission unit test** — mocks `/api/community/submit`, asserts success toast and inline message; asserts honeypot rejection silently succeeds.
- **API endpoint test** — `/api/community/submit` (similar to existing `/api/contact/sponsor` test pattern if any). Mocks SES; asserts schema rejects bad payloads; rate limit assertion if practical.
- **Playwright E2E + axe** spec covering: visit `/cast` → see entries, click character link, axe pass; visit `/community` → fill form, submit, see success state, axe pass; submit a honeypot-filled payload → server returns success without sending email (mock asserts).
- **Continuity**: no DEBT requirements explicitly bound to this phase. Existing tests must continue to pass.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phases 1–3 outputs to mirror
- `client/src/pages/Campaigns.tsx` — list/filter page pattern (mirror for `Cast.tsx` and `Community.tsx`)
- `client/src/pages/CharacterDetail.tsx` — outbound link pattern (`target="_blank" rel="noopener noreferrer"`)
- `client/src/pages/Videos.tsx` (Phase 3) — paginated list pattern; copy form-validation conventions if any
- `client/src/components/PodcastSubscribeStrip.tsx` (Phase 3) — small horizontal strip of icon links; possibly the closest analog for `<SocialStrip>`. Researcher should compare.

### Existing code this phase consumes / extends
- `client/src/data/cast.json` — 9 cast members with `socialLinks` schema (currently empty strings)
- `client/src/data/social-links.json` — show-level socials (populated)
- `client/src/data/characters.json` — character-id resolution from `cast.characters[]` (free-text names today; researcher must propose how to resolve to character ids — possibly extend cast.json with a `characterIds` field, or use name match)
- `client/src/components/Footer.tsx` — exact icon library usage (`react-icons/si` — `SiYoutube`, `SiX`, `SiDiscord`, `SiPatreon`, `SiReddit` are already imported); reuse the icon-link visual treatment
- `client/src/components/AboutSection.tsx` — possibly the closest existing cast-rendering component
- `client/src/components/Sponsorship.tsx` (or similar) — existing form pattern (researcher confirms its location)

### Existing server endpoints / patterns to mirror
- `server/routes.ts` line ~1825 — `/api/contact/sponsor` is the precedent for a public form-submission endpoint with rate limiting + Zod + sanitization. The new `/api/community/submit` should mirror it line-for-line.
- `server/notification-service.ts` — SES wrapper to reuse for email delivery
- `server/rate-limiter.ts` — `expensiveLimiter` (10/hr per IP) already exported
- `server/security.ts` — `logSecurityEvent` for honeypot rejections and validation failures

### Requirements & decisions sources
- `.planning/REQUIREMENTS.md` — FAN-01..03 binding requirements
- `.planning/PROJECT.md` — locked project decisions
- `CLAUDE.md` — wouter rule, accessibility, atomic commits, security requirements
- `.github/copilot-instructions.md` — coding standards, esp. the "secure endpoint" trigger-word pattern (relevant for `/api/community/submit`)

</canonical_refs>

<specifics>
## Specific Ideas

- The cast-character cross-link via `cast.characters[]` is currently free-text strings (e.g., `"The Storyteller"`). Resolving these to character ids in `characters.json` is a small data-shape decision the planner can solve in two ways: (a) extend `cast.json[i]` with a `characterIds[]` array (best, deterministic); (b) attempt a name match at render time (fragile). Recommend (a) — minor migration in the same phase 4 schema commit.
- Hidden cast (alumni / past members) likely exists in `cast.json` with `isCurrent: false`. Defer to backlog; v1 renders only `isCurrent: true`.
- The social strip on the home page should be **non-disruptive** — the home page already has rich content (Hero, LatestEpisodes, LatestShorts, PodcastSection, CharactersSection, etc.). The strip is a small horizontal addition, not a redesign. Probably 60-80px tall.
- For the form, the existing `Sponsorship.tsx` (referenced from the page list) is likely a near-identical pattern — name + email + message + submit. Researcher should confirm and reference it as the template.
- Empty-string fallback for cast socials means: as you populate socials over time, the page enriches automatically without code changes.

</specifics>

<deferred>
## Deferred Ideas

- **Image / file uploads** — major scope expansion (file storage, MIME validation, virus scan, size limits). Defer until visitor demand surfaces.
- **DB persistence + moderation queue** — turning the email into a record-of-truth + admin UI is a separate phase.
- **Cast detail pages** (`/cast/<id>`) — possible polish; v1 is list-only.
- **Cast alumni section** (`isCurrent: false`) — future content phase.
- **Twitch live indicator on cast cards** — fetches Twitch API; not justified for low-frequency live streams.
- **YouTube subscriber-count badge on social strip** — engagement vanity; out of scope unless analytics phase prioritizes.
- **Reply / acknowledge submission flow** — when admin replies, that's their email client's job. No automation needed.
- **CAPTCHA / Turnstile** — not needed v1; revisit if spam volume justifies.
- **`SocialStrip` migration to use a shared "show channels" schema** — currently `social-links.json` is the single source. If we add cast-channel-rendering elsewhere, possible extraction.
- **Larger influencer-features backlog** (gamification, member tiers, full UGC moderation, live-stream hooks beyond YouTube embed) — explicitly forward context only per ROADMAP.md "Out of Scope".

</deferred>

---

*Phase: 04-fan-engagement*
*Context gathered: 2026-05-09 via /gsd-discuss-phase*
