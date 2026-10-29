import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

import { getPrintfulShippingEstimate, getSyncVariantForCheckout } from '../../server/printful';
import { registerRoutes } from '../../server/routes';
import { createCheckoutSession } from '../../server/stripe';

// Mock environment variables
beforeAll(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.PRINTFUL_API_KEY = 'test_printful_key';
});

// Mock Printful
vi.mock('../../server/printful', () => ({
  getCatalogVariantId: vi.fn(() => Promise.resolve(9876)),
  getSyncVariantForCheckout: vi.fn((_productId: string, variantId: string) => Promise.resolve(
    variantId === '456'
      ? { productName: 'Real Product', variantName: 'Black / M', retailPriceCents: 2999, image: 'https://files.printful.com/thumb.jpg' }
      : null
  )),
  getPrintfulShippingEstimate: vi.fn(() => Promise.resolve({ shipping: 4.39, tax: 0.17 })),
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
          payment_status: 'paid',
          url: 'https://checkout.stripe.com/test'
        })),
        retrieve: vi.fn(() => Promise.resolve({
          id: 'cs_test_123',
          payment_status: 'paid',
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
    payment_status: 'paid',
    url: 'https://checkout.stripe.com/test'
  })),
  getCheckoutSession: vi.fn(() => Promise.resolve({
    id: 'cs_test_123',
    payment_status: 'paid',
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
          payment_status: 'paid',
          amount_total: 2999,
          currency: 'usd',
          customer_details: { email: 'test@example.com' }
        }
      }
    };
  }),
  getPaidQuantity: vi.fn(() => 1),
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
    items: [{ sync_variant_id: 12345, quantity: 1 }]
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
          quantity: 1
        })
        .expect(200);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('url');
    });

    it('should charge the server-side price, ignoring client price, name and shipping', async () => {
      vi.mocked(createCheckoutSession).mockClear();

      await request(app)
        .post('/api/stripe/create-checkout')
        .send({
          productId: '123',
          variantId: '456',
          productName: 'Spoofed',
          price: '0.01',
          imageUrl: 'https://evil.example/x.png',
          quantity: 2,
          shipping: { shipping: -30, tax: 0 }
        })
        .expect(200);

      expect(getSyncVariantForCheckout).toHaveBeenCalledWith('123', '456');
      const params = vi.mocked(createCheckoutSession).mock.calls[0][0];
      expect(params.price).toBe(2999);
      expect(params.quantity).toBe(2);
      expect(params.productName).toBe('Real Product - Black / M');
      expect(params.imageUrl).toBe('https://files.printful.com/thumb.jpg');
      expect(params.shippingEstimate).toBeUndefined();
    });

    it('should recompute shipping server-side from a US zip code', async () => {
      vi.mocked(createCheckoutSession).mockClear();

      await request(app)
        .post('/api/stripe/create-checkout')
        .send({ productId: '123', variantId: '456', zipCode: '84015' })
        .expect(200);

      // Printful rejects a recipient whose state_code is the country code
      expect(getPrintfulShippingEstimate).toHaveBeenCalledWith(expect.objectContaining({
        recipient: expect.objectContaining({ state_code: 'NY', country_code: 'US', zip: '84015' }),
      }));
      const params = vi.mocked(createCheckoutSession).mock.calls[0][0];
      expect(params.shippingEstimate).toEqual({ shipping: 4.39, tax: 0.17 });
    });

    it('should reject a variant that does not belong to the product', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout')
        .send({ productId: '123', variantId: '999' })
        .expect(400);

      expect(response.body.error).toContain('not available');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid checkout request');
    });

    it('should validate product ID format', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout')
        .send({
          productId: 'invalid',
          variantId: '456'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it.each([0, 11, 1.5, -1, '2'])('should reject quantity %s', async (quantity) => {
      const response = await request(app)
        .post('/api/stripe/create-checkout')
        .send({ productId: '123', variantId: '456', quantity })
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

    it('should prevent duplicate order creation for the same session', async () => {
      // First webhook - should process
      const firstResponse = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'valid_sig')
        .send(JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: { id: 'cs_test_duplicate_456' } }
        }))
        .expect(200);

      expect(firstResponse.body).toHaveProperty('received', true);
      expect(firstResponse.body).not.toHaveProperty('duplicate');

      // Second webhook - should detect duplicate
      const secondResponse = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'valid_sig')
        .send(JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: { id: 'cs_test_duplicate_456' } }
        }))
        .expect(200);

      expect(secondResponse.body).toHaveProperty('received', true);
      expect(secondResponse.body).toHaveProperty('duplicate', true);
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
