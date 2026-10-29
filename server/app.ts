import crypto from 'crypto';

import connectPgSimple from 'connect-pg-simple';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import session from 'express-session';
import createMemoryStore from 'memorystore';

import { metricsMiddleware } from './monitoring';
import { configureSecurity, originCsrfProtection } from './security';

/**
 * Middleware shared by the production entry (root index.ts) and the dev entry
 * (server/index.ts). Both used to assemble their own stacks, and production
 * silently lost sessions, CSRF protection and the webhook raw-body parsers.
 * Anything security-relevant belongs here so the two cannot drift again.
 */

const MIN_SESSION_SECRET_LENGTH = 32;
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Webhooks verify signatures over the exact request bytes, so they must get
// the raw body before the global express.json() parser runs.
export const WEBHOOK_PATHS = ['/api/stripe/webhook', '/api/webhooks/printful'];

type LogFn = (message: string) => void;

function createSessionStore(isProduction: boolean): session.Store {
  if (isProduction && process.env.DATABASE_URL) {
    const PgStore = connectPgSimple(session);
    return new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15, // seconds
    });
  }

  // memorystore prunes expired entries, unlike express-session's MemoryStore
  const MemoryStore = createMemoryStore(session);
  return new MemoryStore({ checkPeriod: 60 * 60 * 1000 });
}

/**
 * Resolve the session secret. In production a missing or short secret
 * disables sessions (admin login answers 503) rather than crashing the site
 * or falling back to a guessable value. Elsewhere a per-process random secret
 * is used, so sessions simply reset on restart.
 */
function resolveSessionSecret(isProduction: boolean, log: LogFn): string | null {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= MIN_SESSION_SECRET_LENGTH) {
    return secret;
  }

  if (isProduction) {
    console.error(
      `❌ SESSION_SECRET is ${secret ? 'too short' : 'not set'} (need ${MIN_SESSION_SECRET_LENGTH}+ chars). ` +
      'Sessions are disabled: admin login will be unavailable.'
    );
    return null;
  }

  log('SESSION_SECRET not set; using a random per-process secret');
  return crypto.randomBytes(32).toString('hex');
}

export function configureApp(app: Express, options: { log?: LogFn } = {}): { sessionsEnabled: boolean } {
  const log = options.log ?? ((message: string) => console.info(message));
  const isProduction = process.env.NODE_ENV === 'production';

  // Single reverse-proxy hop (Nginx Proxy Manager); required for correct
  // client IPs in rate limiting and for secure cookies behind TLS termination
  app.set('trust proxy', 1);

  // A05: Security Misconfiguration - Apply security middleware FIRST
  configureSecurity(app);

  for (const path of WEBHOOK_PATHS) {
    app.use(path, express.raw({ type: 'application/json', limit: '1mb' }));
  }

  const secret = resolveSessionSecret(isProduction, log);
  if (secret) {
    // Sessions are only meaningful for the API; don't touch the store for assets
    app.use('/api', session({
      store: createSessionStore(isProduction),
      secret,
      name: 'connect.sid',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_MS,
      },
    }));
  }

  app.use(metricsMiddleware);

  // Body parsing middleware (with size limits) - applied to all OTHER routes
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // A01: CSRF - reject cross-site state-changing requests
  app.use(originCsrfProtection(WEBHOOK_PATHS));

  // Request logging middleware (status and timing only; response bodies can
  // contain customer details, so they are not logged)
  app.use((req, res, next) => {
    const start = Date.now();
    const requestPath = req.path;

    res.on('finish', () => {
      if (requestPath.startsWith('/api')) {
        log(`${req.method} ${requestPath} ${res.statusCode} in ${Date.now() - start}ms`);
      }
    });

    next();
  });

  return { sessionsEnabled: secret !== null };
}

/**
 * A07: Enhanced error handling - Don't leak sensitive information.
 * Register AFTER all routes.
 */
export function registerErrorHandler(app: Express): void {
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const error = err as { status?: number; statusCode?: number; message?: string; stack?: string };
    const status = error.status || error.statusCode || 500;

    // A09: Security Logging - Log errors for monitoring
    console.error('[ERROR]', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    // A07: Don't expose internal error details in production
    const message = status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : error.message || 'Internal Server Error';

    res.status(status).json({ error: message });
  });
}
