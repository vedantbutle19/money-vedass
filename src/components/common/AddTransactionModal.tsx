import {
  ArrowRightLeft,
  Calendar,
  Check,
  CreditCard,
  Layers,
  Paperclip,
  Plus,
  Tag,
  Upload,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SUPPORTED_CURRENCIES, useFinance } from '../../context/FinanceContext';
import { CategoryId, PaymentMethod, TransactionType } from '../../types';

export const AddTransactionModal: React.FC = () => {
  const {
    isAddTxModalOpen,
    closeAddTxModal,
    addTxModalDefaults,
    categories,
    accounts,
    addTransaction,
    formatCurrency,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [categoryId, setCategoryId] = useState<CategoryId>('food');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [merchant, setMerchant] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [receiptName, setReceiptName] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAddTxModalOpen) {
      setType(addTxModalDefaults.type || 'expense');
      if (addTxModalDefaults.accountId) {
        setAccountId(addTxModalDefaults.accountId);
      } else if (accounts.length > 0) {
        setAccountId(accounts[0].id);
      }
      if (accounts.length > 1) {
        setToAccountId(accounts[1].id);
      }
      setAmount('');
      setCurrency('INR');
      setMerchant('');
      setDescription('');
      setNotes('');
      setTags([]);
      setReceiptName('');
      setErrors({});
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isAddTxModalOpen, addTxModalDefaults, accounts]);

  if (!isAddTxModalOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!accountId) {
      errs.accountId = 'Please select a source account';
    }
    if (type === 'transfer') {
      if (!toAccountId) {
        errs.toAccountId = 'Please select a destination account';
      } else if (toAccountId === accountId) {
        errs.toAccountId = 'Destination account cannot be identical to source';
      }
    } else {
      if (!categoryId) {
        errs.categoryId = 'Please select a category';
      }
    }
    if (!date) {
      errs.date = 'Date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const parsedAmount = parseFloat(amount);
      const desc =
        description.trim() ||
        (type === 'transfer'
          ? `Transfer to ${accounts.find((a) => a.id === toAccountId)?.name || 'Account'}`
          : merchant.trim() || `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`);

      await addTransaction({
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        categoryId: type === 'transfer' ? 'transfer' : categoryId,
        type,
        amount: parsedAmount,
        currency,
        date,
        merchant: merchant.trim() || undefined,
        description: desc,
        paymentMethod,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        receiptUrl: receiptName ? `mock_receipt_${receiptName}` : undefined,
      });

      closeAddTxModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (type === 'income') return c.type === 'income' || c.type === 'both';
    if (type === 'expense') return c.type === 'expense' || c.type === 'both';
    return true;
  });

  const activeCurrencySymbol =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol || '₹';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      style={{
        paddingTop: 'max(calc(1rem + env(safe-area-inset-top, 0px)), 1.25rem)',
        paddingBottom: 'max(calc(1rem + env(safe-area-inset-bottom, 0px)), 1.25rem)',
      }}
    >
      <div className="fixed inset-0" onClick={closeAddTxModal} />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2.5rem)',
        }}
      >
        {/* Modal Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Add Transaction
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record a new inflow, outflow, or account transfer
            </p>
          </div>
          <button
            onClick={closeAddTxModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Type Segmented Control */}
        <div className="flex-shrink-0 px-5 sm:px-6 pt-3 pb-1">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId('food');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId('salary');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setCategoryId('transfer');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'transfer'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Transfer
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Amount & Currency input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount ({currency}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-semibold text-slate-400 dark:text-slate-500">
                  {activeCurrencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-9 pr-4 py-2.5 text-lg font-semibold font-tabular bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all ${
                    errors.amount
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                  autoFocus
                />
              </div>
              {errors.amount && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-3 text-xs font-semibold bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transfers vs standard transaction flow */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  From Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.accountId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  To Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                >
                  <option value="">Select destination</option>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                </select>
                {errors.toAccountId && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.toAccountId}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value as CategoryId)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Account */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white font-tabular"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Merchant / Payee & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {type === 'income' ? 'Payer / Source' : 'Merchant / Payee'}
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder={
                  type === 'income'
                    ? 'e.g. Acme Tech Pvt Ltd'
                    : 'e.g. Swiggy, Amazon, Uber'
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description / Item
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner with team, Groceries"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Tags & Subcategories */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tags &amp; Labels
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag (e.g. Work, Weekend, Tax) and press Add"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Receipt Attachment Simulation */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Receipt / Bill Attachment (Optional)
            </label>
            <div className="flex items-center gap-3 p-2.5 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-xs">
              <Upload size={16} className="text-slate-400 shrink-0" />
              <div className="flex-1 truncate text-slate-500 dark:text-slate-400">
                {receiptName ? (
                  <span className="text-slate-900 dark:text-white font-medium flex items-center gap-1.5">
                    <Paperclip size={13} /> {receiptName}
                  </span>
                ) : (
                  'Attach bill or invoice (PNG, JPG, PDF up to 5MB)'
                )}
              </div>
              {receiptName ? (
                <button
                  type="button"
                  onClick={() => setReceiptName('')}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setReceiptName('invoice_october.pdf')}
                  className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Browse File
                </button>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs pt-3 pb-1 -mx-5 sm:-mx-6 px-5 sm:px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={closeAddTxModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
