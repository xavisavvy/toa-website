# Printful Webhook Setup Guide

## Overview

Printful webhooks automatically update order status when:
- 📦 **Package is shipped** → Adds tracking info, sends customer notification
- 🔄 **Package is returned** → Alerts admin
- ❌ **Order fails** → Alerts admin
- 🚫 **Order is cancelled** → Updates status

## Setup Steps

### 1. Generate Webhook Secret (Optional but Recommended)

For security, generate a random secret for webhook signature verification:

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Add Environment Variable

Add to your `.env` file:

```bash
# Printful Webhook Secret (optional, for signature verification)
PRINTFUL_WEBHOOK_SECRET=your_generated_secret_here
```

**Note:** If `PRINTFUL_WEBHOOK_SECRET` is not set, webhooks will still work but without signature verification (dev mode only).

### 3. Configure Webhook URL

#### Method A: Automated Setup (Recommended)

Use our setup script to configure webhooks via Printful API:

```bash
# Set environment variables (if not in .env)
export PRINTFUL_API_KEY=your_api_key_here
export PRINTFUL_WEBHOOK_URL=https://talesofaneria.com/api/webhooks/printful

# Run the setup script
npx tsx scripts/setup-printful-webhook.ts
```

This script will:
- ✅ Register the webhook with Printful
- ✅ Subscribe to all necessary events
- ✅ Display current webhook configuration
- ✅ Verify the setup was successful

#### Method B: Manual API Configuration

For custom integrations, Printful webhooks must be configured via API:

```bash
curl -X POST https://api.printful.com/webhooks \
  -H "Authorization: Bearer YOUR_PRINTFUL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://talesofaneria.com/api/webhooks/printful",
    "types": [
      "package_shipped",
      "package_returned",
      "order_failed",
      "order_canceled",
      "product_synced",
      "order_created",
      "order_updated"
    ]
  }'
```

**Note:** Dashboard webhook configuration is only available for e-commerce platform integrations (Shopify, WooCommerce, etc.). Custom API integrations require API-based webhook setup.

#### Method C: Local Development (ngrok)

Since Printful needs a public URL to send webhooks:

1. **Install ngrok** (if not already installed):
   ```bash
   # Download from https://ngrok.com/download
   # Or via npm:
   npm install -g ngrok
   ```

2. **Start your local server**:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

3. **Start ngrok tunnel**:
   ```bash
   ngrok http 5000
   ```

4. **Copy the public URL** (e.g., `https://abc123.ngrok.io`)

5. **Configure webhook using the setup script**:
   ```bash
   export PRINTFUL_API_KEY=your_api_key_here
   export PRINTFUL_WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/printful
   npx tsx scripts/setup-printful-webhook.ts
   ```

### 4. Test the Webhook

#### Option A: Create a Real Test Order

1. Create a test order on your site
2. In Printful dashboard, manually change the order status
3. Watch your server logs for webhook events

#### Option B: Use Printful's Webhook Test

1. In Printful dashboard → **Webhooks**
2. Click **Test** next to your webhook
3. Send a test `package_shipped` event
4. Check server logs

### 5. Verify Webhook is Working

Check your server logs for:

```
[Printful Webhook] Event received: package_shipped
[Printful Webhook] Data: {...}
📦 Processing webhook for order ord_abc123
✅ Package shipped for order: ord_abc123
📬 Order ord_abc123 marked as shipped. Tracking: 1Z999AA10123456784
```

## Webhook Endpoint Details

### Endpoint
```
POST /api/webhooks/printful
```

**Note:** The correct endpoint is `/api/webhooks/printful` (not `/api/printful/webhook`).

### Security
- Uses HMAC SHA256 signature verification
- Signature sent in `X-Printful-Signature` header
- If `PRINTFUL_WEBHOOK_SECRET` is not set, signature check is skipped (dev mode)

### Events Handled

| Event | Order Status | Actions |
|-------|-------------|---------|
| `package_shipped` | `shipped` | Updates status, adds tracking info, logs event |
| `package_returned` | `returned` | Updates status, alerts admin |
| `order_failed` | `failed` | Updates status, logs failure reason, alerts admin |
| `order_canceled` | `cancelled` | Updates status, logs event |

### Response Format

**Success:**
```json
{
  "received": true
}
```

**Order Not Found (still returns 200):**
```json
{
  "received": true,
  "warning": "Order not found"
}
```

**Error:**
```json
{
  "error": "Invalid signature"
}
```

## Database Updates

When a webhook is received, the following happens:

### Orders Table
- `status` is updated (e.g., `processing` → `shipped`)
- `metadata` is enriched with tracking info:
  ```json
  {
    "tracking_number": "1Z999AA10123456784",
    "tracking_url": "https://tracking.url",
    "carrier": "USPS",
    "service": "First Class",
    "shipped_at": "2026-01-04T16:33:00.000Z"
  }
  ```
- `updatedAt` is set to current timestamp

### Order Events Table
New event record is created:
```sql
INSERT INTO order_events (order_id, event_type, status, message, metadata)
VALUES ('ord_123', 'shipped', 'success', 'Package shipped via USPS First Class', {...});
```

## Customer Notifications

**Current Implementation:**
- ✅ Order confirmation email (when order is created)
- ❌ Shipping notification (TODO)

**Planned:**
```typescript
// TODO: Uncomment when shipping notification is implemented
await sendShippingNotification(order, trackingNumber, trackingUrl);
```

To implement:
1. Create `sendShippingNotification()` in `server/notification-service.ts`
2. Design email template with tracking info
3. Uncomment the call in the webhook handler

## Troubleshooting

### Webhook not received

1. **Check Printful dashboard** → Webhooks → View delivery logs
2. **Verify URL is correct** and publicly accessible
3. **Check firewall rules** (if self-hosting)
4. **Check ngrok is running** (for local dev)

### "Invalid signature" error

1. **Verify secret matches** in `.env` and Printful dashboard
2. **Check for extra whitespace** in environment variable
3. **Restart server** after changing `.env`

### "Order not found" warning

- Order hasn't been created in database yet (Stripe webhook not processed)
- Printful order ID doesn't match database record
- Test webhook from Printful using non-existent order ID

### Webhook received but status not updating

1. **Check server logs** for errors
2. **Verify database connection** is working
3. **Check order exists** with correct `printful_order_id`

## Security Considerations

### ✅ Implemented
- HMAC signature verification
- Security event logging for invalid signatures
- Raw body parsing for signature validation

### 🔒 Best Practices
- Always use HTTPS in production
- Keep webhook secret secure (never commit to git)
- Monitor failed webhook attempts
- Set up alerts for suspicious activity

## Monitoring

### Key Metrics to Track
- Webhook success rate
- Average processing time
- Failed signature attempts
- Orders stuck in "processing" status

### Recommended Alerts
- Order failed to fulfill → Alert admin immediately
- Package returned → Alert admin
- Webhook signature failures → Security alert

## References

- [Printful Webhooks Documentation](https://developers.printful.com/docs/#tag/Webhooks)
- [Order Status Flow](./ORDER_STATUS_FLOW.md)
- [Security Documentation](./SECURITY.md)
