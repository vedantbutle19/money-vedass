import { Request, Response, NextFunction } from 'express';
import { db } from '../db.ts';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  monthlyIncomeBaseline: number;
  joinedDate: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in to access your records.' });
    }

    // Look up active session
    const session = db.prepare(`
      SELECT 
        s.token,
        s.user_id,
        s.expires_at,
        u.id,
        u.name,
        u.email,
        u.phone,
        u.currency,
        u.currency_symbol,
        u.date_format,
        u.monthly_income_baseline,
        u.joined_date
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `).get(token) as any;

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in.' });
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    req.user = {
      id: session.id,
      name: session.name,
      email: session.email,
      phone: session.phone || '',
      currency: session.currency || 'INR',
      currencySymbol: session.currency_symbol || '₹',
      dateFormat: session.date_format || 'DD/MM/YYYY',
      monthlyIncomeBaseline: Number(session.monthly_income_baseline || 0),
      joinedDate: session.joined_date,
    };

    next();
  } catch (err: any) {
    res.status(500).json({ error: `Authentication error: ${err.message}` });
  }
}
