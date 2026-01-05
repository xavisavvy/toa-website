import crypto from 'crypto';

import { test, expect } from '@playwright/test';

test.describe('Printful Webhook E2E', () => {
  const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET || 'test_secret';
  const baseURL = process.env.BASE_URL || 'http://localhost:5000';

  test.beforeAll(async () => {
    // Note: In real tests, you'd need to create test orders first
    // For now, we'll just test the webhook endpoint's behavior
  });

  const createSignature = (payload: string): string => {
    return crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
  };

  test('should handle package_shipped webhook', async ({ request }) => {
    const payload = {
      type: 'package_shipped',
      data: {
        order: {
          id: '12345678', // Test Printful order ID
        },
        shipment: {
          tracking_number: '1Z999AA10123456784',
          tracking_url: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
          carrier: 'UPS',
          service: 'Ground',
        },
      },
    };

    const payloadStr = JSON.stringify(payload);
    const signature = createSignature(payloadStr);

    const response = await request.post(`${baseURL}/api/printful/webhook`, {
      headers: {
        'X-Printful-Signature': signature,
        'Content-Type': 'application/json',
      },
      data: payloadStr,
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.received).toBe(true);
  });

  test('should reject webhook with invalid signature', async ({ request }) => {
    const payload = {
      type: 'package_shipped',
      data: {
        order: { id: '12345678' },
      },
    };

    const response = await request.post(`${baseURL}/api/printful/webhook`, {
      headers: {
        'X-Printful-Signature': 'invalid_signature',
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(payload),
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid signature');
  });

  test('should handle order_failed webhook', async ({ request }) => {
    const payload = {
      type: 'order_failed',
      data: {
        order: {
          id: '12345678',
        },
        reason: 'Out of stock',
      },
    };

    const payloadStr = JSON.stringify(payload);
    const signature = createSignature(payloadStr);

    const response = await request.post(`${baseURL}/api/printful/webhook`, {
      headers: {
        'X-Printful-Signature': signature,
        'Content-Type': 'application/json',
      },
      data: payloadStr,
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should handle package_returned webhook', async ({ request }) => {
    const payload = {
      type: 'package_returned',
      data: {
        order: {
          id: '12345678',
        },
      },
    };

    const payloadStr = JSON.stringify(payload);
    const signature = createSignature(payloadStr);

    const response = await request.post(`${baseURL}/api/printful/webhook`, {
      headers: {
        'X-Printful-Signature': signature,
        'Content-Type': 'application/json',
      },
      data: payloadStr,
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should handle order_canceled webhook', async ({ request }) => {
    const payload = {
      type: 'order_canceled',
      data: {
        order: {
          id: '12345678',
        },
      },
    };

    const payloadStr = JSON.stringify(payload);
    const signature = createSignature(payloadStr);

    const response = await request.post(`${baseURL}/api/printful/webhook`, {
      headers: {
        'X-Printful-Signature': signature,
        'Content-Type': 'application/json',
      },
      data: payloadStr,
    });

    expect(response.ok()).toBeTruthy();
  });
});
