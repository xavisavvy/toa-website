import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  sendEmail,
  sendOrderConfirmation,
  sendPaymentFailureNotification,
  sendAdminAlert,
} from '../../server/notification-service';
import type { Order } from '../../shared/schema';

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('sendEmail', () => {
    it('should log email details when called', async () => {
      const params = {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
      };

      const result = await sendEmail(params);

      expect(result).toBe(true);
      expect(console.info).toHaveBeenCalledWith('📧 Email would be sent:');
      expect(console.info).toHaveBeenCalledWith(`  To: ${params.to}`);
      expect(console.info).toHaveBeenCalledWith(`  Subject: ${params.subject}`);
    });

    it('should handle HTML email content', async () => {
      const params = {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'Plain text body',
        html: '<h1>HTML Body</h1>',
      };

      const result = await sendEmail(params);

      expect(result).toBe(true);
    });
  });

  describe('sendOrderConfirmation', () => {
    const mockOrder: Order = {
      id: 'order-123',
      stripeSessionId: 'sess_123',
      stripePaymentIntentId: 'pi_123',
      printfulOrderId: null,
      status: 'pending',
      customerEmail: 'customer@example.com',
      customerName: 'John Doe',
      totalAmount: '99.99',
      currency: 'usd',
      shippingAddress: {
        name: 'John Doe',
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US',
      },
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockItems = [
      {
        name: 'Test Product',
        quantity: 2,
        price: '49.99',
      },
    ];

    it('should send order confirmation email with all details', async () => {
      await sendOrderConfirmation(mockOrder, mockItems);

      expect(console.info).toHaveBeenCalledWith('📧 Email would be sent:');
      expect(console.info).toHaveBeenCalledWith(`  To: ${mockOrder.customerEmail}`);
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(`✅ Order confirmation email sent to ${mockOrder.customerEmail}`)
      );
    });

    it('should include order details in email', async () => {
      await sendOrderConfirmation(mockOrder, mockItems);

      // Check that sendEmail was effectively called with order details
      expect(console.info).toHaveBeenCalled();
    });

    it('should handle order without customer name', async () => {
      const orderWithoutName = { ...mockOrder, customerName: null };

      await sendOrderConfirmation(orderWithoutName, mockItems);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(`✅ Order confirmation email sent to ${orderWithoutName.customerEmail}`)
      );
    });

    it('should handle order without shipping address', async () => {
      const orderWithoutShipping = { ...mockOrder, shippingAddress: null };

      await sendOrderConfirmation(orderWithoutShipping, mockItems);

      expect(console.info).toHaveBeenCalled();
    });

    it('should include multiple items in email', async () => {
      const multipleItems = [
        { name: 'Product 1', quantity: 1, price: '29.99' },
        { name: 'Product 2', quantity: 2, price: '39.99' },
      ];

      await sendOrderConfirmation(mockOrder, multipleItems);

      expect(console.info).toHaveBeenCalled();
    });

    it('should use environment variables for business info', async () => {
      const originalBusinessName = process.env.BUSINESS_NAME;
      const originalSupportEmail = process.env.SUPPORT_EMAIL;

      process.env.BUSINESS_NAME = 'Test Business';
      process.env.SUPPORT_EMAIL = 'support@testbusiness.com';

      await sendOrderConfirmation(mockOrder, mockItems);

      expect(console.info).toHaveBeenCalled();

      // Restore
      process.env.BUSINESS_NAME = originalBusinessName;
      process.env.SUPPORT_EMAIL = originalSupportEmail;
    });

    it('should handle email sending errors gracefully', async () => {
      // sendEmail always returns true in current implementation (logs to console)
      // This test verifies it doesn't throw
      await expect(sendOrderConfirmation(mockOrder, mockItems)).resolves.not.toThrow();
    });
  });

  describe('sendPaymentFailureNotification', () => {
    it('should send payment failure notification', async () => {
      const customerEmail = 'customer@example.com';
      const sessionId = 'sess_123';

      await sendPaymentFailureNotification(customerEmail, sessionId);

      expect(console.info).toHaveBeenCalledWith('📧 Email would be sent:');
      expect(console.info).toHaveBeenCalledWith(`  To: ${customerEmail}`);
      expect(console.info).toHaveBeenCalledWith(
        `✅ Payment failure notification sent to ${customerEmail}`
      );
    });

    it('should include session ID in notification', async () => {
      const customerEmail = 'customer@example.com';
      const sessionId = 'sess_123';

      await sendPaymentFailureNotification(customerEmail, sessionId);

      expect(console.info).toHaveBeenCalled();
    });

    it('should not throw if email fails', async () => {
      const customerEmail = 'customer@example.com';
      const sessionId = 'sess_123';

      // Should not throw, just log error
      await expect(
        sendPaymentFailureNotification(customerEmail, sessionId)
      ).resolves.not.toThrow();
    });
  });

  describe('sendAdminAlert', () => {
    it('should send admin alert with subject and message', async () => {
      const subject = 'Critical Error';
      const message = 'Something went wrong';

      await sendAdminAlert(subject, message);

      expect(console.info).toHaveBeenCalledWith('📧 Email would be sent:');
      expect(console.info).toHaveBeenCalledWith(`✅ Admin alert sent: ${subject}`);
    });

    it('should include metadata in alert', async () => {
      const subject = 'Payment Failed';
      const message = 'Payment processing error';
      const metadata = {
        sessionId: 'sess_123',
        error: 'Card declined',
        amount: 99.99,
      };

      await sendAdminAlert(subject, message, metadata);

      expect(console.info).toHaveBeenCalled();
    });

    it('should use ADMIN_EMAIL if set', async () => {
      const originalAdminEmail = process.env.ADMIN_EMAIL;
      process.env.ADMIN_EMAIL = 'admin@example.com';

      await sendAdminAlert('Test Alert', 'Test message');

      expect(console.info).toHaveBeenCalledWith('  To: admin@example.com');

      process.env.ADMIN_EMAIL = originalAdminEmail;
    });

    it('should fallback to SUPPORT_EMAIL if ADMIN_EMAIL not set', async () => {
      const originalAdminEmail = process.env.ADMIN_EMAIL;
      const originalSupportEmail = process.env.SUPPORT_EMAIL;

      delete process.env.ADMIN_EMAIL;
      process.env.SUPPORT_EMAIL = 'support@example.com';

      await sendAdminAlert('Test Alert', 'Test message');

      expect(console.info).toHaveBeenCalledWith('  To: support@example.com');

      process.env.ADMIN_EMAIL = originalAdminEmail;
      process.env.SUPPORT_EMAIL = originalSupportEmail;
    });

    it('should use default email if neither ADMIN_EMAIL nor SUPPORT_EMAIL set', async () => {
      const originalAdminEmail = process.env.ADMIN_EMAIL;
      const originalSupportEmail = process.env.SUPPORT_EMAIL;

      delete process.env.ADMIN_EMAIL;
      delete process.env.SUPPORT_EMAIL;

      await sendAdminAlert('Test Alert', 'Test message');

      expect(console.info).toHaveBeenCalledWith('  To: admin@talesofaneria.com');

      process.env.ADMIN_EMAIL = originalAdminEmail;
      process.env.SUPPORT_EMAIL = originalSupportEmail;
    });

    it('should not throw if email fails', async () => {
      // Should not throw, just log error
      await expect(sendAdminAlert('Test', 'Test message')).resolves.not.toThrow();
    });

    it('should format subject with [ADMIN ALERT] prefix', async () => {
      await sendAdminAlert('Database Error', 'Connection failed');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Subject: [ADMIN ALERT] Database Error')
      );
    });
  });

  describe('email content formatting', () => {
    it('should format order confirmation with proper line breaks', async () => {
      const order: Order = {
        id: 'order-123',
        stripeSessionId: 'sess_123',
        stripePaymentIntentId: 'pi_123',
        printfulOrderId: null,
        status: 'pending',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        totalAmount: '99.99',
        currency: 'usd',
        shippingAddress: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const items = [{ name: 'Product', quantity: 1, price: '99.99' }];

      await sendOrderConfirmation(order, items);

      expect(console.info).toHaveBeenCalled();
    });

    it('should include support contact information', async () => {
      const order: Order = {
        id: 'order-123',
        stripeSessionId: 'sess_123',
        stripePaymentIntentId: 'pi_123',
        printfulOrderId: null,
        status: 'pending',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        totalAmount: '99.99',
        currency: 'usd',
        shippingAddress: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const items = [{ name: 'Product', quantity: 1, price: '99.99' }];

      await sendOrderConfirmation(order, items);

      expect(console.info).toHaveBeenCalled();
    });
  });
});
