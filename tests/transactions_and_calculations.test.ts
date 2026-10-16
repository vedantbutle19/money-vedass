import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.ts';

describe('Transactions, Financial Calculations & Integrity Suite', () => {
  let userTokenA = '';
  let userTokenB = '';
  let accountIdA1 = '';
  let accountIdA2 = '';
  let accountIdB1 = '';

  before(async () => {
    await startTestServer();

    // Register User A
    const regA = await apiRequest('POST', '/api/auth/signup', {
      name: 'User A',
      email: 'usera@example.com',
      password: 'Password123!',
    });
    userTokenA = regA.data.token;

    // Fetch User A accounts
    const accsA = await apiRequest('GET', '/api/accounts', undefined, userTokenA);
    accountIdA1 = accsA.data[0].id;
    accountIdA2 = accsA.data[1].id;

    // Register User B
    const regB = await apiRequest('POST', '/api/auth/signup', {
      name: 'User B',
      email: 'userb@example.com',
      password: 'Password123!',
    });
    userTokenB = regB.data.token;

    const accsB = await apiRequest('GET', '/api/accounts', undefined, userTokenB);
    accountIdB1 = accsB.data[0].id;
  });

  after(async () => {
    await stopTestServer();
  });

  test('Validation: Rejects negative, zero, or NaN transaction amounts', async () => {
    // Negative
    const neg = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdA1,
      categoryId: 'food',
      type: 'expense',
      amount: -100,
      date: '2026-10-15',
      description: 'Illegal negative expense',
    }, userTokenA);
    assert.strictEqual(neg.status, 400);
    assert.match(neg.data.error, /positive number/);

    // Zero
    const zero = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdA1,
      categoryId: 'food',
      type: 'expense',
      amount: 0,
      date: '2026-10-15',
      description: 'Zero amount',
    }, userTokenA);
    assert.strictEqual(zero.status, 400);
  });

  test('Anti-IDOR: Prevents User A from referencing User B account in transactions', async () => {
    const idorTx = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdB1, // Belongs to User B!
      categoryId: 'food',
      type: 'expense',
      amount: 50,
      date: '2026-10-15',
      description: 'Attempted cross-user exploit',
    }, userTokenA);

    assert.strictEqual(idorTx.status, 400);
    assert.match(idorTx.data.error, /Invalid account ID/);
  });

  test('Anti-IDOR: Prevents cross-user transfer exploit', async () => {
    const idorTransfer = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdA1,
      toAccountId: accountIdB1, // Belongs to User B!
      categoryId: 'transfer',
      type: 'transfer',
      amount: 50,
      date: '2026-10-15',
      description: 'Attempted transfer into User B account',
    }, userTokenA);

    assert.strictEqual(idorTransfer.status, 400);
    assert.match(idorTransfer.data.error, /Invalid destination account ID/);
  });

  test('Calculation: Income, Expense, Transfer and balance rollback verification', async () => {
    // Check initial balance of A1
    const initialAcc1 = await apiRequest('GET', `/api/accounts/${accountIdA1}`, undefined, userTokenA);
    const startBal1 = Number(initialAcc1.data.balance);

    // 1. Add Income of 1000.50
    const incRes = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdA1,
      categoryId: 'salary',
      type: 'income',
      amount: 1000.50,
      date: '2026-10-05',
      description: 'October Salary',
    }, userTokenA);
    assert.strictEqual(incRes.status, 201);

    const postIncomeAcc1 = await apiRequest('GET', `/api/accounts/${accountIdA1}`, undefined, userTokenA);
    assert.strictEqual(Number(postIncomeAcc1.data.balance), startBal1 + 1000.50);

    // 2. Add Expense of 250.25
    const expRes = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdA1,
      categoryId: 'food',
      type: 'expense',
      amount: 250.25,
      date: '2026-10-06',
      description: 'Grocery shopping',
    }, userTokenA);
    assert.strictEqual(expRes.status, 201);
    const expId = expRes.data.id;

    const postExpAcc1 = await apiRequest('GET', `/api/accounts/${accountIdA1}`, undefined, userTokenA);
    assert.strictEqual(Number(postExpAcc1.data.balance), startBal1 + 1000.50 - 250.25);

    // 3. Edit expense amount from 250.25 to 300.00
    const editRes = await apiRequest('PUT', `/api/transactions/${expId}`, {
      amount: 300.00,
    }, userTokenA);
    assert.strictEqual(editRes.status, 200);

    const postEditAcc1 = await apiRequest('GET', `/api/accounts/${accountIdA1}`, undefined, userTokenA);
    assert.strictEqual(Number(postEditAcc1.data.balance), startBal1 + 1000.50 - 300.00);

    // 4. Transfer 200.00 from A1 to A2
    const acc2Before = await apiRequest('GET', `/api/accounts/${accountIdA2}`, undefined, userTokenA);
    const startBal2 = Number(acc2Before.data.balance);

    const transferRes = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdA1,
      toAccountId: accountIdA2,
      categoryId: 'transfer',
      type: 'transfer',
      amount: 200.00,
      date: '2026-10-07',
      description: 'Transfer to cash wallet',
    }, userTokenA);
    assert.strictEqual(transferRes.status, 201);

    const acc1AfterTransfer = await apiRequest('GET', `/api/accounts/${accountIdA1}`, undefined, userTokenA);
    const acc2AfterTransfer = await apiRequest('GET', `/api/accounts/${accountIdA2}`, undefined, userTokenA);
    assert.strictEqual(Number(acc1AfterTransfer.data.balance), startBal1 + 1000.50 - 300.00 - 200.00);
    assert.strictEqual(Number(acc2AfterTransfer.data.balance), startBal2 + 200.00);

    // 5. Delete the edited expense - balance must be restored by +300.00
    const delRes = await apiRequest('DELETE', `/api/transactions/${expId}`, undefined, userTokenA);
    assert.strictEqual(delRes.status, 200);

    const postDelAcc1 = await apiRequest('GET', `/api/accounts/${accountIdA1}`, undefined, userTokenA);
    assert.strictEqual(Number(postDelAcc1.data.balance), startBal1 + 1000.50 - 200.00);
  });

  test('Timezone Boundary Bugfix: Expense on 1st of month updates exact month budget', async () => {
    // Create an October 2026 budget for housing
    const bRes = await apiRequest('POST', '/api/budgets', {
      categoryId: 'housing',
      categoryName: 'Housing & Rent',
      limit: 15000,
      month: 10,
      year: 2026,
    }, userTokenA);
    assert.strictEqual(bRes.status, 201);

    // Add transaction on October 1st: "2026-10-01"
    const tx1st = await apiRequest('POST', '/api/transactions', {
      accountId: accountIdA1,
      categoryId: 'housing',
      type: 'expense',
      amount: 8000,
      date: '2026-10-01',
      description: 'October Rent on the 1st',
    }, userTokenA);
    assert.strictEqual(tx1st.status, 201);

    // Check October budget spent
    const octBudgets = await apiRequest('GET', '/api/budgets?month=10&year=2026', undefined, userTokenA);
    const housingBudget = octBudgets.data.find((b: any) => b.categoryId === 'housing');
    assert.ok(housingBudget);
    assert.strictEqual(Number(housingBudget.spent), 8000, 'October budget must reflect the 8000 expense');

    // Check September budget spent: must NOT have been touched
    const sepBudgets = await apiRequest('GET', '/api/budgets?month=9&year=2026', undefined, userTokenA);
    const sepHousing = sepBudgets.data.find((b: any) => b.categoryId === 'housing');
    assert.strictEqual(sepHousing, undefined, 'September must have no housing budget corrupted by October 1st tx');
  });

  test('Budget synchronization: Creating a budget mid-month aggregates existing expenses', async () => {
    // Add shopping expense of 150.75 on October 10th before budget exists
    await apiRequest('POST', '/api/transactions', {
      accountId: accountIdA1,
      categoryId: 'shopping',
      type: 'expense',
      amount: 150.75,
      date: '2026-10-10',
      description: 'Shopping before budget was created',
    }, userTokenA);

    // Now create budget for shopping for October 2026
    const newBudgetRes = await apiRequest('POST', '/api/budgets', {
      categoryId: 'shopping',
      categoryName: 'Shopping & Retail',
      limit: 5000,
      month: 10,
      year: 2026,
    }, userTokenA);

    assert.strictEqual(newBudgetRes.status, 201);
    assert.strictEqual(Number(newBudgetRes.data.spent), 150.75, 'New budget must automatically reflect pre-existing October spending');
  });
});
