import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

const { Client } = pkg;
import { logger } from '../server/logger.js';
import { users, orders, orderItems } from '../shared/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://toa_user:toa_password@localhost:5432/toa_dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@talesofaneria.com';
const IS_LOCAL_DATABASE = (() => {
  try {
    return ['localhost', '127.0.0.1', 'postgres'].includes(new URL(DATABASE_URL).hostname);
  } catch {
    return false;
  }
})();
// The well-known fallback password is only acceptable for a local dev database
if (!process.env.ADMIN_PASSWORD && !IS_LOCAL_DATABASE) {
  console.error('❌ ADMIN_PASSWORD must be set when seeding a non-local database');
  process.exit(1);
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

async function waitForDatabase(client: typeof Client.prototype, maxRetries = 30, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.connect();
      logger.info('✅ Connected to database');
      return true;
    } catch (_err) {
      logger.info(`⏳ Waiting for database... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      if (i < maxRetries - 1) {
        // Create new client for retry
        client = new Client({ connectionString: DATABASE_URL });
      }
    }
  }
  throw new Error('Failed to connect to database after maximum retries');
}

async function seedDatabase() {
  logger.info('🌱 Seeding database...\n');
  
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await waitForDatabase(client);
    
    const db = drizzle(client);
    
    // Create admin user
    logger.info('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    
    const existingAdmin = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
    
    if (existingAdmin.length > 0) {
      logger.info('⚠️  Admin user already exists, skipping...');
    } else {
      await db.insert(users).values({
        email: ADMIN_EMAIL,
        passwordHash: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logger.info('✅ Admin user created');
    }
    
    // Create test order
    logger.info('\n📦 Creating test order...');
    const testOrderId = 'test-order-12345678';
    const testEmail = 'test@example.com';
    
    const existingOrder = await db.select().from(orders).where(eq(orders.stripeSessionId, testOrderId)).limit(1);
    
    if (existingOrder.length > 0) {
      logger.info('⚠️  Test order already exists, skipping...');
    } else {
      const [order] = await db.insert(orders).values({
        stripeSessionId: testOrderId,
        printfulOrderId: 'printful_test_123',
        customerEmail: testEmail,
        customerName: 'Test Customer',
        status: 'processing',
        totalAmount: '29.99',
        currency: 'usd',
        shippingAddress: {
          name: 'Test Customer',
          line1: '123 Test St',
          city: 'Test City',
          state: 'CA',
          postal_code: '12345',
          country: 'US',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      await db.insert(orderItems).values([
        {
          orderId: order.id,
          printfulProductId: '123',
          printfulVariantId: '456',
          quantity: 1,
          price: '19.99',
          name: 'Tales of Aneria T-Shirt',
          imageUrl: '/src/assets/logo-TOA.svg',
        },
        {
          orderId: order.id,
          printfulProductId: '789',
          printfulVariantId: '012',
          quantity: 1,
          price: '10.00',
          name: 'Tales of Aneria Mug',
          imageUrl: '/src/assets/logo-TOA.svg',
        },
      ]);
      
      logger.info(`✅ Test order created (ID: ${testOrderId}, Email: ${testEmail})`);
    }
    
    logger.info('\n✅ Database seeding complete!\n');
    logger.info('📋 Test credentials:');
    logger.info(`   Admin Email: ${ADMIN_EMAIL}`);
    logger.info(`   Admin Password: ${process.env.ADMIN_PASSWORD ? '(from ADMIN_PASSWORD)' : ADMIN_PASSWORD}`);
    logger.info(`   Test Order ID: test-order-12345678`);
    logger.info(`   Test Order Email: test@example.com`);
    
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();
