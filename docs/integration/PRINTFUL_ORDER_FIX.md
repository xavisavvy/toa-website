# Printful Order Creation Fix

## 🐛 Problem

When processing Stripe webhooks for completed checkouts, Printful was rejecting orders with this error:

```
Item 0: Item can't be submitted without any print files
```

**Root Cause:** Printful requires **print files** (mockup design images) to be included with each order item, not just the variant ID.

---

## ✅ Solution

Updated the Stripe webhook handler to fetch and include print files from the sync variant before creating Printful orders.

### Changes Made:

#### 1. **Updated PrintfulOrderData Interface** (`server/stripe.ts`)
```typescript
export interface PrintfulOrderData {
  recipient: { /* ... */ };
  items: Array<{
    variant_id: number;
    quantity: number;
    files?: Array<{      // ← Added files array
      url: string;
    }>;
  }>;
}
```

#### 2. **Added getSyncVariantFiles Function** (`server/printful.ts`)
```typescript
export async function getSyncVariantFiles(syncVariantId: string): Promise<Array<{ url: string }> | null> {
  // Fetches mockup images from Printful API
  // Returns array of file URLs for the sync variant
}
```

#### 3. **Updated Webhook Handler** (`server/routes.ts`)
```typescript
// Before
orderData.items = orderData.items.map(item => ({
  ...item,
  variant_id: catalogVariantId  // Missing files!
}));

// After
const printFiles = await getSyncVariantFiles(syncVariantId);
orderData.items = orderData.items.map(item => ({
  ...item,
  variant_id: catalogVariantId,
  files: printFiles,  // ✅ Include print files
}));
```

#### 4. **Updated Tests** (`test/routes/stripe-routes.test.ts`)
```typescript
vi.mock('../../server/printful', () => ({
  getCatalogVariantId: vi.fn(() => Promise.resolve(9876)),
  getSyncVariantFiles: vi.fn(() => Promise.resolve([
    { url: 'https://files.printful.com/mockup-1.jpg' },
    { url: 'https://files.printful.com/mockup-2.jpg' },
  ])),
}));
```

---

## 🔍 How It Works Now

### Order Creation Flow:

```
1. Stripe checkout completes
   ↓
2. Webhook received with sync variant ID (12345)
   ↓
3. Fetch catalog variant ID from Printful (9876)
   ↓
4. Fetch print files from sync variant ← NEW STEP
   ↓
5. Create order with:
   - catalog_variant_id: 9876
   - files: [
       { url: "https://files.printful.com/mockup-1.jpg" },
       { url: "https://files.printful.com/mockup-2.jpg" }
     ]
   ↓
6. Printful accepts order ✅
```

### Sample Order Payload:

```json
{
  "recipient": {
    "name": "Preston Farr",
    "email": "xavierproductions05@gmail.com",
    "address1": "526 E 200 S",
    "city": "Clearfield",
    "state_code": "UT",
    "country_code": "US",
    "zip": "84015",
    "phone": "+18162670838"
  },
  "items": [
    {
      "variant_id": 10163,
      "quantity": 1,
      "files": [
        { "url": "https://files.printful.com/mockup-1.jpg" },
        { "url": "https://files.printful.com/mockup-2.jpg" }
      ]
    }
  ]
}
```

---

## 📋 Error Handling

The fix includes comprehensive error handling:

### If Files Are Missing:
```
❌ No print files found for sync variant 12345
⚠️  CRITICAL: Cannot create Printful order without print files
This means the product mockup images are not configured in Printful

📋 Manual Action Required:
   1. Go to Printful Dashboard → Stores → Manage
   2. Find the product and click "Edit"
   3. Ensure mockup images are generated and saved
   4. Manually create order for: customer@example.com
✅ Webhook acknowledged, but order needs manual fulfillment
```

### If Variant ID Resolution Fails:
```
❌ Could not resolve catalog variant ID for sync variant 12345
⚠️  CRITICAL: Payment was successful but order cannot be auto-fulfilled

📋 Manual Action Required:
   - Check session: https://dashboard.stripe.com/payments/cs_123
   - Check variant: https://api.printful.com/store/variants/12345
   - Manually create Printful order
```

---

## ✅ Testing

All tests pass with the new implementation:

```bash
npm test -- routes/stripe --run
# ✓ All 8 tests passing
```

**Test Coverage:**
- ✅ Mock file fetching
- ✅ Verify files included in order payload
- ✅ Validate successful order creation
- ✅ Error handling for missing files

---

## 🚀 Deployment

The fix is ready for deployment. Next time a customer completes checkout:

1. Webhook will be received
2. Print files will be fetched automatically
3. Order will be created in Printful with all required data
4. Order will be fulfilled and shipped by Printful

---

## 📝 What You Need in Printful Dashboard

For this to work, ensure your Printful products have:

1. **Sync Products Created**
   - Go to: Printful Dashboard → Stores → Manage
   
2. **Mockup Images Configured**
   - Each product must have mockup images generated
   - Files must be marked as "visible" and status "ok"
   
3. **Variants Synced**
   - Variants must be synced (not ignored)
   - Each variant should have associated mockup files

---

## 🔄 Testing the Fix

### To test in production:

1. Complete a test checkout with Stripe
2. Check server logs for:
   ```
   📸 Fetching files for sync variant: 12345
   ✅ Found 2 print file(s) for variant
   📦 Creating Printful order...
   ✅ Printful order created successfully! Order ID: 98765
   ```
3. Verify order appears in Printful Dashboard
4. Check that order has mockup images attached

### If it fails:

Check the error message in logs - it will tell you exactly what's missing:
- No print files? → Configure mockups in Printful
- Invalid variant? → Check product is synced
- API error? → Verify API key has correct permissions

---

**Fixed By:** AI Assistant (GitHub Copilot)  
**Date:** January 2, 2026  
**Files Changed:** 3 (server/stripe.ts, server/printful.ts, server/routes.ts, test/routes/stripe-routes.test.ts)  
**Tests:** 8/8 passing ✅

You can now redeploy and resend the webhook to test the fix!
