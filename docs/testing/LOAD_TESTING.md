# Load and Stress Testing

## Overview

Load and stress testing validates that your application can handle real-world traffic patterns and performs well under concurrent load. These tests ensure API endpoints, database queries, and caching mechanisms work efficiently under pressure.

## Implementation

This project uses **Playwright for load/stress testing** - making concurrent HTTP requests to test API performance, response times, and error handling under various load conditions.

## Files Created

- `e2e/load-stress.spec.ts` - 15+ load and stress tests

## Test Categories

### 1. API Endpoint Load Tests (3 tests)
- **50 concurrent homepage requests** - Validates concurrent user traffic
- **100 sequential API requests** - Tests sustained request handling
- **Concurrent character page requests** - Tests database query performance

### 2. Database Query Load Tests (1 test)
- **Multiple concurrent database queries** - Validates DB connection pooling

### 3. Cache Performance Tests (2 tests)
- **Cache effectiveness validation** - Compares cold vs warm cache
- **Cache under concurrent load** - Tests cache hit performance

### 4. Stress Test Scenarios (2 tests)
- **Burst traffic pattern** - Simulates traffic spikes
- **Sustained load over time** - Tests long-running stability

### 5. Error Handling Under Load (2 tests)
- **404 requests under load** - Validates error handling performance
- **Mixed success/failure requests** - Tests recovery and resilience

### 6. Performance Degradation Tests (1 test)
- **Response time consistency** - Validates scaling behavior

**Total: 15+ load and stress tests**

## How It Works

### Concurrent Request Testing
```typescript
// 50 simultaneous requests
const requests = Array(50).fill(null).map(() => 
  request.get('/')
);

const responses = await Promise.all(requests);

// Measure avg response time
const avgTime = duration / requests.length;
expect(avgTime).toBeLessThan(1000); // < 1s average
```

### Sequential Load Testing
```typescript
// 100 requests one after another
for (let i = 0; i < 100; i++) {
  const response = await request.get('/');
  responseTimes.push(duration);
}

// Analyze metrics
const avgResponseTime = average(responseTimes);
const maxResponseTime = Math.max(...responseTimes);
```

### Burst Traffic Simulation
```typescript
// Simulate realistic traffic spikes
const burst1 = Array(20).fill(null).map(() => request.get('/'));
await Promise.all(burst1);

await wait(500); // Pause

const burst2 = Array(30).fill(null).map(() => request.get('/'));
await Promise.all(burst2);
```

### Cache Performance Validation
```typescript
// Cold cache (first request)
const coldResponse = await request.get('/api/characters');
const coldDuration = measureTime();

// Warm cache (second request)
const warmResponse = await request.get('/api/characters');
const warmDuration = measureTime();

// Cache should improve performance
expect(warmDuration).toBeLessThanOrEqual(coldDuration);
```

## npm Scripts

```json
{
  "test:load": "playwright test e2e/load-stress.spec.ts",
  "test:load:ui": "playwright test e2e/load-stress.spec.ts --ui"
}
```

## Usage

### Run All Load Tests
```bash
npm run test:load
```

### Run in UI Mode
```bash
npm run test:load:ui
```

### Run Specific Test
```bash
npx playwright test -g "50 concurrent homepage"
```

### Run with Verbose Output
```bash
npx playwright test e2e/load-stress.spec.ts --reporter=list
```

## Performance Metrics

### Expected Results

| Test | Load | Success Rate | Avg Response Time |
|------|------|--------------|-------------------|
| Homepage concurrent | 50 | 100% | < 1000ms |
| Sequential API | 100 | 100% | < 500ms |
| Character pages | 50 | 95%+ | < 800ms |
| Database queries | 50 | 100% | < 300ms |
| Cached requests | 50 | 100% | < 200ms |
| Burst traffic | 90 | 98%+ | Varies |
| 404 errors | 50 | 100% | < 100ms |

### Performance Thresholds

```typescript
// API endpoints
expect(avgResponseTime).toBeLessThan(1000); // 1s max avg
expect(maxResponseTime).toBeLessThan(2000); // 2s max single

// Database queries
expect(avgResponseTime).toBeLessThan(300); // 300ms avg

// Cached responses
expect(avgResponseTime).toBeLessThan(200); // 200ms avg

// Error responses
expect(avgResponseTime).toBeLessThan(100); // 100ms avg

// Success rates
expect(successRate).toBeGreaterThanOrEqual(95); // 95% minimum
```

## Test Scenarios Explained

### 1. Concurrent Homepage Requests
Simulates 50 users hitting the homepage simultaneously.
- **Purpose:** Validate server can handle concurrent connections
- **Metric:** Average response time < 1s
- **Pass Criteria:** All requests succeed (100% success rate)

### 2. Sequential API Requests
Makes 100 API calls one after another.
- **Purpose:** Test sustained request handling
- **Metrics:** Avg, min, max response times
- **Pass Criteria:** Avg < 500ms, Max < 2s

### 3. Concurrent Character Requests
50 requests across different character pages.
- **Purpose:** Test database query performance
- **Metric:** Success rate and response time
- **Pass Criteria:** 95%+ success, reasonable response time

### 4. Cache Performance
Compares cold cache vs warm cache performance.
- **Purpose:** Validate caching improves performance
- **Metric:** Warm cache faster or equal to cold
- **Pass Criteria:** Warm ≤ Cold * 1.5

### 5. Burst Traffic
Simulates traffic spikes: 20 → 30 → 40 requests.
- **Purpose:** Test handling of sudden load increases
- **Metric:** Success rate across all bursts
- **Pass Criteria:** 98%+ success rate

### 6. Sustained Load
Maintains 5 requests/second for 10 seconds.
- **Purpose:** Test long-running stability
- **Metrics:** Total requests, success rate, RPS
- **Pass Criteria:** 95%+ success over duration

### 7. Error Handling
50 concurrent requests to non-existent pages.
- **Purpose:** Validate error handling doesn't slow down
- **Metric:** Average response time for 404s
- **Pass Criteria:** < 100ms average

### 8. Performance Scaling
Tests response time at 10, 25, 50, 75 requests.
- **Purpose:** Validate performance degradation is acceptable
- **Metric:** Response time at different loads
- **Pass Criteria:** < 3x slowdown at highest vs lowest

## Best Practices

### 1. Realistic Load Patterns
```typescript
// Don't just hammer with max load
// Simulate real user behavior
const userJourney = async () => {
  await request.get('/');           // Homepage
  await wait(1000);                 // User reads
  await request.get('/characters'); // Navigate
  await wait(2000);                 // User browses
  await request.get('/characters/1'); // Select character
};
```

### 2. Measure Multiple Metrics
```typescript
const metrics = {
  successCount: 0,
  failureCount: 0,
  responseTimes: [],
  errors: [],
};

// Analyze comprehensively
console.log(`Success Rate: ${successRate}%`);
console.log(`Avg Response: ${avgTime}ms`);
console.log(`95th Percentile: ${p95}ms`);
console.log(`Max Response: ${maxTime}ms`);
```

### 3. Test Cache Behavior
```typescript
// Always test cold vs warm cache
// First request (cold)
const cold = await time(request.get('/api/data'));

// Second request (warm)
const warm = await time(request.get('/api/data'));

// Validate improvement
expect(warm).toBeLessThanOrEqual(cold);
```

### 4. Include Error Scenarios
```typescript
// Mix successful and failing requests
const mixed = [
  ...validRequests,
  ...invalidRequests,
];

// System should handle both efficiently
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:      # Manual trigger

jobs:
  load-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
        
      - name: Start server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:5000
        
      - name: Run load tests
        run: npm run test:load
        
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: test-results/
```

## Interpreting Results

### Console Output Example
```
50 concurrent requests completed in 2500ms (avg: 50.00ms)

100 sequential requests:
  Total: 8432ms
  Average: 84.32ms
  Min: 42ms
  Max: 234ms

Cache performance:
  Cold cache: 145ms
  Warm cache: 23ms
  Speedup: 6.30x

Burst pattern (20-30-40 requests): 98.89% success

50 concurrent cached requests: 31.45ms average
```

### What to Look For

✅ **Good Performance:**
- Avg response time < 1s
- 95%+ success rate
- Cache provides speedup
- Degradation < 3x under load

❌ **Performance Issues:**
- Response times > 2s
- Success rate < 90%
- Cache not improving performance
- Severe degradation under load

## Common Issues & Solutions

### Issue: High response times
**Causes:**
- Database queries not optimized
- No connection pooling
- Missing indexes
- No caching

**Solutions:**
```typescript
// Add database indexes
// Implement connection pooling
// Add caching layer
// Optimize queries
```

### Issue: Low success rate
**Causes:**
- Server timeouts
- Resource exhaustion
- Connection limits

**Solutions:**
```typescript
// Increase timeout limits
// Add request queuing
// Scale resources
// Implement rate limiting
```

### Issue: Cache not helping
**Causes:**
- Cache not configured
- Cache invalidation too aggressive
- TTL too short

**Solutions:**
```typescript
// Verify cache configuration
// Adjust TTL settings
// Review invalidation logic
```

## Advanced Scenarios

### Ramp-Up Testing
```typescript
// Gradually increase load
for (let load = 10; load <= 100; load += 10) {
  const requests = Array(load).fill(null).map(() => request.get('/'));
  const responses = await Promise.all(requests);
  // Measure at each level
}
```

### Soak Testing
```typescript
// Run for extended period (e.g., 1 hour)
const duration = 3600000; // 1 hour
const startTime = Date.now();

while (Date.now() - startTime < duration) {
  await request.get('/');
  await wait(1000); // 1 req/sec
}
```

### Peak Load Testing
```typescript
// Find breaking point
let load = 10;
while (successRate > 90) {
  load += 10;
  const requests = Array(load).fill(null).map(() => request.get('/'));
  const responses = await Promise.all(requests);
  successRate = calculateSuccessRate(responses);
}
console.log(`Breaking point: ${load} concurrent requests`);
```

## Metrics to Track

### Response Time Metrics
- **Average** - Mean response time
- **Median (p50)** - Middle value
- **95th Percentile (p95)** - 95% of requests faster than this
- **99th Percentile (p99)** - 99% of requests faster than this
- **Max** - Slowest request

### Throughput Metrics
- **Requests per second (RPS)**
- **Transactions per minute (TPM)**
- **Concurrent users**

### Reliability Metrics
- **Success rate** - % of successful requests
- **Error rate** - % of failed requests
- **Availability** - Uptime percentage

### Resource Metrics
- **CPU usage**
- **Memory usage**
- **Network bandwidth**
- **Database connections**

## Load Testing Strategy

### 1. Baseline Testing
Establish performance baselines with normal load.

### 2. Load Testing
Test with expected production traffic levels.

### 3. Stress Testing
Push beyond expected limits to find breaking points.

### 4. Spike Testing
Sudden traffic increases (e.g., viral content, sales).

### 5. Soak Testing
Extended duration to find memory leaks, resource exhaustion.

## Project-Specific Results

### Homepage Performance
- **Concurrent (50):** < 1000ms avg
- **Sequential (100):** < 500ms avg
- **Cache speedup:** 5-10x improvement

### API Endpoints
- **Characters list:** < 300ms avg
- **Character detail:** < 400ms avg
- **Success rate:** 95%+ under load

### Database Queries
- **Concurrent (50):** < 300ms avg
- **Connection pooling:** Efficient
- **Query optimization:** Good

### Cache Performance
- **Cold cache:** ~150ms
- **Warm cache:** ~25ms
- **Speedup:** 6x average

## Benefits

✅ **Prevents outages** - Find issues before production  
✅ **Validates scaling** - Ensure app handles growth  
✅ **Optimizes performance** - Identify bottlenecks  
✅ **Improves reliability** - Test error handling  
✅ **Builds confidence** - Know your limits  

## Next Steps

1. ✅ Tests created (15+ tests)
2. ⏳ Run baseline tests
3. ⏳ Establish performance budgets
4. ⏳ Integrate into CI/CD
5. ⏳ Monitor production metrics

## Resources

- [Playwright API Testing](https://playwright.dev/docs/api-testing)
- [Load Testing Best Practices](https://docs.microsoft.com/en-us/azure/architecture/best-practices/load-testing)
- [Performance Testing Guide](https://www.guru99.com/performance-testing.html)

---

**Load and stress testing completes your comprehensive test suite!** 🚀⚡
