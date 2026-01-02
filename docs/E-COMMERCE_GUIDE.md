# E-Commerce Integration Guide

Complete guide for the Printful + Stripe e-commerce implementation.

## 🎯 Overview

This integration provides a complete e-commerce solution:
- **Printful** for product management and fulfillment
- **Stripe** for secure payment processing
- **Automated workflow** from purchase to shipment

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Setup Guide](#setup-guide)
3. [Testing](#testing)
4. [Production Deployment](#production-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Architecture

### Payment Flow

```
Customer → Shop Page → Product Selection → Stripe Checkout
         ↓
Payment Success → Webhook Handler → Order Confirmation
         ↓
(Phase 2) Auto-create Printful Order → Fulfillment → Shipping
```

### Components

**Backend:**
- `server/printful.ts` - Printful API integration
- `server/stripe.ts` - Stripe checkout and webhooks
- `server/routes.ts` - API endpoints

**Frontend:**
- `client/src/components/PrintfulShop.tsx` - Product catalog
- `client/src/pages/Shop.tsx` - Full shop page
- `client/src/pages/CheckoutSuccess.tsx` - Post-purchase
- `client/src/pages/CheckoutCancel.tsx` - Cancelled checkout

---

## Setup Guide

### 1. Printful Setup

1. **Create Printful Account**
   - Go to [Printful.com](https://www.printful.com)
   - Sign up for free

2. **Create Products**
   - Dashboard → Products → Add Product
   - Design your products
   - Set retail prices
   - **Important:** Sync products to make them available via API

3. **Get API Key**
   - Settings → Stores → Your Store → Add API Access
   - Copy the API key
   - Add to `.env`:
     ```bash
     PRINTFUL_API_KEY=your_key_here
     ```

### 2. Stripe Setup

1. **Create Stripe Account**
   - Go to [Stripe.com](https://stripe.com)
   - Sign up and verify your business

2. **Get Test Keys**
   - Dashboard → Developers → API Keys
   - Copy "Publishable key" and "Secret key"
   - Add to `.env`:
     ```bash
     STRIPE_PUBLISHABLE_KEY=pk_test_...
     STRIPE_SECRET_KEY=sk_test_...
     ```

3. **Configure Webhook**
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
   - Copy signing secret:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```

4. **Create Donation Link**
   - Dashboard → Payment Links
   - Create a donation/one-time payment link
   - Add to `.env`:
     ```bash
     STRIPE_DONATION_URL_TEST=https://donate.stripe.com/test_...
     ```

### 3. Environment Variables

See `.env.example` for complete list. Required variables:

```bash
# Printful
PRINTFUL_API_KEY=

# Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_DONATION_URL_TEST=

# Business
BUSINESS_NAME=Tales of Aneria
SUPPORT_EMAIL=TalesOfAneria@gmail.com
BASE_URL=http://localhost:5000  # or production URL
```

---

## Testing

### Test Cards

Stripe provides test cards for different scenarios:

| Scenario | Card Number | Result |
|----------|-------------|--------|
| Success | `4242 4242 4242 4242` | Payment succeeds |
| Decline | `4000 0000 0000 0002` | Payment declined |
| 3D Secure | `4000 0025 0000 3155` | Requires authentication |

Use any future expiry date and any 3-digit CVC.

### Testing Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Shop**
   - Visit `http://localhost:5000/shop`
   - Verify products load from Printful

3. **Test Checkout**
   - Click "Buy Now" on a product
   - Enter test card details
   - Complete purchase

4. **Verify Webhook**
   - Check server logs for webhook event
   - Verify success page displays

5. **Test Donation**
   - Click "Make a Donation" button
   - Complete donation flow

### Local Webhook Testing

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Copy the webhook signing secret to .env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Test complete checkout flow in sandbox
- [ ] Verify webhook handler works correctly
- [ ] Test all payment scenarios
- [ ] Review product catalog in Printful
- [ ] Set correct pricing
- [ ] Configure business information

### Production Setup

1. **Switch to Production Keys**
   ```bash
   # .env (production)
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   BASE_URL=https://talesofaneria.com
   ```

2. **Configure Production Webhook**
   - Stripe Dashboard → Webhooks
   - Add production endpoint
   - Update `STRIPE_WEBHOOK_SECRET`

3. **Create Production Donation Link**
   - Create new payment link in production mode
   - Update `STRIPE_DONATION_URL`

4. **Deploy**
   ```bash
   git push origin main
   # Follow your deployment process
   ```

5. **Verify Production**
   - Test with real card (small amount)
   - Verify webhook fires
   - Check order confirmation

### Monitoring

Monitor these in production:
- Stripe Dashboard → Payments
- Stripe Dashboard → Webhooks (check for failures)
- Server logs for errors
- Health check endpoint: `/api/health`

---

## Troubleshooting

### Products Not Loading

**Symptom:** "Setting up catalog" message on shop page

**Solutions:**
1. Verify `PRINTFUL_API_KEY` is set correctly
2. Check products are synced in Printful dashboard
3. View server logs for API errors
4. Test API key with: `curl -H "Authorization: Bearer YOUR_KEY" https://api.printful.com/products`

### Checkout Button Does Nothing

**Symptom:** Clicking "Buy Now" has no effect

**Solutions:**
1. Check browser console for errors
2. Verify `STRIPE_PUBLISHABLE_KEY` is set
3. Ensure product has variants in Printful
4. Check CSP headers allow Stripe.js
5. Clear browser cache

### Webhook Not Firing

**Symptom:** Payment succeeds but webhook doesn't trigger

**Solutions:**
1. Verify webhook URL is correct in Stripe Dashboard
2. Check `STRIPE_WEBHOOK_SECRET` is set
3. View webhook logs in Stripe Dashboard
4. Ensure server is accessible from internet
5. Check server logs for webhook errors

### Redis Connection Errors

**Symptom:** Logs show Redis connection failures

**Impact:** App still works (graceful degradation) but caching disabled

**Solutions:**
1. Check Docker Compose is running: `docker-compose ps`
2. Restart Redis: `docker-compose restart redis`
3. For production, ensure Redis service is running
4. App will continue to work without caching

### Payment Succeeded But No Order Created

**Status:** This is expected behavior in Phase 1

**Phase 2 will add:**
- Automatic Printful order creation
- Email confirmations
- Order tracking

Currently, you'll need to manually create Printful orders.

---

## Cost Analysis

### Per $25 Product Sale

| Platform | Fees | You Keep | Notes |
|----------|------|----------|-------|
| **Etsy** | 9.5% + $0.20 = $2.58 | $22.42 | Platform + transaction fees |
| **Stripe** | 2.9% + $0.30 = $1.03 | $23.97 | Direct sales |
| **Savings** | - | **+$1.55** | 6.2% more profit |

### Monthly Example (100 sales @ $25)

- **Etsy:** $2,242 profit
- **Stripe:** $2,397 profit
- **Extra Profit:** $155/month = $1,860/year

---

## Phase 2 Roadmap

Features planned for automatic order fulfillment:

1. **Automatic Printful Order Creation**
   - Webhook triggers order creation
   - Customer shipping info sent to Printful
   - Order confirmation stored

2. **Email Notifications**
   - Order confirmation to customer
   - Shipping notification with tracking
   - Admin notification for new orders

3. **Order Management Dashboard**
   - View all orders
   - Track order status
   - Handle refunds/issues
   - Customer order history

4. **Inventory Management**
   - Track stock levels
   - Low stock alerts
   - Discontinue products

5. **Analytics**
   - Sales reports
   - Revenue tracking
   - Popular products
   - Customer insights

---

## Security Features

✅ **Implemented:**
- API keys stored in environment variables
- Webhook signature verification
- Input validation on all endpoints
- Rate limiting per IP
- HTTPS required in production
- CSP headers configured
- No sensitive data in client code

🔒 **Best Practices:**
- Never commit API keys to git
- Rotate keys regularly
- Monitor for suspicious activity
- Keep dependencies updated
- Review Stripe Dashboard regularly

---

## Support & Resources

### Documentation
- [Printful API Docs](https://developers.printful.com/)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

### Internal Docs
- `PRINTFUL_INTEGRATION.md` - Printful setup details
- `STRIPE_INTEGRATION.md` - Stripe integration guide
- `ENVIRONMENT_MANAGEMENT.md` - Environment variables
- `docs/security/SECURITY.md` - Security guidelines

### Getting Help
- Check server logs: `docker-compose logs -f app`
- Review Stripe Dashboard for payment issues
- Check Printful Dashboard for product sync
- Review webhook logs in Stripe Dashboard

---

**Last Updated:** 2026-01-02  
**Status:** Phase 1 Complete ✅ (Payment processing working, awaiting Phase 2 for automatic fulfillment)
