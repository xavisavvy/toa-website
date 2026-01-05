# Contract Testing Strategy

## Overview

Contract testing ensures that our integrations with external services (Stripe, Printful, YouTube) maintain compatibility over time. These tests validate that our code correctly handles the expected API contracts, preventing breaking changes from impacting production.

## Test Structure

### Location
- **Consumer Contracts**: `test/contract/` - Tests for our consumption of external APIs
- **API Contracts**: `test/contracts/` - Tests validating API response structures

### Coverage

#### Stripe Integration (`stripe.contract.test.ts`)
- **Checkout Session Creation**
  - Metadata preservation (printful_variant_id, printful_product_id)
  - Shipping address collection
  - Price validation (minimum 1 cent)
  - Quantity validation

- **Webhook Verification**
  - Signature validation
  - Event type handling
  - Error scenarios

- **Payment Intents**
  - Creation with valid parameters
  - Currency validation
  - Status transitions

- **Backward Compatibility**
  - Field naming (printful_variant_id vs variantId)
  - Metadata structure
  - URL formatting

**Current Status**: 17 tests (9 active, 8 skipped for live API)

#### Printful Integration (`printful.contract.test.ts`)
- **Product Catalog**
  - Sync products retrieval
  - Product details with variants
  - Variant filtering (ignored products)
  - Pagination and limits

- **Order Management**
  - Order creation
  - Order status tracking
  - Shipment information

- **Variant ID Resolution**
  - Sync variant → Catalog variant conversion
  - Fallback handling
  - Missing data scenarios

- **API Responses**
  - Standard format (code, result, error)
  - Rate limiting (429)
  - Authentication errors (401)
  - Not found errors (404)

- **Backward Compatibility**
  - ProductDisplay interface
  - Field naming consistency

**Current Status**: 28 tests (28 active)

#### YouTube Integration (`youtube.contract.test.ts`)
- **Video Objects**
  - Required fields (id, title, description, thumbnail, publishedAt, url)
  - URL formatting
  - ISO 8601 date validation
  - Field name consistency

- **Type Safety**
  - VideoItem interface compliance
  - Property existence validation

**Current Status**: 5 tests (5 active)

#### API Contracts (`contracts/`)
- **Stripe API** (`stripe-api.contract.test.ts`)
  - Payment intent structure
  - Checkout session structure
  - Webhook event formats
  - Error response handling

- **Printful API** (`printful-api.contract.test.ts`)
  - Store information
  - Product catalog structure
  - Order creation/updates
  - Webhook event formats
  - Rate limiting

- **YouTube API** (`youtube-api.contract.test.ts`)
  - Playlist items endpoint
  - Videos endpoint
  - Pagination
  - Error responses

**Current Status**: 17 tests (17 active)

## Test Execution

### Run All Contract Tests
```bash
npm test -- test/contract test/contracts
```

### Run Specific Integration
```bash
npm test -- test/contract/stripe.contract.test.ts
npm test -- test/contract/printful.contract.test.ts
npm test -- test/contract/youtube.contract.test.ts
```

### Watch Mode
```bash
npm test -- test/contract --watch
```

## Key Principles

### 1. Backward Compatibility
Contract tests ensure we don't break existing integrations by:
- Validating field names remain consistent
- Checking metadata structure
- Verifying URL formats
- Testing error handling

### 2. Type Safety
All contract tests validate TypeScript interfaces match actual API responses:
```typescript
expect(product).toHaveProperty('id');
expect(typeof product.id).toBe('string');
```

### 3. Error Handling
Tests verify graceful degradation:
- Rate limiting (429) → Return empty array, don't crash
- Auth errors (401) → Handle gracefully
- Not found (404) → Return null or empty

### 4. Mocking Strategy
- External APIs are mocked to avoid rate limits
- Mock data matches actual API response structures
- Tests focus on our code's handling of responses

## Critical Field Names

### ⚠️ DO NOT RENAME
These field names are part of contracts with external services:

**Stripe Metadata**:
- `printful_variant_id` (not `variantId` or `variant_id`)
- `printful_product_id` (not `productId` or `product_id`)

**Printful ProductDisplay**:
- `id` (not `productId`)
- `name` (not `title`)
- `price` (not `cost`)
- `image` (not `imageUrl`)
- `url` (not `link`)
- `inStock` (not `available`)

**YouTube VideoItem**:
- `id` (not `videoId`)
- `url` (not `link`)
- `publishedAt` (not `published` or `date`)

## Maintenance

### When to Update Contract Tests
1. **External API Changes**: When Stripe, Printful, or YouTube updates their APIs
2. **New Features**: When adding new integration points
3. **Breaking Changes**: Before renaming any field in ProductDisplay, VideoItem, etc.
4. **Bug Fixes**: When fixing integration bugs to prevent regression

### Adding New Contract Tests
```typescript
describe('New Feature Contract', () => {
  it('should maintain expected structure', async () => {
    const response = await yourFunction();
    
    // Validate required fields
    expect(response).toHaveProperty('requiredField');
    
    // Validate types
    expect(typeof response.requiredField).toBe('string');
    
    // Validate backward compatibility
    expect(response).not.toHaveProperty('oldFieldName');
  });
});
```

### Skipped Tests
Some tests are skipped (`it.skip`) because they require live API calls:
- These tests are documented for future integration testing
- They serve as reference for expected behavior
- Can be enabled for integration test runs with real credentials

## CI/CD Integration

Contract tests run on every:
- Pull request
- Commit to main
- Scheduled nightly builds

Failures indicate potential breaking changes that need review.

## Future Enhancements

### Pact Framework (Installed)
We've installed `@pact-foundation/pact` for future consumer-driven contract testing:
- Generate contract files during testing
- Share contracts with API providers
- Verify provider compatibility

### Contract Monitoring
- [ ] Set up contract versioning
- [ ] Add contract diff detection
- [ ] Implement provider verification tests
- [ ] Create contract change notifications

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Printful API Documentation](https://developers.printful.com/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Pact Documentation](https://docs.pact.io/)
- [Contract Testing Best Practices](https://martinfowler.com/bliki/ContractTest.html)
