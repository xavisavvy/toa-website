import * as fs from 'fs';
import * as path from 'path';

import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';

import { registerRoutes } from '../../server/routes';

describe('Printful Routes', () => {
  let app: express.Application;
  const originalEnv = process.env;
  let fetchMock: any;
  const CACHE_FILE = path.join(process.cwd(), 'server', 'cache', 'printful-products.json');

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      PRINTFUL_API_KEY: 'test_printful_key',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear cache before each test
    try {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
      }
    } catch {
      // Ignore errors
    }
    
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    
    app = express();
    app.use(express.json());
    registerRoutes(app);
  });

  describe('GET /api/printful/products', () => {
    it('should return product list', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 200,
            result: [
              {
                id: 123,
                external_id: 'ext-123',
                name: 'Test T-Shirt',
                variants: 3,
                synced: 3,
                thumbnail_url: 'https://example.com/thumb.jpg',
                is_ignored: false,
              }
            ]
          }),
        })
        // Mock variant fetch for the product
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 200,
            result: {
              sync_product: {
                id: 123,
                name: 'Test T-Shirt',
              },
              sync_variants: [
                {
                  id: 456,
                  external_id: 'ext-456',
                  sync_product_id: 123,
                  name: 'Small - Black',
                  synced: true,
                  variant_id: 789,
                  retail_price: '24.99',
                  currency: 'USD',
                  is_ignored: false,
                  sku: null,
                  product: {
                    variant_id: 789,
                    product_id: 71,
                    image: 'https://example.com/product.jpg',
                    name: 'Bella + Canvas 3001',
                  },
                  files: []
                }
              ]
            }
          }),
        });

      const response = await request(app)
        .get('/api/printful/products')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('price');
        expect(response.body[0]).toHaveProperty('image');
        expect(response.body[0]).toHaveProperty('url');
      }
    });

    it('should handle API errors gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const response = await request(app)
        .get('/api/printful/products')
        .expect(200); // Returns empty array, not error

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/printful/products/:id', () => {
    it('should return product details', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          result: {
            sync_product: {
              id: 123,
              external_id: 'ext-123',
              name: 'Test T-Shirt',
              thumbnail_url: 'https://example.com/thumb.jpg',
            },
            sync_variants: [
              {
                id: 456,
                external_id: 'ext-456',
                sync_product_id: 123,
                name: 'Small - Black',
                synced: true,
                variant_id: 789,
                retail_price: '24.99',
                currency: 'USD',
                is_ignored: false,
                sku: null,
                product: {
                  variant_id: 789,
                  product_id: 71,
                  image: 'https://example.com/product.jpg',
                  name: 'Bella + Canvas 3001',
                },
                files: []
              }
            ]
          }
        }),
      });

      const response = await request(app)
        .get('/api/printful/products/123')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('variants');
      expect(response.body.variants).toBeInstanceOf(Array);
    });

    it('should validate product ID format', async () => {
      const response = await request(app)
        .get('/api/printful/products/invalid$id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid product ID format');
    });

    it('should return 404 for non-existent product', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const response = await request(app)
        .get('/api/printful/products/999999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
