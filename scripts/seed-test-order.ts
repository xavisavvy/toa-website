import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { orders, orderItems } from '../shared/schema';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seedTestOrder() {
  console.log('🌱 Seeding test order...');

  const testOrderId = 'test-order-12345678';
  const testEmail = 'test@talesofaneria.com';

  try {
    // Create test order
    const [order] = await db.insert(orders).values({
      id: testOrderId,
      stripeSessionId: 'cs_test_mock_session_123456789',
      stripePaymentIntentId: 'pi_test_mock_payment_123456789',
      printfulOrderId: '12345678',
      status: 'processing',
      customerEmail: testEmail,
      customerName: 'Test Customer',
      totalAmount: '99.99',
      currency: 'usd',
      shippingAddress: {
        name: 'Test Customer',
        line1: '123 Adventure Lane',
        line2: 'Apt 42',
        city: 'Aneria City',
        state: 'CA',
        postal_code: '90210',
        country: 'US',
      },
      metadata: {
        test: true,
        source: 'seed-script',
      },
    }).returning();

    console.log('✅ Created test order:', order.id);

    // Create test order items
    const items = await db.insert(orderItems).values([
      {
        orderId: testOrderId,
        printfulProductId: '123',
        printfulVariantId: '456',
        name: 'Tales of Aneria T-Shirt (L, Black)',
        quantity: 2,
        price: '29.99',
        imageUrl: 'https://files.cdn.printful.com/o/upload/bfl-image/88/8819_l_mock.png',
        metadata: {
          size: 'L',
          color: 'Black',
        },
      },
      {
        orderId: testOrderId,
        printfulProductId: '789',
        printfulVariantId: '012',
        name: 'Tales of Aneria Mug',
        quantity: 1,
        price: '19.99',
        imageUrl: 'https://files.cdn.printful.com/o/upload/bfl-image/28/289_l_front.png',
        metadata: {
          color: 'White',
        },
      },
      {
        orderId: testOrderId,
        printfulProductId: '345',
        printfulVariantId: '678',
        name: 'Tales of Aneria Poster (24x36)',
        quantity: 1,
        price: '20.02',
        imageUrl: 'https://files.cdn.printful.com/o/upload/bfl-image/b2/b292_l_mock.png',
        metadata: {
          size: '24x36',
        },
      },
    ]).returning();

    console.log(`✅ Created ${items.length} test order items`);

    console.log('\n📦 Test Order Details:');
    console.log('━'.repeat(50));
    console.log(`Order ID: ${testOrderId}`);
    console.log(`Email: ${testEmail}`);
    console.log(`Status: ${order.status}`);
    console.log(`Total: $${order.totalAmount} ${order.currency.toUpperCase()}`);
    console.log('━'.repeat(50));
    console.log('\n🧪 To test the order tracking page:');
    console.log(`1. Go to: http://localhost:5000/track-order`);
    console.log(`2. Enter email: ${testEmail}`);
    console.log(`3. Enter order ID: ${testOrderId}`);
    console.log('\n✨ Done!\n');

  } catch (error) {
    console.error('❌ Error seeding test order:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedTestOrder();
