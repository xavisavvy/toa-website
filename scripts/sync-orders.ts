/**
 * Order Synchronization Script
 * 
 * Pulls missing Stripe payments and Printful orders into the database.
 * Useful for:
 * - Seeding development database with real data
 * - Recovering from webhook failures
 * - Disaster recovery scenarios with data drift
 * 
 * Usage:
 *   npm run sync:orders [--days=30] [--dry-run]
 */

import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

import { db } from '../server/db';
import { orders, orderItems } from '../server/db/schema';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  process.exit(1);
}

if (!PRINTFUL_API_KEY) {
  console.error('❌ PRINTFUL_API_KEY not found in environment');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

interface SyncStats {
  stripeSessionsChecked: number;
  stripeSessionsAdded: number;
  stripeSessionsSkipped: number;
  printfulOrdersChecked: number;
  printfulOrdersUpdated: number;
  printfulItemsAdded: number;
  errors: string[];
}

interface PrintfulOrder {
  id: string;
  status: string;
  recipient: {
    email: string;
    name: string;
    address1: string;
    city: string;
    state_code: string;
    zip: string;
    country_code: string;
  };
  items: Array<{
    id: number;
    variant_id: number;
    quantity: number;
    name: string;
    retail_price: string;
    files: Array<{
      preview_url?: string;
    }>;
  }>;
  costs: {
    total: string;
    currency: string;
  };
  created: number;
  updated: number;
}

async function fetchPrintfulOrder(orderId: string): Promise<PrintfulOrder | null> {
  try {
    const response = await fetch(`https://api.printful.com/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Printful API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(`❌ Error fetching Printful order ${orderId}:`, error);
    return null;
  }
}

async function syncStripePayments(days: number, dryRun: boolean, stats: SyncStats): Promise<void> {
  console.info(`\n🔍 Syncing Stripe payments from last ${days} days...`);
  
  const startDate = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
  
  const sessions = await stripe.checkout.sessions.list({
    created: { gte: startDate },
    limit: 100,
  });

  for (const session of sessions.data) {
    stats.stripeSessionsChecked++;

    if (session.payment_status !== 'paid') {
      stats.stripeSessionsSkipped++;
      continue;
    }

    // Check if order already exists
    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.stripeSessionId, session.id))
      .limit(1);

    if (existingOrder.length > 0) {
      console.info(`⏭️  Skipping existing order: ${session.id}`);
      stats.stripeSessionsSkipped++;
      continue;
    }

    const metadata = session.metadata || {};
    const shippingDetails = session.shipping_details;

    if (dryRun) {
      console.info(`[DRY RUN] Would add order: ${session.id}`);
      stats.stripeSessionsAdded++;
      continue;
    }

    try {
      await db.insert(orders).values({
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string || null,
        printfulOrderId: metadata.printfulOrderId || null,
        status: 'processing',
        customerEmail: session.customer_details?.email || session.customer_email || '',
        customerName: session.customer_details?.name || shippingDetails?.name || '',
        totalAmount: (session.amount_total || 0) / 100,
        currency: session.currency || 'usd',
        shippingAddress: shippingDetails?.address ? {
          name: shippingDetails.name || '',
          line1: shippingDetails.address.line1 || '',
          line2: shippingDetails.address.line2 || '',
          city: shippingDetails.address.city || '',
          state: shippingDetails.address.state || '',
          postal_code: shippingDetails.address.postal_code || '',
          country: shippingDetails.address.country || '',
        } : null,
        metadata: metadata,
      });

      console.info(`✅ Added order from Stripe: ${session.id}`);
      stats.stripeSessionsAdded++;
    } catch (error) {
      const errorMsg = `Failed to insert order ${session.id}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
}

async function syncPrintfulOrders(dryRun: boolean, stats: SyncStats): Promise<void> {
  console.info(`\n🔍 Syncing Printful orders...`);

  // Get all orders that have a Printful order ID
  const ordersWithPrintful = await db.select()
    .from(orders)
    .where(eq(orders.printfulOrderId, null));

  for (const order of ordersWithPrintful) {
    if (!order.printfulOrderId) {continue;}

    stats.printfulOrdersChecked++;

    const printfulOrder = await fetchPrintfulOrder(order.printfulOrderId);
    
    if (!printfulOrder) {
      const errorMsg = `Printful order not found: ${order.printfulOrderId}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
      continue;
    }

    // Map Printful status to our status
    const statusMap: Record<string, string> = {
      'draft': 'processing',
      'pending': 'processing',
      'failed': 'failed',
      'canceled': 'cancelled',
      'onhold': 'processing',
      'inprocess': 'processing',
      'partial': 'shipped',
      'fulfilled': 'delivered',
    };

    const newStatus = statusMap[printfulOrder.status] || 'processing';

    if (dryRun) {
      console.info(`[DRY RUN] Would update order ${order.id} status to ${newStatus}`);
      stats.printfulOrdersUpdated++;
      continue;
    }

    // Update order status
    await db.update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    console.info(`✅ Updated order ${order.id} status: ${newStatus}`);
    stats.printfulOrdersUpdated++;

    // Check if order items exist
    const existingItems = await db.select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    if (existingItems.length > 0) {
      console.info(`⏭️  Order items already exist for ${order.id}`);
      continue;
    }

    // Add order items
    for (const item of printfulOrder.items) {
      if (dryRun) {
        console.info(`[DRY RUN] Would add item: ${item.name}`);
        stats.printfulItemsAdded++;
        continue;
      }

      await db.insert(orderItems).values({
        orderId: order.id,
        printfulItemId: item.id.toString(),
        variantId: item.variant_id.toString(),
        quantity: item.quantity,
        name: item.name,
        price: parseFloat(item.retail_price),
        imageUrl: item.files?.[0]?.preview_url || null,
      });

      stats.printfulItemsAdded++;
    }

    console.info(`✅ Added ${printfulOrder.items.length} items for order ${order.id}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const daysArg = args.find(arg => arg.startsWith('--days='));
  const dryRun = args.includes('--dry-run');
  
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 30;

  console.info('🔄 Order Synchronization Script');
  console.info(`📅 Syncing orders from last ${days} days`);
  if (dryRun) {
    console.info('🔍 DRY RUN MODE - No changes will be made');
  }
  console.info('');

  const stats: SyncStats = {
    stripeSessionsChecked: 0,
    stripeSessionsAdded: 0,
    stripeSessionsSkipped: 0,
    printfulOrdersChecked: 0,
    printfulOrdersUpdated: 0,
    printfulItemsAdded: 0,
    errors: [],
  };

  try {
    await syncStripePayments(days, dryRun, stats);
    await syncPrintfulOrders(dryRun, stats);

    console.info('\n📊 Synchronization Summary:');
    console.info('━'.repeat(50));
    console.info(`Stripe Sessions Checked: ${stats.stripeSessionsChecked}`);
    console.info(`Stripe Sessions Added: ${stats.stripeSessionsAdded}`);
    console.info(`Stripe Sessions Skipped: ${stats.stripeSessionsSkipped}`);
    console.info(`Printful Orders Checked: ${stats.printfulOrdersChecked}`);
    console.info(`Printful Orders Updated: ${stats.printfulOrdersUpdated}`);
    console.info(`Printful Items Added: ${stats.printfulItemsAdded}`);
    console.info(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.error('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.error(`  - ${error}`));
    }

    if (dryRun) {
      console.info('\n🔍 This was a dry run. No changes were made.');
      console.info('   Run without --dry-run to apply changes.');
    }

    process.exit(stats.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
