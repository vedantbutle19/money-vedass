import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Apply authentication to all account routes
router.use(requireAuth);

function formatAccount(row: any) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    balance: Number(row.balance),
    currency: row.currency || 'INR',
    accountNumberMasked: row.account_number_masked,
    institution: row.institution,
    color: row.color,
    updatedAt: row.updated_at,
  };
}

// GET /api/accounts - Only returns current user's accounts
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rows = await db.prepare('SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at ASC').all(userId);
    res.json(rows.map(formatAccount));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/:id - Only returns if belongs to current user
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const row = await db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!row) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(formatAccount(row));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts - Insert tied to current user's ID
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, type, balance, currency, accountNumberMasked, institution, color } = req.body;
    if (!name || typeof name !== 'string' || !name.trim() || !type) {
      return res.status(400).json({ error: 'Account name and type are required' });
    }

    const id = `acc_${userId}_${Date.now()}`;
    const now = new Date().toISOString();
    const cleanBalance = Math.round((Number(balance || 0) + Number.EPSILON) * 100) / 100;

    await db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, balance, currency, account_number_masked, institution, color, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      name.trim(),
      type,
      cleanBalance,
      currency || 'INR',
      accountNumberMasked || '••••',
      institution || name.trim(),
      color || '#3B82F6',
      now,
      now
    );

    const created = await db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(id, userId);
    res.status(201).json(formatAccount(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounts/:id - Update only if belongs to current user
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = await db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const { name, type, balance, currency, accountNumberMasked, institution, color } = req.body;
    const now = new Date().toISOString();
    const cleanBalance = balance !== undefined ? Math.round((Number(balance) + Number.EPSILON) * 100) / 100 : existing.balance;

    await db.prepare(`
      UPDATE accounts
      SET name = ?, type = ?, balance = ?, currency = ?, account_number_masked = ?, institution = ?, color = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name ? name.trim() : existing.name,
      type ?? existing.type,
      cleanBalance,
      currency ?? existing.currency,
      accountNumberMasked ?? existing.account_number_masked,
      institution ?? existing.institution,
      color ?? existing.color,
      now,
      req.params.id,
      userId
    );

    const updated = await db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatAccount(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/:id - Delete only if belongs to current user and has no linked transactions
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = await db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if any transactions reference this account
    const txCheck = await db.prepare(`
      SELECT COUNT(*) as count FROM transactions
      WHERE (account_id = ? OR to_account_id = ?) AND user_id = ?
    `).get(req.params.id, req.params.id, userId) as { count: number };

    if (txCheck && txCheck.count > 0) {
      return res.status(400).json({
        error: `Cannot delete account with ${txCheck.count} existing transaction(s). Please reassign or delete these transactions first to protect ledger integrity.`,
      });
    }

    await db.prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Account deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
