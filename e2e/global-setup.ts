/**
 * Playwright Global Setup
 * Checks if required services are available before running E2E tests
 */

import type { FullConfig } from '@playwright/test';

// eslint-disable-next-line no-unused-vars
function globalSetup(_config: FullConfig) {
  // Check if database is available
  const DATABASE_URL = process.env.DATABASE_URL;
  
  // Log database configuration status
  if (DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.log('✅ DATABASE_URL configured - E2E tests will run with real database');
  } else {
    // eslint-disable-next-line no-console
    console.log('⚠️  DATABASE_URL not configured - some tests may fail');
    // eslint-disable-next-line no-console
    console.log('ℹ️  Run `docker-compose -f docker-compose.test.yml up -d` to start test database');
  }
}

export default globalSetup;
