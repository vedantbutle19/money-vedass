import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import React from 'react';
import { useFinance } from '../../context/FinanceContext';

interface BudgetOverviewCardProps {
  onViewBudgets?: () => void;
}

export const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({ onViewBudgets }) => {
  const { budgets, formatCurrency, totalBudgetLimit, totalBudgetSpent, budgetUsagePercent } =
    useFinance();

  return (
    <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Budget Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly spending envelope progress
            </p>
          </div>
          {onViewBudgets && (
            <button
              onClick={onViewBudgets}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Manage</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Aggregate Overview */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total Envelope</span>
            <span className="font-semibold font-tabular text-slate-900 dark:text-white">
              {formatCurrency(totalBudgetSpent)} / {formatCurrency(totalBudgetLimit)}
            </span>
          </div>

          <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetUsagePercent > 90
                  ? 'bg-rose-500'
                  : budgetUsagePercent > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
            />
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px] font-tabular">
            <span
              className={`font-semibold flex items-center gap-1 ${
                budgetUsagePercent > 80
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {budgetUsagePercent > 80 && <AlertTriangle size={12} />}
              {budgetUsagePercent}% utilized
            </span>
            <span className="text-slate-400">
              Remaining: {formatCurrency(Math.max(0, totalBudgetLimit - totalBudgetSpent))}
            </span>
          </div>
        </div>

        {/* Category specific breakdown */}
        {budgets.length === 0 ? (
          <div className="mt-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No budgets created yet. Allocate spending envelopes from the Budgets tab to monitor your monthly limits.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {budgets.slice(0, 4).map((b) => {
              const usage = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
              const isWarning = usage >= 80 && usage < 100;
              const isExceeded = usage >= 100;

              return (
                <div key={b.id} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {b.categoryName}
                      </span>
                      {isWarning && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <AlertTriangle size={11} /> 80%+
                        </span>
                      )}
                      {isExceeded && (
                        <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                          <ShieldAlert size={11} /> Over
                        </span>
                      )}
                    </div>
                    <span className="font-tabular text-slate-600 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white font-semibold">
                        {formatCurrency(b.spent)}
                      </strong>{' '}
                      / {formatCurrency(b.limit)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-slate-900 dark:bg-slate-200'
                      }`}
                      style={{ width: `${Math.min(usage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {onViewBudgets && (
        <button
          onClick={onViewBudgets}
          className="mt-4 w-full py-2 text-xs font-medium text-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          View All Budget Categories
        </button>
      )}
    </div>
  );
};
