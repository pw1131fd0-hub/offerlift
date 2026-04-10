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
