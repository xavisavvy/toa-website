/**
 * Sentry APM Integration
 *
 * Optional Application Performance Monitoring with Sentry.
 * Configure by setting SENTRY_DSN environment variable.
 *
 * Features:
 * - Error tracking and alerting
 * - Performance monitoring (transactions, spans)
 * - Release tracking
 * - User context
 * - Breadcrumbs for debugging
 *
 * @example
 * // Initialize at app startup (before other imports)
 * import { initSentry, sentryErrorHandler, sentryRequestHandler } from './sentry';
 * initSentry();
 *
 * // Add middleware
 * app.use(sentryRequestHandler());
 * // ... your routes ...
 * app.use(sentryErrorHandler());
 */

import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';

// Sentry types (optional dependency)
interface SentryModule {
  init: (options: Record<string, unknown>) => void;
  Handlers: {
    requestHandler: () => RequestHandler;
    errorHandler: () => ErrorRequestHandler;
  };
  captureException: (error: Error, context?: Record<string, unknown>) => string;
  captureMessage: (message: string, level?: string) => string;
  setUser: (user: { id?: string; email?: string; username?: string } | null) => void;
  setTag: (key: string, value: string) => void;
  setContext: (name: string, context: Record<string, unknown>) => void;
  addBreadcrumb: (breadcrumb: {
    category?: string;
    message?: string;
    level?: string;
    data?: Record<string, unknown>;
  }) => void;
  startSpan: <T>(options: { name: string; op?: string }, callback: () => T) => T;
}

let Sentry: SentryModule | null = null;
let sentryInitialized = false;

/**
 * Initialize Sentry SDK
 * Call this at the very start of your application, before other imports
 */
export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.info('[Sentry] SENTRY_DSN not configured - APM disabled');
    return false;
  }

  try {
    // Dynamic import to make Sentry optional
    Sentry = require('@sentry/node') as SentryModule;

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || 'unknown',

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Profiling (requires @sentry/profiling-node)
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Filter sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }
        return event;
      },

      // Ignore common non-errors
      ignoreErrors: [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'Network request failed',
        'AbortError',
      ],
    });

    sentryInitialized = true;
    console.info('[Sentry] APM initialized successfully');
    return true;
  } catch (error) {
    console.info('[Sentry] Failed to initialize (package may not be installed):', error);
    return false;
  }
}

/**
 * Sentry request handler middleware
 * Add this before your routes
 */
export function sentryRequestHandler(): RequestHandler {
  if (Sentry && sentryInitialized) {
    return Sentry.Handlers.requestHandler();
  }
  // No-op middleware if Sentry not available
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

/**
 * Sentry error handler middleware
 * Add this after your routes but before other error handlers
 */
export function sentryErrorHandler(): ErrorRequestHandler {
  if (Sentry && sentryInitialized) {
    return Sentry.Handlers.errorHandler();
  }
  // Pass-through if Sentry not available
  return (err: Error, _req: Request, _res: Response, next: NextFunction) => next(err);
}

/**
 * Capture an exception to Sentry
 */
export function captureException(error: Error, context?: Record<string, unknown>): string | null {
  if (Sentry && sentryInitialized) {
    return Sentry.captureException(error, context);
  }
  return null;
}

/**
 * Capture a message to Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): string | null {
  if (Sentry && sentryInitialized) {
    return Sentry.captureMessage(message, level);
  }
  return null;
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id?: string; email?: string; username?: string } | null): void {
  if (Sentry && sentryInitialized) {
    Sentry.setUser(user);
  }
}

/**
 * Add a tag to the current scope
 */
export function setTag(key: string, value: string): void {
  if (Sentry && sentryInitialized) {
    Sentry.setTag(key, value);
  }
}

/**
 * Set additional context
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (Sentry && sentryInitialized) {
    Sentry.setContext(name, context);
  }
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void {
  if (Sentry && sentryInitialized) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

/**
 * Create a performance span
 */
export function startSpan<T>(name: string, operation: string, callback: () => T): T {
  if (Sentry && sentryInitialized) {
    return Sentry.startSpan({ name, op: operation }, callback);
  }
  return callback();
}

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return sentryInitialized;
}

/**
 * Express middleware to add user context from session
 */
export function sentryUserMiddleware(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (Sentry && sentryInitialized && req.session?.user) {
      const user = req.session.user as { id?: string; email?: string; role?: string };
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.role,
      });
    }
    next();
  };
}
