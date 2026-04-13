import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { sanitizeAll } from '../utils/sanitize.js';

const router = Router();

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().max(100).optional(),
  city: z.string().min(1),
  salaryRange: z.string().max(50).optional(),
  content: z.string().min(1),
});

// GET /api/forum
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, city, query: searchQuery } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);

    let whereClause = '1=1';
    const params = [];

    if (city) {
      params.push(city);
      whereClause += ` AND city = $${params.length}`;
    }

    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      whereClause += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM forum_posts WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get posts
    params.push(parseInt(pageSize, 10), offset);
    const result = await query(
      `SELECT id, title, company, city, salary_range, content, created_at
       FROM forum_posts
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      posts: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        company: row.company,
        city: row.city,
        salaryRange: row.salary_range,
        content: row.content,
        createdAt: row.created_at,
      })),
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/forum (requires auth)
router.post('/', authMiddleware, validate(CreatePostSchema), async (req, res, next) => {
  try {
    const input = sanitizeAll(req.body);

    const result = await query(
      `INSERT INTO forum_posts (title, company, city, salary_range, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, company, city, salary_range, content, created_at`,
      [input.title, input.company || null, input.city, input.salaryRange || null, input.content]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      title: row.title,
      company: row.company,
      city: row.city,
      salaryRange: row.salary_range,
      content: row.content,
      createdAt: row.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/forum/:id (requires auth)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const anonymousId = getAnonymousIdFromRequest(req);

    const result = await query(
      `DELETE FROM forum_posts WHERE id = $1 AND anonymous_id = $2 RETURNING id`,
      [id, anonymousId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
