# Shipping & Tax Calculation Fix

## 🐛 Problem

**Order #PF139617371 Analysis:**
- Customer paid: **$3.00**
- Printful charged us:
  - Product cost: $2.29
  - Shipping: $4.39
  - Tax: $0.17
  - **Total: $6.85**
- **Loss per order: $3.85** ❌

**Root Cause:** We're only charging the retail price, not including shipping/tax costs.

---

## ✅ Solutions (3 Options)

### Option 1: Printful Shipping Rates API (BEST) ⭐

**Use Printful's `/shipping/rates` endpoint to calculate exact costs**

```typescript
// Before creating Stripe checkout session
async function getPrintfulShippingEstimate(params: {
  recipient: Address;
  items: Array<{ sync_variant_id: number; quantity: number }>;
}): Promise<{ shipping: number; tax: number }> {
  
  const response = await fetch('https://api.printful.com/shipping/rates', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: params.recipient,
      items: params.items,
    }),
  });
  
  const data = await response.json();
  
  // Return cheapest shipping option
  const rates = data.result;
  const cheapest = rates.reduce((min, rate) => 
    rate.rate < min.rate ? rate : min
  );
  
  return {
    shipping: parseFloat(cheapest.rate),
    tax: data.result.taxes?.total || 0,
  };
}

// Use in checkout
const costs = await getPrintfulShippingEstimate({
  recipient: { address from checkout form },
  items: [{ sync_variant_id: 5130270457, quantity: 1 }],
});

const totalPrice = (
  retailPrice +           // $3.00
  costs.shipping +        // $4.39
  costs.tax               // $0.17
) * 100;  // Convert to cents → $7.56 = 756 cents
```

**Pros:**
- ✅ Most accurate pricing
- ✅ Real-time shipping rates
- ✅ Exact tax calculation
- ✅ Customer pays exactly what we pay

**Cons:**
- ⚠️ Requires customer address before checkout
- ⚠️ Extra API call (adds ~200ms)
- ⚠️ Need two-step checkout flow

---

### Option 2: Fixed Shipping Markup (QUICK) ⚡

**Add estimated shipping to product price**

```typescript
// Simple markup calculation
const SHIPPING_ESTIMATE = 4.50;  // Covers most US shipping
const TAX_ESTIMATE_PERCENT = 0.07;  // 7% average US tax

function calculateTotalPrice(retailPrice: number): number {
  const shipping = SHIPPING_ESTIMATE;
  const tax = (retailPrice + shipping) * TAX_ESTIMATE_PERCENT;
  
  return Math.ceil((retailPrice + shipping + tax) * 100);
}

// Example: $3.00 sticker
const price = calculateTotalPrice(3.00);
// → $3.00 + $4.50 + $0.53 = $8.03 (rounded up)
```

**Pros:**
- ✅ Simple to implement
- ✅ No extra API calls
- ✅ Works with existing checkout flow

**Cons:**
- ⚠️ May overcharge some customers
- ⚠️ May undercharge on international orders
- ⚠️ Less accurate

---

### Option 3: Stripe Automatic Tax + Shipping (HYBRID) 🎯

**Use Stripe's built-in tax calculation + flat shipping**

```typescript
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: 'Sticker' },
      unit_amount: 300,  // $3.00 retail price only
    },
    quantity: 1,
  }],
  
  // Add shipping rate
  shipping_options: [{
    shipping_rate_data: {
      display_name: 'Standard Shipping',
      type: 'fixed_amount',
      fixed_amount: {
        amount: 450,  // $4.50
        currency: 'usd',
      },
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 5 },
        maximum: { unit: 'business_day', value: 7 },
      },
    },
  }],
  
  // Automatic tax calculation
  automatic_tax: {
    enabled: true,
  },
  
  mode: 'payment',
  // ...
});
```

**Pros:**
- ✅ Stripe handles tax calculation
- ✅ Customer sees breakdown (product + shipping + tax)
- ✅ Looks professional

**Cons:**
- ⚠️ Requires Stripe Tax to be enabled
- ⚠️ Fixed shipping (not based on weight/destination)
- ⚠️ May not match Printful's exact shipping cost

---

## 🎯 Recommended Approach

### Immediate Fix (Option 2): Add Shipping Markup

**Why:** Quick to implement, prevents further losses

```typescript
// server/stripe.ts - Update createCheckoutSession

export async function createCheckoutSession(params: {
  productId: string;
  variantId: string;
  productName: string;
  price: number;  // Current retail price (e.g., 300 for $3.00)
  // ...
}) {
  
  // Calculate total with shipping + tax
  const ESTIMATED_SHIPPING = 450;  // $4.50 in cents
  const TAX_RATE = 0.07;  // 7% estimated tax
  
  const subtotal = params.price + ESTIMATED_SHIPPING;
  const tax = Math.ceil(subtotal * TAX_RATE);
  const totalAmount = subtotal + tax;
  
  console.log(`💰 Price Breakdown:
    Retail: $${(params.price / 100).toFixed(2)}
    Shipping: $${(ESTIMATED_SHIPPING / 100).toFixed(2)}
    Tax (est): $${(tax / 100).toFixed(2)}
    Total: $${(totalAmount / 100).toFixed(2)}
  `);
  
  return await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${productName} (includes shipping)`,  // Clarify price includes shipping
          // ...
        },
        unit_amount: totalAmount,  // Use total, not just retail price
      },
      quantity: params.quantity,
    }],
    // ...
  });
}
```

**Result for $3.00 sticker:**
- Retail: $3.00
- Shipping: $4.50
- Tax (7%): $0.53
- **Customer pays: $8.03** ✅
- Printful charges: ~$6.85
- **Profit margin: $1.18** ✅

---

### Long-term Solution (Option 1): Printful Shipping API

1. Add address form before "Buy Now"
2. Call Printful shipping API with address
3. Show exact shipping cost
4. Create Stripe session with accurate total

**Implementation timeline:** 2-3 hours

---

## 📊 Cost Breakdown Analysis

### Current Situation (Losing Money):
| Item | Customer Pays | Printful Charges | Your Loss |
|------|--------------|------------------|-----------|
| Sticker | $3.00 | $6.85 | -$3.85 |

### With Shipping Markup (Fixed):
| Item | Customer Pays | Printful Charges | Your Profit |
|------|--------------|------------------|-------------|
| Sticker | $8.03 | $6.85 | +$1.18 |

### With Printful API (Exact):
| Item | Customer Pays | Printful Charges | Your Profit |
|------|--------------|------------------|-------------|
| Sticker | $7.56 | $6.85 | +$0.71 |

---

## 🚀 Implementation Steps

### Quick Fix (30 minutes):

1. **Update `server/stripe.ts`:**
   ```typescript
   const SHIPPING_ESTIMATE = 450;  // $4.50
   const TAX_RATE = 0.07;
   
   const subtotal = params.price + SHIPPING_ESTIMATE;
   const tax = Math.ceil(subtotal * TAX_RATE);
   const totalAmount = subtotal + tax;
   ```

2. **Update product description:**
   ```typescript
   product_data: {
     name: `${productName} (includes shipping & tax)`,
   }
   ```

3. **Test checkout:**
   - Verify price shows $8.03 for $3.00 sticker
   - Complete test order
   - Confirm profitability

4. **Deploy immediately** ⚡

---

### Complete Solution (2-3 hours):

1. **Add Printful shipping estimation function**
2. **Implement address collection before checkout**
3. **Call shipping API to get exact costs**
4. **Display breakdown to customer**
5. **Create Stripe session with accurate total**

---

## ⚠️ Important Notes

### Shipping Varies By:
- **Destination** (US vs International)
- **Product weight** (sticker vs hoodie)
- **Shipping method** (standard vs express)
- **Carrier** (USPS vs UPS)

**Sticker shipping typically:**
- US: $4.00 - $5.00
- Canada: $8.00 - $10.00
- International: $12.00 - $15.00

### Tax Varies By:
- **State** (0% to 10%)
- **Product type** (some states exempt clothing)
- **Tax nexus** (Printful handles this)

**Recommendation:** Use 7-8% as safe estimate for US orders.

---

## 📋 Testing Checklist

- [ ] Update pricing calculation
- [ ] Test $3.00 sticker shows $8.03 total
- [ ] Complete test order
- [ ] Verify Printful order creation
- [ ] Check profit margin
- [ ] Update product descriptions
- [ ] Document pricing strategy
- [ ] Deploy to production

---

**Created:** January 3, 2026  
**Priority:** CRITICAL 🚨  
**Impact:** Currently losing $3.85 per order  
**Immediate Action:** Implement Option 2 (shipping markup)
