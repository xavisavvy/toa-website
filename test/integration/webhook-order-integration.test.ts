import type { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { sendOrderConfirmation, sendAdminAlert } from '../../server/notification-service';
import { createOrder, getOrderByStripeSessionId } from '../../server/order-service';

// Mock dependencies
vi.mock('../../server/order-service');
vi.mock('../../server/notification-service');
vi.mock('../../server/stripe', async () => {
  const actual = await vi.importActual('../../server/stripe');
  return {
    ...actual,
    verifyWebhookSignature: vi.fn(),
    getCheckoutSession: vi.fn(),
    createPrintfulOrderFromSession: vi.fn(),
    createPrintfulOrder: vi.fn(),
  };
});
vi.mock('../../server/printful', async () => {
  const actual = await vi.importActual('../../server/printful');
  return {
    ...actual,
    getCatalogVariantId: vi.fn(),
  };
});

describe('Stripe Webhook Integration with Order Service', () => {
  let app: Express;
  const mockVerifyWebhook = vi.mocked((await import('../../server/stripe')).verifyWebhookSignature);
  const mockGetCheckoutSession = vi.mocked((await import('../../server/stripe')).getCheckoutSession);
  const mockCreatePrintfulOrderFromSession = vi.mocked((await import('../../server/stripe')).createPrintfulOrderFromSession);
  const mockCreatePrintfulOrder = vi.mocked((await import('../../server/stripe')).createPrintfulOrder);
  const mockGetCatalogVariantId = vi.mocked((await import('../../server/printful')).getCatalogVariantId);
  
  const mockCreateOrder = vi.mocked(createOrder);
  const mockGetOrderByStripeSessionId = vi.mocked(getOrderByStripeSessionId);
  const mockSendOrderConfirmation = vi.mocked(sendOrderConfirmation);
  const mockSendAdminAlert = vi.mocked(sendAdminAlert);

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset process.env for webhook secret
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    
    // Import app after mocks are set up
    const { registerRoutes } = await import('../../server/routes');
    const express = await import('express');
    app = express.default();
    app.use(express.default.raw({ type: 'application/json' }));
    registerRoutes(app);
  });

  describe('checkout.session.completed - Success Flow', () => {
    it('should create order and send confirmation on successful payment', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_details: {
              email: 'customer@example.com',
              name: 'John Doe',
            },
            amount_total: 9999,
            currency: 'usd',
            payment_intent: 'pi_123',
          },
        },
      };

      const mockSession = {
        id: 'cs_test_123',
        customer_details: {
          email: 'customer@example.com',
          name: 'John Doe',
        },
        amount_total: 9999,
        currency: 'usd',
        payment_intent: 'pi_123',
        metadata: {
          printful_variant_id: '12345',
          printful_product_id: 'prod_123',
        },
        line_items: {
          data: [
            {
              description: 'Test Product',
              quantity: 1,
              amount_total: 9999,
            },
          ],
        },
      };

      const mockOrder = {
        id: 'order-123',
        stripeSessionId: 'cs_test_123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        totalAmount: '99.99',
        currency: 'usd',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVerifyWebhook.mockReturnValueOnce(mockEvent as any);
      mockGetCheckoutSession.mockResolvedValueOnce(mockSession as any);
      mockGetCatalogVariantId.mockResolvedValueOnce('catalog-var-123');
      mockCreatePrintfulOrderFromSession.mockReturnValueOnce({
        recipient: {
          name: 'John Doe',
          email: 'customer@example.com',
          address1: '123 Main St',
          city: 'New York',
          state_code: 'NY',
          country_code: 'US',
          zip: '10001',
        },
        items: [
          {
            sync_variant_id: 12345,
            quantity: 1,
          },
        ],
      } as any);
      mockCreatePrintfulOrder.mockResolvedValueOnce({
        success: true,
        orderId: 123456,
      });
      mockCreateOrder.mockResolvedValueOnce(mockOrder as any);
      mockGetOrderByStripeSessionId.mockResolvedValueOnce(mockOrder as any);

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)));

      expect(response.status).toBe(200);
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeSessionId: 'cs_test_123',
          customerEmail: 'customer@example.com',
        })
      );
      expect(mockSendOrderConfirmation).toHaveBeenCalledWith(
        mockOrder,
        expect.any(Array)
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_details: {
              email: 'customer@example.com',
            },
            amount_total: 9999,
            currency: 'usd',
          },
        },
      };

      const mockSession = {
        id: 'cs_test_123',
        customer_details: {
          email: 'customer@example.com',
        },
        amount_total: 9999,
        currency: 'usd',
        metadata: {
          printful_variant_id: '12345',
        },
        line_items: {
          data: [],
        },
      };

      mockVerifyWebhook.mockReturnValueOnce(mockEvent as any);
      mockGetCheckoutSession.mockResolvedValueOnce(mockSession as any);
      mockCreateOrder.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)));

      expect(mockSendAdminAlert).toHaveBeenCalledWith(
        'Database Error: Failed to create order',
        expect.stringContaining('Error creating order'),
        expect.any(Object)
      );
    });
  });

  describe('checkout.session.completed - Failed Printful Order', () => {
    it('should log failed order and send admin alert', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_details: {
              email: 'customer@example.com',
            },
            amount_total: 9999,
            currency: 'usd',
          },
        },
      };

      const mockSession = {
        id: 'cs_test_123',
        customer_details: {
          email: 'customer@example.com',
        },
        amount_total: 9999,
        currency: 'usd',
        metadata: {
          printful_variant_id: '12345',
        },
        line_items: {
          data: [],
        },
      };

      mockVerifyWebhook.mockReturnValueOnce(mockEvent as any);
      mockGetCheckoutSession.mockResolvedValueOnce(mockSession as any);
      mockGetCatalogVariantId.mockResolvedValueOnce('catalog-var-123');
      mockCreatePrintfulOrderFromSession.mockReturnValueOnce({} as any);
      mockCreatePrintfulOrder.mockResolvedValueOnce({
        success: false,
        error: 'Printful API error',
      });
      mockCreateOrder.mockResolvedValueOnce({
        id: 'order-123',
        stripeSessionId: 'cs_test_123',
      } as any);

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)));

      expect(mockSendAdminAlert).toHaveBeenCalledWith(
        'Failed to create Printful order',
        expect.stringContaining('Printful order creation failed'),
        expect.any(Object)
      );
    });

    it('should alert admin when variant resolution fails', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_details: {
              email: 'customer@example.com',
            },
            amount_total: 9999,
            currency: 'usd',
          },
        },
      };

      const mockSession = {
        id: 'cs_test_123',
        customer_details: {
          email: 'customer@example.com',
        },
        amount_total: 9999,
        currency: 'usd',
        metadata: {
          printful_variant_id: '12345',
        },
        line_items: {
          data: [],
        },
      };

      mockVerifyWebhook.mockReturnValueOnce(mockEvent as any);
      mockGetCheckoutSession.mockResolvedValueOnce(mockSession as any);
      mockGetCatalogVariantId.mockResolvedValueOnce(null);
      mockCreateOrder.mockResolvedValueOnce({
        id: 'order-123',
        stripeSessionId: 'cs_test_123',
      } as any);

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)));

      expect(mockSendAdminAlert).toHaveBeenCalledWith(
        'CRITICAL: Printful Variant Resolution Failed',
        expect.stringContaining('Payment successful but cannot fulfill order'),
        expect.any(Object)
      );
    });
  });

  describe('checkout.session.async_payment_failed', () => {
    it('should notify customer and admin on async payment failure', async () => {
      const mockEvent = {
        type: 'checkout.session.async_payment_failed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_details: {
              email: 'customer@example.com',
            },
            last_payment_error: {
              message: 'Insufficient funds',
            },
          },
        },
      };

      mockVerifyWebhook.mockReturnValueOnce(mockEvent as any);

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)));

      expect(response.status).toBe(200);
      expect(mockSendAdminAlert).toHaveBeenCalledWith(
        'Async payment failed',
        expect.stringContaining('Async payment failed for session'),
        expect.any(Object)
      );
    });
  });

  describe('webhook security', () => {
    it('should reject webhook without signature', async () => {
      const response = await request(app)
        .post('/api/stripe/webhook')
        .send({ type: 'checkout.session.completed' });

      expect(response.status).toBe(400);
    });

    it('should reject webhook with invalid signature', async () => {
      mockVerifyWebhook.mockReturnValueOnce(null);

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'invalid-signature')
        .send(Buffer.from(JSON.stringify({ type: 'test' })));

      expect(response.status).toBe(400);
    });

    it('should reject webhook when secret not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify({ type: 'test' })));

      expect(response.status).toBe(400);

      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    });
  });

  describe('idempotency', () => {
    it('should not process duplicate webhooks', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_duplicate',
            customer_details: {
              email: 'customer@example.com',
            },
            amount_total: 9999,
            currency: 'usd',
          },
        },
      };

      mockVerifyWebhook.mockReturnValue(mockEvent as any);
      mockGetCheckoutSession.mockResolvedValue({
        id: 'cs_test_duplicate',
        metadata: { printful_variant_id: '12345' },
        line_items: { data: [] },
      } as any);
      mockGetCatalogVariantId.mockResolvedValue('catalog-var-123');
      mockCreatePrintfulOrderFromSession.mockReturnValue({} as any);
      mockCreatePrintfulOrder.mockResolvedValue({ success: true, orderId: 123 });

      // First request
      await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)));

      // Second request with same session ID
      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)));

      expect(response.body).toHaveProperty('duplicate', true);
    });
  });
});
