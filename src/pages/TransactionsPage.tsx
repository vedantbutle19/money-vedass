import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  ArrowUpDown,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Eye,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryId, PaymentMethod, Transaction, TransactionType } from '../types';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    deleteTransaction,
    deleteTransactionsBatch,
    openAddTxModal,
    openExportModal,
    formatCurrency,
    showToast,
  } = useFinance();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryId>('all');
  const [selectedAccount, setSelectedAccount] = useState<'all' | string>('all');
  const [selectedPayment, setSelectedPayment] = useState<'all' | PaymentMethod>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected for View modal
  const [viewTx, setViewTx] = useState<Transaction | null>(null);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedAccount('all');
    setSelectedPayment('all');
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedAccount !== 'all' ||
    selectedPayment !== 'all' ||
    minAmount ||
    maxAmount;

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchDesc = tx.description.toLowerCase().includes(q);
          const matchMerchant = tx.merchant?.toLowerCase().includes(q) || false;
          const matchAmount = tx.amount.toString().includes(q);
          if (!matchDesc && !matchMerchant && !matchAmount) return false;
        }

        if (selectedType !== 'all' && tx.type !== selectedType) return false;
        if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;
        if (selectedAccount !== 'all' && tx.accountId !== selectedAccount) return false;
        if (selectedPayment !== 'all' && tx.paymentMethod !== selectedPayment) return false;

        if (minAmount && tx.amount < parseFloat(minAmount)) return false;
        if (maxAmount && tx.amount > parseFloat(maxAmount)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          return sortDirection === 'desc'
            ? new Date(b.date).getTime() - new Date(a.date).getTime()
            : new Date(a.date).getTime() - new Date(b.date).getTime();
        } else {
          return sortDirection === 'desc' ? b.amount - a.amount : a.amount - b.amount;
        }
      });
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedCategory,
    selectedAccount,
    selectedPayment,
    minAmount,
    maxAmount,
    sortField,
    sortDirection,
  ]);

  // Aggregate summaries for current filtered set
  const { totalIncome, totalExpenses, totalTransfers } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let transfers = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expenses += t.amount;
      else if (t.type === 'transfer') transfers += t.amount;
    });

    return { totalIncome: income, totalExpenses: expenses, totalTransfers: transfers };
  }, [filteredTransactions]);

  // Pagination slice
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Bulk actions
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedTransactions.map((t) => t.id);
    const allSelected = pageIds.every((id) => selectedTxIds.includes(id));
    if (allSelected) {
      setSelectedTxIds(selectedTxIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedTxIds(Array.from(new Set([...selectedTxIds, ...pageIds])));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedTxIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedTxIds.length} transactions?`)) {
      await deleteTransactionsBatch(selectedTxIds);
      setSelectedTxIds([]);
    }
  };

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getAccountName = (accId: string) => {
    return accounts.find((a) => a.id === accId)?.name || accId;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Page Title & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transactions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track and manage all your financial activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openExportModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => openAddTxModal('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Income
          </div>
          <div className="text-lg font-bold font-tabular text-emerald-600 dark:text-emerald-400 mt-0.5">
            +{formatCurrency(totalIncome)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Expenses
          </div>
          <div className="text-lg font-bold font-tabular text-rose-600 dark:text-rose-400 mt-0.5">
            -{formatCurrency(totalExpenses)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Transfers
          </div>
          <div className="text-lg font-bold font-tabular text-blue-600 dark:text-blue-400 mt-0.5">
            {formatCurrency(totalTransfers)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by merchant, description, or amount..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
            />
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Type */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Account */}
            <select
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Payment method */}
            <select
              value={selectedPayment}
              onChange={(e) => {
                setSelectedPayment(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Payment Method</option>
              <option value="UPI">UPI</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex items-center justify-center gap-1 shrink-0"
            >
              <RotateCcw size={13} />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedTxIds.length > 0 && (
        <div className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-100">
          <div className="font-medium">
            {selectedTxIds.length} {selectedTxIds.length === 1 ? 'transaction' : 'transactions'}{' '}
            selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTxIds([])}
              className="px-2.5 py-1 text-slate-300 dark:text-slate-600 hover:text-white dark:hover:text-black"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium"
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 w-10">
                  <button
                    onClick={handleSelectAllOnPage}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {paginatedTransactions.length > 0 &&
                    paginatedTransactions.every((t) => selectedTxIds.includes(t.id)) ? (
                      <CheckSquare size={16} className="text-slate-900 dark:text-white" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="p-3 font-semibold cursor-pointer" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    {sortField === 'date' ? (
                      sortDirection === 'desc' ? (
                        <ArrowDown size={13} />
                      ) : (
                        <ArrowUp size={13} />
                      )
                    ) : (
                      <ArrowUpDown size={13} className="text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="p-3 font-semibold">Description</th>
                <th className="p-3 font-semibold hidden sm:table-cell">Category</th>
                <th className="p-3 font-semibold hidden md:table-cell">Account</th>
                <th className="p-3 font-semibold hidden lg:table-cell">Payment Method</th>
                <th
                  className="p-3 font-semibold text-right cursor-pointer"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    {sortField === 'amount' ? (
                      sortDirection === 'desc' ? (
                        <ArrowDown size={13} />
                      ) : (
                        <ArrowUp size={13} />
                      )
                    ) : (
                      <ArrowUpDown size={13} className="text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="p-3 font-semibold text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <p className="text-sm font-medium">No transactions found</p>
                    <p className="text-xs mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isSelected = selectedTxIds.includes(tx.id);
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-slate-50 dark:bg-slate-800/70'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleRow(tx.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-slate-900 dark:text-white" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-tabular text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {isTransfer ? (
                            <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-500">
                              <ArrowRightLeft size={13} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-semibold text-[11px] shrink-0">
                              {tx.merchant ? tx.merchant[0] : tx.description[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {tx.merchant || tx.description}
                            </div>
                            {tx.merchant && (
                              <div className="text-[11px] text-slate-400 truncate">
                                {tx.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 capitalize text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        {tx.categoryId}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                        {isTransfer && tx.toAccountId ? (
                          <span className="flex items-center gap-1 font-medium">
                            {getAccountName(tx.accountId)} → {getAccountName(tx.toAccountId)}
                          </span>
                        ) : (
                          getAccountName(tx.accountId)
                        )}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                        {tx.paymentMethod}
                      </td>
                      <td className="p-3 text-right font-semibold font-tabular whitespace-nowrap">
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
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewTx(tx)}
                            title="View Details"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete transaction "${tx.description}"?`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredTransactions.length)} of{' '}
            {filteredTransactions.length} entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-medium text-slate-700 dark:text-slate-300 px-2 font-tabular">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* View Transaction Modal */}
      {viewTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setViewTx(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 z-10 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Transaction Details
              </h3>
              <button
                onClick={() => setViewTx(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="text-center py-2">
                <div className="text-xs text-slate-400 uppercase font-medium">
                  {viewTx.type} ({viewTx.currency || 'INR'})
                </div>
                <div
                  className={`text-2xl font-bold font-tabular mt-1 ${
                    viewTx.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : viewTx.type === 'expense'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {viewTx.type === 'income' ? '+' : viewTx.type === 'expense' ? '-' : ''}
                  {formatCurrency(viewTx.amount, { currency: viewTx.currency })}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Date</span>
                  <span className="font-medium text-slate-900 dark:text-white font-tabular">
                    {viewTx.date}
                  </span>
                </div>
                {viewTx.merchant && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Merchant</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {viewTx.merchant}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Description</span>
                  <span className="font-medium text-slate-900 dark:text-white text-right max-w-[200px] truncate">
                    {viewTx.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="font-medium text-slate-900 dark:text-white capitalize">
                    {viewTx.categoryId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {getAccountName(viewTx.accountId)}
                  </span>
                </div>
                {viewTx.toAccountId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Destination Account</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {getAccountName(viewTx.toAccountId)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {viewTx.paymentMethod}
                  </span>
                </div>
                {viewTx.notes && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block mb-1">Notes</span>
                    <p className="text-slate-700 dark:text-slate-300 italic">{viewTx.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewTx(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
