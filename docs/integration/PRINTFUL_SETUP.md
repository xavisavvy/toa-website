# Printful Setup Guide

This document provides quick-start instructions for Printful integration. For complete documentation, see `E-COMMERCE_GUIDE.md`.

## Quick Setup

### 1. Create Printful Account
1. Go to [Printful.com](https://www.printful.com)
2. Sign up for a free account
3. Complete business verification

### 2. Create Products
1. Dashboard → Products → Add Product
2. Choose product type (t-shirt, hoodie, etc.)
3. Upload designs
4. Set retail pricing
5. **Important:** Click "Sync to Store" to make products available via API

### 3. Get API Key
1. Dashboard → Settings → Stores
2. Select your store
3. Click "Add API Access"
4. Copy the API key
5. Add to `.env`:
   ```bash
   PRINTFUL_API_KEY=your_key_here
   ```

### 4. Test Integration
```bash
# Start dev server
npm run dev

# Visit shop page
http://localhost:5000/shop

# Verify products load
```

## Product Sync Requirements

Products MUST be synced to appear via API:
- Each product needs at least one variant (size, color)
- Products must have retail pricing set
- Product status must be "Active"
- Images should be high-quality (at least 1000px)

## API Endpoints

Our integration uses:
- `GET /store/products` - Fetch synced products
- `GET /store/products/{id}` - Get product details
- `POST /orders` - Create order (Phase 2)

## Caching

Products are cached for 1 hour to reduce API calls:
- First request fetches from Printful
- Subsequent requests use cache
- Cache expires after 1 hour
- Stale cache used if API fails

## Troubleshooting

### Products Not Showing
1. Verify products are synced in Printful Dashboard
2. Check API key is correct
3. View server logs for errors
4. Test API directly:
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" \
        https://api.printful.com/store/products
   ```

### Image Issues
- Use high-resolution images (1000px+)
- Supported formats: PNG, JPG
- Max file size: 20MB
- Use transparent backgrounds for best results

## Resources

- [Printful API Documentation](https://developers.printful.com/)
- [Product Creation Guide](https://help.printful.com/hc/en-us/sections/360003663593-Creating-Products)
- Complete integration docs: `E-COMMERCE_GUIDE.md`

