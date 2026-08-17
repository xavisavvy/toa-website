# Context (DOC Intel)

Synthesized from 2 DOC-classified planning documents. These are reference notes — not contracts and not requirements — captured verbatim by topic with source attribution.

---

## TOPIC: Printful Order Creation Methods

- source: docs/integration/PRINTFUL_API_ANALYSIS.md
- summary: Analysis comparing two Printful order-creation methods — sync variant vs catalog variant. Documents common integration mistakes and guidance for selecting between them. Note: the canonical decision in CON-printful-integration-final (SPEC) is to use `sync_variant_id`, which supersedes anything in this analysis where they overlap.

## TOPIC: Security Audit Status (Known Vulnerabilities)

- source: docs/SECURITY_AUDIT.md
- summary: Tracks known moderate-severity dependency vulnerabilities (notably esbuild and drizzle-kit transitive issues), accepted risks, and resolution strategies. Living document that should be re-checked when dependencies are upgraded.
