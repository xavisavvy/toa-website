import cors from 'cors';
import type { Express, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';

import { maskEmail } from './log-sanitizer';

export function getAllowedOrigins(): string[] {
  return process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : ['http://localhost:5000', 'http://127.0.0.1:5000'];
}

function originOf(value: string | undefined): string | null {
  if (!value) {return null;}
  try {
    return new URL(value).origin;
  } catch {
    return 'invalid';
  }
}

/**
 * A01: CSRF protection for cookie-authenticated, state-changing requests.
 *
 * Browsers always attach Origin (or at least Referer) and Sec-Fetch-Site to
 * cross-site POSTs, so a request is rejected when those headers show it came
 * from another site. Requests carrying neither header are not from a browser
 * page and cannot ride a victim's cookies, so they pass. This needs no token
 * in the client and no session for anonymous visitors. It complements the
 * sameSite: 'lax' session cookie.
 */
export function originCsrfProtection(exemptPaths: string[]) {
  const stateChanging = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!stateChanging.has(req.method) || exemptPaths.includes(req.path)) {
      return next();
    }

    const reject = (reason: string) => {
      logSecurityEvent('CSRF_REQUEST_BLOCKED', {
        ip: req.ip,
        resource: req.path,
        reason,
        origin: req.get('origin'),
      });
      return res.status(403).json({ error: 'Cross-site request blocked' });
    };

    if (req.get('sec-fetch-site') === 'cross-site') {
      return reject('sec-fetch-site: cross-site');
    }

    const source = originOf(req.get('origin')) ?? originOf(req.get('referer'));
    if (!source) {
      return next();
    }

    const sameHost = (() => {
      try {
        return new URL(source).host === req.get('host');
      } catch {
        return false;
      }
    })();

    if (sameHost || getAllowedOrigins().includes(source)) {
      return next();
    }

    return reject('origin not allowed');
  };
}

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
            // Vite's dev server injects inline and eval'd scripts (HMR, React
            // refresh). The production build has no inline scripts, so these
            // stay out of production where they would void the XSS protection.
            ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
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
            "https:", // External images from YouTube, Etsy, D&D Beyond, Printful
            ...(isDevelopment ? ["http:"] : []),
          ],
          connectSrc: [
            "'self'",
            "https://www.googleapis.com",
            "https://www.google-analytics.com", // Google Analytics data collection
            "https://*.google-analytics.com", // GA4 regional collection endpoints
            "https://analytics.google.com", // Google Analytics 4
            "https://*.analytics.google.com",
            "https://www.googletagmanager.com",
            "https://openapi.etsy.com",
            "https://character-service.dndbeyond.com",
            "https://api.stripe.com", // Stripe API
            "https://api.printful.com", // Printful API
            ...(isDevelopment ? ["ws:", "wss:"] : []), // Vite HMR websocket
          ],
          mediaSrc: [
            "'self'",
            "https://anchor.fm",
            "https://d3ctxlq1ktw2nl.cloudfront.net", // Anchor podcast audio CDN
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
  const allowedOrigins = getAllowedOrigins();

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
        // Strictly the configured list. The previous *.replit.app /
        // *.repl.co suffix match existed to allow Replit preview domains;
        // with credentials: true it let any Replit-hosted origin make
        // credentialed requests, and the site no longer runs there.
        if (allowedOrigins.indexOf(origin) !== -1) {
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
  
  // Stricter rate limiting for potentially expensive operations.
  // One counter is shared by every path below, and a single home page load
  // makes 6-10 of these calls (channel videos, shorts, stats, campaign
  // playlists, podcast feed, shop), plus one audio-proxy call per episode
  // played. At 30 that left a visitor about three page loads per 15 minutes
  // before every section 429'd. Upstream quota is protected by the
  // server-side caches in youtube.ts/podcast.ts/etsy.ts; this only needs to
  // stop a single IP from hammering cache misses.
  const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per windowMs
    message: 'Too many requests, please slow down.',
     
    skip: () => process.env.NODE_ENV === 'development',
  });

  // Apply strict limiting to external API calls
  app.use('/api/youtube/', strictLimiter);
  app.use('/api/etsy/', strictLimiter);
  app.use('/api/podcast/', strictLimiter);
  app.use('/api/dndbeyond/', strictLimiter);
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
export type NumberValidationResult =
  | { valid: true; value: number }
  | { valid: false; error: string };

export function validateNumber(input: unknown, min: number = 1, max: number = 1000): NumberValidationResult {
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

  // Console logging - mask the email; the full value only goes to the audit table
  const consoleEntry = typeof details.email === 'string'
    ? { ...logEntry, email: maskEmail(details.email) }
    : logEntry;
  console.warn('[SECURITY]', JSON.stringify(consoleEntry));
  
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
        action: event.toLowerCase().replace(/_/g, '-'),
        resource: details.resource as string || 'authentication',
        category: details.category as string || 'security',
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
