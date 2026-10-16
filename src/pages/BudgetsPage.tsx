import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Edit2,
  Plus,
  ShieldAlert,
  Sliders,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../types';

export const BudgetsPage: React.FC = () => {
  const {
    budgets,
    categories,
    updateBudgetLimit,
    addBudget,
    formatCurrency,
    totalBudgetLimit,
    totalBudgetSpent,
    budgetUsagePercent,
    selectedMonth,
  } = useFinance();

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newLimit, setNewLimit] = useState<string>('');
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [initialLimit, setInitialLimit] = useState('');

  const remainingTotal = Math.max(0, totalBudgetLimit - totalBudgetSpent);

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    const val = parseFloat(newLimit);
    if (!isNaN(val) && val > 0) {
      await updateBudgetLimit(editingBudget.id, val);
      setEditingBudget(null);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === selectedCatId);
    const limitNum = parseFloat(initialLimit);
    if (cat && !isNaN(limitNum) && limitNum > 0) {
      await addBudget(cat.id, cat.name, limitNum);
      setIsAddBudgetOpen(false);
      setSelectedCatId('');
      setInitialLimit('');
    }
  };

  const getStatusBadge = (usage: number) => {
    if (usage > 100) {
      return {
        label: 'Exceeded',
        color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
        icon: ShieldAlert,
        barColor: 'bg-rose-500',
      };
    }
    if (usage >= 90) {
      return {
        label: 'Critical',
        color: 'text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900',
        icon: AlertCircle,
        barColor: 'bg-rose-500',
      };
    }
    if (usage >= 70) {
      return {
        label: 'Warning',
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
        icon: AlertTriangle,
        barColor: 'bg-amber-500',
      };
    }
    return {
      label: 'Normal',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900',
      icon: CheckCircle,
      barColor: 'bg-emerald-500',
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budgets
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Spending targets and allocation for {selectedMonth.label}
          </p>
        </div>

        <button
          onClick={() => setIsAddBudgetOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Category Budget</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Total Budget
            </span>
            <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalBudgetLimit)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Total Spent
            </span>
            <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalBudgetSpent)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Remaining
            </span>
            <div className="text-2xl font-bold font-tabular text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(remainingTotal)}
            </div>
          </div>
        </div>

        {/* Master Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-tabular">
            <span>{budgetUsagePercent}% allocated spending consumed</span>
            <span>{100 - budgetUsagePercent > 0 ? (100 - budgetUsagePercent).toFixed(1) : 0}% headroom</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
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
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const usage = Number(((b.spent / b.limit) * 100).toFixed(1));
          const remaining = b.limit - b.spent;
          const status = getStatusBadge(usage);
          const StatusIcon = status.icon;

          return (
            <div
              key={b.id}
              className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {b.categoryName}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.color}`}
                  >
                    <StatusIcon size={11} />
                    <span>{status.label}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between text-xs font-tabular">
                  <div>
                    <span className="text-slate-400 text-[11px]">Spent</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(b.spent)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Limit</span>
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {formatCurrency(b.limit)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
                      style={{ width: `${Math.min(usage, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-tabular">
                    <span className="text-slate-500 font-medium">{usage}% used</span>
                    <span
                      className={
                        remaining >= 0
                          ? 'text-slate-500'
                          : 'text-rose-600 dark:text-rose-400 font-semibold'
                      }
                    >
                      {remaining >= 0
                        ? `${formatCurrency(remaining)} left`
                        : `${formatCurrency(Math.abs(remaining))} over limit`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit button */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <button
                  onClick={() => {
                    setEditingBudget(b);
                    setNewLimit(b.limit.toString());
                  }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Edit2 size={12} />
                  <span>Adjust Limit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setEditingBudget(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-5 z-10 text-xs">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Adjust {editingBudget.categoryName} Budget
            </h3>
            <p className="text-slate-400 mb-3">
              Currently spent: {formatCurrency(editingBudget.spent)}
            </p>
            <form onSubmit={handleSaveLimit} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Monthly Limit (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular text-sm"
                  autoFocus
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Category Budget Modal */}
      {isAddBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsAddBudgetOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-5 z-10 text-xs">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Add Category Budget
            </h3>
            <form onSubmit={handleCreateBudget} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Select Category
                </label>
                <select
                  required
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter((c) => c.type !== 'income')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Monthly Target Limit (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={initialLimit}
                  onChange={(e) => setInitialLimit(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBudgetOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg"
                >
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
