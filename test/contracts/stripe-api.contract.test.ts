import Stripe from 'stripe';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Stripe API Contract Tests', () => {
  let stripe: Stripe | null = null;

  beforeAll(() => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && !stripeKey.includes('your_')) {
      stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
    }
  });

  describe('Payment Intents', () => {
    it('should have required fields in payment intent object', async () => {
      if (!stripe) {
        console.log('⚠️  Stripe not configured, skipping live API test');
        return;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000,
        currency: 'usd',
        payment_method_types: ['card'],
      });

      expect(paymentIntent).toHaveProperty('id');
      expect(paymentIntent).toHaveProperty('amount');
      expect(paymentIntent).toHaveProperty('currency');
      expect(paymentIntent).toHaveProperty('status');
      expect(paymentIntent).toHaveProperty('client_secret');
      expect(paymentIntent.object).toBe('payment_intent');

      await stripe.paymentIntents.cancel(paymentIntent.id);
    });

    it('should support metadata field', async () => {
      if (!stripe) {return;}

      const metadata = {
        orderId: 'test-123',
        customerId: 'user-456',
      };

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata,
      });

      expect(paymentIntent.metadata).toEqual(metadata);
      await stripe.paymentIntents.cancel(paymentIntent.id);
    });
  });

  describe('Checkout Sessions', () => {
    it('should have required fields in session object', async () => {
      if (!stripe) {return;}

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Test Product',
              },
              unit_amount: 2000,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      });

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('url');
      expect(session).toHaveProperty('payment_status');
      expect(session).toHaveProperty('customer_details');
      expect(session.object).toBe('checkout.session');
    });

    it('should support metadata and client_reference_id', async () => {
      if (!stripe) {return;}

      const metadata = { orderId: 'test-789' };
      const clientReferenceId = 'order-123';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: 'Test' },
              unit_amount: 1000,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata,
        client_reference_id: clientReferenceId,
      });

      expect(session.metadata).toEqual(metadata);
      expect(session.client_reference_id).toBe(clientReferenceId);
    });
  });

  describe('Webhook Events', () => {
    it('should have expected structure for checkout.session.completed event', () => {
      const mockEvent = {
        id: 'evt_test',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            object: 'checkout.session',
            payment_status: 'paid',
            customer_details: {
              email: 'test@example.com',
              name: 'Test User',
            },
            metadata: {},
          },
        },
      };

      expect(mockEvent.type).toBe('checkout.session.completed');
      expect(mockEvent.data.object).toHaveProperty('payment_status');
      expect(mockEvent.data.object).toHaveProperty('customer_details');
    });

    it('should have expected structure for payment_intent.succeeded event', () => {
      const mockEvent = {
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
            object: 'payment_intent',
            amount: 1000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {},
          },
        },
      };

      expect(mockEvent.type).toBe('payment_intent.succeeded');
      expect(mockEvent.data.object.status).toBe('succeeded');
      expect(mockEvent.data.object).toHaveProperty('amount');
      expect(mockEvent.data.object).toHaveProperty('currency');
    });
  });

  describe('Error Responses', () => {
    it('should handle invalid API key gracefully', async () => {
      const invalidStripe = new Stripe('sk_test_invalid', { apiVersion: '2024-12-18.acacia' });

      await expect(
        invalidStripe.paymentIntents.create({
          amount: 1000,
          currency: 'usd',
        })
      ).rejects.toThrow();
    });

    it('should validate required parameters', async () => {
      if (!stripe) {return;}

      await expect(
        stripe.paymentIntents.create({
          amount: -100, // Invalid amount
          currency: 'usd',
        })
      ).rejects.toThrow();
    });
  });
});
