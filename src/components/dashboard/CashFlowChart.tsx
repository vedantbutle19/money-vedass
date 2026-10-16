import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

export const CashFlowChart: React.FC = () => {
  const { isDark } = useTheme();
  const { formatCurrency, transactions, selectedMonth } = useFinance();
  const [viewMode, setViewMode] = useState<'both' | 'income' | 'expense'>('both');

  const data = useMemo(() => {
    const monthStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;
    const monthTx = transactions.filter((t) => t.date.startsWith(monthStr));

    const weeks = [
      { period: 'Week 1 (Days 1-7)', income: 0, expense: 0, savings: 0 },
      { period: 'Week 2 (Days 8-14)', income: 0, expense: 0, savings: 0 },
      { period: 'Week 3 (Days 15-21)', income: 0, expense: 0, savings: 0 },
      { period: 'Week 4 (Days 22-End)', income: 0, expense: 0, savings: 0 },
    ];

    monthTx.forEach((tx) => {
      const parts = tx.date.split('-');
      const day = parts.length === 3 ? parseInt(parts[2], 10) : 1;
      let weekIndex = 0;
      if (day > 21) weekIndex = 3;
      else if (day > 14) weekIndex = 2;
      else if (day > 7) weekIndex = 1;

      if (tx.type === 'income') {
        weeks[weekIndex].income += tx.amount;
        weeks[weekIndex].savings += tx.amount;
      } else if (tx.type === 'expense') {
        weeks[weekIndex].expense += tx.amount;
        weeks[weekIndex].savings -= tx.amount;
      }
    });

    return weeks;
  }, [transactions, selectedMonth]);

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Monthly Cash Flow
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Weekly inflow, outflow, and net liquidity dynamics
          </p>
        </div>

        {/* Toggle [ Income ] [ Expenses ] [ Both ] */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setViewMode('income')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'income'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setViewMode('expense')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'expense'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'both'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Both
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />

            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tick={{ fill: textColor, fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: textColor, fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-lg text-xs space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-white mb-1.5">
                        {label}
                      </div>
                      {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4 font-tabular">
                          <span className="capitalize" style={{ color: entry.color }}>
                            {entry.name}:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formatCurrency(entry.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            {(viewMode === 'income' || viewMode === 'both') && (
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
            )}

            {(viewMode === 'expense' || viewMode === 'both') && (
              <Area
                type="monotone"
                dataKey="expense"
                name="Expenses"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            )}

            {viewMode === 'both' && (
              <Area
                type="monotone"
                dataKey="savings"
                name="Net Flow"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend footnote */}
      <div className="flex items-center justify-center gap-6 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Inflows</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Outflows</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Net Surplus</span>
        </span>
      </div>
    </div>
  );
};
