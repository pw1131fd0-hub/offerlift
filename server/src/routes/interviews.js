import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { query } from '../config/database.js';
import { getAnonymousIdFromRequest } from '../utils/anonymous.js';
import { sanitizeAll } from '../utils/sanitize.js';

const router = Router();

const CreateInterviewSchema = z.object({
  company: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  stage: z.string().min(1).max(50),
  notes: z.string().max(1000).optional(),
});

const UpdateInterviewSchema = z.object({
  company: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  stage: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

// GET /api/interviews
router.get('/', async (req, res, next) => {
  try {
    const anonymousId = getAnonymousIdFromRequest(req);
    const { stage } = req.query;

    let sql = `
      SELECT id, company, title, stage, notes, created_at, updated_at
      FROM interviews
      WHERE anonymous_id = $1
    `;
    const params = [anonymousId];

    if (stage) {
      sql += ' AND stage = $2';
      params.push(stage);
    }

    sql += ' ORDER BY updated_at DESC';

    const result = await query(sql, params);

    res.json({
      interviews: result.rows.map(row => ({
        id: row.id,
        company: row.company,
        title: row.title,
        stage: row.stage,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/interviews
router.post('/', validate(CreateInterviewSchema), async (req, res, next) => {
  try {
    const input = sanitizeAll(req.body);
    const anonymousId = getAnonymousIdFromRequest(req);

    const result = await query(
      `INSERT INTO interviews (anonymous_id, company, title, stage, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, company, title, stage, notes, created_at, updated_at`,
      [anonymousId, input.company, input.title, input.stage, input.notes || '']
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      company: row.company,
      title: row.title,
      stage: row.stage,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/interviews/:id
router.put('/:id', validate(UpdateInterviewSchema), async (req, res, next) => {
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
    if (input.stage) {
      paramCount++;
      updates.push(`stage = $${paramCount}`);
      values.push(input.stage);
    }
    if (input.notes !== undefined) {
      paramCount++;
      updates.push(`notes = $${paramCount}`);
      values.push(input.notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE interviews
      SET ${updates.join(', ')}
      WHERE id = $${paramCount + 1} AND anonymous_id = $${paramCount + 2}
      RETURNING id, company, title, stage, notes, updated_at
    `;
    values.push(id, anonymousId);

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      company: row.company,
      title: row.title,
      stage: row.stage,
      notes: row.notes,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/interviews/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const anonymousId = getAnonymousIdFromRequest(req);

    const result = await query(
      `DELETE FROM interviews WHERE id = $1 AND anonymous_id = $2 RETURNING id`,
      [id, anonymousId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
