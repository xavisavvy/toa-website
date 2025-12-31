# Test Improvement Implementation Guide

This document tracks the implementation of comprehensive test improvements for the Tales of Aneria website.

## ✅ Completed Implementations

### #1: E2E Tests with Playwright (COMPLETED)
**Status:** ✅ Done  
**Files Added:**
- `playwright.config.ts` - Playwright configuration
- `e2e/homepage.spec.ts` - Homepage E2E tests (responsive, performance)
- `e2e/characters.spec.ts` - Characters page E2E tests  
- `e2e/seo.spec.ts` - SEO and structured data tests

**Results:**
- 42 E2E tests created
- 35/42 tests passing (7 need data-testid attributes in components)
- Tests cover: navigation, responsive design, performance, SEO compliance

**Commands:**
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run with UI
npm run test:e2e:headed   # Run in headed mode
```

---

### #2: Contract Tests with MSW (COMPLETED)
**Status:** ✅ Done  
**Files Added:**
- `test/contracts/youtube-api.contract.test.ts` - YouTube API contract tests

**Results:**
- 9 contract tests validating YouTube API responses
- Tests document expected API behavior
- Validates error handling for 403, 404, 429 responses
- Tests pagination and batch requests

**What This Covers:**
- YouTube PlaylistItems endpoint contract
- YouTube Videos endpoint contract
- Error response format validation
- Pagination with nextPageToken
- Missing optional fields handling

---

## 📋 Remaining Implementations (Priority Order)

### #3: Snapshot Tests for Structured Data
**Status:** ⏳ To Do  
**Priority:** High  
**Estimated Time:** 1 hour

**What to Do:**
1. Install snapshot testing library (built into Vitest)
2. Add snapshot tests in `test/structured-data.snapshot.test.ts`
3. Validate JSON-LD against schema.org

**Example Test:**
```typescript
import { generatePodcastStructuredData } from '../client/src/lib/structuredData';

test('podcast JSON-LD structure', () => {
  const jsonLd = generatePodcastStructuredData({
    title: 'Tales of Aneria',
    episodes: mockEpisodes,
  });
  
  expect(jsonLd).toMatchSnapshot();
  
  // Validate against schema
  expect(jsonLd['@type']).toBe('PodcastSeries');
  expect(jsonLd.name).toBeTruthy();
});
```

**Files to Create:**
- `test/structured-data.snapshot.test.ts`
- `test/__snapshots__/structured-data.snapshot.test.ts.snap` (auto-generated)

---

### #4: Property-Based Testing with fast-check
**Status:** ⏳ To Do  
**Priority:** Medium  
**Estimated Time:** 2 hours

**What to Do:**
1. Install fast-check: `npm install -D fast-check`
2. Add property tests for validators
3. Test edge cases automatically

**Example Tests:**
```typescript
import fc from 'fast-check';

test('validatePlaylistId handles all invalid inputs', () => {
  fc.assert(
    fc.property(
      fc.string(),
      (input) => {
        const isValid = /^[a-zA-Z0-9_-]+$/.test(input);
        const result = validatePlaylistId(input);
        return isValid ? result.valid : !result.valid;
      }
    )
  );
});
```

**Files to Create:**
- `test/property/validators.property.test.ts`
- `test/property/formatters.property.test.ts`

---

### #5: Performance Benchmarks
**Status:** ⏳ To Do  
**Priority:** Medium  
**Estimated Time:** 1.5 hours

**What to Do:**
1. Add performance tests for cache operations
2. Test large dataset handling
3. Benchmark critical paths

**Example Test:**
```typescript
test('cache read performs under 10ms', () => {
  const start = performance.now();
  const result = readCache('PLTest');
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(10);
});
```

**Files to Create:**
- `test/performance/cache.perf.test.ts`
- `test/performance/data-processing.perf.test.ts`

---

### #6: Mutation Testing with Stryker
**Status:** ⏳ To Do  
**Priority:** Medium  
**Estimated Time:** 2 hours

**What to Do:**
1. Install Stryker: `npm install -D @stryker-mutator/core @stryker-mutator/typescript-checker @stryker-mutator/vitest-runner`
2. Create `stryker.config.mjs`
3. Run mutation tests to verify test quality

**Config Example:**
```javascript
// stryker.config.mjs
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  mutate: [
    'server/**/*.ts',
    'client/src/lib/**/*.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
  ],
};
```

**Command:**
```bash
npx stryker run
```

---

### #7: Visual Regression Tests
**Status:** ⏳ To Do  
**Priority:** Low  
**Estimated Time:** 3 hours

**What to Do:**
1. Set up Storybook: `npx storybook@latest init`
2. Create stories for key components
3. Set up Chromatic for visual regression

**Files to Create:**
- `.storybook/main.ts`
- `.storybook/preview.ts`
- `client/src/components/Hero.stories.tsx`
- `client/src/components/Navigation.stories.tsx`

---

### #8: Load/Stress Tests
**Status:** ⏳ To Do  
**Priority:** Low  
**Estimated Time:** 2 hours

**What to Do:**
1. Install autocannon: `npm install -D autocannon`
2. Create load tests for API endpoints
3. Test concurrent request handling

**Example:**
```typescript
import autocannon from 'autocannon';

test('API handles 100 concurrent requests', async () => {
  const result = await autocannon({
    url: 'http://localhost:5000/api/youtube/playlist/PLTest',
    connections: 100,
    duration: 10,
  });
  
  expect(result.errors).toBe(0);
  expect(result.requests.average).toBeGreaterThan(50);
});
```

**Files to Create:**
- `test/load/api-endpoints.load.test.ts`

---

### #9: Accessibility Tests
**Status:** ⏳ To Do  
**Priority:** Medium  
**Estimated Time:** 1.5 hours

**What to Do:**
1. Install axe-core: `npm install -D @axe-core/playwright`
2. Add a11y tests to E2E suite
3. Check WCAG 2.1 compliance

**Example:**
```typescript
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('homepage is accessible', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

**Files to Update:**
- `e2e/accessibility.spec.ts` (new file)

---

### #10: Security Testing
**Status:** ⏳ To Do  
**Priority:** Medium  
**Estimated Time:** 2 hours

**What to Do:**
1. Add tests for XSS prevention
2. Test CSRF protection (when forms added)
3. Validate rate limiting
4. Test input sanitization

**Example:**
```typescript
test('prevents XSS in user input', async () => {
  const maliciousInput = '<script>alert("XSS")</script>';
  const result = sanitizeInput(maliciousInput);
  
  expect(result).not.toContain('<script>');
});
```

**Files to Create:**
- `test/security/xss.test.ts`
- `test/security/rate-limiting.test.ts`

---

## 📊 Progress Tracker

| # | Test Type | Status | Priority | Tests | Time Estimate |
|---|-----------|--------|----------|-------|---------------|
| 1 | E2E (Playwright) | ✅ Done | High | 42 | - |
| 2 | Contract (MSW) | ✅ Done | High | 9 | - |
| 3 | Snapshot | ⏳ To Do | High | ~10 | 1h |
| 4 | Property-Based | ⏳ To Do | Medium | ~15 | 2h |
| 5 | Performance | ⏳ To Do | Medium | ~8 | 1.5h |
| 6 | Mutation | ⏳ To Do | Medium | N/A | 2h |
| 7 | Visual Regression | ⏳ To Do | Low | ~20 | 3h |
| 8 | Load/Stress | ⏳ To Do | Low | ~5 | 2h |
| 9 | Accessibility | ⏳ To Do | Medium | ~10 | 1.5h |
| 10 | Security | ⏳ To Do | Medium | ~12 | 2h |

**Total Estimated Time Remaining:** ~15 hours

---

## 🎯 Test Pyramid Goal

**Current State:**
```
         E2E: 42 tests (30%)
      /              \
     /                \
Integration: 26 tests (18%)
   /                    \
  /                      \
Unit Tests: 132 tests (52%)
```

**Target State (After All Implementations):**
```
         E2E: ~60 tests (15%)
      /                   \
     /                     \
Integration: ~100 tests (25%)
   /                         \
  /                           \
Unit Tests: ~240 tests (60%)
```

---

## 📝 Next Steps

1. **Immediate (This Week):**
   - ✅ Implement #1: E2E Tests (DONE)
   - ✅ Implement #2: Contract Tests (DONE)
   - Implement #3: Snapshot Tests
   
2. **Short Term (Next 2 Weeks):**
   - Implement #4: Property-Based Testing
   - Implement #5: Performance Benchmarks
   - Implement #9: Accessibility Tests

3. **Medium Term (Next Month):**
   - Implement #6: Mutation Testing
   - Implement #10: Security Testing

4. **Long Term (Next Quarter):**
   - Implement #7: Visual Regression
   - Implement #8: Load Testing

---

## 🔗 Resources

- [Playwright Docs](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [fast-check Guide](https://fast-check.dev/)
- [Stryker Mutator](https://stryker-mutator.io/)
- [Vitest Snapshot Testing](https://vitest.dev/guide/snapshot)
- [axe-core Accessibility](https://github.com/dequelabs/axe-core)

---

**Last Updated:** 2025-12-31  
**Completed By:** AI Assistant (Implementing comprehensive test strategy)
