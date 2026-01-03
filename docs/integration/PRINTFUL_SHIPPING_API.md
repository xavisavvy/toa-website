# Printful Shipping API Integration - Implementation Guide

## 🎯 Overview

This document explains the **proper** implementation of Printful shipping and tax calculation using their Shipping Rates API. This gives customers **exact** costs instead of estimates.

---

## 🏗️ Architecture

### Two-Step Checkout Flow

```
Step 1: Customer enters shipping address
         ↓
Step 2: Call Printful Shipping API
         ↓
Step 3: Display exact costs to customer
         ↓
Step 4: Create Stripe checkout with exact amounts
         ↓
Step 5: Customer completes payment
```

---

## 📡 API Endpoints

### 1. Calculate Shipping Estimate

**Endpoint:** `POST /api/printful/shipping-estimate`

**Purpose:** Get exact shipping and tax costs from Printful before checkout

**Request Body:**
```json
{
  "variantId": "5130270457",
  "quantity": 1,
  "recipient": {
    "address1": "526 E 200 S",
    "address2": null,
    "city": "Clearfield",
    "state_code": "UT",
    "country_code": "US",
    "zip": "84015"
  }
}
```

**Response:**
```json
{
  "shipping": 4.39,
  "tax": 0.17,
  "rates": [{
    "id": "STANDARD",
    "name": "Flat Rate (Estimated delivery: Feb 2)",
    "rate": "4.39",
    "currency": "USD",
    "min_delivery_days": 5,
    "max_delivery_days": 7
  }],
  "costs": {
    "subtotal": "2.29",
    "shipping": "4.39",
    "tax": "0.00",
    "vat": "0.17",
    "total": "6.85"
  }
}
```

---

### 2. Create Checkout with Shipping

**Endpoint:** `POST /api/stripe/create-checkout`

**Purpose:** Create Stripe checkout session with exact Printful costs

**Request Body (WITH shipping data):**
```json
{
  "productId": "123",
  "variantId": "5130270457",
  "productName": "Pika-Bolt Sticker",
  "price": "3.00",
  "quantity": 1,
  "imageUrl": "https://...",
  "shipping": {
    "shipping": 4.39,
    "tax": 0.17
  }
}
```

**Request Body (WITHOUT shipping - uses estimates):**
```json
{
  "productId": "123",
  "variantId": "5130270457",
  "productName": "Pika-Bolt Sticker",
  "price": "3.00",
  "quantity": 1,
  "imageUrl": "https://..."
  // No shipping field = falls back to estimates
}
```

**Response:**
```json
{
  "sessionId": "cs_live_...",
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

---

## 🔧 Implementation

### Backend Functions

#### 1. `getPrintfulShippingEstimate()`

Located in: `server/printful.ts`

```typescript
export async function getPrintfulShippingEstimate(params: {
  recipient: {
    address1: string;
    address2?: string | null;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
  };
  items: Array<{
    sync_variant_id: number;
    quantity: number;
  }>;
}): Promise<PrintfulShippingEstimate | null>
```

**What it does:**
- Calls Printful's `/shipping/rates` API
- Returns exact shipping cost and tax for the address
- Provides multiple shipping options (we use cheapest)
- Includes delivery time estimates

**Example usage:**
```typescript
const estimate = await getPrintfulShippingEstimate({
  recipient: {
    address1: "526 E 200 S",
    city: "Clearfield",
    state_code: "UT",
    country_code: "US",
    zip: "84015"
  },
  items: [{
    sync_variant_id: 5130270457,
    quantity: 1
  }]
});

// estimate.shipping = 4.39
// estimate.tax = 0.17
```

---

#### 2. Updated `createCheckoutSession()`

Located in: `server/stripe.ts`

```typescript
export async function createCheckoutSession(params: {
  productId: string;
  variantId: string;
  productName: string;
  price: number;
  quantity: number;
  shippingEstimate?: {  // ← NEW: Optional Printful data
    shipping: number;
    tax: number;
  };
  // ... other params
}): Promise<Stripe.Checkout.Session | null>
```

**What changed:**
- Added optional `shippingEstimate` parameter
- If provided: Uses **exact** Printful costs
- If NOT provided: Falls back to **estimated** costs ($4.50 shipping + 7% tax)
- Logs which pricing method was used

**Pricing logic:**
```typescript
if (shippingEstimate) {
  // Use EXACT costs from Printful
  shippingCents = Math.round(shippingEstimate.shipping * 100);
  taxCents = Math.round(shippingEstimate.tax * 100);
  priceSource = 'Printful API (exact)';
} else {
  // Use ESTIMATES (fallback)
  shippingCents = 450;  // $4.50
  taxCents = Math.ceil((retailPrice + shippingCents) * 0.07);
  priceSource = 'Estimated (fallback)';
}

totalAmount = retailPrice + shippingCents + taxCents;
```

---

## 🎨 Frontend Integration

### Example: Product Page with Shipping Calculator

```typescript
// 1. Customer fills out shipping form
const shippingAddress = {
  address1: "526 E 200 S",
  city: "Clearfield",
  state_code: "UT",
  country_code: "US",
  zip: "84015"
};

// 2. Calculate shipping from Printful
const shippingResponse = await fetch('/api/printful/shipping-estimate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variantId: '5130270457',
    quantity: 1,
    recipient: shippingAddress
  })
});

const shipping = await shippingResponse.json();

// 3. Display breakdown to customer
console.log(`
  Product: $3.00
  Shipping: $${shipping.shipping.toFixed(2)}
  Tax: $${shipping.tax.toFixed(2)}
  ───────────────
  Total: $${(3.00 + shipping.shipping + shipping.tax).toFixed(2)}
`);

// 4. Create checkout with exact costs
const checkoutResponse = await fetch('/api/stripe/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: '123',
    variantId: '5130270457',
    productName: 'Pika-Bolt Sticker',
    price: '3.00',
    quantity: 1,
    shipping: {  // Include Printful's exact costs
      shipping: shipping.shipping,
      tax: shipping.tax
    }
  })
});

const { url } = await checkoutResponse.json();

// 5. Redirect to Stripe checkout
window.location.href = url;
```

---

## 💰 Price Comparison

### Before (Estimates Only)
| Component | Amount | Source |
|-----------|--------|--------|
| Product | $3.00 | Fixed |
| Shipping | $4.50 | **Estimated** |
| Tax | $0.53 | **Estimated (7%)** |
| **Total** | **$8.03** | - |

**Problems:**
- Might overcharge some customers
- Might undercharge international orders
- Not transparent

---

### After (Printful API)
| Component | Amount | Source |
|-----------|--------|--------|
| Product | $3.00 | Fixed |
| Shipping | $4.39 | **Printful API** ✅ |
| Tax | $0.17 | **Printful API** ✅ |
| **Total** | **$7.56** | - |

**Benefits:**
- ✅ Exact costs
- ✅ Matches what Printful charges us
- ✅ Transparent to customer
- ✅ No surprises

---

## 🧪 Testing

### Unit Tests

Located in: `test/routes/printful-shipping.test.ts`

**Tests:**
1. ✅ Calculate shipping for valid address
2. ✅ Return 400 for missing variantId
3. ✅ Return 400 for incomplete address
4. ✅ Use Printful shipping in Stripe checkout

**Run tests:**
```bash
npm test -- printful-shipping
```

---

### Manual Testing

**1. Test Shipping Estimate API:**
```bash
curl -X POST http://localhost:5000/api/printful/shipping-estimate \
  -H "Content-Type: application/json" \
  -d '{
    "variantId": "5130270457",
    "quantity": 1,
    "recipient": {
      "address1": "526 E 200 S",
      "city": "Clearfield",
      "state_code": "UT",
      "country_code": "US",
      "zip": "84015"
    }
  }'
```

**Expected Response:**
```json
{
  "shipping": 4.39,
  "tax": 0.17,
  "rates": [...]
}
```

**2. Test Checkout with Shipping:**
```bash
curl -X POST http://localhost:5000/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "123",
    "variantId": "5130270457",
    "productName": "Test Sticker",
    "price": "3.00",
    "quantity": 1,
    "shipping": {
      "shipping": 4.39,
      "tax": 0.17
    }
  }'
```

**Expected Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

---

## 🚀 Deployment Checklist

- [x] Add `getPrintfulShippingEstimate()` function
- [x] Update `createCheckoutSession()` to accept shipping data
- [x] Add `/api/printful/shipping-estimate` endpoint
- [x] Update `/api/stripe/create-checkout` to accept shipping
- [x] Add unit tests
- [ ] Update frontend to collect shipping address
- [ ] Add shipping calculator to product page
- [ ] Display cost breakdown to customers
- [ ] Update checkout flow
- [ ] Test with real Printful products
- [ ] Deploy to production

---

## 📊 Monitoring

### Logs to Watch

**Successful shipping calculation:**
```
📦 Calculating shipping rates from Printful...
Recipient: Clearfield UT
Items: [ { sync_variant_id: 5130270457, quantity: 1 } ]
✅ Printful shipping response received
💰 Shipping Breakdown from Printful:
  Shipping Method: Flat Rate
  Shipping Cost: $4.39
  Tax/VAT: $0.17
  Delivery: 5-7 business days
```

**Checkout with exact costs:**
```
💰 Checkout Price Calculation (Printful API (exact)):
  Product: $3.00
  Shipping: $4.39
  Tax: $0.17
  ────────────────────────
  Total: $7.56
```

**Checkout with estimates (fallback):**
```
💰 Checkout Price Calculation (Estimated (fallback)):
  Product: $3.00
  Shipping: $4.50
  Tax: $0.53
  ────────────────────────
  Total: $8.03
```

---

## ⚠️ Error Handling

### Printful API Failures

If Printful's shipping API fails:
1. System falls back to estimated costs
2. Logs warning message
3. Customer still completes checkout
4. Prevents checkout failures

```typescript
const estimate = await getPrintfulShippingEstimate(params);

if (!estimate) {
  // Fallback to estimates
  console.warn('Printful shipping API failed, using estimates');
  // Checkout continues with $4.50 + 7% tax
}
```

---

## 📈 Future Enhancements

1. **Multiple Shipping Options**
   - Let customer choose shipping speed
   - Express vs Standard
   - Different carriers

2. **International Shipping**
   - Different rates for different countries
   - Currency conversion
   - Customs information

3. **Shipping Insurance**
   - Optional add-on
   - Calculated by Printful

4. **Bulk Discounts**
   - Calculate shipping for multiple items
   - Potential savings

---

## 🎓 Key Learnings

1. **Always use Printful's Shipping API** for exact costs
2. **Collect address before checkout** to calculate shipping
3. **Show breakdown** to customers (product + shipping + tax)
4. **Have fallback estimates** in case API fails
5. **Log pricing source** for debugging

---

**Document Created:** January 3, 2026  
**Purpose:** Complete guide for Printful Shipping API integration  
**Status:** Implemented and tested ✅  
**Next:** Frontend integration needed
