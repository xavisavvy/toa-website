import { test, expect } from '@playwright/test';

/**
 * Load and Stress Testing
 * 
 * These tests validate API performance under load and concurrent requests.
 * They ensure the application can handle real-world traffic patterns.
 * 
 * Run: npm run test:load
 */

test.describe('Load and Stress Tests', () => {
  test.describe('API Endpoint Load Tests', () => {
    test('handles 50 concurrent homepage requests', async ({ request }) => {
      const requests = Array(50).fill(null).map(() => 
        request.get('/')
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;
      
      // All requests should succeed
      for (const response of responses) {
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
      }
      
      // Average response time should be reasonable
      const avgResponseTime = duration / requests.length;
      expect(avgResponseTime).toBeLessThan(1000); // < 1s average
      
      console.log(`50 concurrent requests completed in ${duration}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
    });

    test('handles 100 sequential API requests', async ({ request }) => {
      const startTime = Date.now();
      let successCount = 0;
      const responseTimes: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        const reqStart = Date.now();
        const response = await request.get('/');
        const reqDuration = Date.now() - reqStart;
        
        responseTimes.push(reqDuration);
        
        if (response.ok()) {
          successCount++;
        }
      }
      
      const totalDuration = Date.now() - startTime;
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      // Success rate should be 100%
      expect(successCount).toBe(100);
      
      // Performance metrics
      expect(avgResponseTime).toBeLessThan(500); // Average < 500ms
      expect(maxResponseTime).toBeLessThan(2000); // Max < 2s
      
      console.log(`100 sequential requests:`);
      console.log(`  Total: ${totalDuration}ms`);
      console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  Min: ${minResponseTime}ms`);
      console.log(`  Max: ${maxResponseTime}ms`);
    });

    test('handles concurrent character page requests', async ({ request }) => {
      const characterIds = [1, 2, 3, 4, 5];
      const requestsPerChar = 10;
      
      const allRequests = characterIds.flatMap(id =>
        Array(requestsPerChar).fill(null).map(() =>
          request.get(`/api/characters/${id}`)
        )
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(allRequests);
      const duration = Date.now() - startTime;
      
      // Check success rate
      const successCount = responses.filter(r => r.ok()).length;
      const successRate = (successCount / responses.length) * 100;
      
      expect(successRate).toBeGreaterThanOrEqual(95); // 95% success rate
      
      console.log(`${allRequests.length} concurrent character requests:`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Success rate: ${successRate.toFixed(2)}%`);
    });
  });

  test.describe('Database Query Load Tests', () => {
    test('handles multiple concurrent database queries', async ({ request }) => {
      const queries = [
        '/api/characters',
        '/api/characters/1',
        '/api/characters/2',
        '/api/characters',
        '/api/characters/3',
      ];
      
      const iterations = 10;
      const allRequests = Array(iterations).fill(null).flatMap(() =>
        queries.map(path => request.get(path))
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(allRequests);
      const duration = Date.now() - startTime;
      
      const successCount = responses.filter(r => r.ok()).length;
      expect(successCount).toBe(allRequests.length);
      
      // Should handle all requests efficiently
      const avgTime = duration / allRequests.length;
      expect(avgTime).toBeLessThan(300); // < 300ms average
      
      console.log(`${allRequests.length} database queries:`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Average: ${avgTime.toFixed(2)}ms per query`);
    });
  });

  test.describe('Cache Performance Tests', () => {
    test('validates cache effectiveness', async ({ request }) => {
      const endpoint = '/api/characters';
      
      // First request (cold cache)
      const coldStart = Date.now();
      const firstResponse = await request.get(endpoint);
      const coldDuration = Date.now() - coldStart;
      
      expect(firstResponse.ok()).toBeTruthy();
      
      // Second request (warm cache)
      const warmStart = Date.now();
      const secondResponse = await request.get(endpoint);
      const warmDuration = Date.now() - warmStart;
      
      expect(secondResponse.ok()).toBeTruthy();
      
      // Cached response should be faster or similar
      console.log(`Cache performance:`);
      console.log(`  Cold cache: ${coldDuration}ms`);
      console.log(`  Warm cache: ${warmDuration}ms`);
      console.log(`  Speedup: ${(coldDuration / warmDuration).toFixed(2)}x`);
      
      // Warm cache should be at least as fast
      expect(warmDuration).toBeLessThanOrEqual(coldDuration * 1.5);
    });

    test('handles cache under concurrent load', async ({ request }) => {
      const endpoint = '/api/characters';
      
      // Warm up cache
      await request.get(endpoint);
      
      // Hit cache with concurrent requests
      const concurrentRequests = Array(50).fill(null).map(() =>
        request.get(endpoint)
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const duration = Date.now() - startTime;
      
      // All should succeed
      expect(responses.every(r => r.ok())).toBeTruthy();
      
      // Cached responses should be fast
      const avgTime = duration / concurrentRequests.length;
      expect(avgTime).toBeLessThan(200); // < 200ms with cache
      
      console.log(`50 concurrent cached requests: ${avgTime.toFixed(2)}ms average`);
    });
  });

  test.describe('Stress Test Scenarios', () => {
    test('handles burst traffic pattern', async ({ request }) => {
      // Simulate burst: 20 requests, pause, 30 requests, pause, 40 requests
      const burst1 = Array(20).fill(null).map(() => request.get('/'));
      const responses1 = await Promise.all(burst1);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const burst2 = Array(30).fill(null).map(() => request.get('/api/characters'));
      const responses2 = await Promise.all(burst2);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const burst3 = Array(40).fill(null).map(() => request.get('/'));
      const responses3 = await Promise.all(burst3);
      
      // All bursts should handle successfully
      const allResponses = [...responses1, ...responses2, ...responses3];
      const successRate = allResponses.filter(r => r.ok()).length / allResponses.length * 100;
      
      expect(successRate).toBeGreaterThanOrEqual(98); // 98% success rate
      
      console.log(`Burst pattern (20-30-40 requests): ${successRate.toFixed(2)}% success`);
    });

    test('handles sustained load over time', async ({ request }) => {
      const duration = 10000; // 10 seconds
      const requestsPerSecond = 5;
      const interval = 1000 / requestsPerSecond;
      
      const startTime = Date.now();
      const responses: any[] = [];
      
      while (Date.now() - startTime < duration) {
        const response = await request.get('/');
        responses.push(response);
        
        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      
      const totalDuration = Date.now() - startTime;
      const successCount = responses.filter(r => r.ok()).length;
      const successRate = (successCount / responses.length) * 100;
      
      // Should maintain high success rate
      expect(successRate).toBeGreaterThanOrEqual(95);
      
      console.log(`Sustained load (${totalDuration}ms):`);
      console.log(`  Total requests: ${responses.length}`);
      console.log(`  Success rate: ${successRate.toFixed(2)}%`);
      console.log(`  Requests/sec: ${(responses.length / (totalDuration / 1000)).toFixed(2)}`);
    });
  });

  test.describe('Error Handling Under Load', () => {
    test('handles 404 requests gracefully under load', async ({ request }) => {
      const invalidUrls = Array(50).fill(null).map((_, i) =>
        request.get(`/this-does-not-exist-${i}`)
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(invalidUrls);
      const duration = Date.now() - startTime;
      
      // Should return 404 quickly for all
      for (const response of responses) {
        expect(response.status()).toBe(404);
      }
      
      // Should handle errors efficiently
      const avgTime = duration / invalidUrls.length;
      expect(avgTime).toBeLessThan(100); // < 100ms average for 404s
      
      console.log(`50 concurrent 404 requests: ${avgTime.toFixed(2)}ms average`);
    });

    test('recovers from mixed success/failure requests', async ({ request }) => {
      const mixedRequests = [
        ...Array(25).fill(null).map(() => request.get('/')),
        ...Array(25).fill(null).map((_, i) => request.get(`/invalid-${i}`)),
      ];
      
      // Shuffle array
      mixedRequests.sort(() => Math.random() - 0.5);
      
      const startTime = Date.now();
      const responses = await Promise.all(mixedRequests);
      const duration = Date.now() - startTime;
      
      const successCount = responses.filter(r => r.status() === 200).length;
      const errorCount = responses.filter(r => r.status() === 404).length;
      
      expect(successCount).toBe(25);
      expect(errorCount).toBe(25);
      
      console.log(`Mixed requests (25 success, 25 errors): ${duration}ms total`);
    });
  });

  test.describe('Performance Degradation Tests', () => {
    test('response time stays consistent under increasing load', async ({ request }) => {
      const loadLevels = [10, 25, 50, 75];
      const results: { load: number; avgTime: number }[] = [];
      
      for (const load of loadLevels) {
        const requests = Array(load).fill(null).map(() => request.get('/'));
        
        const startTime = Date.now();
        await Promise.all(requests);
        const duration = Date.now() - startTime;
        
        const avgTime = duration / load;
        results.push({ load, avgTime });
      }
      
      console.log('Load scaling:');
      results.forEach(r => {
        console.log(`  ${r.load} requests: ${r.avgTime.toFixed(2)}ms average`);
      });
      
      // Response time shouldn't degrade significantly
      const degradation = results[results.length - 1].avgTime / results[0].avgTime;
      expect(degradation).toBeLessThan(3); // < 3x slowdown at 75 vs 10 requests
    });
  });
});
