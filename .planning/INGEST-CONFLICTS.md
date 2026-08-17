## Conflict Detection Report

Mode: new
Precedence: ADR > SPEC > PRD > DOC
Inputs: 41 classified planning documents (9 ADR, 25 SPEC, 5 PRD, 2 DOC)
LOCKED ADRs: 1 (DEC-security-scanning, source: docs/security/SECURITY_SCANNING.md)

### BLOCKERS (0)

No blockers detected.
- No LOCKED-vs-LOCKED ADR contradictions (only one LOCKED ADR present in the ingest set).
- No cross-reference cycles detected (cross_refs predominantly point to source code, not other planning docs; no doc-to-doc cycles found).
- No UNKNOWN / low-confidence classifications (all 41 docs classified high-confidence with manifest override).

### WARNINGS (0)

No competing acceptance variants detected.
- The 5 PRDs cover non-overlapping scopes (sprint roadmap, analytics enhancements, influencer feature backlog, SEO improvements, shop performance). No two PRDs assert different acceptance criteria for the same requirement scope.

### INFO (2)

[INFO] Auto-resolved: SPEC > DOC on Printful order creation method
  Found: docs/integration/PRINTFUL_INTEGRATION_FINAL.md (SPEC) declares the canonical implementation uses `sync_variant_id` for Printful order creation.
  Found: docs/integration/PRINTFUL_API_ANALYSIS.md (DOC) presents both `sync_variant_id` and catalog-variant approaches as analysis without selecting one.
  Resolution: SPEC wins per default precedence (ADR > SPEC > PRD > DOC). The DOC is preserved verbatim in context.md as historical analysis; the canonical contract lives in constraints.md as CON-printful-integration-final.
  → No user action required.

[INFO] Multiple complementary specs in the Printful shipping/checkout area collapse cleanly
  Found: docs/integration/PRINTFUL_SHIPPING_API.md, docs/integration/SHIPPING_IMPLEMENTATION_SUMMARY.md, docs/PRINTFUL_WEBHOOK_IMPLEMENTATION.md, docs/integration/STRIPE_INTEGRATION.md, docs/E-COMMERCE_GUIDE.md, docs/ORDER_STATUS_FLOW.md, docs/PAYMENT_FLOW_IMPLEMENTATION.md.
  Resolution: All seven SPECs describe complementary slices of the same checkout → fulfillment pipeline (shipping estimate, Stripe checkout, Stripe webhook, Printful order, Printful webhook, order status lifecycle, payment notifications). They are merged additively into constraints.md without contradiction; no precedence tiebreaker needed.
  → No user action required.
