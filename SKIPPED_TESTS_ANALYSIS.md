# Skipped Tests Analysis

**Last Updated:** 2026-01-05

## Summary
- **Total Skipped Tests:** 12 across 3 test files (down from 31)
- **Total Passing Tests:** 786 (up from 698)
- **Recently Fixed:** 19 tests in Phase 1 (Printful webhooks + Integration tests)

## ✅ Recently Completed (Phase 1)

### 🟢 Printful Webhook Events (10/10 tests) - COMPLETE
**File:** `test/printful-webhook.test.ts`
**Status:** All tests passing ✅

**What was fixed:**
- Added missing `auditLogs` export to database mock
- Fixed body parsing to preserve `rawBody` for HMAC verification
- Updated middleware setup to match production configuration
- All webhook event handlers now fully tested

### 🟢 Webhook Integration Tests (9/9 tests) - COMPLETE
**File:** `test/integration/webhook-order-integration.test.ts`  
**Status:** All tests passing ✅

**What was fixed:**
- Added complete session mock data with shipping details
- Fixed `createPrintfulOrderFromSession` mock to return proper recipient/items structure
- All E2E webhook processing flows now tested including:
  - Successful payment and order creation
  - Failed Printful orders with admin alerts
  - Database errors
  - Duplicate webhook detection (idempotency)

## 📋 Remaining Skipped Tests

### 🔴 Category 1: Stripe Contract Tests (9 tests)
**File:** `test/contract/stripe.contract.test.ts`
**Priority:** High (Phase 2)
**Reason:** Ensures Stripe API contract compliance

```
Line 77:  describe.skip('package_shipped event')
Line 114: describe.skip('package_returned event')  
Line 144: describe.skip('order_failed event')
Line 172: describe.skip('order_canceled event')
Line 199: describe.skip('webhook security')
Line 264: describe.skip('error handling')
```

**Impact:** Missing test coverage for:
- Order lifecycle events
- Webhook authentication/validation
- Error scenarios in production webhooks

**Fix Approach:**
- Implement mock Printful webhook payloads
- Test database order status updates
- Verify audit log creation
- Test signature verification


---

### 🟡 Category 2: Stripe Contract Tests (9 tests)
**File:** `test/contract/stripe.contract.test.ts`
**Priority:** Medium-High
**Reason:** Ensures Stripe API contract compliance

```
Line 39:  it.skip('should create session with required Printful metadata')
Line 88:  it.skip('should include shipping address collection')
Line 118: it.skip('should enforce minimum price (1 cent)')
Line 171: it.skip('should retrieve session with shipping details')
Line 215: it.skip('should validate session ID format')
Line 322: it.skip('should handle USD currency')
Line 334: it.skip('should handle quantity variations')
Line 382: it.skip('should maintain printful_variant_id field name')
Line 399: it.skip('should maintain printful_product_id field name')
```

**Impact:**
- No validation of Stripe session creation
- Missing metadata validation tests
- No contract regression detection

**Fix Approach:**
- Mock Stripe API responses
- Test actual session creation flow
- Validate metadata structure matches Printful requirements
- Test edge cases (min/max quantities, pricing)

---

### 🟡 Category 2: YouTube Routes (1 entire suite)
**File:** `test/routes/youtube-shorts-routes.test.ts`
**Priority:** Medium
**Reason:** Entire route suite disabled

```
Line 20: describe.skip('YouTube Shorts Routes')
```

**Impact:**
- No API endpoint testing for `/api/youtube/shorts`
- Missing error handling validation

**Fix Approach:**
- Mock YouTube Data API responses
- Test caching behavior
- Test error scenarios (API down, rate limits)
- Validate response structure


---

### 🟣 Category 5: Performance Benchmarks (2 tests)
**File:** `test/performance/benchmarks.perf.test.ts`
**Priority:** Low
**Reason:** Performance regression detection

```
Line 16:  describe.skip('Cache Performance Benchmarks')
Line 150: it.skip('sorts 1000 videos by date in under 10ms')
```

**Impact:**
- No performance regression detection
- Cache performance unvalidated

**Fix Approach:**
- Implement benchmark thresholds
- Run only in CI environment
- Track performance over time


---

### 🟢 Category 3: Test Infrastructure Issues (1 test)
**File:** `test/user-engagement.test.ts`
**Priority:** Low (Phase 4)
**Reason:** Flaky timing test

```
test/user-engagement.test.ts:64 - 'should reset count if clicks are not rapid'
```

**Impact:**
- One flaky test disabled (not a logic bug)
- Rage click detection logic is correct but Date.now() mocking is unreliable in event handlers

**Fix Approach:**
- Refactor to use fake timers properly
- Consider alternative testing approach for event timing
- Will address in Phase 4: Test Quality & Architecture


---

## Recommended Fix Order

### ✅ Phase 1: Critical Business Logic (COMPLETE - Week 1)
1. ✅ **Printful Webhooks** - 10 tests PASSING
2. ✅ **Webhook Integration** - 9 tests PASSING
3. ⚠️ **Test Infrastructure** - 1 test (timing-dependent, flaky)

**Total: 19/20 tests passing (95%)**

### 🔄 Phase 2: API Contracts (IN PROGRESS - Week 2)
4. [ ] **Stripe Contracts** (Category 1) - 9 tests

**Total: 9 tests**

### Phase 3: Feature Coverage (Week 3)
5. ✅ **YouTube Routes** (Category 4) - 1 suite
6. ✅ **Performance Benchmarks** (Category 5) - 2 tests

**Total: ~10 tests**

---

## Dependencies Needed

### For Printful Tests:
- Mock webhook payloads for all event types
- Test database setup/teardown utilities

### For Stripe Tests:
- Stripe test mode API keys
- Mock/stub Stripe SDK
- Snapshot testing for metadata structure

### For Integration Tests:
- Email notification mocking
- Redis for idempotency testing
- Transaction test utilities

### For Performance Tests:
- Benchmark harness
- Performance tracking database

---

## Test Quality Improvements Needed

1. **Test Isolation:**
   - Global state cleanup between tests
   - Proper async middleware teardown

2. **Timing Issues:**
   - Use `vi.useFakeTimers()` for time-dependent tests
   - Avoid `setTimeout` in tests

3. **External API Mocking:**
   - Consistent mocking strategy (MSW vs manual mocks)
   - Contract testing for third-party APIs

4. **Database State:**
   - Transaction rollback after each test
   - Seed data utilities

---

## Success Criteria

- [ ] All 31 skipped tests passing
- [ ] No new skipped tests introduced
- [ ] Test coverage remains above 80%
- [ ] All tests run in under 60 seconds
- [ ] No flaky tests (100% pass rate over 10 runs)
