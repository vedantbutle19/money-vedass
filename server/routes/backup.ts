import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

// GET /api/backup/export - Exports only logged-in user's records
router.get('/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      user: await db.prepare('SELECT id, name, email, currency, currency_symbol, date_format, monthly_income_baseline, joined_date FROM users WHERE id = ?').get(userId),
      accounts: await db.prepare('SELECT * FROM accounts WHERE user_id = ?').all(userId),
      transactions: await db.prepare('SELECT * FROM transactions WHERE user_id = ?').all(userId),
      budgets: await db.prepare('SELECT * FROM budgets WHERE user_id = ?').all(userId),
      goals: await db.prepare('SELECT * FROM goals WHERE user_id = ?').all(userId),
      subscriptions: await db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').all(userId),
      recurring: await db.prepare('SELECT * FROM recurring_transactions WHERE user_id = ?').all(userId),
      notifications: await db.prepare('SELECT * FROM notifications WHERE user_id = ?').all(userId),
    };
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/backup/reset - Clears only logged-in user's data
router.post('/reset', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM budgets WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM goals WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM recurring_transactions WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
    await db.prepare('UPDATE accounts SET balance = 0 WHERE user_id = ?').run(userId);

    res.json({ success: true, message: 'Your personal records have been reset to zero.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/backup/import - Imports records strictly into logged-in user's account
router.post('/import', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const backup = req.body;
    if (!backup || typeof backup !== 'object') {
      return res.status(400).json({ error: 'Valid JSON backup object required' });
    }

    if (Array.isArray(backup.transactions)) {
      await db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
      const insertTx = db.prepare(`
        INSERT INTO transactions (id, user_id, account_id, to_account_id, category_id, type, amount, date, merchant, description, payment_method, notes, tags, receipt_url, is_recurring, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of backup.transactions) {
        await insertTx.run(
          t.id,
          userId,
          t.account_id || t.accountId,
          t.to_account_id || t.toAccountId || null,
          t.category_id || t.categoryId,
          t.type,
          Number(t.amount),
          t.date,
          t.merchant || null,
          t.description,
          t.payment_method || t.paymentMethod || 'UPI',
          t.notes || null,
          typeof t.tags === 'string' ? t.tags : JSON.stringify(t.tags || []),
          t.receipt_url || t.receiptUrl || null,
          t.is_recurring || t.isRecurring ? 1 : 0,
          t.created_at || new Date().toISOString(),
          t.updated_at || new Date().toISOString()
        );
      }
    }

    if (Array.isArray(backup.accounts)) {
      await db.prepare('DELETE FROM accounts WHERE user_id = ?').run(userId);
      const insertAcc = db.prepare(`
        INSERT INTO accounts (id, user_id, name, type, balance, currency, account_number_masked, institution, color, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of backup.accounts) {
        await insertAcc.run(
          a.id,
          userId,
          a.name,
          a.type,
          Number(a.balance),
          a.currency || 'INR',
          a.account_number_masked || a.accountNumberMasked || '••••',
          a.institution || a.name,
          a.color || '#3B82F6',
          a.updated_at || new Date().toISOString(),
          a.created_at || new Date().toISOString()
        );
      }
    }

    if (Array.isArray(backup.budgets)) {
      await db.prepare('DELETE FROM budgets WHERE user_id = ?').run(userId);
      const insertB = db.prepare(`
        INSERT INTO budgets (id, user_id, category_id, category_name, month, year, limit_amount, spent, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const b of backup.budgets) {
        await insertB.run(
          b.id,
          userId,
          b.category_id || b.categoryId,
          b.category_name || b.categoryName,
          Number(b.month),
          Number(b.year),
          Number(b.limit_amount || b.limit),
          Number(b.spent || 0),
          b.created_at || new Date().toISOString(),
          b.updated_at || new Date().toISOString()
        );
      }
    }

    if (Array.isArray(backup.goals)) {
      await db.prepare('DELETE FROM goals WHERE user_id = ?').run(userId);
      const insertG = db.prepare(`
        INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date, monthly_contribution, category, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const g of backup.goals) {
        await insertG.run(
          g.id,
          userId,
          g.name,
          Number(g.target_amount || g.targetAmount),
          Number(g.current_amount || g.currentAmount || 0),
          g.target_date || g.targetDate,
          Number(g.monthly_contribution || g.monthlyContribution || 0),
          g.category || null,
          g.color || '#3B82F6',
          g.created_at || new Date().toISOString(),
          g.updated_at || new Date().toISOString()
        );
      }
    }

    res.json({ success: true, message: 'Your personal data was successfully imported.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
