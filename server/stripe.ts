/* eslint-disable no-console */
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️  Stripe secret key not configured. Checkout will not be available.');
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null;

export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  successUrl: process.env.STRIPE_SUCCESS_URL || '/checkout/success',
  cancelUrl: process.env.STRIPE_CANCEL_URL || '/checkout/cancel',
  businessName: process.env.BUSINESS_NAME || 'Tales of Aneria',
  supportEmail: process.env.SUPPORT_EMAIL || 'TalesOfAneria@gmail.com',
};

/**
 * Create a Stripe Checkout session for a Printful product
 * 
 * NOTE: Price calculation includes:
 * - Retail price (product cost)
 * - Estimated shipping ($4.50)
 * - Estimated tax (7%)
 */
export async function createCheckoutSession(params: {
  productId: string;
  variantId: string;
  productName: string;
  price: number; // Retail price in cents (e.g., 300 for $3.00)
  quantity: number;
  imageUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  shippingEstimate?: {
    shipping: number;
    tax: number;
  };
}): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const {
    productId,
    variantId,
    productName,
    price: retailPrice,
    quantity,
    imageUrl,
    successUrl,
    cancelUrl,
    metadata = {},
    shippingEstimate,
  } = params;

  // Use actual Printful shipping estimate if provided, otherwise use defaults
  let shippingCents: number;
  let taxCents: number;

  if (shippingEstimate) {
    shippingCents = Math.round(shippingEstimate.shipping * 100);
    taxCents = Math.round(shippingEstimate.tax * 100);
    console.log('💰 Using Printful shipping estimate');
  } else {
    // Fallback to estimated rates
    shippingCents = 450;  // $4.50 estimated US shipping
    const subtotal = retailPrice + shippingCents;
    taxCents = Math.ceil(subtotal * 0.07);  // 7% estimated tax
    console.log('💰 Using fallback shipping estimate');
  }
  
  const subtotal = retailPrice * quantity + shippingCents;
  const totalAmount = subtotal + taxCents;
  
  console.log(`💰 Checkout Price Calculation:
    Product: $${(retailPrice / 100).toFixed(2)} × ${quantity}
    Shipping: $${(shippingCents / 100).toFixed(2)}
    Tax: $${(taxCents / 100).toFixed(2)}
    ────────────────────────
    Total: $${(totalAmount / 100).toFixed(2)}
  `);

  try {
    return await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${productName} (includes shipping & tax)`,
              description: `Shipping: $${(shippingCents / 100).toFixed(2)} | Tax: $${(taxCents / 100).toFixed(2)}`,
              images: imageUrl ? [imageUrl] : [],
              metadata: {
                printful_product_id: productId,
                printful_variant_id: variantId,
                retail_price_cents: retailPrice.toString(),
                shipping_cents: shippingCents.toString(),
                tax_cents: taxCents.toString(),
              },
            },
            unit_amount: totalAmount,  // Total including shipping & tax
          },
          quantity,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.BASE_URL || 'http://localhost:5000'}${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.BASE_URL || 'http://localhost:5000'}${STRIPE_CONFIG.cancelUrl}`,
      metadata: {
        printful_product_id: productId,
        printful_variant_id: variantId,
        ...metadata,
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'], // Adjust based on where Printful ships
      },
      phone_number_collection: {
        enabled: true,
      },
      customer_email: undefined, // Let customer enter their email
      billing_address_collection: 'required',
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw error;
  }
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    return null;
  }

  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return null;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event | null {
  if (!stripe) {
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    console.error('Webhook signature verification failed');
    return null;
  }
}

/**
 * Create a Printful order from Stripe checkout session
 */
export interface PrintfulOrderData {
  recipient: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
    phone?: string;
    email: string;
  };
  items: Array<{
    sync_variant_id?: number; // For sync products (pre-configured)
    variant_id?: number; // For catalog products (manual)
    quantity: number;
    files?: Array<{
      url: string;
    }>;
  }>;
}

export function createPrintfulOrderFromSession(
  session: Stripe.Checkout.Session
): PrintfulOrderData | null {
  if (!session.shipping_details || !session.customer_details) {
    return null;
  }

  const shipping = session.shipping_details;
  const customer = session.customer_details;

  const variantId = session.metadata?.printful_variant_id;
  if (!variantId) {
    return null;
  }

  return {
    recipient: {
      name: shipping.name || customer.name || 'Customer',
      address1: shipping.address?.line1 || '',
      address2: shipping.address?.line2,
      city: shipping.address?.city || '',
      state_code: shipping.address?.state || '',
      country_code: shipping.address?.country || 'US',
      zip: shipping.address?.postal_code || '',
      phone: customer.phone || undefined,
      email: customer.email || '',
    },
    items: [
      {
        sync_variant_id: parseInt(variantId), // Use sync_variant_id for synced products
        quantity: 1, // Get from line items if needed
      },
    ],
  };
}

/**
 * Submit order to Printful
 */
export async function createPrintfulOrder(orderData: PrintfulOrderData): Promise<{
  success: boolean;
  orderId?: number;
  error?: string;
}> {
  const apiKey = process.env.PRINTFUL_API_KEY;

  if (!apiKey) {
    console.error('Printful API key not configured');
    return { success: false, error: 'Printful not configured' };
  }

  try {
    console.log('🚀 Submitting order to Printful API...');
    console.log('Order data:', JSON.stringify(orderData, null, 2));
    
    const response = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await response.text();
    console.log(`Printful API response status: ${response.status}`);
    console.log(`Printful API response body: ${responseText}`);

    if (!response.ok) {
      console.error('Printful order creation failed:', response.status, responseText);
      return { 
        success: false, 
        error: `Printful API error: ${response.status}` 
      };
    }

    const data = JSON.parse(responseText);
    const orderId = data.result?.id;

    if (!orderId) {
      console.error('No order ID returned from Printful');
      return { success: false, error: 'No order ID returned' };
    }

    console.log(`✅ Printful order created successfully: ${orderId}`);
    return { success: true, orderId };

  } catch (error) {
    console.error('Error creating Printful order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get Printful order status
 */
export async function getPrintfulOrderStatus(orderId: number): Promise<{
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
} | null> {
  const apiKey = process.env.PRINTFUL_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`https://api.printful.com/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const order = data.result;

    return {
      status: order.status,
      trackingNumber: order.shipments?.[0]?.tracking_number,
      trackingUrl: order.shipments?.[0]?.tracking_url,
    };

  } catch (error) {
    console.error('Error fetching Printful order status:', error);
    return null;
  }
}
