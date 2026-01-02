import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

import { registerRoutes } from '../../server/routes';

// Mock environment variables
beforeAll(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.PRINTFUL_API_KEY = 'test_printful_key';
});

// Mock Printful
vi.mock('../../server/printful', () => ({
  getCatalogVariantId: vi.fn(() => Promise.resolve(9876)),
  getSyncVariantFiles: vi.fn(() => Promise.resolve([
    { url: 'https://files.printful.com/mockup-1.jpg' },
    { url: 'https://files.printful.com/mockup-2.jpg' },
  ])),
}));

vi.mock('../../server/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(() => Promise.resolve({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test'
        })),
        retrieve: vi.fn(() => Promise.resolve({
          id: 'cs_test_123',
          shipping_details: {
            name: 'Test Customer',
            address: {
              line1: '123 Test St',
              city: 'TestCity',
              state: 'TS',
              postal_code: '12345',
              country: 'US'
            }
          },
          customer_details: {
            email: 'test@example.com',
            phone: '1234567890'
          },
          metadata: {
            printful_variant_id: '12345'
          }
        }))
      }
    }
  },
  createCheckoutSession: vi.fn(() => Promise.resolve({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test'
  })),
  getCheckoutSession: vi.fn(() => Promise.resolve({
    id: 'cs_test_123',
    shipping_details: {
      name: 'Test Customer',
      address: {
        line1: '123 Test St',
        city: 'TestCity',
        state: 'TS',
        postal_code: '12345',
        country: 'US'
      }
    },
    customer_details: {
      email: 'test@example.com',
      phone: '1234567890'
    },
    metadata: {
      printful_variant_id: '12345'
    }
  })),
  verifyWebhookSignature: vi.fn((_payload, sig) => {
    if (sig === 'invalid_sig') {return null;}
    return {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          amount_total: 2999,
          currency: 'usd',
          customer_details: { email: 'test@example.com' }
        }
      }
    };
  }),
  createPrintfulOrderFromSession: vi.fn(() => ({
    recipient: {
      name: 'Test Customer',
      address1: '123 Test St',
      city: 'TestCity',
      state_code: 'TS',
      country_code: 'US',
      zip: '12345',
      email: 'test@example.com'
    },
    items: [{ variant_id: 12345, quantity: 1 }]
  })),
  createPrintfulOrder: vi.fn(() => Promise.resolve({
    success: true,
    orderId: 98765
  })),
  STRIPE_CONFIG: {
    publishableKey: 'pk_test_123'
  }
}));

describe('Stripe Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.set('trust proxy', 1);
    app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('POST /api/stripe/create-checkout', () => {
    it('should create checkout session with valid product data', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout')
        .send({
          productId: '123',
          variantId: '456',
          productName: 'Test Product',
          price: '29.99',
          quantity: 1
        })
        .expect(200);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('url');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should validate product ID format', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout')
        .send({
          productId: 'invalid',
          variantId: '456',
          productName: 'Test',
          price: '29.99'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate price', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout')
        .send({
          productId: '123',
          variantId: '456',
          productName: 'Test',
          price: 'invalid'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/stripe/webhook', () => {
    it('should process webhook with valid signature', async () => {
      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'valid_sig')
        .send(JSON.stringify({ type: 'checkout.session.completed' }))
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });

    it('should reject webhook with invalid signature', async () => {
      await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'invalid_sig')
        .send(JSON.stringify({ type: 'checkout.session.completed' }))
        .expect(400);
    });

    it('should fetch full session and create Printful order on checkout.session.completed', async () => {
      const { getCheckoutSession, createPrintfulOrder } = await import('../../server/stripe');
      
      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'valid_sig')
        .send(JSON.stringify({ 
          type: 'checkout.session.completed',
          data: { object: { id: 'cs_test_123' } }
        }))
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
      expect(getCheckoutSession).toHaveBeenCalledWith('cs_test_123');
      expect(createPrintfulOrder).toHaveBeenCalled();
    });
  });

  describe('GET /api/stripe/config', () => {
    it('should return publishable key', async () => {
      const response = await request(app)
        .get('/api/stripe/config')
        .expect(200);

      expect(response.body).toHaveProperty('publishableKey');
      expect(response.body.publishableKey).toBe('pk_test_123');
    });
  });
});
