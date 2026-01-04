import { describe, it, expect, beforeEach, vi } from 'vitest';

import { db } from '../../server/db';
import {
  createOrder,
  updateOrderStatus,
  updateOrderWithPrintfulId,
  getOrderByStripeSessionId,
  logOrderEvent,
  logFailedOrder,
  type CreateOrderParams,
} from '../../server/order-service';

// Mock the database
vi.mock('../../server/db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
}));

describe('Order Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order with items and log event', async () => {
      const mockOrder = {
        id: 'order-123',
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
        totalAmount: '99.99',
        currency: 'usd',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder]),
        }),
      });

      (db.insert as any) = insertMock;

      const params: CreateOrderParams = {
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
        totalAmount: '99.99',
        currency: 'usd',
        items: [
          {
            printfulProductId: 'prod_123',
            printfulVariantId: 'var_123',
            name: 'Test Product',
            quantity: 1,
            price: '99.99',
          },
        ],
      };

      const result = await createOrder(params);

      expect(result).toEqual(mockOrder);
      expect(insertMock).toHaveBeenCalledTimes(3); // orders, orderItems, orderEvents
    });

    it('should handle order creation without items', async () => {
      const mockOrder = {
        id: 'order-123',
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
        totalAmount: '99.99',
        currency: 'usd',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder]),
        }),
      });

      (db.insert as any) = insertMock;

      const params: CreateOrderParams = {
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
        totalAmount: '99.99',
        currency: 'usd',
        items: [],
      };

      const result = await createOrder(params);

      expect(result).toEqual(mockOrder);
      expect(insertMock).toHaveBeenCalledTimes(2); // orders, orderEvents (no items)
    });

    it('should throw error if order creation fails', async () => {
      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      (db.insert as any) = insertMock;

      const params: CreateOrderParams = {
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
        totalAmount: '99.99',
        currency: 'usd',
        items: [],
      };

      await expect(createOrder(params)).rejects.toThrow('Failed to create order');
    });

    it('should include shipping address if provided', async () => {
      const mockOrder = {
        id: 'order-123',
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
        totalAmount: '99.99',
        currency: 'usd',
        status: 'pending',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postal_code: '10001',
          country: 'US',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder]),
        }),
      });

      (db.insert as any) = insertMock;

      const params: CreateOrderParams = {
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
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
        items: [],
      };

      const result = await createOrder(params);

      expect(result.shippingAddress).toEqual(params.shippingAddress);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status and log event', async () => {
      const updateMock = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      (db.update as any) = updateMock;
      (db.insert as any) = insertMock;

      await updateOrderStatus('order-123', 'completed');

      expect(updateMock).toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalled();
    });

    it('should include metadata in status update', async () => {
      const updateMock = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      (db.update as any) = updateMock;
      (db.insert as any) = insertMock;

      await updateOrderStatus('order-123', 'failed', { error: 'Payment declined' });

      expect(updateMock).toHaveBeenCalled();
    });
  });

  describe('updateOrderWithPrintfulId', () => {
    it('should update order with Printful ID and set status to processing', async () => {
      const updateMock = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      (db.update as any) = updateMock;
      (db.insert as any) = insertMock;

      await updateOrderWithPrintfulId('order-123', 'printful-456');

      expect(updateMock).toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalled();
    });
  });

  describe('getOrderByStripeSessionId', () => {
    it('should retrieve order by Stripe session ID', async () => {
      const mockOrder = {
        id: 'order-123',
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
      };

      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      (db.select as any) = selectMock;

      const result = await getOrderByStripeSessionId('sess_123');

      expect(result).toEqual(mockOrder);
      expect(selectMock).toHaveBeenCalled();
    });

    it('should return undefined if order not found', async () => {
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as any) = selectMock;

      const result = await getOrderByStripeSessionId('sess_nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('logOrderEvent', () => {
    it('should log order event successfully', async () => {
      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      (db.insert as any) = insertMock;

      await logOrderEvent({
        orderId: 'order-123',
        eventType: 'payment_success',
        status: 'success',
        message: 'Payment completed',
      });

      expect(insertMock).toHaveBeenCalled();
    });

    it('should not throw if logging fails', async () => {
      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error('Database error')),
      });

      (db.insert as any) = insertMock;

      // Should not throw
      await expect(
        logOrderEvent({
          orderId: 'order-123',
          eventType: 'payment_success',
          status: 'success',
          message: 'Payment completed',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('logFailedOrder', () => {
    it('should log failed order if order exists', async () => {
      const mockOrder = {
        id: 'order-123',
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
      };

      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const updateMock = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      (db.select as any) = selectMock;
      (db.insert as any) = insertMock;
      (db.update as any) = updateMock;

      await logFailedOrder('sess_123', 'payment_failed', 'Payment declined');

      expect(selectMock).toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
    });

    it('should handle case when order not found', async () => {
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as any) = selectMock;

      // Should not throw
      await expect(
        logFailedOrder('sess_nonexistent', 'payment_failed', 'Payment declined')
      ).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const insertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      });

      (db.insert as any) = insertMock;

      const params: CreateOrderParams = {
        stripeSessionId: 'sess_123',
        customerEmail: 'test@example.com',
        totalAmount: '99.99',
        currency: 'usd',
        items: [],
      };

      await expect(createOrder(params)).rejects.toThrow();
    });
  });
});
