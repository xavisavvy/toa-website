import type Stripe from 'stripe';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const sessionsCreate = vi.fn();

vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: sessionsCreate, retrieve: vi.fn() } };
  },
}));

let createCheckoutSession: typeof import('../../server/stripe').createCheckoutSession;
let getPaidQuantity: typeof import('../../server/stripe').getPaidQuantity;

beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
  ({ createCheckoutSession, getPaidQuantity } = await import('../../server/stripe'));
});

// Shipping and tax used to be folded into unit_amount, which Stripe then
// multiplied by the quantity: qty 3 was charged ~9x the price plus 3x
// shipping, while Printful shipped a single item.
describe('createCheckoutSession charge structure', () => {
  beforeEach(() => {
    sessionsCreate.mockReset();
    sessionsCreate.mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/x' });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('charges the product per unit and shipping plus tax once', async () => {
    await createCheckoutSession({
      productId: '1',
      variantId: '2',
      productName: 'Shirt - M',
      price: 2500,
      quantity: 3,
      shippingEstimate: { shipping: 4.39, tax: 0.5 },
    });

    const params = sessionsCreate.mock.calls[0][0];
    expect(params.line_items).toHaveLength(1);
    expect(params.line_items[0].price_data.unit_amount).toBe(2500);
    expect(params.line_items[0].quantity).toBe(3);
    expect(params.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(439 + 50);
    expect(params.metadata).toMatchObject({ printful_variant_id: '2', quantity: '3' });
  });

  it('bases the fallback tax on the whole order', async () => {
    await createCheckoutSession({
      productId: '1',
      variantId: '2',
      productName: 'Shirt - M',
      price: 1000,
      quantity: 2,
    });

    const params = sessionsCreate.mock.calls[0][0];
    // $4.50 shipping + 7% of ($20.00 + $4.50)
    expect(params.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(450 + Math.ceil(2450 * 0.07));
  });

  it('does not let caller metadata override the server-set variant or quantity', async () => {
    await createCheckoutSession({
      productId: '1',
      variantId: '2',
      productName: 'Shirt - M',
      price: 1000,
      quantity: 1,
      metadata: { printful_variant_id: '999', quantity: '10' },
    });

    expect(sessionsCreate.mock.calls[0][0].metadata).toMatchObject({ printful_variant_id: '2', quantity: '1' });
  });
});

describe('getPaidQuantity', () => {
  const session = (overrides: Partial<Stripe.Checkout.Session>) => overrides as Stripe.Checkout.Session;

  it('prefers the paid line item quantity', () => {
    expect(getPaidQuantity(session({
      line_items: { data: [{ quantity: 3 }] } as unknown as Stripe.ApiList<Stripe.LineItem>,
      metadata: { quantity: '1' },
    }))).toBe(3);
  });

  it('falls back to server-set metadata, then 1', () => {
    expect(getPaidQuantity(session({ metadata: { quantity: '2' } }))).toBe(2);
    expect(getPaidQuantity(session({ metadata: {} }))).toBe(1);
  });

  it('clamps to the checkout limits', () => {
    expect(getPaidQuantity(session({ metadata: { quantity: '500' } }))).toBe(10);
    expect(getPaidQuantity(session({ metadata: { quantity: '0' } }))).toBe(1);
  });
});
