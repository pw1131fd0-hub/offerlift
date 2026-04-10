import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { evaluateOffer } from '../services/evaluator.js';
import { getAnonymousIdFromRequest } from '../utils/anonymous.js';
import { query } from '../config/database.js';
import { sanitizeAll } from '../utils/sanitize.js';

const router = Router();

const EvaluateSchema = z.object({
  jobTitle: z.string().min(1),
  totalComp: z.number().positive(),
  baseSalary: z.number().positive(),
  bonus: z.number().min(0).max(12),
  equity: z.number().min(0).max(5),
  city: z.enum(['taipei', 'nhc', 'taichung', 'kaohsiung', 'remote']),
  experience: z.enum(['0-2', '2-5', '5-10', '10+']),
});

// POST /api/evaluate
router.post('/', validate(EvaluateSchema), async (req, res, next) => {
  try {
    const input = sanitizeAll(req.body);
    const anonymousId = getAnonymousIdFromRequest(req);

    // Evaluate offer
    const result = evaluateOffer(input);

    // Save to history
    await query(
      `INSERT INTO evaluations (anonymous_id, job_title, score, total_comp, breakdown)
       VALUES ($1, $2, $3, $4, $5)`,
      [anonymousId, input.jobTitle, result.score, input.totalComp, JSON.stringify(result.breakdown)]
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/evaluate/history
router.get('/history', async (req, res, next) => {
  try {
    const anonymousId = getAnonymousIdFromRequest(req);

    const result = await query(
      `SELECT id, job_title, score, total_comp, breakdown, created_at
       FROM evaluations
       WHERE anonymous_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [anonymousId]
    );

    res.json({
      evaluations: result.rows.map(row => ({
        id: row.id,
        jobTitle: row.job_title,
        score: row.score,
        totalComp: row.total_comp,
        breakdown: row.breakdown,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
