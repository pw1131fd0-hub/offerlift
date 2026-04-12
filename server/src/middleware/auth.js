import { config } from '../config/env.js';

export function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API Key required' });
  }

  if (apiKey !== config.apiKey) {
    return res.status(401).json({ error: 'Invalid API Key' });
  }

  next();
}

// Optional auth - doesn't require API key but extracts anonymous ID if present
export function optionalAuthMiddleware(req, res, next) {
  // Don't block requests without API key, just skip auth
  next();
}
