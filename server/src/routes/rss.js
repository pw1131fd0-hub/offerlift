import { Router } from 'express';
import { cacheGet, cacheSet } from '../config/redis.js';

const router = Router();

// GET /api/rss/104
router.get('/104', async (req, res, next) => {
  try {
    // Try cache first (1 hour TTL)
    const cached = await cacheGet('rss:104');
    if (cached) {
      return res.json(cached);
    }

    // In production, this would fetch from 104 RSS feed
    // For now, return sample data
    const sampleData = {
      items: [
        {
          title: '2026科技業薪資趨勢報告',
          link: 'https://www.104.com.tw',
          pubDate: new Date().toISOString(),
        },
        {
          title: '半導體業薪資行情分析',
          link: 'https://www.104.com.tw',
          pubDate: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      cachedAt: new Date().toISOString(),
    };

    // Cache for 1 hour
    await cacheSet('rss:104', sampleData, 3600);

    res.json(sampleData);
  } catch (err) {
    next(err);
  }
});

// GET /api/rss/cakeresume
router.get('/cakeresume', async (req, res, next) => {
  try {
    // Try cache first (1 hour TTL)
    const cached = await cacheGet('rss:cakeresume');
    if (cached) {
      return res.json(cached);
    }

    // In production, this would fetch from CakeResume RSS feed
    // For now, return sample data
    const sampleData = {
      items: [
        {
          title: 'CakeResume 2026 薪資報告',
          link: 'https://www.cakeresume.com',
          pubDate: new Date().toISOString(),
        },
      ],
      cachedAt: new Date().toISOString(),
    };

    // Cache for 1 hour
    await cacheSet('rss:cakeresume', sampleData, 3600);

    res.json(sampleData);
  } catch (err) {
    next(err);
  }
});

export default router;
