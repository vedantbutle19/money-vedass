import {
  Calendar,
  Cloud,
  Edit2,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Trash2,
  Tv,
  Wifi,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryId, Subscription } from '../types';

export const SubscriptionsPage: React.FC = () => {
  const {
    subscriptions,
    accounts,
    addSubscription,
    deleteSubscription,
    toggleSubscriptionStatus,
    formatCurrency,
  } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState('2026-11-01');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  const totalMonthly = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.billingCycle === 'monthly' ? s.amount : s.amount / 12), 0);

  const totalAnnual = totalMonthly * 12;

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name || isNaN(parsedAmount) || parsedAmount <= 0) return;

    await addSubscription({
      name,
      amount: parsedAmount,
      billingCycle,
      nextBillingDate,
      category: 'entertainment',
      accountId: accountId || accounts[0]?.id || 'acc_hdfc',
      status: 'active',
      icon: 'Tv',
    });

    setIsAddOpen(false);
    setName('');
    setAmount('');
  };

  const getSubIcon = (icon: string) => {
    switch (icon) {
      case 'Music':
        return <Music size={16} className="text-emerald-500" />;
      case 'Wifi':
        return <Wifi size={16} className="text-blue-500" />;
      case 'Cloud':
        return <Cloud size={16} className="text-amber-500" />;
      default:
        return <Tv size={16} className="text-rose-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subscriptions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor recurring software, digital services, and memberships.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* KPI Cards: Total Monthly & Annual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Total Monthly Outflow
          </span>
          <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalMonthly)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {subscriptions.filter((s) => s.status === 'active').length} active services
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Projected Annualized Outflow
          </span>
          <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalAnnual)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ year</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Auto-renewing recurring commitments
          </p>
        </div>
      </div>

      {/* Subscription List */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {subscriptions.map((sub) => {
            const accName = accounts.find((a) => a.id === sub.accountId)?.name || 'Account';
            const isPaused = sub.status === 'paused';

            return (
              <div
                key={sub.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isPaused ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/20' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {getSubIcon(sub.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {sub.name}
                      </span>
                      {isPaused && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Billed to {accName} · Next renewal: {sub.nextBillingDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-right">
                    <div className="text-sm font-bold font-tabular text-slate-900 dark:text-white">
                      {formatCurrency(sub.amount)}
                      <span className="text-xs font-normal text-slate-400">/{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSubscriptionStatus(sub.id)}
                      title={isPaused ? 'Resume Subscription' : 'Pause Subscription'}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove subscription "${sub.name}"?`)) {
                          deleteSubscription(sub.id);
                        }
                      }}
                      title="Delete"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Subscription Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsAddOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-5 z-10 text-xs">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Add New Subscription
            </h3>
            <form onSubmit={handleCreateSub} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GitHub Copilot, Disney+"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="299"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Billing Cycle
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Next Billing Date
                  </label>
                  <input
                    type="date"
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Payment Account
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
