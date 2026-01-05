# E2E Test Data Management

## Overview

End-to-end (E2E) tests require a seeded database with specific test data to run successfully. This document outlines the data seeding process and maintenance requirements.

## Seeding Script

**Location:** `scripts/seed-e2e-tests.ts`

**Purpose:** Populates the test database with all data required for E2E tests to pass.

### How to Run

```bash
# Local development
npm run db:seed:e2e

# CI/CD (runs automatically before E2E tests)
# See .github/workflows/ci.yml
```

## ⚠️ CRITICAL: Maintaining Test Data Parity

**Whenever you add or modify an E2E test, you MUST update the seed script accordingly.**

### Data Maintenance Checklist

When creating or modifying E2E tests, verify the seed script includes:

- ✅ **Users** - All users referenced in authentication flows
- ✅ **Orders** - Orders with correct statuses for analytics/tracking tests
- ✅ **Audit Logs** - Log entries that compliance tests query for
- ✅ **Products/Variants** - Any Printful products tests interact with
- ✅ **Correct Passwords** - Match test expectations (`ChangeMe123!` for admin)

### Current Seeded Data

#### Users
| Email | Password | Role | Used In Tests |
|-------|----------|------|---------------|
| `admin@talesofaneria.com` | `ChangeMe123!` | admin | Admin login, analytics, audit logs |
| `customer@test.com` | `testpassword` | customer | Customer flows, order tracking |

#### Orders
| Session ID | Status | Total | Used In Tests |
|------------|--------|-------|---------------|
| `test-order-completed-001` | completed | $49.99 | Analytics, order tracking |
| `test-order-processing-001` | processing | $29.99 | Analytics, status filtering |
| `test-order-shipped-001` | shipped | $39.99 | Analytics, tracking |
| `test-order-pending-001` | pending | $19.99 | Analytics, status filtering |

#### Audit Logs
| Action | Category | Severity | Used In Tests |
|--------|----------|----------|---------------|
| login | authentication | info | Audit system |
| failed_login_attempt | security | high | Audit system |
| order_view | data_access | info | Compliance, GDPR |
| data_export | compliance | info | GDPR compliance |

## When to Update Seed Script

### 🔴 Must Update
- Adding new E2E test that requires specific database state
- Changing test assertions that reference database values
- Adding new user roles or permissions tests
- Testing new order statuses or workflows
- Adding audit/compliance verification tests

### 🟡 Should Update
- Modifying existing test flows that might need additional data
- Adding new product variants or Printful integration tests
- Changing authentication flows

### 🟢 No Update Needed
- Visual regression tests (no database dependency)
- SEO/accessibility tests (static content)
- Performance/load tests (using mocked data)

## Common Pitfalls

### ❌ Test Fails: "User not found"
**Cause:** Seed script doesn't create the user referenced in test  
**Fix:** Add user to `scripts/seed-e2e-tests.ts` in the Users section

### ❌ Test Fails: "Order not found"
**Cause:** Test expects specific order ID that doesn't exist  
**Fix:** Add order to `testOrders` array with matching `stripeSessionId`

### ❌ Test Fails: "No audit logs found"
**Cause:** Compliance test expects audit entries that weren't seeded  
**Fix:** Add audit log entry to `auditEntries` array

### ❌ Test Fails: "Invalid password"
**Cause:** Test uses different password than seeded  
**Fix:** Ensure seed script uses same password as test (check env vars)

## Best Practices

### 1. Document Test Data Dependencies
```typescript
// ✅ Good - Documents what data is needed
test('should display completed orders', async ({ page }) => {
  // Expects: order with status='completed' and session_id='test-order-completed-001'
  await page.goto('/admin/orders');
  // ...
});

// ❌ Bad - No indication of data requirements
test('should display completed orders', async ({ page }) => {
  await page.goto('/admin/orders');
  // ...
});
```

### 2. Use Consistent Test Data
- Admin email: `admin@talesofaneria.com`
- Admin password: `ChangeMe123!`
- Test customer: `customer@test.com`
- Order IDs: `test-order-{status}-{number}`

### 3. Keep Seed Script Organized
```typescript
// Group related data with clear comments
// ========================================
// 1. ADMIN USER - Required for admin tests
// ========================================

// ========================================
// 2. TEST CUSTOMER - For customer flows
// ========================================
```

### 4. Run Locally Before Pushing
```bash
# Always test your changes locally
npm run db:push                # Migrate schema
npm run db:seed:e2e           # Seed test data
npm run test:e2e              # Run E2E tests
```

## Troubleshooting

### Seed Script Fails
```bash
# Check database connection
docker compose -f docker-compose.test.yml ps

# View logs
docker compose -f docker-compose.test.yml logs postgres

# Reset and retry
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d
npm run db:push
npm run db:seed:e2e
```

### Tests Pass Locally But Fail in CI
1. Check CI logs for seed script output
2. Verify environment variables are set correctly
3. Ensure database migrations ran before seeding
4. Check for timing issues (database not ready)

## CI/CD Integration

The seed script runs automatically in GitHub Actions:

```yaml
- name: Run database migrations
  run: npm run db:push

- name: Seed E2E test database  # ← Automatically seeds data
  run: npm run db:seed:e2e
  
- name: Run E2E tests           # ← Tests use seeded data
  run: npm run test:e2e
```

## Related Files

- **Seed Script:** `scripts/seed-e2e-tests.ts`
- **Schema Definition:** `shared/schema.ts`
- **CI Workflow:** `.github/workflows/ci.yml`
- **E2E Tests:** `e2e/*.spec.ts`

---

**Remember:** Test data and tests must stay in sync. Update both together!
