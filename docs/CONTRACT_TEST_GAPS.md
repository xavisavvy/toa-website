# Contract Test Coverage Analysis

## ✅ Existing Contract Tests

### 1. **Printful Contract Tests** (`test/contract/printful.contract.test.ts`)
- ✅ Sync Products API
- ✅ Product Details API
- ✅ Variant ID Resolution
- ✅ API Response Structure
- ✅ Backward Compatibility
- ✅ Rate Limiting Handling
- ✅ Error Handling

### 2. **Stripe Contract Tests** (`test/contract/stripe.contract.test.ts`)
- ⚠️ Checkout Session Creation (9 tests SKIPPED)
- ✅ Webhook Signature Verification
- ⚠️ Checkout Session Retrieval (SKIPPED)
- ✅ Webhook Event Types
- ✅ Configuration Contract
- ⚠️ Price Validation (3 tests SKIPPED)
- ⚠️ Metadata Backward Compatibility (2 tests SKIPPED)

---

## ❌ Missing Contract Tests

### **Category A: Printful Webhooks** (HIGH PRIORITY)
**Gap:** No contract tests for incoming Printful webhook payloads

**Missing Tests:**
1. **Webhook Signature Verification Contract**
   - HMAC-SHA256 signature validation
   - Missing signature handling
   - Invalid signature rejection
   - Replay attack prevention

2. **Webhook Event Payload Contracts**
   - `package_shipped` event structure
   - `package_returned` event structure
   - `order_failed` event structure
   - `order_canceled` event structure
   - `product_synced` event structure
   - `stock_updated` event structure

3. **Webhook Response Contract**
   - Must return 200 OK to acknowledge
   - Error responses (400, 401, 500)
   - Idempotency handling

**Business Impact:** 
- Production webhooks could fail silently if Printful changes payload structure
- Security vulnerabilities if signature verification logic breaks

---

### **Category B: Stripe Webhooks** (HIGH PRIORITY)
**Gap:** No contract tests for incoming Stripe webhook events

**Missing Tests:**
1. **Webhook Event Structure Contract**
   - `checkout.session.completed` payload validation
   - `checkout.session.expired` payload validation
   - `payment_intent.succeeded` payload validation
   - `payment_intent.payment_failed` payload validation
   - `payment_intent.canceled` payload validation

2. **Stripe Session Metadata Contract**
   - Verify `printful_variant_id` is preserved
   - Verify `printful_product_id` is preserved
   - Verify custom metadata fields
   - Test metadata character limits

3. **Shipping Address Contract**
   - Required fields present in `shipping_details`
   - Address validation format
   - Country code validation
   - Postal code format per country

**Business Impact:**
- Orders could fail to fulfill if metadata structure changes
- Customer addresses might be incomplete

---

### **Category C: Database Schema Contracts** (MEDIUM PRIORITY)
**Gap:** No tests ensuring database schema matches external API expectations

**Missing Tests:**
1. **Orders Table Contract**
   - `stripe_session_id` format validation
   - `printful_order_id` format validation
   - `status` enum matches Printful statuses
   - Required fields for order fulfillment

2. **Order Items Table Contract**
   - `printful_item_id` uniqueness
   - Price precision (decimal vs integer)
   - Quantity constraints

3. **Audit Logs Table Contract**
   - Required fields for compliance
   - Event type enum completeness
   - PII sanitization validation

**Business Impact:**
- Migration errors could break production
- GDPR compliance violations

---

### **Category D: Admin API Contracts** (MEDIUM PRIORITY)
**Gap:** No contract tests for admin authentication/authorization

**Missing Tests:**
1. **Authentication Contract**
   - Session token format
   - Token expiration behavior
   - Refresh token flow
   - Logout cleanup

2. **Authorization Contract**
   - Admin role enforcement
   - Permission-based access control
   - RBAC rules validation

3. **Rate Limiting Contract**
   - `/api/admin/*` endpoints have separate limits
   - Health check endpoints exempt from rate limiting
   - Rate limit headers present

**Business Impact:**
- Security vulnerabilities if auth breaks
- Admin lockout scenarios

---

### **Category E: Analytics API Contracts** (LOW PRIORITY)
**Gap:** No contract tests for analytics data aggregation

**Missing Tests:**
1. **Analytics Response Contract**
   - Time range query validation
   - Aggregation accuracy
   - Missing data handling
   - Performance benchmarks

2. **Audit Log Query Contract**
   - Pagination behavior
   - Filter accuracy
   - PII masking in responses

**Business Impact:**
- Inaccurate business metrics
- Slow admin dashboard

---

## 📋 Recommended Test Additions

### **Phase 1: Critical Path (Week 1)**
```typescript
// NEW: test/contract/printful-webhooks.contract.test.ts
describe('Printful Webhook Contract Tests', () => {
  test('package_shipped webhook has required fields')
  test('webhook signature validation contract')
  test('order ID resolution from webhook payload')
  test('idempotency key handling')
})

// NEW: test/contract/stripe-webhooks.contract.test.ts
describe('Stripe Webhook Contract Tests', () => {
  test('checkout.session.completed has shipping_details')
  test('metadata preservation through checkout flow')
  test('webhook signature verification with real Stripe lib')
  test('duplicate webhook handling')
})
```

### **Phase 2: Data Integrity (Week 2)**
```typescript
// NEW: test/contract/database-schema.contract.test.ts
describe('Database Schema Contract Tests', () => {
  test('orders table matches Stripe session structure')
  test('orders table matches Printful order requirements')
  test('audit logs support all event types')
  test('PII fields are encrypted at rest')
})
```

### **Phase 3: Admin Security (Week 3)**
```typescript
// NEW: test/contract/admin-api.contract.test.ts
describe('Admin API Contract Tests', () => {
  test('authentication returns valid session token')
  test('rate limiting headers present')
  test('admin-only endpoints reject user tokens')
  test('audit logs capture all admin actions')
})
```

---

## 🔧 Implementation Tools

### **Recommended Libraries:**
1. **Pact.js** - For consumer-driven contract testing with Stripe/Printful
2. **Joi/Zod** - Runtime schema validation for webhook payloads
3. **Supertest** - HTTP assertions for API contracts
4. **Stripe Mock Server** - Official Stripe webhook testing

### **Test Data Strategy:**
1. **Fixture Files:** Store real webhook payloads (sanitized)
   - `fixtures/webhooks/printful/package_shipped.json`
   - `fixtures/webhooks/stripe/checkout_completed.json`

2. **Schema Validators:** Create reusable schema validators
   ```typescript
   export const PrintfulWebhookSchema = z.object({
     type: z.enum(['package_shipped', 'order_failed', ...]),
     data: z.object({
       order: z.object({ id: z.number() })
     })
   });
   ```

3. **Contract Snapshots:** Use snapshot testing for stable contracts
   ```typescript
   expect(webhookPayload).toMatchSnapshot();
   ```

---

## ✅ Success Metrics

- [ ] All external API calls have corresponding contract tests
- [ ] All webhook endpoints have payload validation tests
- [ ] Database schema changes trigger contract test updates
- [ ] Contract tests run in CI before integration tests
- [ ] 100% of skipped contract tests are fixed
- [ ] Contract test failures block deployments

---

## 📊 Current Status

| Category | Existing | Skipped | Missing | Total Needed |
|----------|----------|---------|---------|--------------|
| Printful API | 6 suites | 0 | 0 | ✅ 6 |
| Stripe API | 8 suites | 9 tests | 0 | ⚠️ 17 |
| Printful Webhooks | 0 | 6 tests | 12 tests | ❌ 18 |
| Stripe Webhooks | 4 tests | 0 | 8 tests | ⚠️ 12 |
| Database Schema | 0 | 0 | 15 tests | ❌ 15 |
| Admin API | 0 | 0 | 10 tests | ❌ 10 |
| Analytics API | 0 | 0 | 5 tests | ❌ 5 |

**Total Contract Test Gap:** ~60 tests needed

---

## 🎯 Priority Roadmap

### **Immediate (This Sprint)**
1. Un-skip all 9 Stripe contract tests
2. Fix 6 Printful webhook tests
3. Add 12 new Printful webhook contract tests

### **Next Sprint**
4. Add 8 Stripe webhook contract tests
5. Add 15 database schema contract tests

### **Future**
6. Add 10 admin API contract tests
7. Add 5 analytics contract tests
8. Implement consumer-driven contract testing with Pact

---

## 📚 References

- [Printful Webhook Documentation](https://developers.printful.com/docs/#tag/Webhooks)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)
- [Contract Testing Best Practices](https://martinfowler.com/articles/consumerDrivenContracts.html)
- [Pact.js Documentation](https://docs.pact.io/implementation_guides/javascript)
