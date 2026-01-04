import { describe, it, expect } from 'vitest';
import { 
  maskEmail, 
  maskName, 
  maskPhone, 
  maskAddress,
  sanitizeObject 
} from '../server/log-sanitizer';

describe('Log Sanitizer - PII Protection', () => {
  describe('maskEmail', () => {
    it('should mask email addresses while preserving domain', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j***@example.com');
      expect(maskEmail('admin@test.org')).toBe('a***@test.org');
      expect(maskEmail('user123@company.co.uk')).toBe('u***@company.co.uk');
    });

    it('should handle invalid emails', () => {
      expect(maskEmail('')).toBe('[REDACTED]');
      expect(maskEmail('notanemail')).toBe('[REDACTED]');
      expect(maskEmail(null as any)).toBe('[REDACTED]');
      expect(maskEmail(undefined as any)).toBe('[REDACTED]');
    });

    it('should handle single character local part', () => {
      expect(maskEmail('a@example.com')).toBe('a***@example.com');
    });
  });

  describe('maskName', () => {
    it('should mask names while preserving first letter', () => {
      expect(maskName('John Doe')).toBe('J*** D***');
      expect(maskName('Alice')).toBe('A***');
      expect(maskName('Bob Smith Jr')).toBe('B*** S*** J***');
    });

    it('should handle invalid names', () => {
      expect(maskName('')).toBe('[REDACTED]');
      expect(maskName(null as any)).toBe('[REDACTED]');
      expect(maskName(undefined as any)).toBe('[REDACTED]');
    });

    it('should handle single character names', () => {
      expect(maskName('J')).toBe('J***');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone numbers showing only last 4 digits', () => {
      expect(maskPhone('555-123-4567')).toBe('***-***-4567');
      expect(maskPhone('(555) 123-4567')).toBe('***-***-4567');
      expect(maskPhone('5551234567')).toBe('***-***-4567');
    });

    it('should handle invalid phone numbers', () => {
      expect(maskPhone('')).toBe('[REDACTED]');
      expect(maskPhone('123')).toBe('[REDACTED]'); // Too short
      expect(maskPhone(null as any)).toBe('[REDACTED]');
    });

    it('should handle international formats', () => {
      expect(maskPhone('+1-555-123-4567')).toBe('***-***-4567');
    });
  });

  describe('maskAddress', () => {
    it('should mask street while preserving city/state', () => {
      const address = '123 Main St, New York, NY';
      const masked = maskAddress(address);
      expect(masked).toContain('[STREET REDACTED]');
      expect(masked).toContain('New York');
    });

    it('should handle simple addresses', () => {
      const result = maskAddress('123 Elm Street');
      expect(result).toBe('[REDACTED]');
    });

    it('should handle invalid addresses', () => {
      expect(maskAddress('')).toBe('[REDACTED]');
      expect(maskAddress(null as any)).toBe('[REDACTED]');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize email fields in objects', () => {
      const data = {
        email: 'test@example.com',
        userId: 123
      };
      
      const sanitized = sanitizeObject(data);
      expect(sanitized.email).toBe('t***@example.com');
      expect(sanitized.userId).toBe(123);
    });

    it('should sanitize nested objects', () => {
      const data = {
        user: {
          email: 'user@test.com',
          name: 'John Doe',
          role: 'admin'
        },
        meta: {
          timestamp: 123456
        }
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.user.email).toBe('u***@test.com');
      expect(sanitized.user.name).toBe('J*** D***');
      expect(sanitized.user.role).toBe('admin');
      expect(sanitized.meta.timestamp).toBe(123456);
    });

    it('should sanitize arrays', () => {
      const data = {
        users: [
          { email: 'user1@test.com', name: 'Alice' },
          { email: 'user2@test.com', name: 'Bob' }
        ]
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.users[0].email).toBe('u***@test.com');
      expect(sanitized.users[0].name).toBe('A***');
      expect(sanitized.users[1].email).toBe('u***@test.com');
      expect(sanitized.users[1].name).toBe('B***');
    });

    it('should handle case-insensitive field names', () => {
      const data = {
        Email: 'test@example.com',
        EMAIL: 'admin@test.com',
        customerEmail: 'customer@test.com'
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.Email).toBe('t***@example.com');
      expect(sanitized.EMAIL).toBe('a***@test.com');
      expect(sanitized.customerEmail).toBe('c***@test.com');
    });

    it('should sanitize phone numbers', () => {
      const data = {
        phone: '555-123-4567',
        mobilePhone: '555-987-6543'
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.phone).toBe('***-***-4567');
      expect(sanitized.mobilePhone).toBe('***-***-6543');
    });

    it('should redact password fields', () => {
      const data = {
        username: 'admin',
        password: 'secret123',
        confirmPassword: 'secret123'
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.username).toBe('admin');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.confirmPassword).toBe('[REDACTED]');
    });

    it('should handle address objects', () => {
      const data = {
        shipping: {
          name: 'John Doe',
          address1: '123 Main St',
          city: 'Boston',
          zip: '02101'
        }
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.shipping.name).toBe('J*** D***');
      expect(sanitized.shipping.address1).toBe('[REDACTED]');
      expect(sanitized.shipping.city).toBe('Boston');
      expect(sanitized.shipping.zip).toBe('02101');
    });

    it('should handle recipient objects from Stripe/Printful', () => {
      const data = {
        recipient: {
          name: 'Alice Smith',
          email: 'alice@example.com',
          address1: '456 Oak Ave',
          city: 'Seattle',
          state_code: 'WA'
        }
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.recipient.name).toBe('A*** S***');
      expect(sanitized.recipient.email).toBe('a***@example.com');
      expect(sanitized.recipient.address1).toBe('[REDACTED]');
      expect(sanitized.recipient.city).toBe('Seattle');
      expect(sanitized.recipient.state_code).toBe('WA');
    });

    it('should preserve non-PII fields', () => {
      const data = {
        orderId: 'ORD-123',
        amount: 4999,
        currency: 'USD',
        status: 'completed',
        timestamp: 1234567890,
        items: [{ id: 1, quantity: 2 }]
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.orderId).toBe('ORD-123');
      expect(sanitized.amount).toBe(4999);
      expect(sanitized.currency).toBe('USD');
      expect(sanitized.status).toBe('completed');
      expect(sanitized.timestamp).toBe(1234567890);
      expect(sanitized.items).toEqual([{ id: 1, quantity: 2 }]);
    });

    it('should handle null and undefined values', () => {
      const data = {
        email: null,
        name: undefined,
        phone: 'valid'
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.email).toBe('[REDACTED]');
      expect(sanitized.name).toBe('[REDACTED]');
    });

    it('should handle deeply nested structures', () => {
      const data = {
        order: {
          customer: {
            details: {
              contact: {
                email: 'deep@example.com',
                phone: '555-1234'
              }
            }
          }
        }
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.order.customer.details.contact.email).toBe('d***@example.com');
    });

    it('should handle payment-related fields', () => {
      const data = {
        payment: {
          cardNumber: '4532-1234-5678-9010',
          cvv: '123',
          amount: 5000
        }
      };

      const sanitized = sanitizeObject(data);
      expect(sanitized.payment.cardNumber).toBe('[REDACTED]');
      expect(sanitized.payment.cvv).toBe('[REDACTED]');
      expect(sanitized.payment.amount).toBe(5000);
    });
  });

  describe('Real-world scenarios', () => {
    it('should sanitize Stripe session data', () => {
      const session = {
        id: 'cs_test_123',
        customer_details: {
          email: 'customer@example.com',
          name: 'John Customer',
          phone: '555-123-4567'
        },
        amount_total: 4999,
        currency: 'usd'
      };

      const sanitized = sanitizeObject(session);
      expect(sanitized.id).toBe('cs_test_123');
      expect(sanitized.customer_details.email).toBe('c***@example.com');
      expect(sanitized.customer_details.name).toBe('J*** C***');
      expect(sanitized.customer_details.phone).toBe('***-***-4567');
      expect(sanitized.amount_total).toBe(4999);
    });

    it('should sanitize Printful order data', () => {
      const order = {
        id: 12345,
        recipient: {
          name: 'Alice Recipient',
          email: 'alice@example.com',
          address1: '789 Main Street',
          city: 'Portland',
          state_code: 'OR',
          zip: '97201'
        },
        items: [
          { variant_id: 4011, quantity: 1 }
        ],
        retail_costs: {
          total: '29.99'
        }
      };

      const sanitized = sanitizeObject(order);
      expect(sanitized.id).toBe(12345);
      expect(sanitized.recipient.name).toBe('A*** R***');
      expect(sanitized.recipient.email).toBe('a***@example.com');
      expect(sanitized.recipient.address1).toBe('[REDACTED]');
      expect(sanitized.recipient.city).toBe('Portland');
      expect(sanitized.items).toEqual([{ variant_id: 4011, quantity: 1 }]);
    });

    it('should sanitize admin user data', () => {
      const user = {
        id: 1,
        email: 'admin@talesofaneria.com',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-01-04T12:00:00Z'
      };

      const sanitized = sanitizeObject(user);
      expect(sanitized.id).toBe(1);
      expect(sanitized.email).toBe('a***@talesofaneria.com');
      expect(sanitized.role).toBe('admin');
      expect(sanitized.createdAt).toBe('2024-01-01T00:00:00Z');
    });
  });
});
