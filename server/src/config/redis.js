import Redis from 'ioredis';
import { config } from './env.js';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export async function cacheGet(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis get error:', err);
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 3600) {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('Redis set error:', err);
  }
}

export async function cacheDel(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('Redis del error:', err);
  }
}

export async function rateLimitIncr(key, windowSeconds = 60, maxRequests = 100) {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return current <= maxRequests;
  } catch (err) {
    console.error('Redis rate limit error:', err);
    return true; // Fail open
  }
}
