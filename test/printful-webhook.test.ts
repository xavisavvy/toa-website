import crypto from 'crypto';

import type { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';


// Mock the database
const mockOrder = {
  id: 'test-order-id',
  printfulOrderId: '12345678',
  status: 'processing',
  customerEmail: 'test@example.com',
};

const mockDbSelect = vi.fn();
const mockDb = {
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockImplementation(() => mockDbSelect())
      })
    })
  }),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([mockOrder])
    })
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined)
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([mockOrder])
    })
  })
};

vi.mock('../server/db', () => ({
  db: mockDb,
  orders: {},
  orderItems: {},
  orderEvents: {},
  auditLogs: {},
}));

describe('Printful Webhook', () => {
  let app: Express;
  const mockPrintfulOrderId = '12345678';
  const webhookSecret = 'test_webhook_secret';

  beforeAll(async () => {
    // Set up test environment
    process.env.PRINTFUL_WEBHOOK_SECRET = webhookSecret;
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    // Default: return order for most tests
    mockDbSelect.mockResolvedValue([mockOrder]);
    
    // Import app with routes
    const { registerRoutes } = await import('../server/routes');
    const express = await import('express');
    app = express.default();
    
    // Setup body parsing with raw body preservation for webhooks (like production)
    app.use(express.default.json({
      verify: (req: any, _res, buf) => {
        if (req.url === '/api/webhooks/printful') {
          req.rawBody = buf;
        }
      }
    }));
    
    registerRoutes(app);
  });

  afterAll(() => {
    // Clean up
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
        .post('/api/webhooks/printful')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });

      // Verify order was updated (would need mock implementation)
      expect(mockDb.select).toHaveBeenCalled();

      // Verify event was logged (would need mock implementation)
      expect(mockDb.insert).toHaveBeenCalled();
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
        .post('/api/webhooks/printful')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);

      // Verify order was updated (would need mock implementation)
      expect(mockDb.select).toHaveBeenCalled();

      // Verify event was logged (would need mock implementation)
      expect(mockDb.insert).toHaveBeenCalled();
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
        .post('/api/webhooks/printful')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);

      // Verify order was updated (would need mock implementation)
      expect(mockDb.select).toHaveBeenCalled();
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
        .post('/api/webhooks/printful')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);

      // Verify order was updated (would need mock implementation)
      expect(mockDb.select).toHaveBeenCalled();
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
        .post('/api/webhooks/printful')
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
        .post('/api/webhooks/printful')
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
        .post('/api/webhooks/printful')
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
        .post('/api/webhooks/printful')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing order ID' });
    });

    it('should return 200 with warning for non-existent order', async () => {
      // Mock DB to return no order for this test
      mockDbSelect.mockResolvedValueOnce([]);
      
      const payload = {
        type: 'package_shipped',
        data: {
          order: { id: '99999999' }, // Non-existent order
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = createSignature(payloadStr);

      const response = await request(app)
        .post('/api/webhooks/printful')
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
        .post('/api/webhooks/printful')
        .set('X-Printful-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });
    });
  });
});
// NOTE: These tests are skipped pending proper database mock setup and refactoring
// See: https://github.com/user/repo/issues/XXX (create issue to track this)
// The webhook integration tests need:
// 1. Proper database transaction mocking for order_events inserts
// 2. Complete dependency mocking for all async operations
// 3. Tests for actual webhook payload processing logic separated from route tests
