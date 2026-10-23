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
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
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

    const rows = await db.prepare(query).all(...params);
    res.json(rows.map(formatBudget));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/budgets - Tied to logged-in user with upsert & existing spend sync
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { categoryId, categoryName, limit, month = 10, year = 2026 } = req.body;
    if (!categoryId || limit === undefined) {
      return res.status(400).json({ error: 'Category ID and limit are required' });
    }

    const cleanLimit = Math.round((Number(limit) + Number.EPSILON) * 100) / 100;
    if (isNaN(cleanLimit) || cleanLimit < 0) {
      return res.status(400).json({ error: 'Budget limit must be a non-negative number' });
    }

    const numMonth = Number(month);
    const numYear = Number(year);
    const now = new Date().toISOString();

    // Calculate existing spent amount for this category in this month/year from ledger
    const monthPadded = String(numMonth).padStart(2, '0');
    const existingSpentRow = await db.prepare(`
      SELECT SUM(amount) as total FROM transactions
      WHERE user_id = ? AND category_id = ? AND type = 'expense'
        AND strftime('%Y-%m', date) = ?
    `).get(userId, categoryId, `${numYear}-${monthPadded}`) as { total: number | null };
    const currentSpent = existingSpentRow && existingSpentRow.total ? Math.round(Number(existingSpentRow.total) * 100) / 100 : 0;

    // Check if budget allocation already exists for this month/year
    const existingBudget = await db.prepare(`
      SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?
    `).get(userId, categoryId, numMonth, numYear) as any;

    if (existingBudget) {
      await db.prepare(`
        UPDATE budgets
        SET limit_amount = ?, category_name = ?, spent = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(cleanLimit, categoryName || categoryId, currentSpent, now, existingBudget.id, userId);

      const updated = await db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(existingBudget.id, userId);
      return res.status(200).json(formatBudget(updated));
    }

    const id = `b_${userId}_${categoryId}_${numYear}_${numMonth}`;

    await db.prepare(`
      INSERT INTO budgets (id, user_id, category_id, category_name, month, year, limit_amount, spent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, categoryId, categoryName || categoryId, numMonth, numYear, cleanLimit, currentSpent, now, now);

    const created = await db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(id, userId);
    res.status(201).json(formatBudget(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/budgets/:id - Scoped to logged-in user
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = await db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const { limit, spent } = req.body;
    const now = new Date().toISOString();

    const newLimit = limit !== undefined ? Number(limit) : existing.limit_amount;
    const newSpent = spent !== undefined ? Number(spent) : existing.spent;

    await db.prepare(`
      UPDATE budgets
      SET limit_amount = ?, spent = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(newLimit, newSpent, now, req.params.id, userId);

    const updated = await db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatBudget(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/budgets/:id - Scoped to logged-in user
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = await db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Budget deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
