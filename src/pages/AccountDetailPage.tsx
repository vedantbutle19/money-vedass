import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  CreditCard,
  Edit,
  Landmark,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
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
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

interface AccountDetailPageProps {
  accountId: string;
  onBack: () => void;
}

export const AccountDetailPage: React.FC<AccountDetailPageProps> = ({ accountId, onBack }) => {
  const { accounts, transactions, updateAccount, openAddTxModal, formatCurrency } = useFinance();
  const { isDark } = useTheme();

  const account = accounts.find((a) => a.id === accountId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(account?.name || '');
  const [editBalance, setEditBalance] = useState(account?.balance.toString() || '0');

  const accountTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.accountId === accountId || t.toAccountId === accountId
    );
  }, [transactions, accountId]);

  const { incomeThisMonth, expenseThisMonth, netChange } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    accountTransactions.forEach((t) => {
      if (t.accountId === accountId) {
        if (t.type === 'income') inc += t.amount;
        if (t.type === 'expense') exp += t.amount;
        if (t.type === 'transfer') exp += t.amount; // outflow
      } else if (t.toAccountId === accountId && t.type === 'transfer') {
        inc += t.amount; // inflow transfer
      }
    });
    return {
      incomeThisMonth: inc,
      expenseThisMonth: exp,
      netChange: inc - exp,
    };
  }, [accountTransactions, accountId]);

  // Synthetic balance trend data for chart
  const balanceHistory = useMemo(() => {
    const current = account?.balance || 32500;
    return [
      { date: 'Oct 01', balance: current - 4200 },
      { date: 'Oct 03', balance: current - 2100 },
      { date: 'Oct 05', balance: current + 1500 },
      { date: 'Oct 07', balance: current - 800 },
      { date: 'Oct 08', balance: current },
    ];
  }, [account]);

  if (!account) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Account not found.</p>
        <button onClick={onBack} className="mt-2 text-indigo-600 hover:underline">
          Return to accounts
        </button>
      </div>
    );
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAccount(account.id, {
      name: editName,
      balance: parseFloat(editBalance) || 0,
    });
    setIsEditOpen(false);
  };

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Accounts</span>
      </button>

      {/* Account Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {account.type}
            </span>
            <span className="text-xs text-slate-400">
              {account.institution || 'Primary Account'}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {account.name}
          </h2>
          <div className="mt-3">
            <span className="text-xs text-slate-400">Current Balance</span>
            <div className="text-3xl font-bold font-tabular text-slate-900 dark:text-white">
              {formatCurrency(account.balance)}
            </div>
          </div>
        </div>

        {/* Actions: Edit, Transfer, Add Transaction */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            onClick={() => {
              setEditName(account.name);
              setEditBalance(account.balance.toString());
              setIsEditOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Edit size={14} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => openAddTxModal('transfer', account.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowRightLeft size={14} />
            <span>Transfer</span>
          </button>
          <button
            onClick={() => openAddTxModal('expense', account.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Monthly Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Income This Month
          </span>
          <div className="text-xl font-bold font-tabular text-emerald-600 dark:text-emerald-400 mt-1">
            +{formatCurrency(incomeThisMonth)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Expenses This Month
          </span>
          <div className="text-xl font-bold font-tabular text-rose-600 dark:text-rose-400 mt-1">
            -{formatCurrency(expenseThisMonth)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Net Change
          </span>
          <div
            className={`text-xl font-bold font-tabular mt-1 ${
              netChange >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {netChange >= 0 ? '+' : ''}
            {formatCurrency(netChange)}
          </div>
        </div>
      </div>

      {/* Balance Trend Chart */}
      <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
          Account Balance History (October 2026)
        </h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: textColor, fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow text-xs font-tabular">
                        <div className="text-slate-400">{label}</div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Balance: {formatCurrency(payload[0].value as number)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="balance" stroke="#0ea5e9" strokeWidth={2} fill="url(#accGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Account Transactions List */}
      <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Transactions for {account.name}
        </h3>

        {accountTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No transactions found for this account.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {accountTransactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {tx.merchant || tx.description}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {tx.date} · {tx.paymentMethod} · {tx.categoryId}
                  </div>
                </div>
                <div
                  className={`font-semibold font-tabular ${
                    tx.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : tx.type === 'expense'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                  {formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Account Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsEditOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-5 z-10 text-xs">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Edit {account.name}
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Adjust Balance (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-tabular"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
