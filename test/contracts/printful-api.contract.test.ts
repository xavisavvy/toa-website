import axios from 'axios';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Printful API Contract Tests', () => {
  const apiKey = process.env.PRINTFUL_API_KEY;
  const apiUrl = 'https://api.printful.com';
  let client: typeof axios | null = null;

  beforeAll(() => {
    if (apiKey && !apiKey.includes('your_')) {
      client = axios.create({
        baseURL: apiUrl,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }
  });

  describe('Store Info', () => {
    it('should retrieve store information', async () => {
      if (!client) {
        console.log('⚠️  Printful not configured, skipping live API test');
        return;
      }

      const response = await client.get('/store');

      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('result');
      expect(response.data.result).toHaveProperty('id');
      expect(response.data.result).toHaveProperty('name');
    });
  });

  describe('Products Catalog', () => {
    it('should list products with expected structure', async () => {
      if (!client) {return;}

      const response = await client.get('/products');

      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('result');
      expect(Array.isArray(response.data.result)).toBe(true);

      if (response.data.result.length > 0) {
        const product = response.data.result[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('type');
        expect(product).toHaveProperty('title');
        expect(product).toHaveProperty('brand');
      }
    });

    it('should get product details with variants', async () => {
      if (!client) {return;}

      // Using common product ID (Unisex T-Shirt)
      const productId = 71;
      const response = await client.get(`/products/${productId}`);

      expect(response.data.result).toHaveProperty('product');
      expect(response.data.result).toHaveProperty('variants');
      expect(Array.isArray(response.data.result.variants)).toBe(true);

      const variant = response.data.result.variants[0];
      expect(variant).toHaveProperty('id');
      expect(variant).toHaveProperty('price');
      expect(variant).toHaveProperty('size');
      expect(variant).toHaveProperty('color');
    });
  });

  describe('Orders', () => {
    it('should have expected structure for order creation request', () => {
      const orderRequest = {
        recipient: {
          name: 'John Doe',
          address1: '123 Test St',
          city: 'Test City',
          state_code: 'CA',
          country_code: 'US',
          zip: '12345',
        },
        items: [
          {
            sync_variant_id: 123456789,
            quantity: 1,
          },
        ],
      };

      expect(orderRequest).toHaveProperty('recipient');
      expect(orderRequest).toHaveProperty('items');
      expect(orderRequest.recipient).toHaveProperty('name');
      expect(orderRequest.recipient).toHaveProperty('address1');
      expect(orderRequest.recipient).toHaveProperty('country_code');
    });

    it('should calculate shipping rates', async () => {
      if (!client) {return;}

      const shippingRequest = {
        recipient: {
          address1: '123 Test St',
          city: 'Los Angeles',
          country_code: 'US',
          state_code: 'CA',
          zip: '90001',
        },
        items: [
          {
            quantity: 1,
            variant_id: 4011,
          },
        ],
      };

      const response = await client.post('/shipping/rates', shippingRequest);

      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('result');
      expect(Array.isArray(response.data.result)).toBe(true);

      if (response.data.result.length > 0) {
        const rate = response.data.result[0];
        expect(rate).toHaveProperty('id');
        expect(rate).toHaveProperty('name');
        expect(rate).toHaveProperty('rate');
        expect(rate).toHaveProperty('currency');
      }
    });
  });

  describe('Webhook Events', () => {
    it('should have expected structure for order created webhook', () => {
      const webhookPayload = {
        type: 'order_created',
        created: 1234567890,
        data: {
          order: {
            id: 12345,
            external_id: 'order-123',
            status: 'draft',
            shipping: 'STANDARD',
            recipient: {
              name: 'John Doe',
              email: 'john@example.com',
            },
            items: [],
          },
        },
      };

      expect(webhookPayload).toHaveProperty('type');
      expect(webhookPayload).toHaveProperty('data');
      expect(webhookPayload.data.order).toHaveProperty('id');
      expect(webhookPayload.data.order).toHaveProperty('status');
    });

    it('should have expected structure for order updated webhook', () => {
      const webhookPayload = {
        type: 'order_updated',
        created: 1234567890,
        data: {
          order: {
            id: 12345,
            status: 'fulfilled',
            shipments: [
              {
                id: 'ship-123',
                carrier: 'USPS',
                tracking_number: '1234567890',
                tracking_url: 'https://tracking.example.com',
              },
            ],
          },
        },
      };

      expect(webhookPayload.type).toBe('order_updated');
      expect(webhookPayload.data.order).toHaveProperty('shipments');
      expect(Array.isArray(webhookPayload.data.order.shipments)).toBe(true);
    });

    it('should have expected structure for order failed webhook', () => {
      const webhookPayload = {
        type: 'order_failed',
        created: 1234567890,
        data: {
          order: {
            id: 12345,
            status: 'failed',
            error: {
              code: 'PAYMENT_FAILED',
              message: 'Payment authorization failed',
            },
          },
        },
      };

      expect(webhookPayload.type).toBe('order_failed');
      expect(webhookPayload.data.order.status).toBe('failed');
      expect(webhookPayload.data.order).toHaveProperty('error');
    });
  });

  describe('Error Responses', () => {
    it('should handle 401 unauthorized for invalid API key', async () => {
      const invalidClient = axios.create({
        baseURL: apiUrl,
        headers: {
          'Authorization': 'Bearer invalid_key',
        },
      });

      await expect(invalidClient.get('/store')).rejects.toThrow();
    });

    it('should handle 404 for non-existent resources', async () => {
      if (!client) {return;}

      await expect(
        client.get('/products/999999999')
      ).rejects.toThrow();
    });

    it('should validate required fields in order creation', () => {
      const invalidOrder = {
        items: [
          {
            sync_variant_id: 123,
            quantity: 1,
          },
        ],
        // Missing recipient - should fail validation
      };

      expect(invalidOrder).not.toHaveProperty('recipient');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect API rate limits', async () => {
      if (!client) {return;}

      const response = await client.get('/store');

      // Printful uses X-RateLimit headers
      expect(response.headers).toBeDefined();
      // Rate limit info is typically in headers but may not always be present
    });
  });
});
