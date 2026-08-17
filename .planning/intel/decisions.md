# Decisions (ADR Intel)

Synthesized from 9 ADR-classified planning documents. Decisions are recorded with provenance; only `SECURITY_SCANNING` is LOCKED at synthesis time.

---

## DEC-audit-compliance — Audit & Compliance System

- source: docs/audit-compliance.md
- status: proposed (manifest ADR; no explicit Accepted marker)
- locked: false
- scope: audit logging, GDPR compliance, SOC2, PII masking, audit_logs schema, data retention, security events
- decision: Maintain a comprehensive audit logging system providing trails for GDPR/SOC2 compliance with PII masking and retention policies. Audit events recorded to `audit_logs` table.

## DEC-caching-rate-limit — API Caching & Rate Limiting Strategy

- source: docs/CACHING_RATE_LIMIT_ANALYSIS.md
- status: proposed (analysis status "OPTIMAL")
- locked: false
- scope: caching, rate limiting, YouTube Data API, Printful API, Podcast RSS feed, Etsy API, API quota management
- decision: Current caching strategy and rate limiting configuration are deemed optimal across YouTube, Printful, Podcast, and Etsy integrations. No quota issues expected under current rate limits.

## DEC-ci-database-strategy — CI/CD Database Strategy

- source: docs/CI_DATABASE_STRATEGY.md
- status: proposed (recommendation, not formally Accepted)
- locked: false
- scope: CI/CD, E2E testing, Docker Compose, PostgreSQL, Redis, GitHub Actions
- decision: Use Docker Compose with PostgreSQL and Redis services in CI for E2E tests requiring a real database. Reference: docker-compose.test.yml and .github/workflows/ci.yml.

## DEC-duplicate-order-prevention — Stripe Webhook Idempotency

- source: docs/integration/DUPLICATE_ORDER_PREVENTION.md
- status: proposed (no Accepted marker, but problem/solution/consequences pattern present)
- locked: false
- scope: Stripe webhooks, Printful order creation, idempotency, server/routes.ts, duplicate prevention
- decision: Add in-memory idempotency protection in the Stripe webhook handler to prevent duplicate Printful order creation when Stripe retries the same checkout.session.completed event.

## DEC-license-compliance — Dependency License Approval

- source: docs/security/LICENSE_COMPLIANCE_REVIEW.md
- status: proposed (decision recorded, no Accepted marker)
- locked: false
- scope: dependency licensing, LGPL compliance, sharp library, commercial use approval
- decision: All dependency licenses are approved for commercial use. LGPL exceptions granted for sharp binary libraries used via dynamic linking only.

## DEC-logging-pii — Logging & PII Sanitization

- source: docs/LOGGING_AND_PII.md
- status: proposed
- locked: false
- scope: logging, PII sanitization, log-sanitizer.ts, safeLog, privacy compliance, GDPR, CCPA
- decision: All application logging routes through `log-sanitizer.ts` (`safeLog`) for automatic PII redaction to comply with GDPR and CCPA. Direct `console.log` of user inputs is prohibited.

## DEC-markdown-secret-prevention — Markdown Secret Scanning

- source: docs/security/MARKDOWN_SECRET_PREVENTION.md
- status: proposed
- locked: false
- scope: markdown documentation, secret scanning, pre-commit hooks, gitleaks, API key placeholders
- decision: All markdown files are scanned for accidental real API keys via pre-commit hook + gitleaks. Documentation must use placeholders (e.g., `sk_test_your_key_here`, `[REDACTED]`).

## DEC-security-scanning — CI/CD Security Scanning Stack [LOCKED]

- source: docs/security/SECURITY_SCANNING.md
- status: Active / Accepted
- locked: true
- scope: security scanning, CI/CD, Trivy, Snyk, Gitleaks, npm audit, CodeQL, OWASP Top 10
- decision: The active multi-layer security scanning configuration uses Trivy (container vuln), Snyk (dependency vuln), Gitleaks (secret detection), npm audit (package vuln), and custom OWASP Top 10 tests. CodeQL is explicitly disabled in this stack.

## DEC-youtube-api-key-split — YouTube API Key Restrictions

- source: docs/security/YOUTUBE_API_SECURITY.md
- status: proposed (no Accepted marker)
- locked: false
- scope: YouTube Data API, API key management, server-side key, client-side key, Replit deployment
- decision: Use two separate YouTube API keys: a server-side key with IP restrictions and a client-side key with HTTP referrer restrictions. Never share keys between environments.
