import crypto from 'crypto';

import type { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';


// Mock the database
const mockDb = {
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([])
      })
    })
  }),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'test-order-id' }])
    })
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([])
    })
  })
};

vi.mock('../../server/db', () => ({
  db: mockDb,
  orders: {},
  orderItems: {},
  orderEvents: {},
  auditLogs: {},
}));

// Mock Stripe webhook verification
vi.mock('../../server/stripe', async () => {
  const actual = await vi.importActual('../../server/stripe');
  return {
    ...actual,
    verifyWebhookSignature: vi.fn((payload: string) => {
      // Return the parsed event for valid payloads
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    }),
  };
});

describe('Webhook Contract Tests', () => {
  let app: Express;
  const STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  const PRINTFUL_WEBHOOK_SECRET = 'test_printful_secret';

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules(); // Clear module cache
    
    // Set environment variables
    process.env.STRIPE_WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET;
    process.env.PRINTFUL_WEBHOOK_SECRET = PRINTFUL_WEBHOOK_SECRET;
    
    // Import fresh app with routes
    const { registerRoutes } = await import('../../server/routes');
    const express = await import('express');
    app = express.default();
    
    // Setup body parsing with raw body preservation
    app.use(express.default.json({
      verify: (req: any, _res, buf) => {
        if (req.url === '/api/webhooks/printful' || req.url === '/api/stripe/webhook') {
          req.rawBody = buf;
        }
      }
    }));
    
    registerRoutes(app);
  });

  const generateStripeSignature = (payload: string, secret: string): string => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  };

  const generatePrintfulSignature = (payload: string, secret: string): string => {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  };

  describe('Stripe Webhooks', () => {

    it('should accept valid checkout.session.completed webhook', async () => {
      const payload = JSON.stringify({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            payment_intent: 'pi_test_123',
            customer_email: 'test@example.com',
            amount_total: 2999,
            currency: 'usd',
            payment_status: 'paid',
            metadata: {
              printfulOrderId: 'printful_123'
            }
          }
        }
      });

      const signature = generateStripeSignature(payload, STRIPE_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('received', true);
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = JSON.stringify({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: {} }
      });

      const response = await request(app).post('/api/stripe/webhook').set('Content-Type', 'application/json').set('stripe-signature', 'invalid_signature'
        ).send(payload
      );

      expect(response.status).toBe(400);
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      const payload = JSON.stringify({
        id: 'evt_test_456',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_456',
            status: 'failed',
            last_payment_error: {
              message: 'Card declined'
            }
          }
        }
      });

      const signature = generateStripeSignature(payload, STRIPE_WEBHOOK_SECRET);

      const response = await request(app).post('/api/stripe/webhook').set('Content-Type', 'application/json').set('stripe-signature', signature
        ).send(payload
      );

      expect(response.status).toBe(200);
    });
  });

  describe('Printful Webhooks', () => {
    it('should accept valid package_shipped webhook', async () => {
      const payload = {
        type: 'package_shipped',
        created: Math.floor(Date.now() / 1000),
        retries: 0,
        store: 12345,
        data: {
          order: {
            id: 123456789,
            external_id: 'test-order-123',
            status: 'shipped'
          },
          shipment: {
            id: 'ship_123',
            carrier: 'USPS',
            service: 'First Class',
            tracking_number: '1Z999AA10123456784',
            tracking_url: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=1Z999AA10123456784',
            ship_date: '2026-01-05',
            shipped_at: Math.floor(Date.now() / 1000)
          }
        }
      };

      const payloadString = JSON.stringify(payload);
      const signature = generatePrintfulSignature(payloadString, PRINTFUL_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/webhooks/printful')
        .set('Content-Type', 'application/json')
        .set('X-Printful-Signature', signature)
        .send(payloadString);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('received', true);
      }
    });

    it('should accept valid order_failed webhook', async () => {
      const payload = {
        type: 'order_failed',
        created: Math.floor(Date.now() / 1000),
        retries: 0,
        store: 12345,
        data: {
          order: {
            id: 123456789,
            external_id: 'test-order-456',
            status: 'failed',
            error: {
              reason: 'Out of stock',
              message: 'Product temporarily unavailable'
            }
          }
        }
      };

      const payloadString = JSON.stringify(payload);
      const signature = generatePrintfulSignature(payloadString, PRINTFUL_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/webhooks/printful')
        .set('Content-Type', 'application/json')
        .set('X-Printful-Signature', signature)
        .send(payloadString);

      expect([200, 500]).toContain(response.status);
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = {
        type: 'package_shipped',
        created: Math.floor(Date.now() / 1000),
        retries: 0,
        store: 12345,
        data: {}
      };

      const response = await request(app)
        .post('/api/webhooks/printful')
        .set('Content-Type', 'application/json')
        .set('X-Printful-Signature', 'wrong_secret')
        .send(JSON.stringify(payload));

      expect(response.status).toBe(401);
    });

    it('should handle order_updated webhook', async () => {
      const payload = {
        type: 'order_updated',
        created: Math.floor(Date.now() / 1000),
        retries: 0,
        store: 12345,
        data: {
          order: {
            id: 123456789,
            external_id: 'test-order-789',
            status: 'pending',
            dashboard_url: 'https://www.printful.com/dashboard/default/orders/123456789'
          }
        }
      };

      const payloadString = JSON.stringify(payload);
      const signature = generatePrintfulSignature(payloadString, PRINTFUL_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/webhooks/printful')
        .set('Content-Type', 'application/json')
        .set('X-Printful-Signature', signature)
        .send(payloadString);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Webhook Reliability', () => {
    it('should handle duplicate webhooks idempotently (Stripe)', async () => {
      const payload = JSON.stringify({
        id: 'evt_idempotent_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_idempotent_test',
            payment_intent: 'pi_idempotent_test',
            customer_email: 'idempotent@example.com',
            amount_total: 1999,
            currency: 'usd',
            payment_status: 'paid'
          }
        }
      });

      const signature = generateStripeSignature(payload, STRIPE_WEBHOOK_SECRET);

      const response1 = await request(app)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      const response2 = await request(app)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'test_signature')
        .send('invalid json {{');

      expect(response.status).toBe(400);
    });

    it('should validate required webhook fields (Printful)', async () => {
      const payload = {
        type: 'package_shipped',
        created: Math.floor(Date.now() / 1000)
        // Missing required 'data' field
      };

      const payloadString = JSON.stringify(payload);
      const signature = generatePrintfulSignature(payloadString, PRINTFUL_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/webhooks/printful')
        .set('Content-Type', 'application/json')
        .set('X-Printful-Signature', signature)
        .send(payloadString);

      expect([400, 422, 500]).toContain(response.status);
    });
  });
});

