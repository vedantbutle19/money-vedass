import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Frontend Financial Math & Formatting Logic', () => {
  // Format currency logic replicated from FinanceContext
  function formatCurrency(
    amount: number,
    currency: string = 'INR',
    options?: { showSign?: boolean; hideSymbol?: boolean }
  ): string {
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const absVal = Math.abs(amount);
    const symbol = options?.hideSymbol ? '' : symbols[currency] || '₹';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: absVal % 1 !== 0 ? 2 : 0,
    }).format(absVal);

    if (options?.showSign) {
      if (amount > 0) return `+${symbol}${formatted}`;
      if (amount < 0) return `-${symbol}${formatted}`;
      return `${symbol}${formatted}`;
    }
    if (amount < 0) return `-${symbol}${formatted}`;
    return `${symbol}${formatted}`;
  }

  function calculateFinancialMetrics(transactions: Array<{ type: string; amount: number }>) {
    let income = 0;
    let expenses = 0;
    let transfers = 0;

    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expenses += t.amount;
      else if (t.type === 'transfer') transfers += t.amount;
    });

    const netSavings = Math.round((income - expenses + Number.EPSILON) * 100) / 100;
    const savingsRate = income > 0 ? Number(((netSavings / income) * 100).toFixed(1)) : 0;

    return { income, expenses, transfers, netSavings, savingsRate };
  }

  test('formatCurrency: Formats INR with Indian numbering system and currency symbol', () => {
    assert.strictEqual(formatCurrency(50000, 'INR'), '₹50,000');
    assert.strictEqual(formatCurrency(1250000.5, 'INR'), '₹12,50,000.50');
    assert.strictEqual(formatCurrency(-350, 'INR'), '-₹350');
  });

  test('formatCurrency: Formats USD and EUR accurately', () => {
    assert.strictEqual(formatCurrency(1250.75, 'USD'), '$1,250.75');
    assert.strictEqual(formatCurrency(999, 'EUR'), '€999');
  });

  test('Financial Math: Accurately computes Income, Expenses, Net Savings, and Savings Rate', () => {
    const txs = [
      { type: 'income', amount: 50000 },
      { type: 'income', amount: 3750 },
      { type: 'expense', amount: 15000 },
      { type: 'expense', amount: 13650 },
      { type: 'transfer', amount: 5000 },
    ];

    const metrics = calculateFinancialMetrics(txs);
    assert.strictEqual(metrics.income, 53750);
    assert.strictEqual(metrics.expenses, 28650);
    assert.strictEqual(metrics.transfers, 5000);
    assert.strictEqual(metrics.netSavings, 25100);
    // 25100 / 53750 * 100 = 46.697... -> 46.7%
    assert.strictEqual(metrics.savingsRate, 46.7);
  });

  test('Financial Math: Edge cases (Zero income, Deficit/Negative savings rate)', () => {
    // Zero income with expenses
    const deficitTxs = [
      { type: 'expense', amount: 2000 },
    ];
    const metricsDeficit = calculateFinancialMetrics(deficitTxs);
    assert.strictEqual(metricsDeficit.income, 0);
    assert.strictEqual(metricsDeficit.expenses, 2000);
    assert.strictEqual(metricsDeficit.netSavings, -2000);
    assert.strictEqual(metricsDeficit.savingsRate, 0); // No division by zero

    // Expenses exceeding income
    const overspendTxs = [
      { type: 'income', amount: 1000 },
      { type: 'expense', amount: 1500 },
    ];
    const metricsOverspend = calculateFinancialMetrics(overspendTxs);
    assert.strictEqual(metricsOverspend.netSavings, -500);
    assert.strictEqual(metricsOverspend.savingsRate, -50.0);
  });
});
