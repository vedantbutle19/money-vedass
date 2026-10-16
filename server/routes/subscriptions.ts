import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

function formatSubscription(row: any) {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    billingCycle: row.billing_cycle,
    nextBillingDate: row.next_billing_date,
    category: row.category_id,
    accountId: row.account_id,
    status: row.status,
    icon: row.icon,
  };
}

// GET /api/subscriptions
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rows = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY next_billing_date ASC').all(userId);
    res.json(rows.map(formatSubscription));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, amount, billingCycle, nextBillingDate, category, accountId, status = 'active', icon = 'Tv' } = req.body;
    if (!name || amount === undefined || !billingCycle || !nextBillingDate || !accountId) {
      return res.status(400).json({ error: 'Name, amount, billing cycle, account, and next billing date required' });
    }

    const id = `sub_${userId}_${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO subscriptions (id, user_id, name, amount, billing_cycle, next_billing_date, category_id, account_id, status, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      name,
      Number(amount),
      billingCycle,
      nextBillingDate,
      category || 'entertainment',
      accountId,
      status,
      icon,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(id, userId);
    res.status(201).json(formatSubscription(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subscriptions/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const { name, amount, billingCycle, nextBillingDate, category, accountId, status, icon } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE subscriptions
      SET name = ?, amount = ?, billing_cycle = ?, next_billing_date = ?, category_id = ?, account_id = ?, status = ?, icon = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name ?? existing.name,
      amount !== undefined ? Number(amount) : existing.amount,
      billingCycle ?? existing.billing_cycle,
      nextBillingDate ?? existing.next_billing_date,
      category ?? existing.category_id,
      accountId ?? existing.account_id,
      status ?? existing.status,
      icon ?? existing.icon,
      now,
      req.params.id,
      userId
    );

    const updated = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatSubscription(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    db.prepare('DELETE FROM subscriptions WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
