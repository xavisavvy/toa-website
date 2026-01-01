# Contract Testing Guide

This document describes the contract testing strategy for the TOA website.

## What is Contract Testing?

Contract testing validates that APIs and services maintain their expected behavior and data structures. It ensures:
- **Backward compatibility** - API responses don't break existing clients
- **Type safety** - Response fields match expected types
- **SLA compliance** - Performance meets defined thresholds

## Running Contract Tests

```bash
# Run all contract tests
npm run test:contract

# Run specific contract test file
npx vitest test/contract/youtube.contract.test.ts
```

## Test Categories

### 1. API Response Contracts
Tests in `test/contract/api.contract.test.ts` validate:
- Response structure and field presence
- Data types for all fields
- HTTP headers (cache-control, content-type)
- Error response formats
- Response time SLAs

### 2. Service Contracts
Tests in `test/contract/youtube.contract.test.ts` validate:
- Multi-playlist merging behavior
- Video object structure
- URL formatting
- Date formatting (ISO 8601)
- Cache behavior
- Error handling

## Contract Test Examples

### Testing Response Structure
```typescript
it('should return array of videos with required fields', async () => {
  const response = await fetch('http://localhost:5000/api/youtube');
  const data = await response.json();
  
  expect(Array.isArray(data)).toBe(true);
  
  if (data.length > 0) {
    const video = data[0];
    expect(video).toHaveProperty('id');
    expect(video).toHaveProperty('title');
    expect(typeof video.id).toBe('string');
  }
});
```

### Testing Backward Compatibility
```typescript
it('should maintain field names', async () => {
  const response = await fetch('http://localhost:5000/api/youtube');
  const data = await response.json();
  
  if (data.length > 0) {
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).not.toHaveProperty('videoId'); // Field wasn't renamed
  }
});
```

### Testing Performance SLAs
```typescript
it('should respond within acceptable time', async () => {
  const startTime = Date.now();
  await fetch('http://localhost:5000/api/youtube');
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(5000); // 5 second SLA
});
```

## When to Update Contracts

Update contract tests when:
1. **Adding new API endpoints** - Create contract tests before implementation
2. **Changing response structure** - Update tests to reflect new contracts
3. **Deprecating fields** - Add grace period tests for backward compatibility
4. **Changing error formats** - Update error contract tests

## Best Practices

1. **Keep contracts stable** - Breaking changes require major version bumps
2. **Test edge cases** - Empty arrays, null values, error conditions
3. **Validate types strictly** - Don't rely on duck typing
4. **Test performance** - Include SLA validations in contracts
5. **Document breaking changes** - Update CHANGELOG.md for contract changes

## CI/CD Integration

Contract tests run automatically in the CI pipeline:
- ✅ On every pull request
- ✅ Before merging to main
- ✅ Before deployment

Failed contract tests block deployment to prevent breaking changes.

## Troubleshooting

### Contract test failures

1. **Field missing** - Check if API response structure changed
2. **Type mismatch** - Verify data transformation logic
3. **SLA violation** - Investigate performance regression
4. **Backward compatibility** - Check if field was renamed/removed

### Debugging tips

```bash
# Run with detailed output
npx vitest test/contract --reporter=verbose

# Run single test for debugging
npx vitest test/contract/youtube.contract.test.ts -t "should fetch from multiple playlists"
```

## Related Documentation

- [Testing Guide](./TESTING.md) - Overall testing strategy
- [Load Testing](./LOAD_TESTING.md) - Performance testing
- [Security Testing](./SECURITY.md) - Security validation
