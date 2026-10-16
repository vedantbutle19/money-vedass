import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { AVAILABLE_MONTHS, useFinance } from '../context/FinanceContext';

export const MonthlyReportPage: React.FC = () => {
  const {
    selectedMonth,
    setSelectedMonth,
    formatCurrency,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    budgets,
    transactions,
    openExportModal,
  } = useFinance();

  const currentIndex = AVAILABLE_MONTHS.findIndex(
    (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
  );

  const handlePrevMonth = () => {
    if (currentIndex < AVAILABLE_MONTHS.length - 1) {
      setSelectedMonth(AVAILABLE_MONTHS[currentIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    if (currentIndex > 0) {
      setSelectedMonth(AVAILABLE_MONTHS[currentIndex - 1]);
    }
  };

  const comparison = useMemo(() => {
    const prevMonthNum = selectedMonth.month === 1 ? 12 : selectedMonth.month - 1;
    const prevYearNum = selectedMonth.month === 1 ? selectedMonth.year - 1 : selectedMonth.year;
    const prevStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}`;

    let prevIncome = 0;
    let prevExpense = 0;
    transactions.forEach((t) => {
      if (t.date.startsWith(prevStr)) {
        if (t.type === 'income') prevIncome += t.amount;
        if (t.type === 'expense') prevExpense += t.amount;
      }
    });

    const prevSavings = prevIncome - prevExpense;
    const prevRate = prevIncome > 0 ? (prevSavings / prevIncome) * 100 : 0;

    const incomeChange = prevIncome > 0 ? (((monthlyIncome - prevIncome) / prevIncome) * 100).toFixed(1) + '%' : '0.0%';
    const expenseChange = prevExpense > 0 ? (((monthlyExpenses - prevExpense) / prevExpense) * 100).toFixed(1) + '%' : '0.0%';
    const savingsChange = prevSavings !== 0 ? (((monthlySavings - prevSavings) / Math.abs(prevSavings)) * 100).toFixed(1) + '%' : '0.0%';

    return {
      income: { prev: prevIncome, curr: monthlyIncome, change: incomeChange, isGood: monthlyIncome >= prevIncome },
      expense: { prev: prevExpense, curr: monthlyExpenses, change: expenseChange, isGood: monthlyExpenses <= prevExpense },
      savings: { prev: prevSavings, curr: monthlySavings, change: savingsChange, isGood: monthlySavings >= prevSavings },
      savingsRate: { prev: `${prevRate.toFixed(1)}%`, curr: `${savingsRate.toFixed(1)}%`, change: `${(savingsRate - prevRate).toFixed(1)}%`, isGood: savingsRate >= prevRate },
    };
  }, [transactions, selectedMonth, monthlyIncome, monthlyExpenses, monthlySavings, savingsRate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header with Navigation & Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Monthly Audit Report
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {selectedMonth.label}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Executive financial summary, variances, and capital efficiency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Previous / Next Month Navigation */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5">
            <button
              onClick={handlePrevMonth}
              disabled={currentIndex >= AVAILABLE_MONTHS.length - 1}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              {selectedMonth.label}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={currentIndex <= 0}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={openExportModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Total Income
          </span>
          <div className="text-2xl font-bold font-tabular text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(monthlyIncome, { showSign: true })}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
            {comparison.income.change} vs prev month
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Total Expenses
          </span>
          <div className="text-2xl font-bold font-tabular text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(-monthlyExpenses)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
            {comparison.expense.change} vs prev month
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Net Savings
          </span>
          <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-1">
            {formatCurrency(monthlySavings)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
            {comparison.savings.change} vs prev month
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Savings Rate
          </span>
          <div className="text-2xl font-bold font-tabular text-indigo-600 dark:text-indigo-400 mt-1">
            {savingsRate}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            Benchmark: 20.0% standard
          </span>
        </div>
      </div>

      {/* Monthly Comparison: September vs October */}
      <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Month-over-Month Variance: September vs October 2026
          </h3>
          <p className="text-xs text-slate-400">
            Side-by-side metric comparison and percentage trajectories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Income Comparison */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-xs text-slate-500 font-medium">Income Trajectory</div>
            <div className="flex items-center gap-2 font-tabular">
              <span className="text-sm text-slate-400 line-through">
                {formatCurrency(comparison.income.prev)}
              </span>
              <ArrowRight size={14} className="text-slate-400" />
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {formatCurrency(comparison.income.curr)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={13} />
              <span>{comparison.income.change} growth</span>
            </div>
          </div>

          {/* Expense Comparison */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-xs text-slate-500 font-medium">Expense Discipline</div>
            <div className="flex items-center gap-2 font-tabular">
              <span className="text-sm text-slate-400 line-through">
                {formatCurrency(comparison.expense.prev)}
              </span>
              <ArrowRight size={14} className="text-slate-400" />
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {formatCurrency(comparison.expense.curr)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingDown size={13} />
              <span>{comparison.expense.change} reduction</span>
            </div>
          </div>

          {/* Savings Comparison */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-xs text-slate-500 font-medium">Net Savings Acceleration</div>
            <div className="flex items-center gap-2 font-tabular">
              <span className="text-sm text-slate-400 line-through">
                {formatCurrency(comparison.savings.prev)}
              </span>
              <ArrowRight size={14} className="text-slate-400" />
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {formatCurrency(comparison.savings.curr)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={13} />
              <span>{comparison.savings.change} expansion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Performance Detailed Table */}
      <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Category Budget Performance Audit
          </h3>
          <p className="text-xs text-slate-400">Limit vs Actual variance analysis</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                <th className="py-2.5 font-medium">Category</th>
                <th className="py-2.5 font-medium">Target Limit</th>
                <th className="py-2.5 font-medium">Actual Spend</th>
                <th className="py-2.5 font-medium">Variance (Headroom)</th>
                <th className="py-2.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {budgets.map((b) => {
                const diff = b.limit - b.spent;
                const usage = (b.spent / b.limit) * 100;
                return (
                  <tr key={b.id}>
                    <td className="py-3 font-medium text-slate-900 dark:text-white">
                      {b.categoryName}
                    </td>
                    <td className="py-3 font-tabular text-slate-600 dark:text-slate-300">
                      {formatCurrency(b.limit)}
                    </td>
                    <td className="py-3 font-tabular font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(b.spent)}
                    </td>
                    <td
                      className={`py-3 font-tabular font-medium ${
                        diff >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {diff >= 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          usage > 90
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                            : usage > 75
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        }`}
                      >
                        {usage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
