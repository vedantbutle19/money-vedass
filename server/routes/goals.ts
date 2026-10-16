import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

function formatGoal(row: any) {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    targetDate: row.target_date,
    monthlyContribution: Number(row.monthly_contribution),
    category: row.category || undefined,
    color: row.color || undefined,
    createdAt: row.created_at,
  };
}

// GET /api/goals
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rows = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json(rows.map(formatGoal));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/goals
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, targetAmount, currentAmount = 0, targetDate, monthlyContribution = 0, category, color } = req.body;
    if (!name || targetAmount === undefined || !targetDate) {
      return res.status(400).json({ error: 'Name, target amount, and target date are required' });
    }

    const id = `g_${userId}_${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date, monthly_contribution, category, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      name,
      Number(targetAmount),
      Number(currentAmount),
      targetDate,
      Number(monthlyContribution),
      category || null,
      color || '#3B82F6',
      now,
      now
    );

    const created = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(id, userId);
    res.status(201).json(formatGoal(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/goals/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const { name, targetAmount, currentAmount, targetDate, monthlyContribution, category, color } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE goals
      SET name = ?, target_amount = ?, current_amount = ?, target_date = ?, monthly_contribution = ?, category = ?, color = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name ?? existing.name,
      targetAmount !== undefined ? Number(targetAmount) : existing.target_amount,
      currentAmount !== undefined ? Number(currentAmount) : existing.current_amount,
      targetDate ?? existing.target_date,
      monthlyContribution !== undefined ? Number(monthlyContribution) : existing.monthly_contribution,
      category !== undefined ? category : existing.category,
      color ?? existing.color,
      now,
      req.params.id,
      userId
    );

    const updated = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatGoal(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
