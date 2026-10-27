import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

// GET /api/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const rows = await db.prepare('SELECT * FROM categories').all() as any[];
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        iconName: r.icon_name,
        color: r.color,
        type: r.type,
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Protected system categories that cannot be overwritten by regular users
const SYSTEM_CATEGORY_IDS = new Set([
  'housing',
  'rent',
  'house_loan',
  'emi',
  'water',
  'electricity',
  'broadband',
  'mobile_recharge',
  'gas_bill',
  'maintenance',
  'insurance',
  'food',
  'transport',
  'shopping',
  'entertainment',
  'bills',
  'health',
  'education',
  'salary',
  'investment',
  'transfer',
  'other',
]);

// POST /api/categories - Requires authentication
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, name, iconName, color, type } = req.body;
    if (!id || typeof id !== 'string' || !name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Category id and name required' });
    }

    const cleanId = id.trim().toLowerCase();
    if (SYSTEM_CATEGORY_IDS.has(cleanId)) {
      return res.status(403).json({ error: 'Standard system categories are protected and cannot be modified.' });
    }

    const cleanType = ['expense', 'income', 'both'].includes(type) ? type : 'expense';

    await db.prepare(`
      INSERT OR REPLACE INTO categories (id, name, icon_name, color, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(cleanId, name.trim(), iconName || 'Folder', color || '#6B7280', cleanType);

    res.status(201).json({ id: cleanId, name: name.trim(), iconName, color, type: cleanType });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
