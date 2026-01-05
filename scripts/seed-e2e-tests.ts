/**
 * E2E Test Database Seeding Script
 * 
 * ⚠️ IMPORTANT: When adding or modifying E2E tests, update this seed script!
 * 
 * This script seeds the database with all data required for E2E tests to run.
 * It should be run before E2E tests in CI/CD and local development.
 * 
 * Required Data Checklist:
 * ✅ Admin user for authentication tests
 * ✅ Sample orders for order tracking tests
 * ✅ Sample audit logs for compliance tests
 * ✅ Multiple order statuses for analytics tests
 * 
 * When E2E tests are modified, verify this script includes:
 * 1. All users referenced in test scenarios
 * 2. All orders with correct statuses
 * 3. All audit log entries that tests query
 * 4. Any products or variants tests interact with
 */

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

const { Client } = pkg;
import { logger } from '../server/logger.js';
import { users, orders, orderItems, auditLogs } from '../shared/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/toa_test';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@talesofaneria.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'testpassword';

async function waitForDatabase(client: typeof Client.prototype, maxRetries = 30, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.connect();
      logger.info('✅ Connected to database');
      return true;
    } catch {
      logger.info(`⏳ Waiting for database... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      if (i < maxRetries - 1) {
        client = new Client({ connectionString: DATABASE_URL });
      }
    }
  }
  throw new Error('Failed to connect to database after maximum retries');
}

async function seedE2EDatabase() {
  logger.info('🌱 Seeding E2E test database...\n');
  
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await waitForDatabase(client);
    const db = drizzle(client);
    
    // ========================================
    // 1. ADMIN USER - Required for admin tests
    // ========================================
    logger.info('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const hashedTestPassword = await bcrypt.hash(TEST_ADMIN_PASSWORD, 12);
    
    // Delete existing admin if present (for clean re-seeding)
    await db.delete(users).where(eq(users.email, ADMIN_EMAIL));
    
    const [adminUser] = await db.insert(users).values({
      email: ADMIN_EMAIL,
      passwordHash: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    logger.info(`✅ Admin user created (ID: ${adminUser.id})`);
    
    // ========================================
    // 2. TEST CUSTOMER - For customer flows
    // ========================================
    logger.info('\n👥 Creating test customer...');
    const testCustomerEmail = 'customer@test.com';
    await db.delete(users).where(eq(users.email, testCustomerEmail));
    
    const [customerUser] = await db.insert(users).values({
      email: testCustomerEmail,
      passwordHash: hashedTestPassword,
      role: 'customer',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    logger.info(`✅ Test customer created (ID: ${customerUser.id})`);
    
    // ========================================
    // 3. TEST ORDERS - Various statuses for analytics
    // ========================================
    logger.info('\n📦 Creating test orders...');
    
    const TEST_CUSTOMER_NAME = 'Test Customer';
    
    const testOrders = [
      {
        stripeSessionId: 'test-order-completed-001',
        printfulOrderId: 'printful_completed_001',
        customerEmail: testCustomerEmail,
        customerName: TEST_CUSTOMER_NAME,
        status: 'completed' as const,
        totalAmount: '49.99',
        currency: 'usd',
        shippingAddress: {
          name: TEST_CUSTOMER_NAME,
          line1: '123 Test St',
          city: 'Test City',
          state: 'CA',
          postal_code: '12345',
          country: 'US',
        },
      },
      {
        stripeSessionId: 'test-order-processing-001',
        printfulOrderId: 'printful_processing_001',
        customerEmail: testCustomerEmail,
        customerName: TEST_CUSTOMER_NAME,
        status: 'processing' as const,
        totalAmount: '29.99',
        currency: 'usd',
        shippingAddress: {
          name: TEST_CUSTOMER_NAME,
          line1: '456 Test Ave',
          city: 'Test Town',
          state: 'NY',
          postal_code: '67890',
          country: 'US',
        },
      },
      {
        stripeSessionId: 'test-order-shipped-001',
        printfulOrderId: 'printful_shipped_001',
        customerEmail: testCustomerEmail,
        customerName: TEST_CUSTOMER_NAME,
        status: 'shipped' as const,
        totalAmount: '39.99',
        currency: 'usd',
        shippingAddress: {
          name: TEST_CUSTOMER_NAME,
          line1: '789 Test Blvd',
          city: 'Test Village',
          state: 'TX',
          postal_code: '11111',
          country: 'US',
        },
      },
      {
        stripeSessionId: 'test-order-pending-001',
        printfulOrderId: null,
        customerEmail: testCustomerEmail,
        customerName: TEST_CUSTOMER_NAME,
        status: 'pending' as const,
        totalAmount: '19.99',
        currency: 'usd',
        shippingAddress: {
          name: TEST_CUSTOMER_NAME,
          line1: '321 Test Ln',
          city: 'Test Hamlet',
          state: 'FL',
          postal_code: '22222',
          country: 'US',
        },
      },
    ];
    
    // Delete existing test orders
    for (const order of testOrders) {
      await db.delete(orders).where(eq(orders.stripeSessionId, order.stripeSessionId));
    }
    
    // Insert orders with items
    for (const orderData of testOrders) {
      const [order] = await db.insert(orders).values({
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      // Add order items
      await db.insert(orderItems).values([
        {
          orderId: order.id,
          printfulProductId: '123',
          printfulVariantId: '456',
          quantity: 1,
          price: orderData.totalAmount,
          name: 'Tales of Aneria T-Shirt',
          imageUrl: '/src/assets/logo-TOA.svg',
        },
      ]);
      
      logger.info(`   ✅ Order ${order.stripeSessionId} (${order.status})`);
    }
    
    // ========================================
    // 4. AUDIT LOGS - For compliance tests
    // ========================================
    logger.info('\n📋 Creating audit log entries...');
    
    const auditEntries = [
      {
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'admin',
        action: 'login',
        resource: 'authentication',
        category: 'authentication',
        severity: 'info' as const,
        status: 'success' as const,
        ipAddress: '127.0.0.1',
        gdprRelevant: 0,
      },
      {
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'admin',
        action: 'failed_login_attempt',
        resource: 'authentication',
        category: 'security',
        severity: 'high' as const,
        status: 'failure' as const,
        ipAddress: '127.0.0.1',
        errorMessage: 'Invalid credentials',
        gdprRelevant: 0,
      },
      {
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'admin',
        action: 'order_view',
        resource: 'order',
        resourceId: 'test-order-completed-001',
        category: 'data_access',
        severity: 'info' as const,
        status: 'success' as const,
        ipAddress: '127.0.0.1',
        gdprRelevant: 1,
      },
      {
        userId: customerUser.id,
        userEmail: customerUser.email,
        userRole: 'customer',
        action: 'data_export',
        resource: 'user_data',
        category: 'compliance',
        severity: 'info' as const,
        status: 'success' as const,
        ipAddress: '127.0.0.1',
        gdprRelevant: 1,
      },
    ];
    
    for (const entry of auditEntries) {
      await db.insert(auditLogs).values({
        ...entry,
        createdAt: new Date(),
      });
      logger.info(`   ✅ ${entry.action} (${entry.category})`);
    }
    
    // ========================================
    // SUMMARY
    // ========================================
    logger.info('\n✅ E2E database seeding complete!\n');
    logger.info('📋 Test credentials:');
    logger.info(`   Admin Email: ${ADMIN_EMAIL}`);
    logger.info(`   Admin Password: ${ADMIN_PASSWORD}`);
    logger.info(`   Customer Email: ${testCustomerEmail}`);
    logger.info(`   Customer Password: ${TEST_ADMIN_PASSWORD}`);
    logger.info('\n📊 Test data summary:');
    logger.info(`   Users: 2 (1 admin, 1 customer)`);
    logger.info(`   Orders: ${testOrders.length}`);
    logger.info(`   Audit Logs: ${auditEntries.length}`);
    logger.info('\n⚠️  Remember to update this script when E2E tests change!\n');
    
  } catch (error) {
    logger.error('❌ Error seeding E2E database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedE2EDatabase();
