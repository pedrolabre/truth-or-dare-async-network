import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix: string;
  keyGenerator: (req: Request) => string | null;
  message?: string;
};

const DEFAULT_RATE_LIMIT_MESSAGE =
  'Muitas tentativas. Tente novamente em alguns minutos.';

const store = new Map<string, RateLimitEntry>();

function getClientIp(req: Request): string | null {
  if (typeof req.ip !== 'string') {
    return null;
  }

  const trimmed = req.ip.trim();

  return trimmed ? trimmed : null;
}

function shouldReset(entry: RateLimitEntry, now: number): boolean {
  return now >= entry.resetAt;
}

function createKey(prefix: string, value: string): string {
  return `${prefix}:${value}`;
}

export function hashRateLimitKey(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function getRateLimitClientIp(req: Request): string {
  return getClientIp(req) ?? 'unknown';
}

export function createRateLimiter(options: RateLimitOptions) {
  const message = options.message ?? DEFAULT_RATE_LIMIT_MESSAGE;

  return (req: Request, res: Response, next: NextFunction) => {
    const keyBase = options.keyGenerator(req);

    if (!keyBase) {
      return next();
    }

    const now = Date.now();
    const key = createKey(options.keyPrefix, keyBase);
    const current = store.get(key);

    if (!current || shouldReset(current, now)) {
      store.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });

      return next();
    }

    if (current.count >= options.max) {
      console.warn({
        event: 'rate_limit.exceeded',
        timestamp: new Date().toISOString(),
        keyPrefix: options.keyPrefix,
        ipAddress: getClientIp(req),
      });

      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }

    current.count += 1;
    store.set(key, current);

    return next();
  };
}
