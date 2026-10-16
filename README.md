# Finora — Personal Finance & Expense OS

Finora is a complete, production-grade, long-lasting personal expense tracker and wealth management platform. It features a React 19 frontend paired with an Express.js backend powered by a persistent, high-durability SQLite database.

---

## 🏗️ Architecture Overview

- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Recharts, Vite.
- **Backend**: Node.js & Express RESTful API (`/api/*`).
- **Database**: SQLite (via `node:sqlite`), configured in **Write-Ahead Logging (WAL)** mode for high concurrency, ACID transaction guarantees, and durability.
- **Storage Location**: `data/finora.db` — completely self-contained, long-lasting local database file that persists your data across app restarts, updates, and reboots.
- **Auto-Sync Engine**: Whenever you add, edit, or delete transactions:
  - Account balances update automatically (expenses deduct, income credits, transfers move funds between accounts).
  - Monthly category budget allocations update their `spent` amounts automatically.
  - Financial health indicators, savings rates, and cash-flow insights recalculate in real-time.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v22.5+ or v24+ (Node.js includes native high-performance SQLite support).

### 1. Run Development Server
To launch both the backend server (port 5000) and the Vite frontend (port 3000) concurrently:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Independent Services (Optional)
If you prefer running frontend and backend in separate terminals:
- **Backend API Server**:
  ```bash
  npm run dev:server
  ```
  Runs at `http://localhost:5000`.
- **Frontend Client**:
  ```bash
  npm run dev:client
  ```
  Runs at `http://localhost:3000` (proxies `/api` to port 5000).

### 3. Production Build & Run
To run the full-stack app as a single service serving both the compiled frontend and API:
```bash
npm run build
npm start
```
Runs at `http://localhost:5000`.

---

## 🗄️ Database & Reliability (`data/finora.db`)

The database is built for long-term expense tracking:
- **Users**: Account credentials, profile details, currency symbol, and income baseline.
- **Accounts**: Bank accounts, credit cards, cash wallets, investments, and balances.
- **Transactions**: Full ledger with date, merchant, amount, category, payment method, tags, and notes.
- **Budgets**: Monthly budget ceilings and tracked expenditures.
- **Goals**: Target savings milestones with automated contribution tracking.
- **Subscriptions**: Recurring subscription commitments with renewal schedules.
- **Recurring Transactions**: Scheduled periodic income & expenses.
- **Notifications**: Automated budget overrun alerts and billing reminders.

### Backup & Export
- In **Settings**, you can click **Export JSON** to instantly generate and download a complete cryptographic snapshot of your SQLite database.
- You can restore or inspect your data anytime.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check & database connection status |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/signup` | POST | Create new account |
| `/api/user/profile` | GET / PUT | Fetch or update user preferences & currency |
| `/api/accounts` | GET / POST | List accounts or create new account |
| `/api/accounts/:id` | GET / PUT / DELETE | Account details, edits, or deletion |
| `/api/transactions` | GET / POST | Filtered ledger queries or create new transaction |
| `/api/transactions/:id` | GET / PUT / DELETE | Update or delete transaction with balance rollback |
| `/api/transactions/batch-delete` | POST | Bulk transaction deletion |
| `/api/budgets` | GET / POST | List monthly budgets or allocate new category budget |
| `/api/budgets/:id` | PUT / DELETE | Update budget limit |
| `/api/goals` | GET / POST | Savings goals |
| `/api/goals/:id/contribute` | POST | Record contribution towards goal |
| `/api/subscriptions` | GET / POST / PUT / DELETE | Subscription tracking |
| `/api/subscriptions/:id/toggle` | PATCH | Pause / resume subscription |
| `/api/recurring` | GET / POST / PUT / DELETE | Recurring transaction schedules |
| `/api/financial-health` | GET | Real-time computed health scores & insights |
| `/api/backup/export` | GET | Full database JSON backup |
| `/api/backup/reset` | POST | Reset to default demo state |
