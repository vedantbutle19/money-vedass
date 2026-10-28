import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Goal } from '../types';

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, deleteGoal, contributeToGoal, formatCurrency } = useFinance();

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>('');

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [targetDate, setTargetDate] = useState('2027-03-31');

  const calculateMonthsRemaining = (target: number, current: number, monthly: number) => {
    if (monthly <= 0) return 0;
    const remaining = target - current;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / monthly);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(targetAmount);
    const c = parseFloat(currentAmount) || 0;
    const m = parseFloat(monthlyContribution) || 5000;

    if (!name || isNaN(t) || t <= 0) return;

    await addGoal({
      name,
      targetAmount: t,
      currentAmount: c,
      targetDate,
      monthlyContribution: m,
      category: 'Savings',
    });

    setIsAddGoalOpen(false);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setMonthlyContribution('');
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const val = parseFloat(contributionAmount);
    if (!isNaN(val) && val > 0) {
      await contributeToGoal(contributeGoal.id, val);
      setContributeGoal(null);
      setContributionAmount('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Goals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track milestones, purchase reserves, and target dates.
          </p>
        </div>

        <button
          onClick={() => setIsAddGoalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((g) => {
          const progress = Number(((g.currentAmount / g.targetAmount) * 100).toFixed(1));
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          const monthsLeft = calculateMonthsRemaining(
            g.targetAmount,
            g.currentAmount,
            g.monthlyContribution
          );

          return (
            <div
              key={g.id}
              className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      <Target size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {g.name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Target Date: {g.targetDate}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Remove goal "${g.name}"?`)) deleteGoal(g.id);
                    }}
                    className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Numbers */}
                <div className="mt-5 space-y-1 font-tabular">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(g.currentAmount)}
                    </span>
                    <span className="text-xs text-slate-400">
                      of {formatCurrency(g.targetAmount)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-slate-900 dark:bg-slate-200 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {progress}% complete
                    </span>
                    <span>Remaining: {formatCurrency(remaining)}</span>
                  </div>
                </div>

                {/* Projection badge */}
                <div className="mt-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Monthly Contribution:</span>
                  <span className="font-semibold font-tabular">
                    {formatCurrency(g.monthlyContribution)}/mo
                  </span>
                </div>

                {monthsLeft > 0 && (
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-500" />
                    <span>Est. completion: in ~{monthsLeft} months</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setContributeGoal(g);
                    setContributionAmount('');
                  }}
                  className="w-full py-1.5 px-3 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Contribute Funds</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contribute Funds Modal */}
      {contributeGoal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
          style={{
            paddingTop: 'max(calc(1rem + env(safe-area-inset-top, 0px)), 1.25rem)',
            paddingBottom: 'max(calc(1rem + env(safe-area-inset-bottom, 0px)), 1.25rem)',
          }}
        >
          <div className="fixed inset-0" onClick={() => setContributeGoal(null)} />
          <div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-5 z-10 text-xs my-auto overflow-y-auto"
            style={{
              maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2.5rem)',
            }}
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Contribute to {contributeGoal.name}
            </h3>
            <p className="text-slate-400 mb-3 font-tabular">
              Current progress: {formatCurrency(contributeGoal.currentAmount)} /{' '}
              {formatCurrency(contributeGoal.targetAmount)}
            </p>
            <form onSubmit={handleContribute} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Contribution Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular text-sm"
                  autoFocus
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg"
                >
                  Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {isAddGoalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
          style={{
            paddingTop: 'max(calc(1rem + env(safe-area-inset-top, 0px)), 1.25rem)',
            paddingBottom: 'max(calc(1rem + env(safe-area-inset-bottom, 0px)), 1.25rem)',
          }}
        >
          <div className="fixed inset-0" onClick={() => setIsAddGoalOpen(false)} />
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 sm:p-6 z-10 text-xs my-auto overflow-y-auto"
            style={{
              maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2.5rem)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Create Financial Goal
              </h3>
              <button
                onClick={() => setIsAddGoalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="py-4 space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MacBook Pro, Emergency Fund"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="120000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Initial Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Monthly Contribution (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    placeholder="15000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
