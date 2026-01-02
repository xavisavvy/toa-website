import autocannon from 'autocannon';

import { setupServer } from '../helpers/test-server';

/**
 * Load Testing Script
 * Tests API endpoints under various load conditions
 */

async function runLoadTest(url: string, name: string, duration: number = 10) {
  console.log(`\n🚀 Running load test: ${name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Duration: ${duration}s\n`);

  const result = await autocannon({
    url,
    duration,
    connections: 10,
    pipelining: 1,
    workers: 2,
  });

  console.log(`\n📊 Results for ${name}:`);
  console.log(`   Requests: ${result.requests.total}`);
  console.log(`   Throughput: ${Math.round(result.throughput.mean / 1024)} KB/s`);
  console.log(`   Latency (avg): ${result.latency.mean.toFixed(2)}ms`);
  console.log(`   Latency (p99): ${result.latency.p99.toFixed(2)}ms`);
  console.log(`   Errors: ${result.errors}`);
  console.log(`   Timeouts: ${result.timeouts}`);

  return result;
}

async function main() {
  console.log('🎯 Starting Load Tests...\n');

  const { server } = await setupServer();
  const baseUrl = 'http://localhost:5000';

  try {
    // Test 1: YouTube API endpoint
    const youtubeResult = await runLoadTest(
      `${baseUrl}/api/youtube`,
      'YouTube API',
      10
    );

    // Test 2: Events API endpoint
    const eventsResult = await runLoadTest(
      `${baseUrl}/api/events`,
      'Events API',
      10
    );

    // Test 3: Homepage
    const homepageResult = await runLoadTest(
      baseUrl,
      'Homepage',
      10
    );

    // Test 4: Stress test - High concurrency
    console.log(`\n🔥 Running stress test (high concurrency)...`);
    const stressResult = await autocannon({
      url: `${baseUrl}/api/youtube`,
      duration: 10,
      connections: 100,
      pipelining: 10,
      workers: 4,
    });

    console.log(`\n📊 Stress Test Results:`);
    console.log(`   Requests: ${stressResult.requests.total}`);
    console.log(`   Throughput: ${Math.round(stressResult.throughput.mean / 1024)} KB/s`);
    console.log(`   Latency (avg): ${stressResult.latency.mean.toFixed(2)}ms`);
    console.log(`   Latency (p99): ${stressResult.latency.p99.toFixed(2)}ms`);
    console.log(`   Errors: ${stressResult.errors}`);
    console.log(`   Timeouts: ${stressResult.timeouts}`);

    // Validate performance SLAs
    console.log(`\n✅ Performance SLA Validation:`);
    
    const validateSLA = (name: string, result: any, maxLatencyP99: number) => {
      const passed = result.latency.p99 < maxLatencyP99 && result.errors === 0;
      console.log(`   ${name}: ${passed ? '✅ PASS' : '❌ FAIL'} (p99: ${result.latency.p99.toFixed(2)}ms, max: ${maxLatencyP99}ms)`);
      return passed;
    };

    const youtubeSLA = validateSLA('YouTube API', youtubeResult, 5000);
    const eventsSLA = validateSLA('Events API', eventsResult, 2000);
    const homepageSLA = validateSLA('Homepage', homepageResult, 1000);
    const stressSLA = validateSLA('Stress Test', stressResult, 10000);

    const allPassed = youtubeSLA && eventsSLA && homepageSLA && stressSLA;
    
    console.log(`\n${allPassed ? '✅ All SLAs passed!' : '❌ Some SLAs failed!'}`);
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  } finally {
    server.close();
  }
}

main();
