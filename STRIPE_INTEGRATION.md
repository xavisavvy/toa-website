# Stripe Integration - Complete Setup Guide

## ✅ Implementation Complete!

Your Stripe integration is fully implemented and ready to use. Here's what's been built:

### 🎯 Features Implemented:

1. **Stripe Checkout** - Direct payment processing
2. **Product Variant Support** - Size, color selection
3. **Success/Cancel Pages** - Post-checkout user experience
4. **Webhook Handler** - Payment confirmation automation
5. **Security** - Webhook signature verification
6. **Error Handling** - Graceful failures with user feedback

---

## 🔑 Environment Variables Required

```bash
# Printful
PRINTFUL_API_KEY=your_printful_api_key_here

# Stripe (Test/Sandbox - get your own keys from Stripe Dashboard)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe (Production - when ready to go live)
# STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...

# Business Info
BUSINESS_NAME=Tales of Aneria
SUPPORT_EMAIL=TalesOfAneria@gmail.com

# Stripe URLs
BASE_URL=https://talesofaneria.com
STRIPE_DONATION_URL_TEST=https://donate.stripe.com/test_...
STRIPE_DONATION_URL=https://donate.stripe.com/...
```

---

## 🚀 How to Use

### Enable Stripe Checkout on Homepage:

```tsx
// client/src/pages/Home.tsx
import PrintfulShop from "@/components/PrintfulShop";

// Replace ShopSection with:
<PrintfulShop enableCheckout={true} />
```

That's it! When `enableCheckout={true}`, customers can buy directly on your site.

---

##  📋 Next Steps to Go Live

### 1. Set Up Webhook Endpoint

After deploying to production:

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
5. Copy the **Signing Secret** (starts with `whsec_...`)
6. Add to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### 2. Add Production Keys (When Ready)

Replace test keys with live keys in your production environment:

```bash
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### 3. Configure Success/Cancel URLs

Add to `.env`:

```bash
BASE_URL=https://talesofaneria.com
STRIPE_SUCCESS_URL=/checkout/success
STRIPE_CANCEL_URL=/checkout/cancel
```

---

## 🛠️ Testing the Integration

### Test with Stripe Test Cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

### Testing Workflow:

1. Enable checkout: `<PrintfulShop enableCheckout={true} />`
2. Click on a product
3. You'll be redirected to Stripe Checkout
4. Enter test card details
5. After payment:
   - **Success** → `/checkout/success`
   - **Cancel** → `/checkout/cancel`

---

## 💰 Payment Flow

```
Customer clicks product
  ↓
Stripe Checkout opens
  ↓
Customer pays
  ↓
Stripe webhook fires
  ↓
Server creates Printful order (Phase 2)
  ↓
Customer gets confirmation email
  ↓
Printful ships order
```

---

## 📦 Phase 2: Auto-Create Printful Orders (To Be Implemented)

Currently, the webhook receives payment confirmation but doesn't auto-create Printful orders yet.

**To enable automatic order creation:**

I can implement:
1. Printful Order Creation API integration
2. Automatic order submission when payment succeeds
3. Order status tracking
4. Email notifications with tracking numbers
5. Error handling for failed orders

Just let me know when you're ready for this!

---

## 🔐 Security Features

✅ Webhook signature verification  
✅ API key authentication  
✅ Input validation on all endpoints  
✅ Rate limiting  
✅ HTTPS required in production  
✅ No sensitive data exposed to client  

---

## 📊 Cost Comparison

### Per $25 Sale:

| Method | Fees | You Keep | Profit Difference |
|--------|------|----------|-------------------|
| **Etsy** | 9.5% + $0.20 | $22.62 | Baseline |
| **Stripe** | 2.9% + $0.30 | $24.03 | **+$1.41 (6% more)** |

**On 100 sales/month:**
- Etsy: $2,262 profit
- Stripe: $2,403 profit
- **Extra profit with Stripe: $141/month**

---

## 🎯 Files Created

### Backend:
- `server/stripe.ts` - Stripe utilities and checkout logic
- `server/routes.ts` - Updated with Stripe endpoints

### Frontend:
- `client/src/lib/stripe.ts` - Client-side Stripe utilities
- `client/src/components/PrintfulShop.tsx` - Updated with checkout
- `client/src/pages/CheckoutSuccess.tsx` - Success page
- `client/src/pages/CheckoutCancel.tsx` - Cancel page
- `client/src/App.tsx` - Added checkout routes

### Config:
- `.env` - Stripe keys added
- `package.json` - Stripe SDKs installed

---

## 📞 Ready for Phase 2?

When you're ready to enable automatic Printful order creation, I can implement:

1. ✅ Webhook handler (done)
2. ⬜ **Printful Order Creation API**
3. ⬜ **Email Confirmations** (via Resend if you have it)
4. ⬜ **Order Tracking Dashboard**
5. ⬜ **Inventory Management**
6. ⬜ **Customer Order History**

Let me know and I'll add these features!

---

## 🐛 Troubleshooting

**Checkout button does nothing:**
- Check browser console for errors
- Verify `STRIPE_PUBLISHABLE_KEY` is set
- Ensure Printful products have variants

**Webhook not firing:**
- Verify webhook URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` is set
- View webhook logs in Stripe dashboard

**Payment succeeds but no order:**
- This is expected - Phase 2 will auto-create orders
- Check server logs for webhook events

---

## 🎉 You're Ready to Test!

1. Deploy your app
2. Set up webhook endpoint in Stripe
3. Test with Stripe test cards
4. When ready, switch to production keys
5. Start accepting direct payments!

**Current Status:** ✅ Stripe integration complete and ready for testing!
