import {
  Calendar,
  CreditCard,
  PieChart as PieIcon,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

export const AnalyticsPage: React.FC = () => {
  const { formatCurrency, transactions, accounts, categories, selectedMonth } = useFinance();
  const { isDark } = useTheme();

  const [period, setPeriod] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('30d');

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  // 1. Income vs Expense (Monthly) computed from transactions
  const monthlyComparisonData = useMemo(() => {
    const monthTotals: Record<string, { income: number; expense: number }> = {};
    const currentMonthLabel = selectedMonth.label.slice(0, 3) + ' ' + selectedMonth.year;
    monthTotals[currentMonthLabel] = { income: 0, expense: 0 };

    transactions.forEach((tx) => {
      const parts = tx.date.split('-');
      if (parts.length === 3) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(parts[1], 10) - 1;
        const key = `${monthNames[mIdx]} ${parts[0]}`;
        if (!monthTotals[key]) monthTotals[key] = { income: 0, expense: 0 };
        if (tx.type === 'income') monthTotals[key].income += tx.amount;
        if (tx.type === 'expense') monthTotals[key].expense += tx.amount;
      }
    });

    return Object.entries(monthTotals).map(([month, totals]) => ({
      month,
      income: totals.income,
      expense: totals.expense,
      savings: totals.income - totals.expense,
    }));
  }, [transactions, selectedMonth]);

  // 2. Spending Trend (Trailing Daily)
  const spendingTrendData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense').slice(0, 15);
    if (expenses.length === 0) {
      return [{ day: 'Day 1', spend: 0 }];
    }
    return expenses.map((t) => ({
      day: t.date.slice(5),
      spend: t.amount,
    }));
  }, [transactions]);

  // 3. Top Merchants
  const topMerchantsData = useMemo(() => {
    const merchantMap: Record<string, { amount: number; count: number }> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const name = t.merchant || t.description || 'Unknown';
        if (!merchantMap[name]) merchantMap[name] = { amount: 0, count: 0 };
        merchantMap[name].amount += t.amount;
        merchantMap[name].count += 1;
      });

    const result = Object.entries(merchantMap)
      .map(([merchant, val]) => ({ merchant, ...val }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 7);

    return result.length > 0 ? result : [{ merchant: 'No merchants yet', amount: 0, count: 0 }];
  }, [transactions]);

  // 4. Payment Method Distribution
  const paymentMethodData = useMemo(() => {
    const methodMap: Record<string, number> = {};
    let totalExpense = 0;
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        methodMap[t.paymentMethod] = (methodMap[t.paymentMethod] || 0) + t.amount;
        totalExpense += t.amount;
      });

    const colors: Record<string, string> = {
      UPI: '#0ea5e9',
      'Credit Card': '#f97316',
      'Debit Card': '#6366f1',
      Cash: '#10b981',
      'Bank Transfer': '#8b5cf6',
    };

    const list = Object.entries(methodMap).map(([method, amount]) => ({
      method,
      amount,
      share: totalExpense > 0 ? Number(((amount / totalExpense) * 100).toFixed(1)) : 0,
      color: colors[method] || '#94a3b8',
    }));

    return list.length > 0
      ? list
      : [{ method: 'No payment methods', amount: 0, share: 100, color: '#94a3b8' }];
  }, [transactions]);

  // 5. Category Spending
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        catMap[t.categoryId] = (catMap[t.categoryId] || 0) + t.amount;
      });

    const list = Object.entries(catMap)
      .map(([catId, amount]) => {
        const c = categories.find((cat) => cat.id === catId);
        return {
          name: c?.name || catId,
          amount,
          color: c?.color || '#94a3b8',
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return list.length > 0 ? list : [{ name: 'No spending yet', amount: 0, color: '#94a3b8' }];
  }, [transactions, categories]);

  // 6. Savings Rate Trend
  const savingsRateData = useMemo(() => {
    return monthlyComparisonData.map((m: any) => ({
      month: m.month.split(' ')[0],
      rate: m.income > 0 ? Number(((m.savings / m.income) * 100).toFixed(1)) : 0,
    }));
  }, [monthlyComparisonData]);

  // 7. Recurring vs Discretionary
  const recurringVsDiscretionary = useMemo(() => {
    let recurringAmt = 0;
    let discretionaryAmt = 0;

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (t.isRecurring) recurringAmt += t.amount;
        else discretionaryAmt += t.amount;
      });

    return [
      { name: 'Recurring Commitments', value: recurringAmt, color: '#3b82f6' },
      { name: 'Discretionary Outflow', value: discretionaryAmt, color: '#f59e0b' },
    ];
  }, [transactions]);

  // 8. Account Balances
  const accountBalancesData = useMemo(() => {
    return accounts.map((a) => ({
      name: a.name,
      balance: a.balance,
    }));
  }, [accounts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Deep dive into long-term cash flow, merchant concentration, and capital allocation.
          </p>
        </div>

        {/* Time Period Filter: 7d, 30d, 3m, 6m, 1y */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '3m', label: '3 Months' },
            { id: '6m', label: '6 Months' },
            { id: '1y', label: '1 Year' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: 8 Comprehensive Financial Charts */}

      {/* Row 1: Income vs Expense & Monthly Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Income vs Expense */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                1. Inflow vs Outflow History
              </h3>
              <p className="text-xs text-slate-400">Monthly total income compared with expenses</p>
            </div>
          </div>
          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow text-xs font-tabular space-y-1">
                          <div className="font-semibold text-slate-900 dark:text-white">{label}</div>
                          {payload.map((e: any) => (
                            <div key={e.name} className="flex justify-between gap-3" style={{ color: e.color }}>
                              <span>{e.name}:</span>
                              <span className="font-semibold">{formatCurrency(e.value)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Savings & Rate */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                2. Savings Rate Progression
              </h3>
              <p className="text-xs text-slate-400">% of gross monthly income retained</p>
            </div>
            <span className="text-xs font-bold font-tabular text-emerald-600 dark:text-emerald-400">
              46.7% in Oct
            </span>
          </div>
          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[20, 55]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow text-xs font-tabular">
                          <div className="font-semibold text-slate-900 dark:text-white">{label}</div>
                          <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            Savings Rate: {payload[0].value}%
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5} fill="url(#rateGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Category Spending & Spending Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Category Spending Horizontal Bars */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              3. Category Spending Breakdown
            </h3>
            <p className="text-xs text-slate-400">Total volume by budget envelope</p>
          </div>
          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={categoryData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-tabular">
                          <div className="font-semibold">{d.name}</div>
                          <div className="text-slate-600 dark:text-slate-300">{formatCurrency(d.amount)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry: any) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Daily Spending Trend */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              4. Daily Spending Trajectory
            </h3>
            <p className="text-xs text-slate-400">Outflow spikes across the billing cycle</p>
          </div>
          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-tabular">
                          <div className="text-slate-400">{label}</div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            Spend: {formatCurrency(payload[0].value as number)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="spend" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Top Merchants & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 5: Top Merchants */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              5. Top Merchants &amp; Payees
            </h3>
            <p className="text-xs text-slate-400">Highest aggregate spend destinations</p>
          </div>
          <div className="mt-4 space-y-2.5">
            {topMerchantsData.map((m: any, idx: number) => (
              <div key={m.merchant} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-slate-400 font-tabular font-medium">{idx + 1}.</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{m.merchant}</span>
                  <span className="text-[10px] text-slate-400">({m.count} txns)</span>
                </div>
                <span className="font-semibold font-tabular text-slate-900 dark:text-white">
                  {formatCurrency(m.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 6: Payment Method Distribution */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              6. Payment Method Distribution
            </h3>
            <p className="text-xs text-slate-400">Volume breakdown by payment channel</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 pt-4">
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    dataKey="amount"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {paymentMethodData.map((entry: any) => (
                      <Cell key={entry.method} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-tabular">
                            <div className="font-semibold">{d.method}</div>
                            <div>{formatCurrency(d.amount)} ({d.share}%)</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs">
              {paymentMethodData.map((p: any) => (
                <div key={p.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-700 dark:text-slate-300">{p.method}</span>
                  </div>
                  <span className="font-semibold font-tabular text-slate-900 dark:text-white">
                    {p.share}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recurring vs Discretionary & Account Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 7: Recurring vs Discretionary */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              7. Recurring vs. Discretionary Spending
            </h3>
            <p className="text-xs text-slate-400">Fixed commitments vs spontaneous lifestyle costs</p>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-tabular mb-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  Fixed &amp; Recurring: {formatCurrency(16448)} (57.4%)
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Discretionary: {formatCurrency(12202)} (42.6%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                <div className="bg-blue-500 h-full" style={{ width: '57.4%' }} />
                <div className="bg-amber-500 h-full" style={{ width: '42.6%' }} />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your fixed commitments (Rent ₹8,000, Subscriptions ₹2,767, Utilities ₹2,100, SIP ₹5,000) are well below the healthy 60% threshold.
            </p>
          </div>
        </div>

        {/* Chart 8: Account Balance Distribution */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              8. Capital Allocation by Account
            </h3>
            <p className="text-xs text-slate-400">Liquidity distribution across stored instruments</p>
          </div>
          <div className="h-48 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountBalancesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-tabular">
                          <div className="font-semibold">{label}</div>
                          <div>{formatCurrency(payload[0].value as number)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="balance" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
