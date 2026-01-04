# Audit & Compliance System

## Overview

The Tales of Aneria audit system provides comprehensive logging of all critical user actions, administrative operations, and security events to ensure compliance with GDPR, SOC2, and other regulatory requirements.

## Features

### 🔍 **Comprehensive Audit Trail**
- All authentication events (login, logout, failures)
- Administrative actions (user management, order access)
- Data access (PII viewing, exports)
- Data modifications (with before/after states)
- Security events (rate limiting, permission denials)

### 🔒 **Privacy & Security**
- **Automatic PII Masking**: Sensitive fields automatically redacted in logs
- **Email Masking**: `test@example.com` → `t***@e***.com`
- **Password Redaction**: All password fields replaced with `***REDACTED***`
- **IP Anonymization**: Support for GDPR right to be forgotten

### 📋 **GDPR Compliance**
- Automatic marking of GDPR-relevant actions
- User data export capability
- User data anonymization for "right to be forgotten"
- Retention policy management
- Clear audit trail for data subject requests

### 📊 **Audit Log Querying**
- Filter by category, severity, action, user, date range
- Pagination support
- Full-text search capabilities
- Export to CSV/JSON for compliance reporting

## Architecture

### Database Schema

```typescript
audit_logs
├── id                     (UUID, primary key)
├── user_id               (UUID, nullable)
├── user_email            (text, denormalized)
├── user_role             (text: admin, customer, system)
├── action                (text: login, logout, create_order, etc.)
├── resource              (text: user, order, admin_settings, etc.)
├── resource_id           (text, nullable)
├── category              (text: authentication, data_access, security, etc.)
├── severity              (text: info, warning, critical)
├── ip_address            (text)
├── user_agent            (text)
├── request_method        (text: GET, POST, etc.)
├── request_path          (text)
├── status                (text: success, failure, denied)
├── status_code           (integer, HTTP status)
├── error_message         (text, nullable)
├── changes_before        (jsonb, PII masked)
├── changes_after         (jsonb, PII masked)
├── gdpr_relevant         (integer: 0 or 1)
├── retention_policy      (text: standard, extended, permanent)
├── metadata              (jsonb)
└── created_at            (timestamp)
```

### Indexes

- `user_id` - Fast user-specific queries
- `action` - Filter by action type
- `category` - Filter by category
- `severity` - Alert on critical events
- `resource` + `resource_id` - Track specific resource access
- `created_at` - Time-based queries
- `gdpr_relevant` - GDPR compliance reports

## Usage

### Basic Audit Logging

```typescript
import { AuditService, AuditAction } from './server/audit';

// Log authentication
await AuditService.logAuth(
  AuditAction.LOGIN,
  'success',
  req,
  'user@example.com',
  'user-123'
);

// Log data access (GDPR-relevant)
await AuditService.logDataAccess(
  'order',
  'order-123',
  'admin-456',
  'admin@example.com',
  req
);

// Log data modification
await AuditService.logDataChange(
  AuditAction.ORDER_UPDATE,
  'order',
  'order-123',
  'admin-456',
  'admin@example.com',
  'admin',
  { status: 'pending' },  // before
  { status: 'completed' }, // after
  req
);

// Log security event
await AuditService.logSecurity(
  AuditAction.SECURITY_RATE_LIMIT,
  'denied',
  req,
  'Rate limit exceeded',
  'user-123'
);
```

### Advanced Logging

```typescript
// Custom audit log with full context
await AuditService.log({
  userId: 'user-123',
  userEmail: 'user@example.com',
  userRole: 'admin',
  action: 'custom_action',
  resource: 'custom_resource',
  resourceId: 'resource-456',
  category: AuditCategory.DATA_MODIFICATION,
  severity: AuditSeverity.WARNING,
  status: 'success',
  changesBefore: { field: 'old_value' },
  changesAfter: { field: 'new_value' },
  gdprRelevant: true,
  metadata: { custom: 'data' },
  req,
});
```

### Querying Audit Logs

```typescript
// Admin endpoint: GET /api/admin/audit-logs
const logs = await fetch('/api/admin/audit-logs?' + new URLSearchParams({
  category: 'authentication',
  severity: 'warning',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  limit: '100',
  page: '1',
}));
```

### GDPR Compliance Operations

```typescript
// Export user's complete audit trail
const userAuditTrail = await AuditService.exportUserAuditTrail('user-123');

// Anonymize user data (right to be forgotten)
await AuditService.anonymizeUserAuditTrail('user-123');
// Note: Anonymizes PII while preserving audit trail integrity
```

## Audit Action Types

### Authentication
- `login` - Successful user login
- `logout` - User logout
- `login_failed` - Failed login attempt
- `session_expired` - Session timeout
- `password_reset` - Password reset initiated

### User Management
- `user_create` - New user created
- `user_update` - User details modified
- `user_delete` - User account deleted
- `user_activate` - User account activated
- `user_deactivate` - User account deactivated

### Order Management
- `order_create` - New order placed
- `order_update` - Order status/details changed
- `order_view` - Order details accessed
- `order_cancel` - Order cancelled
- `order_refund` - Order refunded

### Data Access (GDPR)
- `data_export` - User data exported
- `data_delete` - User data deleted
- `pii_access` - Personal information accessed

### Security
- `security_rate_limit` - Rate limit triggered
- `security_invalid_token` - Invalid auth token
- `security_permission_denied` - Unauthorized access attempt

## Audit Categories

- `authentication` - Login/logout events
- `authorization` - Permission checks
- `data_access` - Data viewing/retrieval
- `data_modification` - Data changes
- `security` - Security events
- `compliance` - GDPR/regulatory actions

## Severity Levels

- `info` - Normal operations
- `warning` - Suspicious or noteworthy events
- `critical` - Security incidents, system failures

## Retention Policies

- **Standard** (default): 1 year retention
- **Extended**: 3 years (for legal requirements)
- **Permanent**: Never deleted (for critical compliance events)

## Security Considerations

### What Gets Logged
✅ User actions and their outcomes
✅ IP addresses and user agents
✅ Resource access patterns
✅ Before/after states (masked)
✅ Timestamps and context

### What Gets Masked
🚫 Passwords and password hashes
🚫 API keys and secrets
🚫 Full email addresses (partially masked)
🚫 Credit card numbers
🚫 Social security numbers

### Fail-Safe Design
- Audit logging failures do NOT crash the application
- Logs are written to both database and application logger
- Errors in audit logging are logged separately

## Admin Dashboard Integration

### Viewing Audit Logs
1. Navigate to `/admin/audit-logs`
2. Use filters to find specific events
3. Export for compliance reporting

### Real-Time Monitoring
- Critical events trigger alerts
- Failed login attempts monitored
- Rate limit violations tracked

## Compliance Reports

### GDPR Data Subject Request
```bash
# Export all data for a user
GET /api/admin/audit-logs?userId=user-123

# Anonymize user data
POST /api/admin/users/user-123/anonymize
```

### SOC2 Audit Trail
```bash
# All admin access to customer data
GET /api/admin/audit-logs?category=data_access&gdpr_relevant=true

# Security incidents
GET /api/admin/audit-logs?category=security&severity=critical
```

## Testing

### Unit Tests
```bash
npm test -- audit.test.ts
```

### E2E Tests
```bash
npm run test:e2e -- audit-system.spec.ts
```

### Manual Testing
1. Login as admin
2. Access customer order (PII)
3. View audit logs
4. Verify event logged with GDPR marker
5. Confirm PII is masked

## Best Practices

### DO
✅ Log all authentication events
✅ Log all PII access
✅ Mark GDPR-relevant actions
✅ Use appropriate severity levels
✅ Include request context
✅ Provide meaningful error messages

### DON'T
❌ Log raw passwords or secrets
❌ Skip audit logging for "minor" actions
❌ Expose audit logs to non-admins
❌ Delete audit logs arbitrarily
❌ Log without masking PII

## Roadmap

- [ ] Real-time anomaly detection
- [ ] Automated compliance reporting
- [ ] Integration with SIEM systems
- [ ] Machine learning for fraud detection
- [ ] Webhook notifications for critical events
- [ ] Export to external audit systems

## Related Documentation

- [Security Best Practices](./security-best-practices.md)
- [GDPR Compliance](./gdpr-compliance.md)
- [Admin Dashboard](./admin-dashboard.md)
- [Database Schema](./database-schema.md)
