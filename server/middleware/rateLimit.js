'use strict';

const config = require('../config/env');

/**
 * Minimal in-memory per-IP rate limiter.
 *
 * Deliberately dependency-free and process-local: it protects the paid Qwen
 * quota from a runaway client without adding Redis to a hackathon deployment.
 * It is applied only to /api/chat, never to the offline safety content.
 */

const hits = new Map();

// Drop expired buckets so the map cannot grow forever.
function sweep(now) {
  for (const [key, bucket] of hits) {
    if (bucket.resetAt <= now) hits.delete(key);
  }
}

function rateLimit({ windowMs = config.rateLimit.windowMs, max = config.rateLimit.max } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    if (hits.size > 500) sweep(now);

    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    let bucket = hits.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      hits.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          messageKey: 'errors.rateLimited',
          retryAfter,
        },
      });
    }

    return next();
  };
}

module.exports = rateLimit;
