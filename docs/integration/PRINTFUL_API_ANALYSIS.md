# Printful API Analysis & Order Creation Methods

## 📚 Printful API Documentation Review

Based on Printful's official API documentation at `https://developers.printful.com/docs/`

---

## 🔍 Two Ways to Create Orders

### Method 1: Using Sync Variant ID (`sync_variant_id`)
**For:** Products already synced in your Printful store

```json
POST https://api.printful.com/orders
{
  "recipient": { ... },
  "items": [
    {
      "sync_variant_id": 5130270457,
      "quantity": 1
    }
  ]
}
```

**Characteristics:**
- ✅ Uses sync variant ID (from your Printful store)
- ✅ Files already associated in Printful dashboard
- ✅ **NO files array needed**
- ✅ Simpler payload
- ✅ Recommended for synced products

**Requirements:**
1. Product must exist in your Printful store
2. Product must be "synced" (not ignored)
3. Mockup images must be generated in Printful dashboard
4. Files are automatically pulled from sync product

---

### Method 2: Using Catalog Variant ID (`variant_id` + `files`)
**For:** One-off custom orders with manual file upload

```json
POST https://api.printful.com/orders
{
  "recipient": { ... },
  "items": [
    {
      "variant_id": 10163,
      "quantity": 1,
      "files": [
        {
          "url": "https://yourserver.com/design.png"
        }
      ]
    }
  ]
}
```

**Characteristics:**
- ⚠️ Uses catalog variant ID (global Printful catalog)
- ⚠️ **REQUIRES files array** with publicly accessible URLs
- ⚠️ More complex
- ⚠️ Files must be hosted and accessible
- ⚠️ Used for custom/manual orders

**Requirements:**
1. Files must be PNG/JPG/PDF
2. Files must be publicly accessible URLs
3. Files must meet Printful's size/DPI requirements
4. Files are NOT stored in your Printful account

---

## ⚠️ Common Mistakes & What We Had Wrong

### ❌ MISTAKE #1: Mixing Both Methods
```typescript
// WRONG - Can't mix sync_variant_id with files
{
  sync_variant_id: 5130270457,
  files: [...]  // ← Files ignored when using sync_variant_id
}
```

### ❌ MISTAKE #2: Using variant_id WITHOUT Files
```typescript
// WRONG - variant_id requires files array
{
  variant_id: 10163,
  // Missing files! This is what caused the "no print files" error
}
```

### ❌ MISTAKE #3: Fetching Files from Sync Variant for Catalog Order
```typescript
// WRONG APPROACH (what we tried before)
const syncVariant = await fetch(`/store/variants/${syncId}`);
const files = syncVariant.files;  // URLs might be null!

// Create order with catalog variant + those files
{
  variant_id: catalogId,  // Using catalog ID
  files: files  // Files from sync variant (may have null URLs)
}
```

**Why this failed:**
- Sync variant files are for mockup display, not order submission
- File URLs can be `null` (especially for PDFs)
- These files are internal to Printful, not meant for API submission

---

## ✅ CORRECT APPROACH: Use Sync Variant ID Only

### What We're Doing Now:

```typescript
// Get sync variant ID from Stripe metadata
const syncVariantId = session.metadata.printful_variant_id;  // "5130270457"

// Create order with sync_variant_id (NO FILES NEEDED)
const orderData = {
  recipient: { ... },
  items: [
    {
      sync_variant_id: parseInt(syncVariantId),  // Just the sync ID
      quantity: 1
      // NO files array!
    }
  ]
};

await createPrintfulOrder(orderData);
```

**Why this works:**
1. ✅ Product already exists in Printful store
2. ✅ Mockup files already configured in dashboard
3. ✅ Printful automatically uses the associated files
4. ✅ No need to fetch/provide file URLs

---

## 📊 API Endpoints We Use

### 1. List Sync Products
```
GET https://api.printful.com/store/products
```
Returns all products in your store with sync variant IDs

### 2. Get Sync Variant Details
```
GET https://api.printful.com/store/variants/{sync_variant_id}
```
Returns variant info including:
- `sync_variant_id`: e.g., 5130270457 (use for orders)
- `variant_id`: e.g., 10163 (catalog ID - DON'T use for synced products)
- `product.variant_id`: Same as above
- `files`: Mockup images (for display, not for orders)

### 3. Create Order
```
POST https://api.printful.com/orders
```
Accepts either:
- `sync_variant_id` (synced products - what we use)
- `variant_id` + `files` (custom orders - we don't use this)

---

## 🔄 Evolution of Our Implementation

### Version 1: Wrong Approach ❌
```typescript
// Used catalog variant_id without files
{
  variant_id: 10163,  // Catalog ID
  // Missing files → ERROR: "no print files"
}
```
**Error:** "Item can't be submitted without any print files"

### Version 2: Still Wrong ❌
```typescript
// Tried to fetch files from sync variant
const files = await getSyncVariantFiles(syncId);

{
  variant_id: 10163,  // Still using catalog ID
  files: files  // Files with null URLs → ERROR
}
```
**Error:** Files had `url: null`, still failed

### Version 3: CORRECT ✅
```typescript
// Use sync_variant_id, no files needed
{
  sync_variant_id: 5130270457,  // Sync ID
  quantity: 1
  // NO files field at all!
}
```
**Success!** Printful handles files automatically

---

## 🎯 Key Insights

### Sync Variant vs Catalog Variant

| Aspect | Sync Variant | Catalog Variant |
|--------|--------------|-----------------|
| **ID Example** | 5130270457 | 10163 |
| **Source** | Your Printful store | Global Printful catalog |
| **Files** | Pre-configured | Must provide |
| **Field Name** | `sync_variant_id` | `variant_id` |
| **Use Case** | Store products | Custom orders |
| **Our Usage** | ✅ YES | ❌ NO |

### Why We Confused Them

1. The sync variant API response includes BOTH IDs:
   ```json
   {
     "id": 5130270457,  // ← sync_variant_id
     "variant_id": 10163,  // ← catalog variant_id
     "product": {
       "variant_id": 10163  // ← same catalog ID
     }
   }
   ```

2. We were extracting `variant.product.variant_id` (catalog ID)
   instead of using the sync variant ID directly

3. We thought we needed to "convert" sync to catalog
   - **Reality:** For synced products, use sync ID directly!

---

## 📋 Checklist for Printful Orders

### Before Creating Order:
- [ ] Product synced in Printful dashboard
- [ ] Mockup images generated and visible
- [ ] Variant not marked as "ignored"
- [ ] Sync variant ID stored in Stripe metadata

### Order Payload:
- [ ] Use `sync_variant_id` (NOT `variant_id`)
- [ ] Do NOT include `files` array
- [ ] Include complete recipient address
- [ ] Include recipient email

### After Order Creation:
- [ ] Check order appears in Printful dashboard
- [ ] Verify order has correct mockup images
- [ ] Monitor order status through API

---

## 🧪 Testing Recommendations

### Test Case 1: Successful Order
```bash
# Send webhook with valid sync variant
# Expected: Order created successfully
# Log: "✅ Printful order created successfully!"
```

### Test Case 2: Missing Sync Variant
```bash
# Send webhook with non-existent sync variant
# Expected: Graceful error with manual action steps
# Log: "❌ Could not resolve catalog variant ID"
```

### Test Case 3: Unsynced Product
```bash
# Product exists but is marked "ignored"
# Expected: Error with instructions to sync
# Log: Product info with is_ignored: true
```

---

## 📝 Current Implementation Status

### ✅ What's Correct:
- Using `sync_variant_id` in order payload
- NOT including files array
- Proper error handling
- Idempotency protection

### ⚠️ Potential Issues:
- We still fetch `getCatalogVariantId()` but don't use it
  - This is just for logging/debugging now
  - Can be removed to simplify code
  
### 🔧 Recommended Cleanup:
```typescript
// REMOVE: No longer needed
const catalogVariantId = await resolveCatalogVariantId(syncVariantId);

// KEEP: This is what we actually use
const orderData = createPrintfulOrderFromSession(fullSession);
// orderData.items[0].sync_variant_id is already set correctly
```

---

## 🎓 Lessons Learned

1. **Read the API docs carefully** - Don't assume how an API works
2. **Sync products != Custom products** - They use different fields
3. **Files in API response != Files for order** - Display vs submission
4. **Simpler is better** - Using sync_variant_id is much simpler than variant_id + files
5. **Test with real data** - Mock tests can hide incorrect assumptions

---

## 📚 References

- Printful API Docs: https://developers.printful.com/docs/
- Create Order: https://developers.printful.com/docs/#tag/Orders-API/operation/createOrder
- Sync Products: https://developers.printful.com/docs/#tag/Store-Product-Information-API

---

**Document Created:** January 3, 2026  
**Purpose:** Comprehensive understanding of Printful order creation  
**Status:** Current implementation is CORRECT ✅
