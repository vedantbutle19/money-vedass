import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

const router = Router();

// GET /api/categories
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM categories').all() as any[];
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

// POST /api/categories
router.post('/', (req: Request, res: Response) => {
  try {
    const { id, name, iconName, color, type } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'Category id and name required' });
    }

    db.prepare(`
      INSERT OR REPLACE INTO categories (id, name, icon_name, color, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, iconName || 'Folder', color || '#6B7280', type || 'expense');

    res.status(201).json({ id, name, iconName, color, type });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
