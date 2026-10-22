import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

function formatRecurring(row: any) {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    type: row.type,
    frequency: row.frequency,
    dayOfMonth: Number(row.day_of_month),
    category: row.category_id,
    accountId: row.account_id,
    status: row.status,
    nextRunDate: row.next_run_date,
  };
}

// GET /api/recurring
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rows = db.prepare('SELECT * FROM recurring_transactions WHERE user_id = ? ORDER BY next_run_date ASC').all(userId);
    res.json(rows.map(formatRecurring));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recurring
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, amount, type, frequency, dayOfMonth = 1, category, accountId, status = 'active', nextRunDate } = req.body;
    if (!name || amount === undefined || !type || !frequency || !accountId) {
      return res.status(400).json({ error: 'Name, amount, type, frequency, and account required' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Recurring amount must be a positive number greater than zero' });
    }

    // Verify account belongs strictly to authenticated user
    const userAcc = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
    if (!userAcc) {
      return res.status(400).json({ error: 'Invalid account ID. Account does not exist or does not belong to your account.' });
    }

    const id = `rec_${userId}_${Date.now()}`;
    const now = new Date().toISOString();
    const nextDate = nextRunDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO recurring_transactions (id, user_id, name, amount, type, frequency, day_of_month, category_id, account_id, status, next_run_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      name,
      numAmount,
      type,
      frequency,
      Number(dayOfMonth),
      category || 'bills',
      accountId,
      status,
      nextDate,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?').get(id, userId);
    res.status(201).json(formatRecurring(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/recurring/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    const { name, amount, type, frequency, dayOfMonth, category, accountId, status, nextRunDate } = req.body;

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Recurring amount must be a positive number greater than zero' });
      }
    }

    if (accountId && accountId !== existing.account_id) {
      const userAcc = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
      if (!userAcc) {
        return res.status(400).json({ error: 'Invalid account ID. Account does not exist or does not belong to your account.' });
      }
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE recurring_transactions
      SET name = ?, amount = ?, type = ?, frequency = ?, day_of_month = ?, category_id = ?, account_id = ?, status = ?, next_run_date = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name ?? existing.name,
      amount !== undefined ? Number(amount) : existing.amount,
      type ?? existing.type,
      frequency ?? existing.frequency,
      dayOfMonth !== undefined ? Number(dayOfMonth) : existing.day_of_month,
      category ?? existing.category_id,
      accountId ?? existing.account_id,
      status ?? existing.status,
      nextRunDate ?? existing.next_run_date,
      now,
      req.params.id,
      userId
    );

    const updated = db.prepare('SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatRecurring(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/recurring/:id/toggle - Toggle active / paused
router.patch('/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    const newStatus = existing.status === 'active' ? 'paused' : 'active';
    const now = new Date().toISOString();

    db.prepare('UPDATE recurring_transactions SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(newStatus, now, req.params.id, userId);

    const updated = db.prepare('SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatRecurring(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/recurring/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    db.prepare('DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Recurring transaction deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
