/**
 * Script to configure Printful webhook
 * Run with: npx tsx scripts/setup-printful-webhook.ts
 */

const WEBHOOK_URL = process.env.PRINTFUL_WEBHOOK_URL || 'https://talesofaneria.com/api/webhooks/printful';

async function setupPrintfulWebhook() {
  const apiKey = process.env.PRINTFUL_API_KEY;

  if (!apiKey) {
    console.error('❌ PRINTFUL_API_KEY environment variable not set');
    process.exit(1);
  }

  console.info('🔧 Setting up Printful webhook...');
  console.info(`📍 Webhook URL: ${WEBHOOK_URL}`);

  try {
    const response = await fetch('https://api.printful.com/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        types: [
          'package_shipped',      // When order is shipped
          'package_returned',     // When package is returned
          'order_failed',         // When order fails
          'order_canceled',       // When order is canceled
          'product_synced',       // When product sync is complete
          'order_created',        // When order is created in Printful
          'order_updated',        // When order status changes
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to setup webhook:', response.status);
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.info('✅ Webhook configured successfully!');
    console.info(data);
    
    // Also get current webhooks to verify
    const listResponse = await fetch('https://api.printful.com/webhooks', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (listResponse.ok) {
      const webhooks = await listResponse.json();
      console.info('\n📋 Current webhooks:');
      console.info(JSON.stringify(webhooks, null, 2));
    }

  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
    process.exit(1);
  }
}

setupPrintfulWebhook();
