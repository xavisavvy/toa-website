/**
 * Log Sanitization Utility
 * Masks PII (Personally Identifiable Information) in logs to comply with privacy regulations
 */

interface SanitizableObject {
  [key: string]: unknown;
}

// Fields that contain direct PII and should be masked
const DIRECT_PII_FIELDS = [
  'email',
  'name',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'fullName',
  'full_name',
  'phone',
  'phoneNumber',
  'phone_number',
  'mobile',
  'ssn',
  'password',
  'creditCard',
  'cardNumber',
  'card_number',
  'cvv',
  'ccv'
];

// Fields that contain street addresses (should be masked, but preserve city/state/zip)
const ADDRESS_FIELDS = [
  'address',
  'address1',
  'address2',
  'street',
  'street1',
  'street2',
  'line1',
  'line2'
];

// Container fields that need recursive processing but aren't PII themselves
const CONTAINER_FIELDS = [
  'recipient',
  'customer',
  'customerDetails',
  'customer_details',
  'billing',
  'billing_details',
  'shipping',
  'shipping_details'
];

// Property names that must never be copied onto the sanitized output object:
// assigning one of these via bracket notation rewrites the target's
// prototype chain instead of adding a normal data property. sanitizeObject()
// is routinely called on untrusted, attacker-shaped data (e.g. request
// bodies passed through to audit logs), and JSON.parse legitimately produces
// own, enumerable "__proto__"/"constructor"/"prototype" keys, so this guard
// is load-bearing rather than defensive boilerplate.
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Masks an email address while preserving domain for debugging
 * Example: john.doe@example.com -> j***@example.com
 */
const REDACTED = '[REDACTED]';

export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') {return REDACTED;}
  
  const [localPart, domain] = email.split('@');
  if (!domain) {return REDACTED;}
  
  const maskedLocal = `${localPart.charAt(0)  }***`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Masks a name while preserving first initial
 * Example: John Doe -> J*** D***
 */
export function maskName(name: string): string {
  if (!name || typeof name !== 'string') {return REDACTED;}
  
  return name.split(' ')
    .map(part => `${part.charAt(0)  }***`)
    .join(' ');
}

/**
 * Masks an address partially
 */
export function maskAddress(address: string): string {
  if (!address || typeof address !== 'string') {return REDACTED;}

  // Keep city/state for debugging, mask street
  const parts = address.split(',');
  if (parts.length > 1) {
    return `[STREET REDACTED], ${parts.slice(-2).join(',')}`;
  }
  return REDACTED;
}

/**
 * Masks phone numbers
 * Example: 555-123-4567 -> ***-***-4567
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {return REDACTED;}

  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `***-***-${  digits.slice(-4)}`;
  }
  return REDACTED;
}

/** True if `lowerKey` (already lowercased) names a field holding direct PII. */
function isDirectPIIField(lowerKey: string): boolean {
  return DIRECT_PII_FIELDS.some(field => {
    const fieldLower = field.toLowerCase();
    // Exact match or ends with the field name (but exclude 'username' from 'name' matching)
    if (field === 'name' && lowerKey === 'username') {return false;}
    return lowerKey === fieldLower || lowerKey.endsWith(fieldLower);
  });
}

/** True if `lowerKey` (already lowercased) names a street-address field. */
function isAddressFieldKey(lowerKey: string): boolean {
  return ADDRESS_FIELDS.some(field => lowerKey === field.toLowerCase() || lowerKey.endsWith(field.toLowerCase()));
}

/** True if `lowerKey` (already lowercased) names a container that needs recursive sanitizing. */
function isContainerFieldKey(lowerKey: string): boolean {
  return CONTAINER_FIELDS.some(field => lowerKey === field.toLowerCase() || lowerKey.includes(field.toLowerCase()));
}

/** Masks a direct-PII string value according to which kind of field it is. */
function maskDirectPIIValue(lowerKey: string, value: string): string {
  if (lowerKey.includes('email')) {return maskEmail(value);}
  if (lowerKey.includes('name') && !lowerKey.includes('username')) {return maskName(value);}
  if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {return maskPhone(value);}
  // password/cvv/ssn/card and any other direct-PII field are fully redacted
  return REDACTED;
}

/** Computes the sanitized replacement value for a single object entry. */
function sanitizeEntryValue(key: string, value: unknown, seen: WeakSet<object>): unknown {
  const lowerKey = key.toLowerCase();
  const directPII = isDirectPIIField(lowerKey);
  const addressField = isAddressFieldKey(lowerKey);
  const containerField = isContainerFieldKey(lowerKey);

  if (directPII && typeof value === 'string') {
    return maskDirectPIIValue(lowerKey, value);
  }
  if (directPII && (value === null || value === undefined)) {
    return REDACTED;
  }
  if (addressField && typeof value === 'string') {
    return REDACTED;
  }
  if ((directPII || addressField || containerField) && typeof value === 'object' && value !== null) {
    return sanitizeObject(value as SanitizableObject, seen);
  }
  if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value as SanitizableObject, seen);
  }
  return value;
}

/**
 * Recursively sanitizes an object by masking PII fields
 */
export function sanitizeObject(obj: SanitizableObject, seen = new WeakSet()): SanitizableObject {
  if (!obj || typeof obj !== 'object') {return obj;}

  // Prevent circular reference infinite loops
  if (seen.has(obj)) {
    return '[Circular Reference]' as unknown as SanitizableObject;
  }
  seen.add(obj);

  const sanitized: SanitizableObject = Array.isArray(obj) ? {} : {};

  if (Array.isArray(obj)) {
    return obj.map(item =>
      typeof item === 'object' && item !== null
        ? sanitizeObject(item as SanitizableObject, seen)
        : item
    ) as unknown as SanitizableObject;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (UNSAFE_OBJECT_KEYS.has(key)) {
      // Never copy reserved property names onto the output object — see
      // UNSAFE_OBJECT_KEYS above for why this matters.
      continue;
    }

    // eslint-disable-next-line security/detect-object-injection -- key is checked against UNSAFE_OBJECT_KEYS above
    sanitized[key] = sanitizeEntryValue(key, value, seen);
  }

  return sanitized;
}

/**
 * Safe logger that automatically sanitizes PII
 */
export const safeLog = {
  info: (message: string, data?: unknown) => {
    if (data && typeof data === 'object' && data !== null) {
      console.info(message, sanitizeObject(data as SanitizableObject));
    } else if (data) {
      console.info(message, data);
    } else {
      console.info(message);
    }
  },
  
  warn: (message: string, data?: unknown) => {
    if (data && typeof data === 'object' && data !== null) {
      console.warn(message, sanitizeObject(data as SanitizableObject));
    } else if (data) {
      console.warn(message, data);
    } else {
      console.warn(message);
    }
  },
  
  error: (message: string, data?: unknown) => {
    if (data && typeof data === 'object' && data !== null) {
      console.error(message, sanitizeObject(data as SanitizableObject));
    } else if (data) {
      console.error(message, data);
    } else {
      console.error(message);
    }
  },
  
  log: (message: string, data?: unknown) => {
    if (data && typeof data === 'object' && data !== null) {
      console.info(message, sanitizeObject(data as SanitizableObject));
    } else if (data) {
      console.info(message, data);
    } else {
      console.info(message);
    }
  }
};
