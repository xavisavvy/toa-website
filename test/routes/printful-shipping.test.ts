import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, vi } from 'vitest';

import { registerRoutes } from '../../server/routes';

// Mock environment variables
beforeAll(() => {
  process.env.PRINTFUL_API_KEY = 'test_printful_key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
});

// Mock Printful getPrintfulShippingEstimate
vi.mock('../../server/printful', async () => {
  const actual = await vi.importActual('../../server/printful');
  return {
    ...actual,
    getPrintfulShippingEstimate: vi.fn(async (params: {recipient: {zip: string}}) => {
      // Mock successful response
      if (params.recipient.zip === '84015') {
        return {
          shipping: 4.39,
          tax: 0.17,
          retail_costs: {
            subtotal: 3.00,
            discount: 0,
            shipping: 4.39,
            tax: 0.17,
          },
          costs: {
            subtotal: '2.29',
            discount: '0.00',
            shipping: '4.39',
            digitization: '0.00',
            additional_fee: '0.00',
            fulfillment_fee: '0.00',
            tax: '0.00',
            vat: '0.17',
            total: '6.85',
          },
          rates: [{
            id: 'STANDARD',
            name: 'Flat Rate (Estimated delivery: Feb 2)',
            rate: '4.39',
            currency: 'USD',
            min_delivery_days: 5,
            max_delivery_days: 7,
          }],
        };
      }
      return null;
    }),
  };
});

// Mock Stripe
vi.mock('../../server/stripe', async () => {
  const actual = await vi.importActual('../../server/stripe');
  return {
    ...actual,
    createCheckoutSession: vi.fn(async () => {
      return {
        id: 'cs_test_with_shipping_123',
        url: 'https://checkout.stripe.com/test-with-shipping',
      };
    }),
  };
});

describe('Printful Shipping Estimate API', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    registerRoutes(app);
  });

  it('should calculate shipping estimate for valid address', async () => {
    const response = await request(app)
      .post('/api/printful/shipping-estimate')
      .send({
        variantId: '5130270457',
        quantity: 1,
        recipient: {
          address1: '526 E 200 S',
          city: 'Clearfield',
          state_code: 'UT',
          country_code: 'US',
          zip: '84015',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('shipping');
    expect(response.body).toHaveProperty('tax');
    expect(response.body).toHaveProperty('rates');
    
    expect(response.body.shipping).toBe(4.39);
    expect(response.body.tax).toBe(0.17);
    expect(response.body.rates).toHaveLength(1);
    expect(response.body.rates[0].name).toContain('Flat Rate');
  });

  it('should return 400 for missing variantId and items', async () => {
    const response = await request(app)
      .post('/api/printful/shipping-estimate')
      .send({
        quantity: 1,
        recipient: {
          address1: '526 E 200 S',
          city: 'Clearfield',
          state_code: 'UT',
          country_code: 'US',
          zip: '84015',
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required field: variantId or items');
  });

  it('should calculate shipping for multiple items (cart)', async () => {
    const response = await request(app)
      .post('/api/printful/shipping-estimate')
      .send({
        items: [
          { variantId: '5130270457', quantity: 2 },
          { variantId: '5130270458', quantity: 1 },
        ],
        recipient: {
          address1: '526 E 200 S',
          city: 'Clearfield',
          state_code: 'UT',
          country_code: 'US',
          zip: '84015',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('shipping');
    expect(response.body).toHaveProperty('tax');
    expect(response.body).toHaveProperty('rates');
  });

  it('should return 400 for incomplete recipient address', async () => {
    const response = await request(app)
      .post('/api/printful/shipping-estimate')
      .send({
        variantId: '5130270457',
        quantity: 1,
        recipient: {
          city: 'Clearfield',
          // Missing address1, state_code, country_code, zip
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required recipient fields');
  });

  it('should use Printful shipping in Stripe checkout', async () => {
    const response = await request(app)
      .post('/api/stripe/create-checkout')
      .send({
        productId: '123',
        variantId: '5130270457',
        productName: 'Test Sticker',
        price: '3.00',
        quantity: 1,
        shipping: {
          shipping: 4.39,  // From Printful API
          tax: 0.17,       // From Printful API
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('url');
  });
});
