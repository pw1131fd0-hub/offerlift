import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { query } from '../config/database.js';
import { getAnonymousIdFromRequest } from '../utils/anonymous.js';
import { sanitizeAll } from '../utils/sanitize.js';

const router = Router();

const CreateOfferSchema = z.object({
  company: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  deadline: z.string(),
  status: z.enum(['candidate', 'negotiating', 'accepted', 'rejected', 'expired']).optional(),
});

const UpdateOfferSchema = z.object({
  company: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  deadline: z.string().optional(),
  status: z.enum(['candidate', 'negotiating', 'accepted', 'rejected', 'expired']),
});

// GET /api/offers
router.get('/', async (req, res, next) => {
  try {
    const anonymousId = getAnonymousIdFromRequest(req);

    const result = await query(
      `SELECT id, company, title, deadline, status, created_at
       FROM offers
       WHERE anonymous_id = $1
       ORDER BY created_at DESC`,
      [anonymousId]
    );

    res.json({
      offers: result.rows.map(row => ({
        id: row.id,
        company: row.company,
        title: row.title,
        deadline: row.deadline,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/offers
router.post('/', validate(CreateOfferSchema), async (req, res, next) => {
  try {
    const input = sanitizeAll(req.body);
    const anonymousId = getAnonymousIdFromRequest(req);

    const result = await query(
      `INSERT INTO offers (anonymous_id, company, title, deadline, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, company, title, deadline, status, created_at`,
      [anonymousId, input.company, input.title, input.deadline, input.status || 'candidate']
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      company: row.company,
      title: row.title,
      deadline: row.deadline,
      status: row.status,
      createdAt: row.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/offers/:id
router.put('/:id', validate(UpdateOfferSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const input = sanitizeAll(req.body);
    const anonymousId = getAnonymousIdFromRequest(req);

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (input.company) {
      paramCount++;
      updates.push(`company = $${paramCount}`);
      values.push(input.company);
    }
    if (input.title) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(input.title);
    }
    if (input.deadline) {
      paramCount++;
      updates.push(`deadline = $${paramCount}`);
      values.push(input.deadline);
    }
    if (input.status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(input.status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE offers
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND anonymous_id = $${paramCount + 1}
      RETURNING id, company, title, deadline, status, updated_at
    `;
    values.push(id, anonymousId);

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      company: row.company,
      title: row.title,
      deadline: row.deadline,
      status: row.status,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/offers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const anonymousId = getAnonymousIdFromRequest(req);

    const result = await query(
      `DELETE FROM offers WHERE id = $1 AND anonymous_id = $2 RETURNING id`,
      [id, anonymousId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
