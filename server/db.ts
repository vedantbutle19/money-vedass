import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// Ensure data folder exists if using file path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const defaultDbPath = process.env.VERCEL ? path.join('/tmp', 'finora.db') : path.join(DATA_DIR, 'finora.db');
const DB_PATH = process.env.DB_PATH || defaultDbPath;
if (DB_PATH !== ':memory:' && !fs.existsSync(path.dirname(DB_PATH))) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  } catch {}
}

export const db = new DatabaseSync(DB_PATH);

// Setup database optimizations & constraints
if (DB_PATH !== ':memory:') {
  db.exec('PRAGMA journal_mode = WAL;');
}
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT,
      currency TEXT DEFAULT 'INR',
      currency_symbol TEXT DEFAULT '₹',
      date_format TEXT DEFAULT 'DD/MM/YYYY',
      monthly_income_baseline REAL DEFAULT 0,
      joined_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      account_number_masked TEXT,
      institution TEXT,
      color TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      to_account_id TEXT,
      category_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      date TEXT NOT NULL,
      merchant TEXT,
      description TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      tags TEXT,
      receipt_url TEXT,
      is_recurring INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      category_name TEXT NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      limit_amount REAL NOT NULL,
      spent REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      target_date TEXT NOT NULL,
      monthly_contribution REAL NOT NULL DEFAULT 0,
      category TEXT,
      color TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      billing_cycle TEXT NOT NULL,
      next_billing_date TEXT NOT NULL,
      category_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      icon TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      frequency TEXT NOT NULL,
      day_of_month INTEGER NOT NULL DEFAULT 1,
      category_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      next_run_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      action_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions (date);
    CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions (user_id);
    CREATE INDEX IF NOT EXISTS idx_tx_acc ON transactions (account_id);
    CREATE INDEX IF NOT EXISTS idx_budget_month_year ON budgets (year, month);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_unique ON budgets (user_id, category_id, month, year);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts (user_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets (user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user ON goals (user_id);
    CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions (user_id);
    CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_transactions (user_id);
    CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications (user_id);
    CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes (email);
  `);

  try {
    db.exec("ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'INR';");
  } catch {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE users ADD COLUMN phone TEXT;");
  } catch {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE otp_codes ADD COLUMN attempts INTEGER DEFAULT 0;");
  } catch {
    // Column already exists
  }

  seedInitialDataIfEmpty();
}

// Seed global shared categories only (users must register first)
export function seedInitialDataIfEmpty() {
  const catCheck = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCheck.count > 0) {
    return; // Already initialized
  }

  console.log('🌱 Seeding initial system categories...');

  const categories = [
    { id: 'housing', name: 'Housing & Rent', iconName: 'Home', color: '#6366F1', type: 'expense' },
    { id: 'food', name: 'Food & Dining', iconName: 'UtensilsCrossed', color: '#F97316', type: 'expense' },
    { id: 'transport', name: 'Transportation', iconName: 'Car', color: '#0EA5E9', type: 'expense' },
    { id: 'shopping', name: 'Shopping & Retail', iconName: 'ShoppingBag', color: '#EC4899', type: 'expense' },
    { id: 'entertainment', name: 'Entertainment', iconName: 'Tv', color: '#8B5CF6', type: 'expense' },
    { id: 'bills', name: 'Bills & Utilities', iconName: 'Receipt', color: '#10B981', type: 'expense' },
    { id: 'health', name: 'Health & Wellness', iconName: 'HeartPulse', color: '#EF4444', type: 'expense' },
    { id: 'salary', name: 'Salary & Professional', iconName: 'Briefcase', color: '#059669', type: 'income' },
    { id: 'investment', name: 'Investments & Returns', iconName: 'TrendingUp', color: '#0284C7', type: 'income' },
    { id: 'transfer', name: 'Internal Transfer', iconName: 'ArrowRightLeft', color: '#64748B', type: 'both' },
    { id: 'other', name: 'Other Expenses', iconName: 'Layers', color: '#94A3B8', type: 'expense' },
  ];
  const insertCat = db.prepare('INSERT INTO categories (id, name, icon_name, color, type) VALUES (?, ?, ?, ?, ?)');
  for (const c of categories) {
    insertCat.run(c.id, c.name, c.iconName, c.color, c.type);
  }
}

// Helper to provision clean initial accounts for a freshly registered user
export function createInitialUserAccounts(userId: string) {
  const now = new Date().toISOString();
  const accounts = [
    { id: `acc_${userId}_primary`, name: 'Primary Bank Account', type: 'Bank', balance: 0, currency: 'INR', accountNumberMasked: '••0000', institution: 'Bank', color: '#004c8f' },
    { id: `acc_${userId}_cash`, name: 'Cash Wallet', type: 'Cash', balance: 0, currency: 'INR', accountNumberMasked: 'Cash', institution: 'Physical Cash', color: '#10B981' },
  ];
  const insertAcc = db.prepare(`
    INSERT INTO accounts (id, user_id, name, type, balance, currency, account_number_masked, institution, color, updated_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of accounts) {
    insertAcc.run(a.id, userId, a.name, a.type, a.balance, a.currency, a.accountNumberMasked, a.institution, a.color, now, now);
  }
}

// Reset data completely to zero
export function resetDatabase() {
  db.exec(`
    DELETE FROM transactions;
    DELETE FROM budgets;
    DELETE FROM goals;
    DELETE FROM subscriptions;
    DELETE FROM recurring_transactions;
    DELETE FROM notifications;
    DELETE FROM sessions;
    DELETE FROM accounts;
    DELETE FROM categories;
    DELETE FROM users;
  `);
  seedInitialDataIfEmpty();
}
