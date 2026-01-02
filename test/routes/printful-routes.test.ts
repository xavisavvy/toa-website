import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { registerRoutes } from '../../server/routes';

vi.mock('../../server/printful', () => ({
  getStoreProducts: vi.fn(() => Promise.resolve([
    {
      id: 1,
      name: 'Test Product',
      price: 29.99,
      currency: 'USD',
      image: 'https://example.com/product.jpg',
      description: 'Test description',
      variants: []
    }
  ])),
  getSyncProductById: vi.fn(() => Promise.resolve({
    id: 1,
    name: 'Test Product',
    price: 29.99,
    currency: 'USD',
    image: 'https://example.com/product.jpg',
    description: 'Test description',
    variants: [
      { id: 1, name: 'Small', price: 29.99, available: true }
    ]
  }))
}));

describe.skip('Printful Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerRoutes(app);
  });

  describe('GET /api/printful/products', () => {
    it('should return product list', async () => {
      const response = await request(app)
        .get('/api/printful/products')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
    });

    it('should handle errors gracefully', async () => {
      const { getStoreProducts } = await import('../../server/printful');
      vi.mocked(getStoreProducts).mockRejectedValueOnce(new Error('API Error'));

      const response = await request(app)
        .get('/api/printful/products')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/printful/products/:id', () => {
    it('should return product details', async () => {
      const response = await request(app)
        .get('/api/printful/products/1')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('variants');
    });

    it('should validate product ID', async () => {
      const response = await request(app)
        .get('/api/printful/products/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
