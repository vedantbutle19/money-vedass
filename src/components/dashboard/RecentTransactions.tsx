import { ArrowRight, ArrowRightLeft } from 'lucide-react';
import React from 'react';
import { useFinance } from '../../context/FinanceContext';

interface RecentTransactionsProps {
  onViewAll?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ onViewAll }) => {
  const { transactions, accounts, formatCurrency } = useFinance();

  const recent = transactions.slice(0, 5);

  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || 'Account';
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const monthIndex = parseInt(parts[1], 10) - 1;
        return `${monthNames[monthIndex]} ${parts[2]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Recent Transactions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Latest activity across all accounts
          </p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>View all transactions</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <th className="py-2.5 font-medium">Date</th>
              <th className="py-2.5 font-medium">Transaction</th>
              <th className="py-2.5 font-medium hidden sm:table-cell">Category</th>
              <th className="py-2.5 font-medium hidden md:table-cell">Account</th>
              <th className="py-2.5 font-medium hidden lg:table-cell">Payment</th>
              <th className="py-2.5 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  No transactions recorded yet. Click &quot;+ New Transaction&quot; to log your first income or expense.
                </td>
              </tr>
            ) : (
              recent.map((tx) => {
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';
                const isTransfer = tx.type === 'transfer';

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 text-slate-500 dark:text-slate-400 font-tabular whitespace-nowrap">
                      {formatDateDisplay(tx.date)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {isTransfer ? (
                            <ArrowRightLeft size={12} className="text-blue-500" />
                          ) : tx.merchant ? (
                            tx.merchant[0]
                          ) : (
                            tx.description[0]
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate">
                            {tx.merchant || tx.description}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate sm:hidden">
                            {tx.categoryId} · {getAccountName(tx.accountId)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 capitalize hidden sm:table-cell">
                      {tx.categoryId}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      {getAccountName(tx.accountId)}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3 text-right font-semibold font-tabular whitespace-nowrap">
                      <span
                        className={
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
                        {formatCurrency(tx.amount, { currency: tx.currency })}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
