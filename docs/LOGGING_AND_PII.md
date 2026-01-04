# Logging & PII Protection

## Overview
All application logging implements **PII (Personally Identifiable Information) sanitization** to comply with privacy regulations (GDPR, CCPA, etc.).

## Log Sanitization

### Automatic PII Masking
The `log-sanitizer.ts` utility automatically masks sensitive information:

```typescript
import { safeLog, maskEmail, sanitizeObject } from './log-sanitizer';

// ✅ SAFE - Email is masked
safeLog.info('User logged in:', { email: user.email }); 
// Output: { email: 'j***@example.com' }

// ✅ SAFE - Object is sanitized recursively
safeLog.info('Order created:', order);
// Output: { customerEmail: 'j***@example.com', customerName: 'J*** D***' }

// ❌ UNSAFE - Direct console.log
console.log('User:', user.email); // AVOID THIS
```

### Protected Fields
The following fields are automatically masked in logs:

- **Email addresses**: `john.doe@example.com` → `j***@example.com`
- **Names**: `John Doe` → `J*** D***`
- **Phone numbers**: `555-123-4567` → `***-***-4567`
- **Addresses**: Full street redacted, city/state preserved for debugging
- **Payment info**: All credit card/CVV data redacted
- **Passwords**: Always redacted

### Field Detection
The sanitizer detects PII by field name (case-insensitive):
- `email`, `emailAddress`, `userEmail`
- `name`, `firstName`, `lastName`, `customerName`
- `address`, `street`, `address1`, `address2`
- `phone`, `phoneNumber`, `mobile`
- `password`, `creditCard`, `cardNumber`, `cvv`, `ssn`

## Safe Logging API

### safeLog Methods
Use `safeLog` instead of `console.*`:

```typescript
safeLog.info(message, data?)   // Info-level logging
safeLog.warn(message, data?)   // Warning-level logging
safeLog.error(message, data?)  // Error-level logging
safeLog.log(message, data?)    // General logging
```

### Individual Masking Functions
For specific use cases:

```typescript
import { maskEmail, maskName, maskPhone, maskAddress } from './log-sanitizer';

const maskedEmail = maskEmail('user@example.com');      // 'u***@example.com'
const maskedName = maskName('John Doe');                // 'J*** D***'
const maskedPhone = maskPhone('555-123-4567');          // '***-***-4567'
const maskedAddress = maskAddress('123 Main St, NY');   // '[STREET REDACTED], NY'
```

### Object Sanitization
Sanitize entire objects before logging:

```typescript
import { sanitizeObject } from './log-sanitizer';

const user = {
  id: 123,
  email: 'user@example.com',
  name: 'John Doe',
  address: '123 Main St',
  preferences: { theme: 'dark' }
};

console.log(sanitizeObject(user));
// Output:
// {
//   id: 123,
//   email: 'u***@example.com',
//   name: 'J*** D***',
//   address: '[REDACTED]',
//   preferences: { theme: 'dark' }
// }
```

## Security Events
Security-sensitive events use dedicated logging:

```typescript
import { logSecurityEvent } from './security';

logSecurityEvent('FAILED_LOGIN_ATTEMPT', req, { email: credentials.email });
logSecurityEvent('UNAUTHORIZED_ACCESS', req, { resource: '/admin' });
logSecurityEvent('WEBHOOK_SIGNATURE_FAILED', req, { source: 'printful' });
```

Security logs automatically mask PII and include:
- Timestamp (ISO 8601)
- Event type
- IP address
- User agent (truncated)
- Sanitized event data

**Admin Authentication Events:**
- Failed login attempts (email masked)
- Successful logins (email masked)
- Unauthorized access attempts
- Session validation failures

**Webhook Security Events:**
- Failed signature verifications
- Invalid webhook payloads
- Missing required fields

## Webhook Logging

### Stripe Webhooks
```typescript
// Payment data is sanitized before logging
safeLog.info('Payment received:', {
  sessionId,
  customer: session.customer_details  // Automatically masked
});
```

### Printful Webhooks
```typescript
// Order updates log minimal PII with safe logging
safeLog.info('[Printful Webhook] Event received:', { type, orderId });
// Webhook bodies are sanitized before logging
safeLog.info('Printful webhook processed:', sanitizeObject(webhookData));
// Customer details are automatically masked
```

**Security Features:**
- Signature verification logs use `safeLog` to mask any accidental PII
- Failed webhook attempts logged securely
- Order updates log only IDs and status (no customer data)

## Database Logging
Database operations should **never log full records** containing PII:

```typescript
// ✅ SAFE
console.log(`Order created: ${order.id}`);
safeLog.info('Order status updated:', { orderId, status });

// ❌ UNSAFE
console.log('Full order:', order);  // Contains customer email, name, address
```

## Best Practices

### 1. Use safeLog for User Data
```typescript
// ✅ Good
safeLog.info('User updated:', { email: user.email, role: user.role });

// ❌ Bad
console.log('User:', user);
```

### 2. Minimize Logging Scope
```typescript
// ✅ Good - Log only what's needed
console.log(`Processing order ${orderId}`);

// ❌ Bad - Excessive logging
console.log('Full order data:', order);
```

### 3. Never Log Raw Request Bodies
```typescript
// ✅ Good
safeLog.info('Checkout session created:', { sessionId });

// ❌ Bad
console.log('Request body:', req.body);  // May contain raw PII
```

### 4. Use Structured Logging
```typescript
// ✅ Good
safeLog.info('Authentication failed', {
  email: credentials.email,
  reason: 'invalid_password',
  timestamp: Date.now()
});

// ❌ Bad
console.log(`Login failed for ${credentials.email}`);
```

## Compliance

### GDPR Article 5
- **Data minimization**: Only log necessary information
- **Purpose limitation**: Logs used only for debugging/security
- **Storage limitation**: Implement log rotation (not included in app)

### CCPA Section 1798.100
- **Consumer right to know**: PII in logs is masked
- **Consumer right to deletion**: Logs should be rotated/purged regularly

### PCI DSS Requirement 3
- **No raw payment data**: Credit cards, CVVs always redacted
- **Limited cardholder data**: Only last 4 digits retained (in Stripe, not logs)

## Production Recommendations

1. **Log Aggregation**: Use external service (DataDog, Splunk, CloudWatch)
2. **Log Retention**: Auto-delete logs after 30-90 days
3. **Access Control**: Restrict log access to authorized personnel
4. **Encryption**: Encrypt logs at rest and in transit
5. **Monitoring**: Alert on security events (failed logins, etc.)
6. **Audit Logs**: Separate audit trail for admin actions

## Testing
Verify PII masking with unit tests:

```typescript
import { describe, it, expect } from 'vitest';
import { maskEmail, sanitizeObject } from './log-sanitizer';

describe('PII Masking', () => {
  it('should mask email addresses', () => {
    expect(maskEmail('test@example.com')).toBe('t***@example.com');
  });

  it('should sanitize nested objects', () => {
    const data = {
      user: { email: 'user@test.com', role: 'admin' }
    };
    const sanitized = sanitizeObject(data);
    expect(sanitized.user.email).toContain('***@test.com');
    expect(sanitized.user.role).toBe('admin');
  });
});
```

## Migration from Existing Code
Existing `console.log` statements with PII should be updated:

```typescript
// Before
console.log('User logged in:', user.email);

// After
safeLog.info('User logged in:', { email: user.email });
```

---

**IMPORTANT**: When in doubt, use `safeLog` or `sanitizeObject`. Better to over-sanitize than to leak PII.
