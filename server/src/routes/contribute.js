import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { query } from '../config/database.js';
import { sanitizeAll } from '../utils/sanitize.js';

const router = Router();

const ContributeSchema = z.object({
  title: z.string().min(1).max(100),
  salary: z.number().positive(),
  city: z.string().min(1),
});

// POST /api/contribute - Anonymous salary contribution
router.post('/', validate(ContributeSchema), async (req, res, next) => {
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

export default router;