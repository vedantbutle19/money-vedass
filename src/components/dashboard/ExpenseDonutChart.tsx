import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '../../context/FinanceContext';

export const ExpenseDonutChart: React.FC = () => {
  const { formatCurrency, monthlyExpenses, transactions, categories, selectedMonth } = useFinance();

  const categoryBreakdown = useMemo(() => {
    const monthStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(monthStr)
    );

    const totalsByCategory: Record<string, number> = {};
    let total = 0;

    monthExpenses.forEach((t) => {
      totalsByCategory[t.categoryId] = (totalsByCategory[t.categoryId] || 0) + t.amount;
      total += t.amount;
    });

    return Object.entries(totalsByCategory)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          name: cat?.name || catId,
          amount,
          percentage: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
          color: cat?.color || '#94a3b8',
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, selectedMonth]);

  const hasData = categoryBreakdown.length > 0;

  return (
    <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Spending by Category
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Outflow distribution for {selectedMonth.label}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Total Outflow</span>
          <div className="text-sm font-bold font-tabular text-slate-900 dark:text-white">
            {formatCurrency(monthlyExpenses)}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
          No expenses recorded for this month yet. Your category breakdown will automatically appear here once you log transactions.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-4">
          {/* Left: Donut Chart with Center Total */}
          <div className="md:col-span-5 relative h-52 sm:h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="none"
                >
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg bg-slate-900 text-white text-xs shadow-lg border border-slate-800">
                          <div className="font-semibold">{data.name}</div>
                          <div className="text-slate-300 font-tabular mt-0.5">
                            {formatCurrency(data.amount)} ({data.percentage}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Total
              </span>
              <span className="text-sm font-bold font-tabular text-slate-900 dark:text-white">
                {formatCurrency(monthlyExpenses)}
              </span>
            </div>
          </div>

          {/* Right: Category List */}
          <div className="md:col-span-7 space-y-2.5">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-tabular">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-slate-400 text-[11px] w-10 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
