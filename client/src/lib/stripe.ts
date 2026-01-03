import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    // Fetch publishable key from server
    stripePromise = fetch('/api/stripe/config')
      .then(res => res.json())
      .then(data => loadStripe(data.publishableKey))
      .catch(error => {
        console.error('Failed to load Stripe:', error);
        return null;
      });
  }
  return stripePromise;
};

export interface CheckoutParams {
  productId: string;
  variantId: string;
  productName: string;
  price: string; // e.g., "24.99"
  quantity?: number;
  imageUrl?: string;
  zipCode?: string;
  shipping?: number;
  tax?: number;
}

export async function createCheckout(params: CheckoutParams): Promise<{ url: string } | null> {
  try {
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    return { url: data.url };
  } catch (error) {
    console.error('Checkout error:', error);
    return null;
  }
}

export async function getCheckoutSession(sessionId: string) {
  try {
    const response = await fetch(`/api/stripe/checkout/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}
