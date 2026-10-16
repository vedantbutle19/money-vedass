# Automated Test Report
**Project:** Finora Financial Record Management System  
**Test Framework:** Node.js v24 Native Test Runner (`node:test`, `node:assert`, `tsx`)  
**Execution Date:** October 2026  
**Total Tests:** 30  
**Passed:** 30  
**Failed:** 0  
**Skipped:** 0  
**Total Execution Time:** ~1.45 seconds  
**Test Status:** **100% PASSED**

---

## 1. Test Execution Summary

The test suite runs against an isolated, process-specific temporary SQLite test database (`data/test_finora_<pid>.db`), ensuring zero interference with production or development data.

| Test Suite | File | Tests | Passed | Failed | Duration |
|---|---|---|---|---|---|
| **Authentication & Security** | `tests/auth.test.ts` | 10 | 10 | 0 | ~602 ms |
| **Transactions, Calculations & Integrity** | `tests/transactions_and_calculations.test.ts` | 6 | 6 | 0 | ~362 ms |
| **Security, IDOR & Feature Suite** | `tests/security_and_features.test.ts` | 10 | 10 | 0 | ~358 ms |
| **Frontend Math & Formatting Logic** | `tests/frontend_calculations.test.ts` | 4 | 4 | 0 | ~38 ms |
| **Total** | | **30** | **30** | **0** | **~1.45 s** |

---

## 2. Test Suite Details

### Suite 1: Authentication & Security (`tests/auth.test.ts`)
- `✔ POST /api/auth/signup - Rejects passwords shorter than 8 characters`
  - Verifies rejection of short passwords (`password.length < 8`), returning HTTP 400 with descriptive error message.
- `✔ POST /api/auth/signup - Successfully registers new user with valid password`
  - Verifies account creation, password hashing with `node:crypto.scryptSync`, automatic initial accounts provisioning (`Primary Bank Account`, `Cash Wallet`), and token generation.
- `✔ POST /api/auth/signup - Rejects duplicate email registration`
  - Verifies rejection of duplicate email (case-insensitive), returning HTTP 400.
- `✔ POST /api/auth/login - Rejects invalid password`
  - Verifies password verification with timing-safe comparison; returns HTTP 401 on incorrect password.
- `✔ POST /api/auth/login - Successfully logs in registered user`
  - Verifies 30-day session token issuance and returns user profile.
- `✔ GET /api/user/profile - Returns profile with valid token, rejects unauthenticated`
  - Verifies `requireAuth` middleware enforcement; returns 401 without Bearer token, returns profile with Bearer token.
- `✔ POST /api/auth/send-otp - Plaintext OTP is NOT exposed in response without dev flag`
  - Verifies that `res.json` does NOT contain `smsNotification.otpCode` in standard/production environments.
- `✔ POST /api/auth/reset-password - Locks out after 5 invalid OTP attempts and enforces lockout`
  - Simulates brute-force attack on 6-digit OTP; verifies attempt tracking and invalidates OTP after 5 failed attempts.
- `✔ POST /api/auth/reset-password - Successfully resets password with valid OTP and invalidates old sessions`
  - Verifies valid OTP resets user password, updates password hash, and deletes all existing sessions for that user.
- `✔ POST /api/auth/logout - Invalidates session token`
  - Verifies token removal from `sessions` table upon logout.

### Suite 2: Transactions, Calculations & Integrity (`tests/transactions_and_calculations.test.ts`)
- `✔ Validation: Rejects negative, zero, or NaN transaction amounts`
  - Verifies `amount <= 0` or NaN is rejected with HTTP 400, preventing negative expense balance exploitation.
- `✔ Anti-IDOR: Prevents User A from referencing User B account in transactions`
  - Verifies that referencing an account belonging to another user is rejected with HTTP 400.
- `✔ Anti-IDOR: Prevents cross-user transfer exploit`
  - Verifies that transfer destination account must belong to the authenticated user.
- `✔ Calculation: Income, Expense, Transfer and balance rollback verification`
  - Verifies:
    - Adding income of 1000.50 increases balance by exactly 1000.50.
    - Adding expense of 250.25 deducts 250.25.
    - Updating expense to 300.00 adjusts balance accordingly.
    - Transfer of 200.00 decrements source account and increments destination account.
    - Deleting transaction restores balance accurately.
- `✔ Timezone Boundary Bugfix: Expense on 1st of month updates exact month budget`
  - Verifies that a transaction on `"2026-10-01"` updates the October 2026 budget spent amount without shifting into September in negative timezones.
- `✔ Budget synchronization: Creating a budget mid-month aggregates existing expenses`
  - Verifies that when a budget is allocated after expenses were already recorded, `spent` is automatically synchronized from ledger history.

### Suite 3: Security, IDOR Access Control & Features (`tests/security_and_features.test.ts`)
- `✔ Security Headers: HTTP responses contain essential defense-in-depth headers`
  - Verifies `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
- `✔ Unauthenticated Categories Mutation: POST /api/categories rejects unauthenticated request`
  - Verifies `requireAuth` protection on category creation; returns HTTP 401.
- `✔ Account Deletion Safeguard: Cannot delete account with linked transactions`
  - Verifies that deleting an account that contains transactions is blocked with HTTP 400 to prevent orphaned ledger records.
- `✔ IDOR Protection: User A cannot read, update, or delete User B account`
  - Verifies 404 response when attempting to access another user's account ID.
- `✔ IDOR Protection: User A cannot read, update, or delete User B transaction`
  - Verifies 404 response when attempting to access another user's transaction ID.
- `✔ Data Export Isolation: Backup export strictly excludes other users records`
  - Verifies that `GET /api/backup/export` only dumps data belonging to the calling user.
- `✔ Feature: Savings Goal creation and POST /api/goals/:id/contribute endpoint`
  - Verifies savings goal creation and contribution endpoint with positive amount checks.
- `✔ Feature: Subscription creation and PATCH /api/subscriptions/:id/toggle endpoint`
  - Verifies toggling subscription status between `active` and `paused`.
- `✔ Feature: Recurring Transaction creation and PATCH /api/recurring/:id/toggle endpoint`
  - Verifies toggling recurring transaction status between `active` and `paused`.
- `✔ Feature: Financial Health score calculation endpoint`
  - Verifies `GET /api/financial-health` returns valid composite score, tier (`critical`, `needs_improvement`, `good`, `excellent`), and breakdown metrics.

### Suite 4: Frontend Math & Formatting Logic (`tests/frontend_calculations.test.ts`)
- `✔ formatCurrency: Formats INR with Indian numbering system and currency symbol`
  - Verifies INR formatting (e.g. `₹12,50,000.50` with commas at lakhs/crores).
- `✔ formatCurrency: Formats USD and EUR accurately`
  - Verifies multi-currency symbol and thousand grouping.
- `✔ Financial Math: Accurately computes Income, Expenses, Net Savings, and Savings Rate`
  - Verifies baseline calculation: Income ₹53,750, Expenses ₹28,650, Net Savings ₹25,100, Savings Rate 46.7%.
- `✔ Financial Math: Edge cases (Zero income, Deficit/Negative savings rate)`
  - Verifies zero division prevention and deficit handling.

---

## 3. Verification Commands Run

```bash
# 1. Static type check
npm run lint
# Exit code: 0

# 2. Complete automated test suite
npm test
# Exit code: 0 (30 passed, 0 failed)

# 3. Frontend production build
npm run build
# Exit code: 0 (dist/ created cleanly in ~700ms)
```
