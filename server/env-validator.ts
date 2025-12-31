/**
 * Environment Variable Validator
 * Validates required environment variables at application startup
 */

interface EnvConfig {
  name: string;
  required: boolean;
  description: string;
}

const SERVER_ENV_VARS: EnvConfig[] = [
  { name: 'NODE_ENV', required: false, description: 'Application environment' },
  { name: 'PORT', required: false, description: 'Server port (default: 5000)' },
  { name: 'ALLOWED_ORIGINS', required: false, description: 'CORS allowed origins' },
];

const OPTIONAL_API_KEYS: EnvConfig[] = [
  { name: 'YOUTUBE_API_KEY', required: false, description: 'YouTube Data API v3 key (server-side)' },
  { name: 'ETSY_API_KEY', required: false, description: 'Etsy API key' },
  { name: 'ETSY_ACCESS_TOKEN', required: false, description: 'Etsy access token' },
  { name: 'REPLIT_CONNECTORS_HOSTNAME', required: false, description: 'Replit connectors hostname' },
  { name: 'REPL_IDENTITY', required: false, description: 'Replit identity token' },
  { name: 'WEB_REPL_RENEWAL', required: false, description: 'Replit deployment renewal token' },
];

export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  SERVER_ENV_VARS.forEach(({ name, required, description }) => {
    const value = process.env[name];
    if (required && !value) {
      missing.push(`${name}: ${description}`);
    }
  });

  // Warn about missing optional API keys
  OPTIONAL_API_KEYS.forEach(({ name, description }) => {
    const value = process.env[name];
    if (!value) {
      warnings.push(`${name}: ${description}`);
    }
  });

  // Report results
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(msg => console.error(`  - ${msg}`));
    console.error('\nApplication cannot start without these variables.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional environment variables not configured:');
    warnings.forEach(msg => console.warn(`  - ${msg}`));
    console.warn('\nSome features may not work without these variables.\n');
  }

  console.log('✅ Environment validation passed');
}
