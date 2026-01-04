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

const ECOMMERCE_ENV_VARS: EnvConfig[] = [
  { name: 'PRINTFUL_API_KEY', required: false, description: 'Printful API key for product catalog' },
  { name: 'STRIPE_PUBLISHABLE_KEY', required: false, description: 'Stripe publishable key (client-side)' },
  { name: 'STRIPE_SECRET_KEY', required: false, description: 'Stripe secret key (server-side)' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: false, description: 'Stripe webhook signing secret' },
];

/**
 * Validate Stripe configuration
 * Ensures all Stripe keys are present if any are configured
 */
function validateStripeConfig(): string[] {
  const errors: string[] = [];
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const hasAnyStripeKey = publishableKey || secretKey || webhookSecret;

  if (hasAnyStripeKey) {
    // If any Stripe key is present, all should be present
    if (!publishableKey) {
      errors.push('STRIPE_PUBLISHABLE_KEY is required when Stripe is configured');
    } else if (!publishableKey.startsWith('pk_')) {
      errors.push('STRIPE_PUBLISHABLE_KEY must start with "pk_" (got: ' + publishableKey.substring(0, 5) + '...)');
    }

    /* eslint-disable security/detect-object-injection */
    if (!secretKey) {
      errors.push('STRIPE_SECRET_KEY is required when Stripe is configured');
    } else if (!secretKey.startsWith('sk_')) {
      errors.push('STRIPE_SECRET_KEY must start with "sk_" (got: ' + secretKey.substring(0, 5) + '...)');
    }

    if (!webhookSecret) {
      errors.push('STRIPE_WEBHOOK_SECRET is required when Stripe is configured');
    } else if (!webhookSecret.startsWith('whsec_')) {
      errors.push('STRIPE_WEBHOOK_SECRET must start with "whsec_" (got: ' + webhookSecret.substring(0, 8) + '...)');
    }
    /* eslint-enable security/detect-object-injection */
  }

  return errors;
}

/**
 * Validate Printful configuration
 */
function validatePrintfulConfig(): string[] {
  const errors: string[] = [];
  const apiKey = process.env.PRINTFUL_API_KEY;

  if (apiKey && apiKey.length < 10) {
    errors.push('PRINTFUL_API_KEY appears to be invalid (too short)');
  }

  return errors;
}

export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];
  const configErrors: string[] = [];

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

  // Warn about missing e-commerce keys
  ECOMMERCE_ENV_VARS.forEach(({ name, description }) => {
    const value = process.env[name];
    if (!value) {
      warnings.push(`${name}: ${description}`);
    }
  });

  // Validate Stripe configuration
  const stripeErrors = validateStripeConfig();
  configErrors.push(...stripeErrors);

  // Validate Printful configuration
  const printfulErrors = validatePrintfulConfig();
  configErrors.push(...printfulErrors);

  // Report results
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(msg => console.error(`  - ${msg}`));
    console.error('\nApplication cannot start without these variables.\n');
    process.exit(1);
  }

  if (configErrors.length > 0) {
    console.error('\n❌ Environment configuration errors:');
    configErrors.forEach(msg => console.error(`  - ${msg}`));
    console.error('\nPlease fix these configuration issues.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional environment variables not configured:');
    warnings.forEach(msg => console.warn(`  - ${msg}`));
    console.warn('\nSome features may not work without these variables.\n');
  }

  // Feature availability summary
  const hasStripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY;
  const hasPrintful = process.env.PRINTFUL_API_KEY;
  
  /* eslint-disable no-console */
  console.log('\n📋 Feature Availability:');
  console.log(`  - E-commerce checkout: ${hasStripe ? '✅ Enabled' : '❌ Disabled (Stripe not configured)'}`);
  console.log(`  - Product catalog: ${hasPrintful ? '✅ Enabled' : '❌ Disabled (Printful not configured)'}`);

  console.log('\n✅ Environment validation passed\n');
  /* eslint-enable no-console */
}
