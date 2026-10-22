import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db.ts';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.ts';

describe('Security, IDOR Access Control & Features Suite', () => {
  let userTokenA = '';
  let userTokenB = '';
  let accountIdA = '';
  let accountIdB = '';
  let txIdA = '';
  let txIdB = '';
  let goalIdA = '';
  let subIdA = '';
  let recIdA = '';

  before(async () => {
    await startTestServer();

    // User A
    const regA = await apiRequest('POST', '/api/auth/signup', {
      name: 'User A',
      email: 'usera.sec@example.com',
      password: 'StrongPassword123!',
    });
    userTokenA = regA.data.token;
    const accsA = await apiRequest('GET', '/api/accounts', undefined, userTokenA);
    accountIdA = accsA.data[0].id;

    // Create a transaction for User A
    const txA = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdA,
      categoryId: 'food',
      type: 'expense',
      amount: 45.00,
      date: '2026-10-12',
      description: 'User A Lunch',
    }, userTokenA);
    txIdA = txA.data.id;

    // User B
    const regB = await apiRequest('POST', '/api/auth/signup', {
      name: 'User B',
      email: 'userb.sec@example.com',
      password: 'StrongPassword123!',
    });
    userTokenB = regB.data.token;
    const accsB = await apiRequest('GET', '/api/accounts', undefined, userTokenB);
    accountIdB = accsB.data[0].id;

    const txB = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdB,
      categoryId: 'bills',
      type: 'expense',
      amount: 99.00,
      date: '2026-10-12',
      description: 'User B Private Bill',
    }, userTokenB);
    txIdB = txB.data.id;
  });

  after(async () => {
    await stopTestServer();
  });

  test('Security Headers: HTTP responses contain essential defense-in-depth headers', async () => {
    const res = await apiRequest('GET', '/api/health');
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.strictEqual(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  });

  test('Unauthenticated Categories Mutation: POST /api/categories rejects unauthenticated request', async () => {
    const unauth = await apiRequest('POST', '/api/categories', {
      id: 'malicious',
      name: 'Malicious Category',
      type: 'expense',
    });
    assert.strictEqual(unauth.status, 401);
  });

  test('System Category Protection: Authenticated user cannot overwrite core categories', async () => {
    const overwriteAttempt = await apiRequest('POST', '/api/categories', {
      id: 'salary',
      name: 'Defaced Salary',
      type: 'income',
    }, userTokenA);
    assert.strictEqual(overwriteAttempt.status, 403);
    assert.match(overwriteAttempt.data.error, /Standard system categories are protected/);

    // Verify system category remains intact
    const salary = db.prepare('SELECT name FROM categories WHERE id = ?').get('salary') as any;
    assert.strictEqual(salary.name, 'Salary & Professional');
  });

  test('Account Deletion Safeguard: Cannot delete account with linked transactions', async () => {
    const deleteAttempt = await apiRequest('DELETE', `/api/accounts/${accountIdA}`, undefined, userTokenA);
    assert.strictEqual(deleteAttempt.status, 400);
    assert.match(deleteAttempt.data.error, /Cannot delete account with \d+ existing transaction/);
  });

  test('IDOR Protection: User A cannot read, update, or delete User B account', async () => {
    // Read
    const getRes = await apiRequest('GET', `/api/accounts/${accountIdB}`, undefined, userTokenA);
    assert.strictEqual(getRes.status, 404);

    // Update
    const putRes = await apiRequest('PUT', `/api/accounts/${accountIdB}`, { name: 'Hacked Account' }, userTokenA);
    assert.strictEqual(putRes.status, 404);

    // Delete
    const delRes = await apiRequest('DELETE', `/api/accounts/${accountIdB}`, undefined, userTokenA);
    assert.strictEqual(delRes.status, 404);
  });

  test('IDOR Protection: User A cannot read, update, or delete User B transaction', async () => {
    // Read
    const getRes = await apiRequest('GET', `/api/transactions/${txIdB}`, undefined, userTokenA);
    assert.strictEqual(getRes.status, 404);

    // Update
    const putRes = await apiRequest('PUT', `/api/transactions/${txIdB}`, { amount: 1.00 }, userTokenA);
    assert.strictEqual(putRes.status, 404);

    // Delete
    const delRes = await apiRequest('DELETE', `/api/transactions/${txIdB}`, undefined, userTokenA);
    assert.strictEqual(delRes.status, 404);
  });

  test('Data Export Isolation: Backup export strictly excludes other users records', async () => {
    const exportRes = await apiRequest('GET', '/api/backup/export', undefined, userTokenA);
    assert.strictEqual(exportRes.status, 200);

    const exportedTxs = exportRes.data.transactions;
    const hasUserBTransaction = exportedTxs.some((t: any) => t.id === txIdB);
    assert.strictEqual(hasUserBTransaction, false, 'User A export must not include User B transactions');
  });

  test('Feature: Savings Goal creation and POST /api/goals/:id/contribute endpoint', async () => {
    // Create goal
    const goalRes = await apiRequest('POST', '/api/goals', {
      name: 'Emergency Fund 2026',
      targetAmount: 50000,
      currentAmount: 10000,
      targetDate: '2026-12-31',
      monthlyContribution: 5000,
    }, userTokenA);
    assert.strictEqual(goalRes.status, 201);
    goalIdA = goalRes.data.id;

    // Contribute 2500
    const contributeRes = await apiRequest('POST', `/api/goals/${goalIdA}/contribute`, {
      amount: 2500,
    }, userTokenA);
    assert.strictEqual(contributeRes.status, 200);
    assert.strictEqual(Number(contributeRes.data.currentAmount), 12500);

    // Rejects negative contribution
    const negRes = await apiRequest('POST', `/api/goals/${goalIdA}/contribute`, {
      amount: -500,
    }, userTokenA);
    assert.strictEqual(negRes.status, 400);
  });

  test('Feature: Subscription creation and PATCH /api/subscriptions/:id/toggle endpoint', async () => {
    const subRes = await apiRequest('POST', '/api/subscriptions', {
      name: 'Cloud Storage',
      amount: 199,
      billingCycle: 'monthly',
      nextBillingDate: '2026-11-01',
      accountId: accountIdA,
    }, userTokenA);
    assert.strictEqual(subRes.status, 201);
    subIdA = subRes.data.id;
    assert.strictEqual(subRes.data.status, 'active');

    // Toggle to paused
    const toggle1 = await apiRequest('PATCH', `/api/subscriptions/${subIdA}/toggle`, undefined, userTokenA);
    assert.strictEqual(toggle1.status, 200);
    assert.strictEqual(toggle1.data.status, 'paused');

    // Toggle back to active
    const toggle2 = await apiRequest('PATCH', `/api/subscriptions/${subIdA}/toggle`, undefined, userTokenA);
    assert.strictEqual(toggle2.status, 200);
    assert.strictEqual(toggle2.data.status, 'active');
  });

  test('Feature: Recurring Transaction creation and PATCH /api/recurring/:id/toggle endpoint', async () => {
    const recRes = await apiRequest('POST', '/api/recurring', {
      name: 'Broadband Internet',
      amount: 799,
      type: 'expense',
      frequency: 'monthly',
      dayOfMonth: 5,
      accountId: accountIdA,
    }, userTokenA);
    assert.strictEqual(recRes.status, 201);
    recIdA = recRes.data.id;
    assert.strictEqual(recRes.data.status, 'active');

    // Toggle to paused
    const toggle1 = await apiRequest('PATCH', `/api/recurring/${recIdA}/toggle`, undefined, userTokenA);
    assert.strictEqual(toggle1.status, 200);
    assert.strictEqual(toggle1.data.status, 'paused');
  });

  test('Feature: Financial Health score calculation endpoint', async () => {
    const healthRes = await apiRequest('GET', '/api/financial-health', undefined, userTokenA);
    assert.strictEqual(healthRes.status, 200);
    assert.ok(typeof healthRes.data.overallScore === 'number');
    assert.ok(['critical', 'needs_improvement', 'good', 'excellent'].includes(healthRes.data.tier));
    assert.ok(healthRes.data.components);
  });

  test('IDOR Protection: User A cannot bind User B account to subscriptions or recurring schedules', async () => {
    // Attempt to create subscription with User B's account
    const badSub = await apiRequest('POST', '/api/subscriptions', {
      name: 'Malicious Sub',
      amount: 499,
      billingCycle: 'monthly',
      nextBillingDate: '2026-11-01',
      accountId: accountIdB,
    }, userTokenA);
    assert.strictEqual(badSub.status, 400);
    assert.match(badSub.data.error, /does not belong to your account/);

    // Attempt to create recurring schedule with User B's account
    const badRec = await apiRequest('POST', '/api/recurring', {
      name: 'Malicious Rec',
      amount: 1000,
      type: 'expense',
      frequency: 'monthly',
      accountId: accountIdB,
    }, userTokenA);
    assert.strictEqual(badRec.status, 400);
    assert.match(badRec.data.error, /does not belong to your account/);
  });
});
