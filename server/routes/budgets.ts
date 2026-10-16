import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

function formatBudget(row: any) {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    month: Number(row.month),
    year: Number(row.year),
    limit: Number(row.limit_amount),
    spent: Number(row.spent),
  };
}

// GET /api/budgets - Scoped to logged-in user
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { month, year } = req.query;
    let query = 'SELECT * FROM budgets WHERE user_id = ?';
    const params: any[] = [userId];

    if (month) {
      query += ' AND month = ?';
      params.push(Number(month));
    }
    if (year) {
      query += ' AND year = ?';
      params.push(Number(year));
    }

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(formatBudget));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/budgets - Tied to logged-in user
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { categoryId, categoryName, limit, month = 10, year = 2026 } = req.body;
    if (!categoryId || limit === undefined) {
      return res.status(400).json({ error: 'Category ID and limit are required' });
    }

    const id = `b_${userId}_${categoryId}_${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO budgets (id, user_id, category_id, category_name, month, year, limit_amount, spent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, userId, categoryId, categoryName || categoryId, Number(month), Number(year), Number(limit), now, now);

    const created = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(id, userId);
    res.status(201).json(formatBudget(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/budgets/:id - Scoped to logged-in user
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const { limit, spent } = req.body;
    const now = new Date().toISOString();

    const newLimit = limit !== undefined ? Number(limit) : existing.limit_amount;
    const newSpent = spent !== undefined ? Number(spent) : existing.spent;

    db.prepare(`
      UPDATE budgets
      SET limit_amount = ?, spent = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(newLimit, newSpent, now, req.params.id, userId);

    const updated = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatBudget(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/budgets/:id - Scoped to logged-in user
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Budget deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
