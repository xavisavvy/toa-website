import { eq } from 'drizzle-orm';

import { orders, orderItems, orderEvents } from '../shared/schema';
import type { InsertOrderEvent, Order } from '../shared/schema';

import { db } from './db';


export interface CreateOrderParams {
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  customerEmail: string;
  customerName?: string;
  totalAmount: string;
  currency: string;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: Array<{
    printfulProductId: string;
    printfulVariantId: string;
    name: string;
    quantity: number;
    price: string;
    imageUrl?: string;
  }>;
  metadata?: Record<string, any>;
}

export async function createOrder(params: CreateOrderParams): Promise<Order> {
  try {
    const [order] = await db.insert(orders).values({
      stripeSessionId: params.stripeSessionId,
      stripePaymentIntentId: params.stripePaymentIntentId,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      totalAmount: params.totalAmount,
      currency: params.currency,
      shippingAddress: params.shippingAddress,
      status: 'pending',
      metadata: params.metadata,
    }).returning();

    if (!order) {
      throw new Error('Failed to create order');
    }

    if (params.items && params.items.length > 0) {
      await db.insert(orderItems).values(
        params.items.map((item) => ({
          orderId: order.id,
          printfulProductId: item.printfulProductId,
          printfulVariantId: item.printfulVariantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl,
        }))
      );
    }

    await logOrderEvent({
      orderId: order.id,
      eventType: 'order_created',
      status: 'success',
      message: 'Order created successfully',
      metadata: { stripeSessionId: params.stripeSessionId } as any,
    });

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await db.update(orders)
      .set({ 
        status, 
        updatedAt: new Date(),
        ...(metadata && { metadata })
      })
      .where(eq(orders.id, orderId));

    await logOrderEvent({
      orderId,
      eventType: 'status_changed',
      status: 'success',
      message: `Order status changed to ${status}`,
      metadata: { newStatus: status, ...metadata } as any,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

export async function updateOrderWithPrintfulId(
  orderId: string,
  printfulOrderId: string
): Promise<void> {
  try {
    await db.update(orders)
      .set({ 
        printfulOrderId,
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await logOrderEvent({
      orderId,
      eventType: 'printful_created',
      status: 'success',
      message: 'Printful order created successfully',
      metadata: { printfulOrderId } as any,
    });
  } catch (error) {
    console.error('Error updating order with Printful ID:', error);
    throw error;
  }
}

export async function getOrderByStripeSessionId(
  stripeSessionId: string
): Promise<Order | undefined> {
  try {
    const [order] = await db.select()
      .from(orders)
      .where(eq(orders.stripeSessionId, stripeSessionId))
      .limit(1);
    return order;
  } catch (error) {
    console.error('Error getting order by Stripe session ID:', error);
    throw error;
  }
}

export async function logOrderEvent(params: InsertOrderEvent): Promise<void> {
  try {
    await db.insert(orderEvents).values(params);
  } catch (error) {
    console.error('Error logging order event:', error);
  }
}

export async function logFailedOrder(
  stripeSessionId: string,
  eventType: string,
  errorMessage: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const order = await getOrderByStripeSessionId(stripeSessionId);
    
    if (!order) {
      console.warn(`Order not found for session ${stripeSessionId}, attempting to create minimal record`);
      return;
    }

    await logOrderEvent({
      orderId: order.id,
      eventType,
      status: 'failed',
      message: errorMessage,
      metadata,
    });

    await updateOrderStatus(order.id, 'failed', { error: errorMessage });
  } catch (error) {
    console.error('Error logging failed order:', error);
  }
}
