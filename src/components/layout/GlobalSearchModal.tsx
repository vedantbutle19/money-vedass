import {
  ArrowRight,
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  Search,
  Target,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { transactions, accounts, goals, budgets, formatCurrency } = useFinance();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show quick suggested navigation
      return {
        transactions: transactions.slice(0, 3),
        accounts: accounts.slice(0, 3),
        goals: goals.slice(0, 2),
        isSuggestions: true,
      };
    }

    const matchedTx = transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        (t.merchant && t.merchant.toLowerCase().includes(q)) ||
        t.categoryId.toLowerCase().includes(q) ||
        t.paymentMethod.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
    );

    const matchedAccounts = accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        (a.institution && a.institution.toLowerCase().includes(q))
    );

    const matchedGoals = goals.filter((g) => g.name.toLowerCase().includes(q));

    const matchedBudgets = budgets.filter((b) => b.categoryName.toLowerCase().includes(q));

    return {
      transactions: matchedTx,
      accounts: matchedAccounts,
      goals: matchedGoals,
      budgets: matchedBudgets,
      isSuggestions: false,
    };
  }, [query, transactions, accounts, goals, budgets]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, accounts, merchants, goals..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {searchResults.isSuggestions && (
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-2">
              Recent Activity &amp; Quick Access
            </div>
          )}

          {/* Transactions */}
          {searchResults.transactions.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 mb-1 flex items-center gap-1.5">
                <Receipt size={13} />
                <span>Transactions</span>
              </div>
              <div className="space-y-1">
                {searchResults.transactions.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => {
                      onClose();
                      onNavigate('transactions');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 text-xs font-semibold">
                        {tx.merchant ? tx.merchant[0] : tx.description[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {tx.merchant || tx.description}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {tx.date} · {tx.categoryId} · {tx.paymentMethod}
                        </div>
                      </div>
                    </div>
                    <div className="text-right pl-3 shrink-0">
                      <span
                        className={`text-xs font-semibold font-tabular ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'expense'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Accounts */}
          {searchResults.accounts.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 mb-1 flex items-center gap-1.5">
                <Landmark size={13} />
                <span>Accounts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {searchResults.accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      onClose();
                      onNavigate('accounts');
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors border border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{acc.type}</div>
                    </div>
                    <span className="text-xs font-semibold font-tabular text-slate-800 dark:text-slate-200">
                      {formatCurrency(acc.balance)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {searchResults.goals && searchResults.goals.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 mb-1 flex items-center gap-1.5">
                <Target size={13} />
                <span>Savings Goals</span>
              </div>
              <div className="space-y-1">
                {searchResults.goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      onClose();
                      onNavigate('goals');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-900 dark:text-white">
                      {g.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-tabular">
                      {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {!searchResults.isSuggestions &&
            searchResults.transactions.length === 0 &&
            searchResults.accounts.length === 0 &&
            (!searchResults.goals || searchResults.goals.length === 0) && (
              <div className="p-8 text-center text-slate-400">
                <Search size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs">No records found matching "{query}"</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Try searching for "Amazon", "Salary", "HDFC", or "Swiggy"
                </p>
              </div>
            )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>Navigation: Click to jump</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Press</span>
            <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono">
              ESC
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
