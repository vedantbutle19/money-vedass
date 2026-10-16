import {
  ArrowRightLeft,
  Building2,
  CreditCard,
  Eye,
  Landmark,
  MoreVertical,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account, AccountType } from '../types';

interface AccountsPageProps {
  onSelectAccount: (accountId: string) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ onSelectAccount }) => {
  const { accounts, addAccount, formatCurrency, openAddTxModal } = useFinance();
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Bank');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    setIsSubmitting(true);
    try {
      await addAccount({
        name,
        type,
        balance: parseFloat(balance) || 0,
        currency: 'INR',
        institution: institution || undefined,
        accountNumberMasked: type === 'Credit Card' ? '••1234' : '••5678',
      });
      setIsAddAccountOpen(false);
      setName('');
      setBalance('');
      setInstitution('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case 'Bank':
        return <Landmark size={18} className="text-blue-500" />;
      case 'Credit Card':
        return <CreditCard size={18} className="text-rose-500" />;
      case 'Cash':
        return <Wallet size={18} className="text-emerald-500" />;
      case 'Wallet':
        return <Wallet size={18} className="text-indigo-500" />;
      case 'Investment':
        return <TrendingUp size={18} className="text-purple-500" />;
      default:
        return <Building2 size={18} className="text-slate-500" />;
    }
  };

  const totalNetWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Accounts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your bank accounts, cards and cash.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddTxModal('transfer')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowRightLeft size={14} />
            <span>Transfer Funds</span>
          </button>
          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Net Worth banner */}
      <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Combined Net Balance
          </span>
          <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-0.5">
            {formatCurrency(totalNetWorth)}
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Tracking {accounts.length} active financial instruments across liquid, credit &amp; wealth
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isNegative = acc.balance < 0;

          return (
            <div
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {acc.name}
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        {acc.type} {acc.accountNumberMasked && `· ${acc.accountNumberMasked}`}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {acc.institution || acc.type}
                  </span>
                </div>

                <div className="mt-6">
                  <div className="text-[11px] text-slate-400">Current Balance</div>
                  <div
                    className={`text-xl font-bold font-tabular mt-0.5 ${
                      isNegative
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {formatCurrency(acc.balance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Updated recently</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:underline flex items-center gap-1">
                  View Activity →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Account Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsAddAccountOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 z-10 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Add New Financial Account
              </h3>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="py-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Axis Salary Account"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Account Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                  >
                    <option value="Bank">Bank Account</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash Envelope</option>
                    <option value="Wallet">Digital Wallet</option>
                    <option value="Investment">Investment</option>
                    <option value="Loan">Loan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Current Balance (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Financial Institution (Optional)
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Axis Bank Ltd"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg"
                >
                  {isSubmitting ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
