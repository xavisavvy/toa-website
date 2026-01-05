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
  if (!name || typeof name !== 'string') {return '[REDACTED]';}
  
  return name.split(' ')
    .map(part => `${part.charAt(0)  }***`)
    .join(' ');
}

/**
 * Masks an address partially
 */
export function maskAddress(address: string): string {
  if (!address || typeof address !== 'string') {return '[REDACTED]';}
  
  // Keep city/state for debugging, mask street
  const parts = address.split(',');
  if (parts.length > 1) {
    return `[STREET REDACTED], ${parts.slice(-2).join(',')}`;
  }
  return '[REDACTED]';
}

/**
 * Masks phone numbers
 * Example: 555-123-4567 -> ***-***-4567
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {return '[REDACTED]';}
  
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `***-***-${  digits.slice(-4)}`;
  }
  return '[REDACTED]';
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
    const lowerKey = key.toLowerCase();
    
    // Check if this is a direct PII field
    const isDirectPII = DIRECT_PII_FIELDS.some(field => {
      const fieldLower = field.toLowerCase();
      // Exact match or ends with the field name (but exclude 'username' from 'name' matching)
      if (field === 'name' && lowerKey === 'username') {return false;}
      return lowerKey === fieldLower || lowerKey.endsWith(fieldLower);
    });
    const isAddressField = ADDRESS_FIELDS.some(field => lowerKey === field.toLowerCase() || lowerKey.endsWith(field.toLowerCase()));
    const isContainer = CONTAINER_FIELDS.some(field => lowerKey === field.toLowerCase() || lowerKey.includes(field.toLowerCase()));
    
    if (isDirectPII && typeof value === 'string') {
      // Mask direct PII based on field type
      if (lowerKey.includes('email')) {
        (sanitized as Record<string, unknown>)[key] = maskEmail(value);
      } else if (lowerKey.includes('name') && !lowerKey.includes('username')) {
        (sanitized as Record<string, unknown>)[key] = maskName(value);
      } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
        (sanitized as Record<string, unknown>)[key] = maskPhone(value);
      } else if (lowerKey.includes('password') || lowerKey.includes('cvv') || lowerKey.includes('ssn') || lowerKey.includes('card')) {
        (sanitized as Record<string, unknown>)[key] = REDACTED;
      } else {
        (sanitized as Record<string, unknown>)[key] = REDACTED;
      }
    } else if (isDirectPII && (value === null || value === undefined)) {
      (sanitized as Record<string, unknown>)[key] = REDACTED;
    } else if (isAddressField && typeof value === 'string') {
      sanitized[key] = REDACTED;
    } else if ((isDirectPII || isAddressField || isContainer) && typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as SanitizableObject, seen);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as SanitizableObject, seen);
    } else {
      sanitized[key] = value;
    }
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
      // Note: console.log used for debugging - consider removing in production
      console.log(message, sanitizeObject(data as SanitizableObject));
    } else if (data) {
      // Note: console.log used for debugging - consider removing in production
      console.log(message, data);
    } else {
      // Note: console.log used for debugging - consider removing in production
      console.log(message);
    }
  }
};
