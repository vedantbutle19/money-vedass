# Finora — Production Deployment & Operations Guide
**Project:** Finora / Money Vedass Financial Record Management System  
**Audience:** DevOps Engineers, Full-Stack Developers, Site Reliability Engineers  
**Status:** **READY FOR PRE-PRODUCTION VERIFICATION**

---

## 1. Architecture Overview

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend:** Node.js v22+/v24+ with Express.js REST API (`server/index.ts`, `server/routes/*`).
- **Database:** SQLite (via native `node:sqlite`) with WAL mode (`data/finora.db`).
- **Target Hosting:** Vercel (Frontend & Serverless Functions) or Hybrid (Vercel Frontend + Persistent Container Backend).

---

## 2. Permanent Database Persistence (Render Free Tier + Turso Cloud)

> [!IMPORTANT]
> **Why Render Free Tier resets data:**
> On Render's Free tier, services spin down after 15 minutes of inactivity, and the container disk is ephemeral. When the service wakes up, local disk files are reset.
>
> **The Solution (Now Integrated in `@libsql/client`):**
> Finora now natively supports **Turso (LibSQL Cloud)**. Turso provides a **100% free forever** SQLite-compatible cloud database (up to 9 GB storage, 500 databases).
> 
> Simply add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to your Render environment variables, and all accounts, sessions, and transactions persist permanently across restarts and sleep cycles!

### 2-Minute Turso Configuration Steps:
1. Create a free account at [turso.tech](https://turso.tech).
2. Click **Create Database** (e.g. `money-vedass`) and choose your region (e.g. `Mumbai` or `Singapore`).
3. Copy your database URL (`libsql://money-vedass-...turso.io`) and click **Generate Token**.
4. In your **Render Dashboard** -> Service `money-vedass` -> **Environment**, add:
   - `TURSO_DATABASE_URL`: `libsql://money-vedass-...turso.io`
   - `TURSO_AUTH_TOKEN`: `your-turso-auth-token`
5. Click **Save Changes**. Render will redeploy automatically.
6. Verify persistence at `https://money-vedass.onrender.com/api/health` — you will see `"storage": "turso_cloud"`.
- **Frontend:** Hosted on Vercel (blazing-fast global CDN for React SPA).
- **Backend:** Hosted on a Node.js persistent host such as **Render**, **Railway**, or **Fly.io** with an attached persistent volume mounted at `/data`.
- **Setup:**
  1. Deploy the backend repository to Render/Railway as a Node web service.
  2. Attach a 1GB persistent disk mounted to `data/`.
  3. In Vercel, set `VITE_API_URL` or rewrite `/api/*` to your backend URL (`https://finora-api.onrender.com`).
  4. Local SQLite file (`data/finora.db`) persists indefinitely across restarts and redeploys.

---

## 3. Deploying to Vercel

The repository is already configured with:
- `vercel.json` for routing `/api/*` to the serverless function and all other routes to React SPA `index.html`.
- `api/index.ts` as the serverless API handler.
- Fallback `/tmp/finora.db` support to avoid read-only filesystem crash during preview builds.

### Step-by-Step Vercel Deployment:

1. **Install Vercel CLI (or connect via GitHub):**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Configure Environment Variables in Vercel Project Settings:**
   - `NODE_ENV`: `production`
   - `ALLOWED_ORIGIN`: `https://your-vercel-domain.vercel.app`
   - `ENABLE_DEV_OTP_SIMULATION`: `false`
   - `FAST2SMS_API_KEY`: *(Optional: your Fast2SMS key for live SMS)*

3. **Deploy:**
   ```bash
   # Deploy preview build
   vercel

   # Deploy production build
   vercel --prod
   ```

---

## 4. Database Backup & Disaster Recovery

### 4.1 Automated In-App JSON Backup
Finora provides a built-in cryptographic backup and restoration engine:
- **Exporting Data:**
  - In the UI: Go to **Settings** -> **Export JSON Data**.
  - Or via API:
    ```bash
    curl -H "Authorization: Bearer <user_token>" https://your-domain.com/api/backup/export > finora_backup_$(date +%F).json
    ```
- **Importing / Restoring Data:**
  - Send the saved JSON backup to `POST /api/backup/import`:
    ```bash
    curl -X POST -H "Authorization: Bearer <user_token>" \
      -H "Content-Type: application/json" \
      -d @finora_backup_2026-10-16.json \
      https://your-domain.com/api/backup/import
    ```

### 4.2 Raw SQLite File Snapshot
Before any maintenance or migrations:
- A snapshot has already been taken at: `data/finora.db.backup`
- Manual command line backup:
  ```powershell
  # PowerShell
  Copy-Item "data\finora.db" -Destination "data\finora_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
  ```
  ```bash
  # Linux/macOS
  cp data/finora.db data/finora_backup_$(date +%Y%m%d_%H%M%S).db
  ```

### 4.3 Restoring from SQLite Snapshot
To restore a snapshot:
1. Stop the running server.
2. Replace `data/finora.db` with the snapshot file:
   ```powershell
   Copy-Item "data/finora.db.backup" -Destination "data/finora.db" -Force
   ```
3. Remove any lingering WAL/SHM files:
   ```powershell
   Remove-Item "data/finora.db-wal", "data/finora.db-shm" -ErrorAction SilentlyContinue
   ```
4. Start the server: `npm start`.

---

## 5. Rollback Procedures

### 5.1 Application Code Rollback
If a regression occurs in a new deployment:
1. **Git Rollback:**
   ```bash
   # Check git history
   git log --oneline -n 5

   # Revert to baseline commit or specific tag
   git checkout <commit_hash>
   ```
2. **Vercel Instant Rollback:**
   - In the Vercel Dashboard -> Deployments -> find previous stable deployment -> click **Promote to Production**.

### 5.2 Database Rollback
If corrupt transactions or data issues occur:
1. Use the pre-existing backup file `data/finora.db.backup`.
2. Or use `POST /api/backup/import` with a previously verified JSON export.

---

## 6. Pre-Production Launch Checklist

- [x] Passwords required to be $\ge 8$ characters.
- [x] SMS OTP removed from all production API responses.
- [x] Rate limiting configured on all auth endpoints (`signup`, `login`, `send-otp`, `reset-password`).
- [x] OTP brute-force lockout active (invalidated after 5 failed attempts).
- [x] Date/Timezone boundary bug resolved for budget allocations.
- [x] Negative and zero amount injections blocked on transactions.
- [x] IDOR protection enforced across accounts, transactions, and budgets.
- [x] Accounts with linked transactions protected against accidental deletion.
- [x] Categories POST mutation protected with authentication.
- [x] Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) enabled.
- [x] Goal contribution, subscription toggle, and recurring toggle endpoints implemented.
- [x] Full automated test suite created (30 tests passing, 0 failing).
- [x] `.env.example` updated with production documentation.
- [ ] Select and configure persistent production database (Turso or Render/Railway container with persistent volume) before final public production launch.
