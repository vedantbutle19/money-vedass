import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  name?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    name = 'default',
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'unknown-ip';
      return ip;
    },
  } = options;

  if (!stores.has(name)) {
    stores.set(name, new Map<string, RateLimitRecord>());
  }
  const store = stores.get(name)!;

  // Cleanup old entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // In test environment, allow bypassing rate limits if desired
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    let record = store.get(key);

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: message,
        retryAfterSeconds: retryAfter,
      });
    }

    next();
  };
}
