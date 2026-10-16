import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Require authentication for all transaction routes
router.use(requireAuth);

function formatTransaction(row: any) {
  let tags: string[] = [];
  if (row.tags) {
    try {
      tags = JSON.parse(row.tags);
    } catch {
      tags = typeof row.tags === 'string' ? row.tags.split(',').map((s: string) => s.trim()) : [];
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    toAccountId: row.to_account_id || undefined,
    categoryId: row.category_id,
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency || 'INR',
    date: row.date,
    merchant: row.merchant || undefined,
    description: row.description,
    paymentMethod: row.payment_method,
    notes: row.notes || undefined,
    tags,
    receiptUrl: row.receipt_url || undefined,
    isRecurring: Boolean(row.is_recurring),
  };
}

// Helper to safely extract UTC year and month from ISO date string (YYYY-MM-DD)
// This avoids timezone boundary shifts where local midnight parses as previous day in negative timezones
function parseDateParts(dateStr: string): { year: number; month: number } {
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) {
        return { year: y, month: m };
      }
    }
  }
  const d = new Date(dateStr);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

// Helper to round financial numbers to 2 decimal places
function roundCurrency(val: number): number {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

// Helper to adjust balance & budget scoped to a specific user
function applyTransactionEffects(userId: string, tx: {
  type: string;
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  date: string;
}) {
  const amt = roundCurrency(tx.amount);
  const { year, month } = parseDateParts(tx.date);

  if (tx.type === 'expense') {
    db.prepare(`UPDATE accounts SET balance = ROUND(balance - ?, 2), updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(amt, tx.accountId, userId);
    
    // Update budget spent for this category, month/year, and user
    db.prepare(`UPDATE budgets SET spent = ROUND(spent + ?, 2), updated_at = datetime('now') WHERE category_id = ? AND month = ? AND year = ? AND user_id = ?`)
      .run(amt, tx.categoryId, month, year, userId);
  } else if (tx.type === 'income') {
    db.prepare(`UPDATE accounts SET balance = ROUND(balance + ?, 2), updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(amt, tx.accountId, userId);
  } else if (tx.type === 'transfer' && tx.toAccountId) {
    db.prepare(`UPDATE accounts SET balance = ROUND(balance - ?, 2), updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(amt, tx.accountId, userId);
    db.prepare(`UPDATE accounts SET balance = ROUND(balance + ?, 2), updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(amt, tx.toAccountId, userId);
  }
}

// Helper to revert balance & budget scoped to a specific user
function revertTransactionEffects(userId: string, tx: {
  type: string;
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  date: string;
}) {
  const amt = roundCurrency(tx.amount);
  const { year, month } = parseDateParts(tx.date);

  if (tx.type === 'expense') {
    db.prepare(`UPDATE accounts SET balance = ROUND(balance + ?, 2), updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(amt, tx.accountId, userId);
    
    db.prepare(`UPDATE budgets SET spent = ROUND(MAX(0, spent - ?), 2), updated_at = datetime('now') WHERE category_id = ? AND month = ? AND year = ? AND user_id = ?`)
      .run(amt, tx.categoryId, month, year, userId);
  } else if (tx.type === 'income') {
    db.prepare(`UPDATE accounts SET balance = ROUND(balance - ?, 2), updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(amt, tx.accountId, userId);
  } else if (tx.type === 'transfer' && tx.toAccountId) {
    db.prepare(`UPDATE accounts SET balance = ROUND(balance + ?, 2), updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(amt, tx.accountId, userId);
    db.prepare(`UPDATE accounts SET balance = ROUND(balance - ?, 2), updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(amt, tx.toAccountId, userId);
  }
}

// GET /api/transactions - Scoped to logged-in user
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { month, year, accountId, categoryId, search, type } = req.query;
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params: any[] = [userId];

    if (month && year) {
      const monthPadded = String(month).padStart(2, '0');
      query += ` AND strftime('%Y-%m', date) = ?`;
      params.push(`${year}-${monthPadded}`);
    } else if (year) {
      query += ` AND strftime('%Y', date) = ?`;
      params.push(String(year));
    }

    if (accountId) {
      query += ' AND (account_id = ? OR to_account_id = ?)';
      params.push(accountId, accountId);
    }

    if (categoryId) {
      query += ' AND category_id = ?';
      params.push(categoryId);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (description LIKE ? OR merchant LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(formatTransaction));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions/:id - Scoped to logged-in user
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const row = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(formatTransaction(row));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions - Create for logged-in user
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      accountId,
      toAccountId,
      categoryId,
      type,
      amount,
      currency,
      date,
      merchant,
      description,
      paymentMethod,
      notes,
      tags,
      receiptUrl,
      isRecurring,
    } = req.body;

    if (!accountId || !categoryId || !type || amount === undefined || !date || !description) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Transaction amount must be a positive number greater than zero' });
    }
    const cleanAmount = roundCurrency(numAmount);

    if (!['expense', 'income', 'transfer'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type. Must be expense, income, or transfer' });
    }

    // Verify source account belongs strictly to authenticated user
    const sourceAcc = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
    if (!sourceAcc) {
      return res.status(400).json({ error: 'Invalid account ID. Account does not exist or does not belong to your account.' });
    }

    // If transfer, verify destination account belongs to user and is distinct
    if (type === 'transfer') {
      if (!toAccountId || typeof toAccountId !== 'string') {
        return res.status(400).json({ error: 'Destination account ID is required for transfers' });
      }
      if (toAccountId === accountId) {
        return res.status(400).json({ error: 'Source and destination accounts cannot be identical' });
      }
      const destAcc = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(toAccountId, userId);
      if (!destAcc) {
        return res.status(400).json({ error: 'Invalid destination account ID. Destination account does not exist or does not belong to your account.' });
      }
    }

    const id = `tx_${Date.now()}`;
    const tagsJson = tags ? JSON.stringify(tags) : null;
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO transactions (
          id, user_id, account_id, to_account_id, category_id, type, amount, currency, date,
          merchant, description, payment_method, notes, tags, receipt_url, is_recurring,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        accountId,
        toAccountId || null,
        categoryId,
        type,
        cleanAmount,
        currency || 'INR',
        date,
        merchant || null,
        description,
        paymentMethod || 'UPI',
        notes || null,
        tagsJson,
        receiptUrl || null,
        isRecurring ? 1 : 0,
        now,
        now
      );

      // Auto update balances and budgets for current user
      applyTransactionEffects(userId, {
        type,
        amount: cleanAmount,
        accountId,
        toAccountId,
        categoryId,
        date,
      });

      db.exec('COMMIT;');
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }

    const created = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, userId);
    res.status(201).json(formatTransaction(created));
  } catch (err: any) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const {
      accountId,
      toAccountId,
      categoryId,
      type,
      amount,
      currency,
      date,
      merchant,
      description,
      paymentMethod,
      notes,
      tags,
      receiptUrl,
      isRecurring,
    } = req.body;

    const newAccountId = accountId ?? existing.account_id;
    const newToAccountId = toAccountId !== undefined ? toAccountId : existing.to_account_id;
    const newCategoryId = categoryId ?? existing.category_id;
    const newType = type ?? existing.type;
    const rawAmount = amount !== undefined ? Number(amount) : Number(existing.amount);
    if (isNaN(rawAmount) || !isFinite(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({ error: 'Transaction amount must be a positive number greater than zero' });
    }
    const newAmount = roundCurrency(rawAmount);

    if (!['expense', 'income', 'transfer'].includes(newType)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Verify source account belongs to authenticated user
    const sourceAcc = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(newAccountId, userId);
    if (!sourceAcc) {
      return res.status(400).json({ error: 'Invalid account ID. Account does not exist or does not belong to you.' });
    }

    if (newType === 'transfer') {
      if (!newToAccountId) {
        return res.status(400).json({ error: 'Destination account is required for transfers' });
      }
      if (newToAccountId === newAccountId) {
        return res.status(400).json({ error: 'Source and destination accounts cannot be identical' });
      }
      const destAcc = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(newToAccountId, userId);
      if (!destAcc) {
        return res.status(400).json({ error: 'Invalid destination account ID. Account does not exist or does not belong to you.' });
      }
    }

    const newCurrency = currency ?? (existing.currency || 'INR');
    const newDate = date ?? existing.date;
    const newMerchant = merchant !== undefined ? merchant : existing.merchant;
    const newDesc = description ?? existing.description;
    const newPaymentMethod = paymentMethod ?? existing.payment_method;
    const newNotes = notes !== undefined ? notes : existing.notes;
    const newTags = tags !== undefined ? JSON.stringify(tags) : existing.tags;
    const newReceiptUrl = receiptUrl !== undefined ? receiptUrl : existing.receipt_url;
    const newIsRecurring = isRecurring !== undefined ? (isRecurring ? 1 : 0) : existing.is_recurring;
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Revert existing transaction balance & budget impacts
      revertTransactionEffects(userId, {
        type: existing.type,
        amount: Number(existing.amount),
        accountId: existing.account_id,
        toAccountId: existing.to_account_id,
        categoryId: existing.category_id,
        date: existing.date,
      });

      // 2. Update transaction record
      db.prepare(`
        UPDATE transactions
        SET account_id = ?, to_account_id = ?, category_id = ?, type = ?, amount = ?, currency = ?,
            date = ?, merchant = ?, description = ?, payment_method = ?, notes = ?,
            tags = ?, receipt_url = ?, is_recurring = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(
        newAccountId,
        newToAccountId || null,
        newCategoryId,
        newType,
        newAmount,
        newCurrency,
        newDate,
        newMerchant || null,
        newDesc,
        newPaymentMethod,
        newNotes || null,
        newTags,
        newReceiptUrl || null,
        newIsRecurring,
        now,
        req.params.id,
        userId
      );

      // 3. Apply new transaction balance & budget impacts
      applyTransactionEffects(userId, {
        type: newType,
        amount: newAmount,
        accountId: newAccountId,
        toAccountId: newToAccountId,
        categoryId: newCategoryId,
        date: newDate,
      });

      db.exec('COMMIT;');
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }

    const updated = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    res.json(formatTransaction(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions/batch-delete - Delete multiple transactions
router.post('/batch-delete', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of transaction IDs required' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const id of ids) {
        const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, userId) as any;
        if (existing) {
          revertTransactionEffects(userId, {
            type: existing.type,
            amount: Number(existing.amount),
            accountId: existing.account_id,
            toAccountId: existing.to_account_id,
            categoryId: existing.category_id,
            date: existing.date,
          });
          db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId);
        }
      }
      db.exec('COMMIT;');
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }

    res.json({ success: true, count: ids.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/transactions/:id - Delete single transaction
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      revertTransactionEffects(userId, {
        type: existing.type,
        amount: Number(existing.amount),
        accountId: existing.account_id,
        toAccountId: existing.to_account_id,
        categoryId: existing.category_id,
        date: existing.date,
      });
      db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(req.params.id, userId);
      db.exec('COMMIT;');
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
