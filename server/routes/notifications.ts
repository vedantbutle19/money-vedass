import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

function formatNotification(row: any) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    timestamp: row.timestamp,
    read: Boolean(row.read),
    actionUrl: row.action_url || undefined,
  };
}

// GET /api/notifications
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json(rows.map(formatNotification));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, message, type = 'system', timestamp, actionUrl } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' });
    }

    const id = `notif_${userId}_${Date.now()}`;
    const timeStr = timestamp || 'Just now';

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, timestamp, read, action_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, datetime('now'))
    `).run(id, userId, title, message, type, timeStr, actionUrl || null);

    const created = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(id, userId);
    res.status(201).json(formatNotification(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
