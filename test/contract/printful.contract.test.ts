/* eslint-disable no-undef */
import * as fs from 'fs';
import * as path from 'path';

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

import { 
  getPrintfulSyncProducts,
  getPrintfulProductDetails,
  getCatalogVariantId
} from '../../server/printful';

/**
 * Contract Tests for Printful API Integration
 * Validates that our Printful integration adheres to expected API contracts
 */

describe('Printful API Contract Tests', () => {
  const originalEnv = process.env;
  const CACHE_FILE = path.join(process.cwd(), 'server', 'cache', 'printful-products.json');

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      PRINTFUL_API_KEY: 'test_printful_contract_key',
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
  });

  describe('Sync Products API Contract', () => {
    it('should return products with required fields', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 200,
            result: [
              {
                id: 123,
                external_id: 'ext-123',
                name: 'Test Product',
                variants: 3,
                synced: 3,
                thumbnail_url: 'https://example.com/thumb.jpg',
                is_ignored: false,
              }
            ]
          }),
        } as Response)
        // Product details fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 200,
            result: {
              sync_product: {
                id: 123,
                external_id: 'ext-123',
                name: 'Test Product',
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
        } as Response);

      const products = await getPrintfulSyncProducts(10);

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      
      if (products.length > 0) {
        const product = products[0];
        // Required fields per contract
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('image');
        expect(product).toHaveProperty('url');
        expect(product).toHaveProperty('inStock');
        
        // Type validations
        expect(typeof product.id).toBe('string');
        expect(typeof product.name).toBe('string');
        expect(typeof product.price).toBe('string');
        expect(typeof product.image).toBe('string');
        expect(typeof product.url).toBe('string');
        expect(typeof product.inStock).toBe('boolean');
      }
    });

    it('should handle empty product list', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 200,
          result: []
        }),
      } as Response);

      const products = await getPrintfulSyncProducts();

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);

      const products = await getPrintfulSyncProducts();

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      // Should return empty array on error, not throw
    });

    it('should respect limit parameter', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 200,
            result: Array(50).fill(null).map((_, i) => ({
              id: i,
              external_id: `ext-${i}`,
              name: `Product ${i}`,
              variants: 1,
              synced: 1,
              thumbnail_url: 'https://example.com/thumb.jpg',
              is_ignored: false,
            }))
          }),
        } as Response);

      // Mock product details for each
      for (let i = 0; i < 50; i++) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 200,
            result: {
              sync_product: { id: i, name: `Product ${i}` },
              sync_variants: [{
                id: i * 10,
                retail_price: '19.99',
                currency: 'USD',
                synced: true,
                product: { image: 'https://example.com/img.jpg' }
              }]
            }
          }),
        } as Response);
      }

      const products = await getPrintfulSyncProducts(10);

      expect(products.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Product Details API Contract', () => {
    it('should return product with variants', async () => {
      global.fetch = vi.fn().mockResolvedValue({
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
              },
              {
                id: 457,
                external_id: 'ext-457',
                sync_product_id: 123,
                name: 'Medium - Black',
                synced: true,
                variant_id: 790,
                retail_price: '24.99',
                currency: 'USD',
                is_ignored: false,
                sku: null,
                product: {
                  variant_id: 790,
                  product_id: 71,
                  image: 'https://example.com/product.jpg',
                  name: 'Bella + Canvas 3001',
                },
                files: []
              }
            ]
          }
        }),
      } as Response);

      const product = await getPrintfulProductDetails('123');

      expect(product).toBeDefined();
      expect(product?.variants).toBeDefined();
      expect(Array.isArray(product?.variants)).toBe(true);
      expect(product?.variants?.length).toBeGreaterThan(0);
      
      if (product?.variants && product.variants.length > 0) {
        const variant = product.variants[0];
        expect(variant).toHaveProperty('id');
        expect(variant).toHaveProperty('name');
        expect(variant).toHaveProperty('price');
        expect(variant).toHaveProperty('inStock');
      }
    });

    it('should return null for non-existent product', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const product = await getPrintfulProductDetails('999999');

      expect(product).toBeNull();
    });

    it('should filter out ignored variants', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 200,
          result: {
            sync_product: {
              id: 123,
              name: 'Test Product',
              thumbnail_url: 'https://example.com/thumb.jpg',
            },
            sync_variants: [
              {
                id: 456,
                name: 'Active Variant',
                synced: true,
                variant_id: 789,
                retail_price: '24.99',
                currency: 'USD',
                is_ignored: false,
                product: {
                  variant_id: 789,
                  image: 'https://example.com/img.jpg',
                }
              },
              {
                id: 457,
                name: 'Ignored Variant',
                synced: false,
                variant_id: 790,
                retail_price: '24.99',
                currency: 'USD',
                is_ignored: true, // Should be filtered out
                product: {
                  variant_id: 790,
                  image: 'https://example.com/img.jpg',
                }
              }
            ]
          }
        }),
      } as Response);

      const product = await getPrintfulProductDetails('123');

      expect(product?.variants).toBeDefined();
      expect(product?.variants?.length).toBe(1);
      expect(product?.variants?.[0].name).toContain('Active');
    });
  });

  describe('Variant ID Resolution Contract', () => {
    it('should resolve sync variant to catalog variant', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 200,
          result: {
            id: 5130270457,
            external_id: 'ext-123',
            variant_id: 12345, // Catalog variant ID
            product: {
              variant_id: 12345,
              product_id: 71,
              name: 'Bella + Canvas 3001',
            }
          }
        }),
      } as Response);

      const catalogId = await getCatalogVariantId('5130270457');

      expect(catalogId).toBe(12345);
      expect(catalogId).not.toBe(5130270457); // Must convert!
    });

    it('should return null for invalid sync variant', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({
          code: 404,
          result: 'Variant not found',
          error: { reason: 'NotFound' }
        }),
      } as Response);

      const catalogId = await getCatalogVariantId('999999999');

      expect(catalogId).toBeNull();
    });

    it('should handle missing variant_id in response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 200,
          result: {
            sync_variant: {
              id: 5130270457,
              external_id: 'ext-123',
              // variant_id is missing
            }
          }
        }),
      } as Response);

      const catalogId = await getCatalogVariantId('5130270457');

      expect(catalogId).toBeNull();
    });

    it('should use product.variant_id as fallback', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 200,
          result: {
            id: 5130270457,
            external_id: 'ext-123',
            // variant_id is missing
            product: {
              variant_id: 67890, // Fallback location
              product_id: 71,
            }
          }
        }),
      } as Response);

      const catalogId = await getCatalogVariantId('5130270457');

      expect(catalogId).toBe(67890);
    });
  });

  describe('API Response Structure Contract', () => {
    it('should follow Printful API response format', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 200, // Always present
          result: [], // Data payload
          // Optional: error, paging
        }),
      } as Response);

      const products = await getPrintfulSyncProducts();

      expect(products).toBeDefined();
    });

    it('should handle rate limiting response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          code: 429,
          result: 'Too Many Requests',
          error: {
            reason: 'TooManyRequests',
            message: 'Rate limit exceeded'
          }
        }),
      } as Response);

      const products = await getPrintfulSyncProducts();

      // Should handle gracefully, not crash
      expect(Array.isArray(products)).toBe(true);
    });

    it('should handle unauthorized response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          code: 401,
          result: 'Unauthorized',
          error: {
            reason: 'Unauthorized',
            message: 'Invalid API key'
          }
        }),
      } as Response);

      const products = await getPrintfulSyncProducts();

      expect(Array.isArray(products)).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain ProductDisplay interface structure', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 200,
            result: [{
              id: 123,
              name: 'Test',
              variants: 1,
              synced: 1,
              thumbnail_url: 'https://example.com/img.jpg',
              is_ignored: false,
            }]
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 200,
            result: {
              sync_product: { id: 123, name: 'Test' },
              sync_variants: [{
                id: 456,
                retail_price: '19.99',
                currency: 'USD',
                synced: true,
                variant_id: 789,
                product: { variant_id: 789, image: 'https://example.com/img.jpg' }
              }]
            }
          }),
        } as Response);

      const products = await getPrintfulSyncProducts(1);

      if (products.length > 0) {
        const product = products[0];
        
        // Critical: Don't rename these fields
        expect(product).toHaveProperty('id'); // Not productId
        expect(product).toHaveProperty('name'); // Not title
        expect(product).toHaveProperty('price'); // Not cost
        expect(product).toHaveProperty('image'); // Not imageUrl
        expect(product).toHaveProperty('url'); // Not link
        expect(product).toHaveProperty('inStock'); // Not available
      }
    });
  });
});
