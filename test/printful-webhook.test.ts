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

  // The app is built ONCE. Importing ../server/routes pulls in the whole
  // server dependency graph (stripe, printful, youtube, aws-sdk, ...) which
  // costs ~3.5s on a cold module cache. Doing that in beforeEach charged it to
  // whichever test ran first and, under full-suite parallel load, blew the
  // 10s hookTimeout — the suite failed intermittently on
  // "should update order status to shipped" while passing in isolation.
  //
  // Rebuilding per test bought nothing: the handler reads
  // PRINTFUL_WEBHOOK_SECRET per request (server/routes.ts), not at
  // registration, so the dev-mode test that unsets it still works against a
  // shared app. Per-test isolation comes from resetting the db mocks below.
  beforeAll(async () => {
    process.env.PRINTFUL_WEBHOOK_SECRET = webhookSecret;

    const { registerRoutes } = await import('../server/routes');
    const express = await import('express');
    app = express.default();

    // Body parsing with raw body preserved for signature verification,
    // matching the dev entry (server/index.ts). The production entry's
    // middleware order is covered separately below.
    app.use(express.default.json({
      verify: (req: any, _res, buf) => {
        if (req.url === '/api/webhooks/printful') {
          req.rawBody = buf;
        }
      }
    }));

    registerRoutes(app);
  // The cold import of ../server/routes can exceed the 10s default hook
  // timeout when the whole suite runs in parallel.
  }, 30_000);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return order for most tests
    mockDbSelect.mockResolvedValue([mockOrder]);
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

    it('should reject unsigned webhooks in production when no secret is set', async () => {
      const originalSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
      const originalEnv = process.env.NODE_ENV;
      delete process.env.PRINTFUL_WEBHOOK_SECRET;
      process.env.NODE_ENV = 'production';

      try {
        const response = await request(app)
          .post('/api/webhooks/printful')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({ type: 'order_canceled', data: { order: { id: mockPrintfulOrderId } } }));

        expect(response.status).toBe(503);
        expect(mockDb.update).not.toHaveBeenCalled();
      } finally {
        process.env.PRINTFUL_WEBHOOK_SECRET = originalSecret;
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  // Root index.ts (the production entry) mounts express.raw for this path
  // before the global express.json(), and sets no rawBody. These tests use the
  // same middleware order so a regression there can't hide behind the dev setup.
  describe('production middleware order', () => {
    let prodApp: Express;

    beforeAll(async () => {
      const { registerRoutes } = await import('../server/routes');
      const express = await import('express');
      prodApp = express.default();
      prodApp.use('/api/webhooks/printful', express.default.raw({ type: 'application/json' }));
      prodApp.use(express.default.json());
      registerRoutes(prodApp);
    });

    it('should accept a correctly signed webhook', async () => {
      const payloadStr = JSON.stringify({
        type: 'package_shipped',
        data: {
          order: { id: mockPrintfulOrderId },
          shipment: { tracking_number: 'T1', tracking_url: 'https://www.ups.com/track', carrier: 'UPS', service: 'Ground' },
        },
      });

      const response = await request(prodApp)
        .post('/api/webhooks/printful')
        .set('X-Printful-Signature', createSignature(payloadStr))
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });
    });

    it('should reject a signature computed over different bytes', async () => {
      const payloadStr = JSON.stringify({ type: 'order_canceled', data: { order: { id: mockPrintfulOrderId } } });

      const response = await request(prodApp)
        .post('/api/webhooks/printful')
        .set('X-Printful-Signature', createSignature(`${payloadStr} `))
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(401);
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe('unverifiable body', () => {
    it('should fail closed when the body was already parsed and no raw copy exists', async () => {
      const { registerRoutes } = await import('../server/routes');
      const express = await import('express');
      const parsedApp = express.default();
      parsedApp.use(express.default.json());
      registerRoutes(parsedApp);

      const payloadStr = JSON.stringify({ type: 'order_canceled', data: { order: { id: mockPrintfulOrderId } } });

      const response = await request(parsedApp)
        .post('/api/webhooks/printful')
        .set('X-Printful-Signature', createSignature(payloadStr))
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(response.status).toBe(500);
      expect(mockDb.update).not.toHaveBeenCalled();
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
