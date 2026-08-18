# Ingest Synthesis Summary

Mode: new
Date: 2026-05-08
Inputs consumed: 41 classified planning documents from `.planning/intel/classifications/`
Project: Tales of Aneria — TTRPG live-play website (React 18 + Express + PostgreSQL/Drizzle; YouTube, Stripe, Printful, AWS SES).

## Doc Counts by Type

- ADR: 9
- SPEC: 25
- PRD: 5
- DOC: 2
- Total: 41

## Decisions

- Total decisions extracted: 9
- Locked: 1
  - DEC-security-scanning (source: docs/security/SECURITY_SCANNING.md) — CI/CD security scanning stack: Trivy, Snyk, Gitleaks, npm audit, OWASP tests; CodeQL disabled.
- Proposed (non-locked): 8
  - DEC-audit-compliance, DEC-caching-rate-limit, DEC-ci-database-strategy, DEC-duplicate-order-prevention, DEC-license-compliance, DEC-logging-pii, DEC-markdown-secret-prevention, DEC-youtube-api-key-split

Detail: `.planning/intel/decisions.md`

## Requirements

- Total requirements extracted: 5
  - REQ-roadmap-tech-debt
  - REQ-analytics-metrics-roadmap
  - REQ-influencer-features
  - REQ-seo-recommendations
  - REQ-shop-performance

Detail: `.planning/intel/requirements.md`

## Constraints

- Total constraints: 25
- By type:
  - api-contract: 17 (admin dashboard, analytics events, OpenAPI specs, AWS SES, cart, chaos goblin, dynamic social images, e-commerce guide, health checks, order status, payment flow, Printful integration final, Printful shipping API, Printful webhook, shipping implementation, Stripe integration, YouTube channel videos)
  - schema: 2 (architecture, character images)
  - nfr: 6 (security policy, authentication security, contract testing, deployment, design guidelines, docker deployment, environment management)

Detail: `.planning/intel/constraints.md`

## Context

- Total context topics: 2 (Printful order creation methods analysis; security audit status)

Detail: `.planning/intel/context.md`

## Conflicts

- BLOCKERS: 0
- WARNINGS (competing variants): 0
- INFO (auto-resolved): 2

Detail: `.planning/INGEST-CONFLICTS.md`

## Status

READY — safe to route to `gsd-roadmapper`. No locked-vs-locked contradictions, no competing acceptance variants, no unresolved blockers.

## Pointers for Downstream Consumers

- Decisions intel: `.planning/intel/decisions.md`
- Requirements intel: `.planning/intel/requirements.md`
- Constraints intel: `.planning/intel/constraints.md`
- Context intel: `.planning/intel/context.md`
- Conflicts report: `.planning/INGEST-CONFLICTS.md`
- Source classifications: `.planning/intel/classifications/*.json`
