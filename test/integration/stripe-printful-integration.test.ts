/* eslint-disable no-undef, @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import type Stripe from 'stripe';

import { createPrintfulOrderFromSession, createPrintfulOrder } from '../../server/stripe';
import { getCatalogVariantId } from '../../server/printful';

/**
 * Integration tests for Stripe → Printful order flow
 * Tests the critical path: Payment → Variant Resolution → Order Creation
 */

describe('Stripe → Printful Integration', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    // Mock environment variables for tests
    process.env = {
      ...originalEnv,
      PRINTFUL_API_KEY: 'test_printful_api_key',
      STRIPE_SECRET_KEY: 'sk_test_123',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Variant ID Resolution', () => {
    it('should convert sync variant ID to catalog variant ID', async () => {
      // Mock Printful API response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            code: 200,
            result: {
              sync_variant: {
                id: 5130270457,
                external_id: 'test-external-id',
                variant_id: 12345, // This is the catalog variant ID
                product: {
                  variant_id: 12345,
                  product_id: 71,
                  name: 'Test Product',
                }
              }
            }
          }),
        } as Response)
      ) as any;

      const catalogId = await getCatalogVariantId('5130270457');
      
      expect(catalogId).toBe(12345);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.printful.com/store/variants/5130270457',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          })
        })
      );
    });

    it('should return null if sync variant does not exist', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          text: () => Promise.resolve(JSON.stringify({
            code: 404,
            result: 'Variant not found',
            error: { reason: 'NotFound' }
          })),
        } as Response)
      ) as any;

      const catalogId = await getCatalogVariantId('999999999');
      expect(catalogId).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as any;

      const catalogId = await getCatalogVariantId('5130270457');
      expect(catalogId).toBeNull();
    });

    it('should return null if variant_id is missing in response', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            code: 200,
            result: {
              sync_variant: {
                id: 5130270457,
                // variant_id is missing
              }
            }
          }),
        } as Response)
      ) as any;

      const catalogId = await getCatalogVariantId('5130270457');
      expect(catalogId).toBeNull();
    });
  });

  describe('Order Data Transformation', () => {
    it('should create valid Printful order data from Stripe session', () => {
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_test_123',
        object: 'checkout.session',
        shipping_details: {
          name: 'Preston Farr',
          address: {
            line1: '526 E 200 S',
            line2: null,
            city: 'Clearfield',
            state: 'UT',
            postal_code: '84015',
            country: 'US',
          }
        },
        customer_details: {
          email: 'test@example.com',
          phone: '+18162670838',
        },
        metadata: {
          printful_variant_id: '5130270457'
        },
      } as any;

      const orderData = createPrintfulOrderFromSession(mockSession);

      expect(orderData).not.toBeNull();
      expect(orderData?.recipient).toEqual({
        name: 'Preston Farr',
        address1: '526 E 200 S',
        address2: null,
        city: 'Clearfield',
        state_code: 'UT',
        country_code: 'US',
        zip: '84015',
        phone: '+18162670838',
        email: 'test@example.com',
      });
      expect(orderData?.items).toHaveLength(1);
      expect(orderData?.items[0].variant_id).toBe(5130270457);
      expect(orderData?.items[0].quantity).toBe(1);
    });

    it('should return null if shipping details are missing', () => {
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_test_123',
        object: 'checkout.session',
        customer_details: {
          email: 'test@example.com',
        },
        metadata: {
          printful_variant_id: '5130270457'
        },
      } as any;

      const orderData = createPrintfulOrderFromSession(mockSession);
      expect(orderData).toBeNull();
    });

    it('should return null if variant ID is missing from metadata', () => {
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_test_123',
        object: 'checkout.session',
        shipping_details: {
          name: 'Test User',
          address: {
            line1: '123 Test St',
            city: 'TestCity',
            state: 'TS',
            postal_code: '12345',
            country: 'US',
          }
        },
        customer_details: {
          email: 'test@example.com',
        },
        metadata: {}, // No printful_variant_id
      } as any;

      const orderData = createPrintfulOrderFromSession(mockSession);
      expect(orderData).toBeNull();
    });
  });

  describe('Printful Order Creation', () => {
    it('should successfully create order with valid data', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            code: 200,
            result: {
              id: 123456789,
              external_id: 'cs_test_123',
              status: 'draft',
            }
          })),
        } as Response)
      ) as any;

      const orderData = {
        recipient: {
          name: 'Preston Farr',
          address1: '526 E 200 S',
          address2: null,
          city: 'Clearfield',
          state_code: 'UT',
          country_code: 'US',
          zip: '84015',
          phone: '+18162670838',
          email: 'test@example.com',
        },
        items: [
          { variant_id: 12345, quantity: 1 } // Catalog variant ID, not sync
        ],
      };

      const result = await createPrintfulOrder(orderData);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe(123456789);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.printful.com/orders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(orderData),
        })
      );
    });

    it('should handle 400 error for invalid variant ID', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          text: () => Promise.resolve(JSON.stringify({
            code: 400,
            result: 'Item 0: Variant with id: `5130270457` was not found.',
            error: {
              reason: 'BadRequest',
              message: 'Item 0: Variant with id: `5130270457` was not found.'
            }
          })),
        } as Response)
      ) as any;

      const orderData = {
        recipient: {
          name: 'Test User',
          address1: '123 Test St',
          city: 'TestCity',
          state_code: 'TS',
          country_code: 'US',
          zip: '12345',
          email: 'test@example.com',
        },
        items: [
          { variant_id: 5130270457, quantity: 1 } // Wrong: sync ID instead of catalog ID
        ],
      };

      const result = await createPrintfulOrder(orderData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Printful API error: 400');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network timeout'))
      ) as any;

      const orderData = {
        recipient: {
          name: 'Test User',
          address1: '123 Test St',
          city: 'TestCity',
          state_code: 'TS',
          country_code: 'US',
          zip: '12345',
          email: 'test@example.com',
        },
        items: [{ variant_id: 12345, quantity: 1 }],
      };

      const result = await createPrintfulOrder(orderData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete full payment → order workflow', async () => {
      // Step 1: Variant resolution
      global.fetch = vi.fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              code: 200,
              result: {
                sync_variant: {
                  id: 5130270457,
                  variant_id: 12345, // Catalog ID
                }
              }
            }),
          } as Response)
        )
        // Step 2: Order creation
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({
              code: 200,
              result: { id: 999888777 }
            })),
          } as Response)
        ) as any;

      // Simulate webhook payload
      const session: Stripe.Checkout.Session = {
        id: 'cs_test_workflow',
        object: 'checkout.session',
        shipping_details: {
          name: 'Preston Farr',
          address: {
            line1: '526 E 200 S',
            city: 'Clearfield',
            state: 'UT',
            postal_code: '84015',
            country: 'US',
          }
        },
        customer_details: {
          email: 'test@example.com',
          phone: '+18162670838',
        },
        metadata: {
          printful_variant_id: '5130270457'
        },
      } as any;

      // Step 1: Get catalog variant
      const syncVariantId = session.metadata?.printful_variant_id!;
      const catalogVariantId = await getCatalogVariantId(syncVariantId);
      expect(catalogVariantId).toBe(12345);

      // Step 2: Create order data
      const orderData = createPrintfulOrderFromSession(session);
      expect(orderData).not.toBeNull();

      // Step 3: Replace sync ID with catalog ID
      orderData!.items = orderData!.items.map(item => ({
        ...item,
        variant_id: catalogVariantId!,
      }));

      expect(orderData!.items[0].variant_id).toBe(12345);

      // Step 4: Submit order
      const result = await createPrintfulOrder(orderData!);
      expect(result.success).toBe(true);
      expect(result.orderId).toBe(999888777);
    });
  });
});
