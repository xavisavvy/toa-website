/**
 * Playwright Global Setup
 * Checks if required services are available before running E2E tests
 */

import type { FullConfig } from '@playwright/test';

// eslint-disable-next-line no-unused-vars
function globalSetup(_config: FullConfig) {
  // Check if database is required and available
  const DATABASE_URL = process.env.DATABASE_URL;
  
  // In CI without database, skip E2E tests gracefully
  if (process.env.CI && !DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.log('⚠️  Database not configured in CI - E2E tests will be skipped');
    // eslint-disable-next-line no-console
    console.log('ℹ️  Set DATABASE_URL environment variable to enable E2E tests');
    process.exit(0); // Exit cleanly, don't fail the build
  }
  
  // If DATABASE_URL is set but invalid/unreachable, we'll let tests fail naturally
  // This way developers know something is wrong with their database config
  
  // Optional: Check if webServer can start (basic health check)
  if (process.env.CI) {
    // eslint-disable-next-line no-console
    console.log('✅ Environment checks passed, starting E2E tests...');
  }
}

export default globalSetup;
