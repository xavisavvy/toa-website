import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { registerRoutes } from '../../server/routes';

vi.mock('../../server/stripe', () => ({
  createCheckoutSession: vi.fn(() => Promise.resolve({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test'
  })),
  handleWebhook: vi.fn(() => Promise.resolve()),
  constructWebhookEvent: vi.fn()
}));

describe.skip('Stripe Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerRoutes(app);
  });

  describe('POST /api/stripe/create-checkout-session', () => {
    it('should create checkout session with valid items', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .send({
          items: [
            { variantId: 1, quantity: 2, price: 29.99, name: 'Test Product' }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('url');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate item quantities', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .send({
          items: [
            { variantId: 1, quantity: 0, price: 29.99, name: 'Test' }
          ]
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle stripe errors', async () => {
      const { createCheckoutSession } = await import('../../server/stripe');
      vi.mocked(createCheckoutSession).mockRejectedValueOnce(new Error('Stripe Error'));

      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .send({
          items: [
            { variantId: 1, quantity: 1, price: 29.99, name: 'Test' }
          ]
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/stripe/webhook', () => {
    it('should process webhook with valid signature', async () => {
      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test_sig')
        .send({ type: 'checkout.session.completed' })
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });
  });
});
