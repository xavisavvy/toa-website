import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import crypto from 'crypto';
import { db } from '../server/db';
import { orders, orderEvents } from '../shared/schema';
import { eq } from 'drizzle-orm';

describe('Printful Webhook', () => {
  let app: Express;
  let testOrderId: string;
  const mockPrintfulOrderId = '12345678';
  const webhookSecret = 'test_webhook_secret';

  beforeAll(async () => {
    // Set up test environment
    process.env.PRINTFUL_WEBHOOK_SECRET = webhookSecret;

    // Import and set up app (we'll need to refactor routes.ts to export app)
    // For now, this is a placeholder
    app = express();
    
    // Create a test order
    const [testOrder] = await db.insert(orders).values({
      stripeSessionId: 'cs_test_webhook',
      stripePaymentIntentId: 'pi_test_webhook',
      printfulOrderId: mockPrintfulOrderId,
      status: 'processing',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      totalAmount: '29.99',
      currency: 'usd',
      shippingAddress: {
        name: 'Test User',
        line1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postal_code: '12345',
        country: 'US',
      },
    }).returning();

    testOrderId = testOrder.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(orderEvents).where(eq(orderEvents.orderId, testOrderId));
    await db.delete(orders).where(eq(orders.id, testOrderId));
    delete process.env.PRINTFUL_WEBHOOK_SECRET;
  });

  const createSignature = (payload: string): string => {
    return crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
  };

  describe('package_shipped event', () => {
    it('should update order status to shipped and add tracking info', async () => {
      const payload = {
        type: 'package_shipped',
        data: {
          order: {
            id: mockPrintfulOrderId,
          },
          shipment: {
            tracking_number: '1Z999AA10123456784',
            tracking_url: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
            carrier: 'UPS',
            service: 'Ground',
          },
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = createSignature(payloadStr);

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });

      // Verify order was updated
      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(updatedOrder.status).toBe('shipped');
      expect(updatedOrder.metadata).toMatchObject({
        tracking_number: '1Z999AA10123456784',
        tracking_url: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
        carrier: 'UPS',
        service: 'Ground',
      });

      // Verify event was logged
      const events = await db
        .select()
        .from(orderEvents)
        .where(eq(orderEvents.orderId, testOrderId));

      const shippedEvent = events.find(e => e.eventType === 'shipped');
      expect(shippedEvent).toBeDefined();
      expect(shippedEvent?.status).toBe('success');
      expect(shippedEvent?.message).toContain('UPS Ground');
    });
  });

  describe('package_returned event', () => {
    it('should update order status to returned', async () => {
      const payload = {
        type: 'package_returned',
        data: {
          order: {
            id: mockPrintfulOrderId,
          },
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = createSignature(payloadStr);

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);

      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(updatedOrder.status).toBe('returned');

      // Verify event was logged
      const events = await db
        .select()
        .from(orderEvents)
        .where(eq(orderEvents.orderId, testOrderId));

      const returnedEvent = events.find(e => e.eventType === 'returned');
      expect(returnedEvent).toBeDefined();
    });
  });

  describe('order_failed event', () => {
    it('should update order status to failed with reason', async () => {
      const payload = {
        type: 'order_failed',
        data: {
          order: {
            id: mockPrintfulOrderId,
          },
          reason: 'Out of stock',
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = createSignature(payloadStr);

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);

      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(updatedOrder.status).toBe('failed');
      expect(updatedOrder.metadata).toMatchObject({
        failure_reason: 'Out of stock',
      });
    });
  });

  describe('order_canceled event', () => {
    it('should update order status to cancelled', async () => {
      const payload = {
        type: 'order_canceled',
        data: {
          order: {
            id: mockPrintfulOrderId,
          },
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = createSignature(payloadStr);

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);

      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(updatedOrder.status).toBe('cancelled');
    });
  });

  describe('webhook security', () => {
    it('should reject webhook with invalid signature', async () => {
      const payload = {
        type: 'package_shipped',
        data: {
          order: { id: mockPrintfulOrderId },
        },
      };

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('X-Printful-Signature', 'invalid_signature')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(payload));

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid signature' });
    });

    it('should reject webhook with missing signature when secret is set', async () => {
      const payload = {
        type: 'package_shipped',
        data: {
          order: { id: mockPrintfulOrderId },
        },
      };

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(payload));

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Missing signature' });
    });

    it('should accept webhook without signature when secret is not set (dev mode)', async () => {
      const originalSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
      delete process.env.PRINTFUL_WEBHOOK_SECRET;

      const payload = {
        type: 'package_shipped',
        data: {
          order: { id: mockPrintfulOrderId },
          shipment: {
            tracking_number: 'TEST123',
            tracking_url: 'https://example.com/track',
            carrier: 'USPS',
            service: 'First Class',
          },
        },
      };

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(payload));

      expect(response.status).toBe(200);

      // Restore secret
      process.env.PRINTFUL_WEBHOOK_SECRET = originalSecret;
    });
  });

  describe('error handling', () => {
    it('should return 400 for webhook without order ID', async () => {
      const payload = {
        type: 'package_shipped',
        data: {},
      };

      const payloadStr = JSON.stringify(payload);
      const signature = createSignature(payloadStr);

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing order ID' });
    });

    it('should return 200 with warning for non-existent order', async () => {
      const payload = {
        type: 'package_shipped',
        data: {
          order: { id: '99999999' }, // Non-existent order
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = createSignature(payloadStr);

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        received: true,
        warning: 'Order not found',
      });
    });

    it('should handle unknown webhook types gracefully', async () => {
      const payload = {
        type: 'unknown_event_type',
        data: {
          order: { id: mockPrintfulOrderId },
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = createSignature(payloadStr);

      const response = await request(app)
        .post('/api/printful/webhook')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });
    });
  });
});
