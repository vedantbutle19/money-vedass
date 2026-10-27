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
    autoDeduct: Boolean(row.auto_deduct),
    lastPaidDate: row.last_paid_date || undefined,
    billType: row.bill_type || 'bill',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Calculate the next due date by advancing 1 month (or chosen cycle)
export function getNextBillingDate(currentDateStr: string, cycle: string = 'monthly'): string {
  const parts = currentDateStr.split('-').map(Number);
  const year = parts[0] || new Date().getUTCFullYear();
  const month = parts[1] || 1; // 1-12
  const day = parts[2] || 1;

  let nextYear = year;
  let nextMonth = month;

  if (cycle === 'yearly') {
    nextYear += 1;
  } else if (cycle === 'quarterly') {
    nextMonth += 3;
    if (nextMonth > 12) {
      nextYear += 1;
      nextMonth -= 12;
    }
  } else {
    // Monthly by default
    nextMonth += 1;
    if (nextMonth > 12) {
      nextYear += 1;
      nextMonth = 1;
    }
  }

  // Handle month length boundary (e.g. 31st in a 30-day month)
  const maxDays = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  const nextDay = Math.min(day, maxDays);

  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
}

// Helper to execute payment deduction logic
async function processDeduction(
  userId: string,
  sub: any,
  options: {
    targetAccountId?: string;
    deductAmount?: number;
    paymentDate?: string;
    notes?: string;
  } = {}
) {
  const targetAccountId = options.targetAccountId || sub.account_id;
  const deductAmount = options.deductAmount !== undefined ? Number(options.deductAmount) : Number(sub.amount);
  const paymentDate = options.paymentDate || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Verify account belongs to user
  const acc = await db.prepare('SELECT id, name, currency FROM accounts WHERE id = ? AND user_id = ?').get(targetAccountId, userId) as any;
  if (!acc) {
    throw new Error('Target account not found or does not belong to your account');
  }

  // 1. Log Expense Transaction
  const txId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const txDesc = `${sub.name} (Recurring Payment)`;
  const tagsJson = JSON.stringify(['#recurring', '#bill', sub.category_id || 'bills']);

  await db.prepare(`
    INSERT INTO transactions (
      id, user_id, account_id, category_id, type, amount, currency, date,
      merchant, description, payment_method, notes, tags, receipt_url, is_recurring,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'expense', ?, ?, ?, ?, ?, 'Bank Transfer', ?, ?, NULL, 1, ?, ?)
  `).run(
    txId,
    userId,
    targetAccountId,
    sub.category_id || 'bills',
    deductAmount,
    acc.currency || 'INR',
    paymentDate,
    sub.name,
    txDesc,
    options.notes || `Recurring bill payment for ${sub.name}`,
    tagsJson,
    now,
    now
  );

  // 2. Deduct Balance from Account
  await db.prepare(`
    UPDATE accounts
    SET balance = ROUND(balance - ?, 2), updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(deductAmount, targetAccountId, userId);

  // 3. Update Category Budget for Payment Month
  const [pYear, pMonth] = paymentDate.split('-').map(Number);
  await db.prepare(`
    UPDATE budgets
    SET spent = ROUND(spent + ?, 2), updated_at = datetime('now')
    WHERE category_id = ? AND month = ? AND year = ? AND user_id = ?
  `).run(deductAmount, sub.category_id || 'bills', pMonth, pYear, userId);

  // 4. Advance Next Due Date and update last_paid_date
  const baseDate = sub.next_billing_date && sub.next_billing_date >= paymentDate ? sub.next_billing_date : paymentDate;
  const nextDate = getNextBillingDate(baseDate, sub.billing_cycle || 'monthly');

  await db.prepare(`
    UPDATE subscriptions
    SET next_billing_date = ?, last_paid_date = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(nextDate, paymentDate, now, sub.id, userId);

  // 5. Create System Notification
  const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  await db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, timestamp, read, created_at)
    VALUES (?, ?, 'Bill Payment Deducted', ?, 'system', 'Just now', 0, datetime('now'))
  `).run(
    notifId,
    userId,
    `₹${deductAmount} was successfully deducted from ${acc.name} for ${sub.name}. Next due date is ${nextDate}.`
  );

  const updatedSub = await db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(sub.id, userId);
  return {
    transactionId: txId,
    deductedAmount: deductAmount,
    nextBillingDate: nextDate,
    subscription: formatSubscription(updatedSub),
    accountName: acc.name,
  };
}

// GET /api/subscriptions - Returns user's bills & auto-deducts overdue items if auto-deduct is enabled
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // Check for any active bills with auto_deduct enabled that are due on or before today
    try {
      const dueAutoSubs = await db.prepare(`
        SELECT * FROM subscriptions
        WHERE user_id = ? AND status = 'active' AND auto_deduct = 1 AND next_billing_date <= ?
      `).all(userId, todayStr) as any[];

      for (const autoSub of dueAutoSubs) {
        try {
          await processDeduction(userId, autoSub, {
            paymentDate: autoSub.next_billing_date,
            notes: `Auto-deducted on due date (${autoSub.next_billing_date})`,
          });
        } catch (autoErr) {
          console.warn(`Auto-deduct error for sub ${autoSub.id}:`, autoErr);
        }
      }
    } catch {}

    const rows = await db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY next_billing_date ASC').all(userId);
    res.json(rows.map(formatSubscription));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions - Create new recurring bill or subscription
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      amount,
      billingCycle = 'monthly',
      nextBillingDate,
      category = 'bills',
      accountId,
      status = 'active',
      icon = 'Receipt',
      autoDeduct = false,
      billType = 'bill',
    } = req.body;

    if (!name || amount === undefined || !billingCycle || !nextBillingDate || !accountId) {
      return res.status(400).json({ error: 'Name, amount, billing cycle, account, and next billing date required' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than zero' });
    }

    // Verify account belongs strictly to authenticated user
    const userAcc = await db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
    if (!userAcc) {
      return res.status(400).json({ error: 'Invalid account ID. Account does not exist or does not belong to your account.' });
    }

    const id = `sub_${userId}_${Date.now()}`;
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, name, amount, billing_cycle, next_billing_date,
        category_id, account_id, status, icon, auto_deduct, bill_type,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      name.trim(),
      numAmount,
      billingCycle,
      nextBillingDate,
      category,
      accountId,
      status,
      icon,
      autoDeduct ? 1 : 0,
      billType,
      now,
      now
    );

    const created = await db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(id, userId);
    res.status(201).json(formatSubscription(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/:id/deduct - Deduct payment on demand and advance billing cycle
router.post('/:id/deduct', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sub = await db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!sub) {
      return res.status(404).json({ error: 'Bill or Subscription not found' });
    }

    const targetAccountId = req.body.accountId || sub.account_id;
    const deductAmount = req.body.amount !== undefined ? Number(req.body.amount) : Number(sub.amount);

    if (isNaN(deductAmount) || !isFinite(deductAmount) || deductAmount <= 0) {
      return res.status(400).json({ error: 'Deduction amount must be a positive number greater than zero' });
    }

    const paymentDate = req.body.date || new Date().toISOString().split('T')[0];
    const notes = req.body.notes || `Payment deducted for ${sub.name}`;

    const result = await processDeduction(userId, sub, {
      targetAccountId,
      deductAmount,
      paymentDate,
      notes,
    });

    res.json({
      success: true,
      message: `Successfully deducted ₹${deductAmount} from ${result.accountName} for ${sub.name}! Next payment due on ${result.nextBillingDate}.`,
      subscription: result.subscription,
      transactionId: result.transactionId,
      deductedAmount: result.deductedAmount,
      nextBillingDate: result.nextBillingDate,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subscriptions/:id - Update recurring bill or subscription
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = await db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Bill or Subscription not found' });
    }

    const {
      name,
      amount,
      billingCycle,
      nextBillingDate,
      category,
      accountId,
      status,
      icon,
      autoDeduct,
      billType,
    } = req.body;

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number greater than zero' });
      }
    }

    if (accountId && accountId !== existing.account_id) {
      const userAcc = await db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
      if (!userAcc) {
        return res.status(400).json({ error: 'Invalid account ID. Account does not exist or does not belong to your account.' });
      }
    }

    const now = new Date().toISOString();
    const updatedAutoDeduct = autoDeduct !== undefined ? (autoDeduct ? 1 : 0) : existing.auto_deduct;

    await db.prepare(`
      UPDATE subscriptions
      SET name = ?, amount = ?, billing_cycle = ?, next_billing_date = ?, category_id = ?, account_id = ?,
          status = ?, icon = ?, auto_deduct = ?, bill_type = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name ? name.trim() : existing.name,
      amount !== undefined ? Number(amount) : existing.amount,
      billingCycle ?? existing.billing_cycle,
      nextBillingDate ?? existing.next_billing_date,
      category ?? existing.category_id,
      accountId ?? existing.account_id,
      status ?? existing.status,
      icon ?? existing.icon,
      updatedAutoDeduct,
      billType ?? existing.bill_type ?? 'bill',
      now,
      req.params.id,
      userId
    );

    const updated = await db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatSubscription(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/subscriptions/:id/toggle - Toggle active / paused
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = await db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Bill or Subscription not found' });
    }

    const newStatus = existing.status === 'active' ? 'paused' : 'active';
    const now = new Date().toISOString();

    await db.prepare('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(newStatus, now, req.params.id, userId);

    const updated = await db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatSubscription(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/:id/deduct - Deduct payment for a subscription/bill
router.post('/:id/deduct', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, accountId, date, notes } = req.body;

    const sub = await db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!sub) {
      return res.status(404).json({ error: 'Bill or Subscription not found' });
    }

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number greater than zero' });
      }
    }

    const result = await processDeduction(userId, sub, {
      deductAmount: amount !== undefined ? Number(amount) : undefined,
      targetAccountId: accountId,
      paymentDate: date,
      notes,
    });

    res.json({
      success: true,
      message: `Successfully deducted ₹${result.deductedAmount} for ${sub.name}`,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = await db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Bill or Subscription not found' });
    }

    await db.prepare('DELETE FROM subscriptions WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Bill / Subscription deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
