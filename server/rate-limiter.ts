import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import type { Request, Response } from 'express';

// Initialize Redis client (optional - falls back to in-memory if unavailable)
let redis: Redis | null = null;

try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('error', (err) => {
      console.warn('⚠️  Redis connection error, falling back to in-memory rate limiting:', err.message);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
    });
  }
} catch (err) {
  console.warn('⚠️  Failed to initialize Redis for rate limiting, using in-memory store');
}

// General API rate limiter (100 requests per 15 minutes)
export const apiLimiter = rateLimit({
  store: redis ? new RedisStore({
    // @ts-expect-error - ioredis is compatible
    sendCommand: (...args: string[]) => redis!.call(...args),
    prefix: 'rl:api:',
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later.',
  // Trust proxy for Replit and cloud environments
  validate: { trustProxy: process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DEPLOYMENT },
  skip: (req: Request) => {
    // Skip rate limiting for localhost in development
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Stricter rate limiter for authentication endpoints (5 requests per 15 minutes)
export const authLimiter = rateLimit({
  store: redis ? new RedisStore({
    // @ts-expect-error - ioredis is compatible
    sendCommand: (...args: string[]) => redis!.call(...args),
    prefix: 'rl:auth:',
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts from this IP, please try again later.',
  validate: { trustProxy: process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DEPLOYMENT },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'You have exceeded the authentication rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Aggressive rate limiter for expensive operations (10 requests per hour)
export const expensiveLimiter = rateLimit({
  store: redis ? new RedisStore({
    // @ts-expect-error - ioredis is compatible
    sendCommand: (...args: string[]) => redis!.call(...args),
    prefix: 'rl:expensive:',
  }) : undefined,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many expensive requests from this IP, please try again later.',
  validate: { trustProxy: process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DEPLOYMENT },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have exceeded the rate limit for this resource. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Cleanup on process exit
process.on('SIGINT', async () => {
  if (redis) {
    await redis.quit();
  }
});

process.on('SIGTERM', async () => {
  if (redis) {
    await redis.quit();
  }
});
