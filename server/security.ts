import cors from 'cors';
import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';

/**
 * Configure security middleware for the Express application
 * Following OWASP Top 10:2021 best practices
 */
export function configureSecurity(app: Express) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // A02: Cryptographic Failures - Security Headers with Helmet
  app.use(
    helmet({
      // Content Security Policy - Prevents XSS attacks
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Vite in development
            "'unsafe-eval'", // Required for Vite in development
            "https://www.youtube.com",
            "https://www.google.com",
            "https://www.googletagmanager.com", // Google Analytics & Tag Manager
            "https://apis.google.com",
            "https://js.stripe.com", // Stripe Checkout
          ],
          workerSrc: ["'self'", "blob:"], // Required for Vite HMR workers
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: [
            "'self'",
            "data:",
            "https:",
            "http:", // For external images from YouTube, Etsy, D&D Beyond
          ],
          connectSrc: [
            "'self'",
            "https://www.googleapis.com",
            "https://www.google-analytics.com", // Google Analytics data collection
            "https://analytics.google.com", // Google Analytics 4
            "https://openapi.etsy.com",
            "https://character-service.dndbeyond.com",
            "https://api.stripe.com", // Stripe API
            "https://api.printful.com", // Printful API
            "wss:", // For WebSocket connections in development
          ],
          mediaSrc: [
            "'self'",
            "https://anchor.fm",
            "https://*.cloudfront.net",
            "https://*.spotify.com",
            "https://*.apple.com",
            ...(isDevelopment ? ["http://localhost:*", "http://127.0.0.1:*"] : []),
          ],
          frameSrc: [
            "'self'",
            "https://www.youtube.com",
            "https://open.spotify.com",
            "https://music.youtube.com",
            "https://js.stripe.com", // Stripe Checkout iframe
            "https://hooks.stripe.com", // Stripe webhooks
          ],
          objectSrc: ["'none'"],
          // Only upgrade insecure requests in production
          ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      // Strict-Transport-Security - Forces HTTPS (only in production)
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // X-Frame-Options - Prevents clickjacking
      frameguard: {
        action: 'sameorigin',
      },
      // X-Content-Type-Options - Prevents MIME sniffing
      noSniff: true,
      // X-DNS-Prefetch-Control - Controls DNS prefetching
      dnsPrefetchControl: {
        allow: false,
      },
      // Referrer-Policy - Controls referrer information
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    })
  );

  // A05: Security Misconfiguration - CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5000', 'http://127.0.0.1:5000'];

  app.use(
    cors({
       
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        if (!origin) {return callback(null, true);}
        
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }

        // In production, check against allowed origins
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.replit.app') || origin.endsWith('.repl.co')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400, // 24 hours
    })
  );

  // A05: Security Misconfiguration - Rate Limiting (DoS Prevention)
  // Note: General API rate limiting is applied in routes.ts using rate-limiter.ts
  // This includes health check endpoint exceptions for Kubernetes probes
  
  // Stricter rate limiting for potentially expensive operations
  const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per windowMs
    message: 'Too many requests, please slow down.',
     
    skip: () => process.env.NODE_ENV === 'development',
  });

  // Apply strict limiting to external API calls
  app.use('/api/youtube/', strictLimiter);
  app.use('/api/etsy/', strictLimiter);
  app.use('/api/podcast/', strictLimiter);
}

/**
 * A10: Server-Side Request Forgery (SSRF) Protection
 * Validates URLs to prevent SSRF attacks
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  // Check if URL is valid
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
  })) {
    return { valid: false, error: 'Invalid URL format' };
  }

  try {
     
    const parsedUrl = new URL(url);
    
    // A10: SSRF - Block private/internal IP addresses
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: 'Access to localhost is not allowed' };
    }

    // Block private IP ranges (IPv4)
    const privateIPv4Patterns = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^169\.254\./,              // 169.254.0.0/16 (link-local)
    ];

    for (const pattern of privateIPv4Patterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Access to private IP addresses is not allowed' };
      }
    }

    // Block private IPv6 addresses
    if (hostname.includes(':') && (
      hostname.startsWith('fc') || 
      hostname.startsWith('fd') || 
      hostname.startsWith('fe80')
    )) {
      return { valid: false, error: 'Access to private IP addresses is not allowed' };
    }

    // Block AWS metadata service
    if (hostname === '169.254.169.254') {
      return { valid: false, error: 'Access to metadata service is not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL' };
  }
}

/**
 * A03: Injection - Input validation helper
 * Validates and sanitizes string inputs
 */
export function validateString(input: string, maxLength: number = 1000): { valid: boolean; error?: string; sanitized?: string } {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  if (input.length === 0) {
    return { valid: false, error: 'Input cannot be empty' };
  }

  if (input.length > maxLength) {
    return { valid: false, error: `Input exceeds maximum length of ${maxLength} characters` };
  }

  // Trim and sanitize
  const sanitized = validator.trim(input);
  const escaped = validator.escape(sanitized);

  return { valid: true, sanitized: escaped };
}

/**
 * A03: Injection - Validate numeric input
 */
export function validateNumber(input: unknown, min: number = 1, max: number = 1000): { valid: boolean; error?: string; value?: number } {
  // Strict validation: must be a valid integer string with no extra characters
  const stringInput = String(input).trim();
  
  // Reject if contains non-numeric characters (except leading minus)
  if (!/^-?\d+$/.test(stringInput)) {
    return { valid: false, error: 'Input must be a valid number' };
  }
  
  const num = parseInt(stringInput, 10);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Input must be a valid number' };
  }

  if (num < min || num > max) {
    return { valid: false, error: `Number must be between ${min} and ${max}` };
  }

  return { valid: true, value: num };
}

/**
 * A09: Security Logging and Monitoring
 * Logs security-related events to console and database
 */
export async function logSecurityEvent(event: string, details: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...details,
  };

  // Console logging
  console.warn('[SECURITY]', JSON.stringify(logEntry));
  
  // Database logging (async, don't await to avoid blocking)
  try {
    const { db } = await import('./db');
    const { auditLogs } = await import('../shared/schema');
    if (db) {
      const severity = event.includes('FAILED') || event.includes('INVALID') || event.includes('SUSPICIOUS') 
        ? 'high' 
        : 'medium';
      
      await db.insert(auditLogs).values({
        userId: details.userId as string || null,
        userEmail: details.email as string || null,
        action: event.toLowerCase().replace(/_/g, '_'),
        resource: details.resource as string || null,
        ipAddress: details.ip as string || null,
        userAgent: details.userAgent as string || null,
        status: details.status as 'success' | 'failure' || 'failure',
        errorMessage: details.reason as string || details.message as string || null,
        severity: severity as 'low' | 'medium' | 'high',
      }).catch((err: Error) => {
        console.error('[ERROR] Failed to write audit log:', err);
      });
    }
  } catch (err) {
    // Silently fail - audit logging should not break application flow
    console.error('[ERROR] Failed to write audit log:', err);
  }
}
