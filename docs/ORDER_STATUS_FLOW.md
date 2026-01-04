# Order Status Flow & Webhooks

## Current Implementation

### Order Status Lifecycle

1. **`pending`** - Initial status when order is created in database (after Stripe payment)
2. **`processing`** - Set when Printful order ID is added (order submitted to Printful)
3. **`shipped`** - ✅ Set by Printful webhook when package ships
4. **`completed`** - Set when order is delivered (manual or future automation)
5. **`failed`** - Set when order creation or processing fails
6. **`refunded`** - ⚠️ Currently NOT automated (needs Stripe refund webhook)
7. **`returned`** - ✅ Set by Printful webhook when package is returned
8. **`cancelled`** - ✅ Set by Printful webhook when order is cancelled

### Current Webhooks

#### ✅ Stripe Webhook (`/api/stripe/webhook`)
**Triggers:** Payment events from Stripe
**Events Handled:**
- `checkout.session.completed` - Creates order in DB, submits to Printful

**Flow:**
1. Customer pays → Stripe sends webhook
2. Creates order record (status: `pending`)
3. Submits order to Printful
4. Updates order (status: `processing`, adds Printful order ID)
5. Sends confirmation email to customer

#### ✅ Printful Webhook (`/api/printful/webhook`)
**Triggers:** Order status updates from Printful
**Events Handled:**
- `package_shipped` - Order has been shipped → Updates status to `shipped`, adds tracking info
- `package_returned` - Order was returned → Updates status to `returned`, alerts admin
- `order_failed` - Order failed to fulfill → Updates status to `failed`, alerts admin
- `order_canceled` - Order was cancelled → Updates status to `cancelled`

**Flow:**
1. Printful ships order → Webhook sent
2. Updates order status and tracking info
3. Logs event in order_events table
4. (TODO) Sends shipping notification to customer

## Missing Implementation

### 1. Shipping Notification Emails

**Current Status:** Order confirmation emails work, but shipping notifications are not yet sent.

**TODO:**
1. Create `sendShippingNotification()` function in `server/notification-service.ts`
2. Design email template with tracking information
3. Uncomment the notification call in Printful webhook handler (line ~1324 in routes.ts)

### 2. Stripe Refund Handling

**Current Status:** Refunds must be processed manually through Stripe dashboard

**TODO:**
1. Add `charge.refunded` event handler to Stripe webhook
2. Update order status to `refunded`
3. Log refund event
4. Send refund confirmation email to customer

## TODO

### High Priority
- [x] Implement Printful webhook handler ✅
- [x] Fix product images in orders ✅
- [ ] Send shipping notification emails
- [ ] Add Stripe refund webhook handler

### Medium Priority
- [ ] Add order cancellation flow (manual admin action)
- [ ] Add manual order status override in admin panel
- [ ] Set up webhook monitoring and alerts

### Low Priority
- [ ] Add order event timeline view in admin panel
- [ ] Add delivery confirmation status (when carrier provides it)
- [ ] Add re-ship request handling

## Testing

### Test Order Status Updates Locally

Since webhooks require public URLs, use ngrok or Printful's test mode:

```bash
# 1. Set up ngrok (for local webhook testing)
ngrok http 5000

# 2. Add webhook URL in Printful dashboard:
https://your-ngrok-url.ngrok.io/api/printful/webhook

# 3. Create test order in Printful dashboard
# 4. Watch order status updates in database
```

### Manual Status Update (For Testing)

```sql
-- Update order status manually
UPDATE orders 
SET status = 'completed' 
WHERE id = 'your-order-id';

-- Add tracking info manually
UPDATE orders 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'), 
  '{tracking_number}', 
  '"1Z999AA10123456784"'
)
WHERE id = 'your-order-id';
```

## References

- [Printful Webhooks Documentation](https://developers.printful.com/docs/#tag/Webhooks)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Order Schema](../shared/schema.ts)
