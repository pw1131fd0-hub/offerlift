import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import { query } from '../config/database.js';
import { sanitizeAll } from '../utils/sanitize.js';

const router = Router();

const ContributeSchema = z.object({
  title: z.string().min(1).max(100),
  salary: z.number().positive(),
  city: z.string().min(1),
});

// GET /api/salary-data
router.get('/', async (req, res, next) => {
  try {
    const { title, city } = req.query;

    // Try cache first
    const cacheKey = title && city ? `salary:${title}:${city}` : 'salary:all';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Query database
    let sql = 'SELECT * FROM salary_data WHERE 1=1';
    const params = [];

    if (title) {
      params.push(`%${title}%`);
      sql += ` AND title ILIKE $${params.length}`;
    }

    if (city) {
      params.push(city);
      sql += ` AND city = $${params.length}`;
    }

    sql += ' ORDER BY title';

    const result = await query(sql, params);

    const response = {
      data: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        min: row.min_salary,
        max: row.max_salary,
        level: row.level,
        city: row.city,
        source: row.source,
      })),
      sources: ['104', 'LinkedIn', 'CakeResume', 'manual'],
    };

    // Cache for 1 hour
    await cacheSet(cacheKey, response, 3600);

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /api/salary-data/contribute
router.post('/contribute', validate(ContributeSchema), async (req, res, next) => {
  try {
    const input = sanitizeAll(req.body);
    const anonymousId = req.headers['x-anonymous-id'] || 'anonymous';

    await query(
      `INSERT INTO salary_contributions (anonymous_id, title, salary, city)
       VALUES ($1, $2, $3, $4)`,
      [anonymousId, input.title, input.salary, input.city]
    );

    res.status(201).json({
      success: true,
      message: '感謝您的貢獻',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/salary-data/contributions
router.get('/contributions', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT title, salary, city, created_at
       FROM salary_contributions
       ORDER BY created_at DESC
       LIMIT 100`
    );

    res.json({
      contributions: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
