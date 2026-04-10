import { Router } from 'express';
import { cacheGet, cacheSet } from '../config/redis.js';
import { query } from '../config/database.js';

const router = Router();

// GET /api/scripts
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;

    // Try cache first (24 hour TTL)
    const cacheKey = category ? `scripts:${category}` : 'scripts:all';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let sql = 'SELECT id, title, situation, script, tip, category FROM negotiation_scripts';
    const params = [];

    if (category) {
      sql += ' WHERE category = $1';
      params.push(category);
    }

    sql += ' ORDER BY category, id';

    const result = await query(sql, params);

    const scripts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      situation: row.situation,
      script: row.script,
      tip: row.tip,
      category: row.category,
    }));

    const response = { scripts };

    // Cache for 24 hours
    await cacheSet(cacheKey, response, 86400);

    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
