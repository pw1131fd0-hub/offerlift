import { rateLimitIncr } from '../config/redis.js';

export function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const key = `ratelimit:${ip}`;

  rateLimitIncr(key, 60, 100)
    .then((allowed) => {
      if (!allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: 60,
        });
      }
      next();
    })
    .catch(() => {
      // Fail open on Redis error
      next();
    });
}
