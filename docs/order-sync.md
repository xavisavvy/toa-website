# Order Synchronization

This document describes the order synchronization script used to sync data between Stripe, Printful, and our database.

## Purpose

The order sync script (`scripts/sync-orders.ts`) helps maintain data consistency by:

1. **Pulling missing Stripe payments** - Fetches completed checkout sessions from Stripe and adds them to the database
2. **Syncing Printful order details** - Updates order status and items from Printful
3. **Recovering from webhook failures** - Handles missed webhooks during outages
4. **Disaster recovery** - Restores data after drift or corruption

## Use Cases

### Development Database Seeding
```bash
# Sync last 30 days of orders (default)
npm run sync:orders

# Sync last 7 days
npm run sync:orders -- --days=7

# Preview changes without applying
npm run sync:orders:dry-run
```

### Production Recovery
```bash
# After a webhook outage, sync missing data
npm run sync:orders -- --days=1

# Always test first with dry-run
npm run sync:orders:dry-run -- --days=1
```

## How It Works

### Phase 1: Stripe Payment Sync
1. Fetches paid Stripe checkout sessions from the specified time period
2. Checks if each session already exists in the database
3. Creates new order records for missing sessions
4. Preserves shipping details and metadata

### Phase 2: Printful Order Sync
1. Finds all orders with Printful order IDs
2. Fetches current order details from Printful API
3. Updates order status based on Printful status:
   - `draft`, `pending`, `onhold`, `inprocess` → `processing`
   - `partial` → `shipped`
   - `fulfilled` → `delivered`
   - `failed` → `failed`
   - `canceled` → `cancelled`
4. Adds order items if missing

## Options

| Option | Description | Example |
|--------|-------------|---------|
| `--days=N` | Number of days to look back (default: 30) | `--days=7` |
| `--dry-run` | Preview changes without applying them | `--dry-run` |

## Output

The script provides a detailed summary:

```
📊 Synchronization Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stripe Sessions Checked: 42
Stripe Sessions Added: 3
Stripe Sessions Skipped: 39
Printful Orders Checked: 15
Printful Orders Updated: 8
Printful Items Added: 24
Errors: 0
```

## Error Handling

- **Missing API keys** - Script exits with error if STRIPE_SECRET_KEY or PRINTFUL_API_KEY not found
- **API failures** - Logs errors but continues processing other orders
- **Missing Printful orders** - Logs warning if Printful order ID doesn't exist
- **Database errors** - Captured and reported in summary

## Best Practices

### Development
1. Always use `--dry-run` first to preview changes
2. Start with small time periods (`--days=1`)
3. Review the summary output for unexpected results
4. Use after setting up a new development environment

### Production
1. **Always use dry-run first** in production
2. Sync during low-traffic periods
3. Monitor logs for errors
4. Keep time periods small to avoid API rate limits
5. Run after confirmed webhook outages or issues

## Security Considerations

- Requires valid Stripe and Printful API keys
- Only syncs existing customer data (no new customer creation)
- Preserves all original metadata
- Does not modify Stripe or Printful data (read-only for external APIs)
- All database writes are audited

## Kubernetes Usage

For Kubernetes deployments, you can run the sync as a one-time job:

```bash
# Run sync job in cluster
kubectl create job --from=cronjob/order-sync manual-sync-$(date +%s) -n toa-local

# View logs
kubectl logs job/manual-sync-TIMESTAMP -n toa-local
```

## Monitoring

Track sync operations through:
- Console output and summary statistics
- Audit logs (for non-dry-run executions)
- Error logs for failed operations

## Related

- [Database Schema](./database-schema.md)
- [Stripe Integration](./stripe-integration.md)
- [Printful Integration](./printful-integration.md)
- [Webhook Documentation](./webhooks.md)
