/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiter (use express-rate-limit for production)
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

// In-memory store (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';
    const key = `${identifier}:${req.path}`;
    const now = Date.now();

    let record = requestCounts.get(key);

    // Create new record or reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + options.windowMs,
      };
      requestCounts.set(key, record);
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > options.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests. Please try again later.',
        retryAfter,
      });
      return;
    }

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': options.max.toString(),
      'X-RateLimit-Remaining': (options.max - record.count).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
    });

    next();
  };
}

// Cleanup old entries periodically (every 10 minutes)
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime) {
        requestCounts.delete(key);
      }
    }
  },
  10 * 60 * 1000
);

/*
 * TODO: For production, use express-rate-limit with Redis store
 *
 * import rateLimit from 'express-rate-limit';
 * import RedisStore from 'rate-limit-redis';
 * import Redis from 'ioredis';
 *
 * const redis = new Redis(process.env.REDIS_URL);
 *
 * export const rateLimiter = rateLimit({
 *   store: new RedisStore({
 *     client: redis,
 *     prefix: 'rl:',
 *   }),
 *   windowMs: 15 * 60 * 1000,
 *   max: 100,
 * });
 */
