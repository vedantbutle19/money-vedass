import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { db, initDatabase } from './db.ts';

import authRouter from './routes/auth.ts';
import accountsRouter from './routes/accounts.ts';
import transactionsRouter from './routes/transactions.ts';
import budgetsRouter from './routes/budgets.ts';
import goalsRouter from './routes/goals.ts';
import subscriptionsRouter from './routes/subscriptions.ts';
import recurringRouter from './routes/recurring.ts';
import categoriesRouter from './routes/categories.ts';
import notificationsRouter from './routes/notifications.ts';
import healthRouter from './routes/health.ts';
import backupRouter from './routes/backup.ts';

// Initialize SQLite schema and initial seed data
initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Body parser
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Security headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS Middleware
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logger (in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.originalUrl.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      stats: {
        users: userCount.count,
        transactions: txCount.count,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Mount modular API routers
app.use('/api/auth', authRouter);
app.use('/api/user', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/recurring', recurringRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/financial-health', healthRouter);
app.use('/api/backup', backupRouter);

// Serve frontend in production or if dist folder exists
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 for undefined API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({ error: isDev ? (err.message || 'Internal Server Error') : 'An unexpected internal error occurred.' });
});

let server: any = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Finora Backend Server running on http://localhost:${PORT}`);
    console.log(`📁 Persistent SQLite database initialized at data/finora.db`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down Finora server gracefully...');
    if (server) {
      server.close(() => {
        try {
          db.close();
          console.log('Database connection closed.');
        } catch {}
        process.exit(0);
      });
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export { app, server };
export default app;
