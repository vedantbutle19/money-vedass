import {
  ArrowRightLeft,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Layers,
  Loader2,
  Paperclip,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { SUPPORTED_CURRENCIES, useFinance } from '../../context/FinanceContext';
import { CategoryId, PaymentMethod, TransactionType } from '../../types';
import { financeService } from '../../services/financeService';
import { ReceiptViewerModal } from './ReceiptViewerModal';

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
  
  // Bill / Receipt upload state
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      setReceiptUrl('');
      setReceiptPreview('');
      setIsScanning(false);
      setScanMessage(null);
      setErrors({});
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isAddTxModalOpen, addTxModalDefaults, accounts]);

  if (!isAddTxModalOpen) return null;

  // Compress image client-side to ensure speedy upload
  const compressImage = (file: File, maxDimension = 1600, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type || 'image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    setReceiptName(file.name);
    setScanMessage(null);
    setIsScanning(true);

    try {
      const dataUrl = await compressImage(file);
      setReceiptPreview(dataUrl);

      // Perform AI Bill Scan
      const scanResult = await financeService.scanReceipt(dataUrl, file.type, file.name);

      if (scanResult.receiptUrl) {
        setReceiptUrl(scanResult.receiptUrl);
      } else {
        setReceiptUrl(dataUrl);
      }

      const extracted = scanResult.data;
      if (extracted) {
        // Automatically switch type to expense
        setType('expense');

        if (extracted.amount && !isNaN(extracted.amount)) {
          setAmount(extracted.amount.toString());
        }
        if (extracted.merchant) {
          setMerchant(extracted.merchant);
        }
        if (extracted.description) {
          setDescription(extracted.description);
        }
        if (extracted.notes) {
          setNotes(extracted.notes);
        }
        if (extracted.date) {
          setDate(extracted.date);
        }
        if (extracted.currency) {
          setCurrency(extracted.currency);
        }

        // Map category
        if (extracted.category) {
          const matched = categories.find(
            (c) =>
              c.id.toLowerCase() === extracted.category?.toLowerCase() ||
              c.name.toLowerCase().includes(extracted.category?.toLowerCase() || '')
          );
          if (matched) {
            setCategoryId(matched.id as CategoryId);
          }
        }

        // Map payment method
        if (extracted.paymentMethod) {
          const pm = extracted.paymentMethod as PaymentMethod;
          if (['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Cash'].includes(pm)) {
            setPaymentMethod(pm);
          }
        }

        setScanMessage({
          type: extracted.isSimulated ? 'info' : 'success',
          text: extracted.isSimulated
            ? extracted.message || 'Bill attached! Please review auto-filled fields.'
            : `✨ Extracted: ${extracted.currency || '₹'}${extracted.amount || ''} at ${extracted.merchant || 'Merchant'}`,
        });
      }
    } catch (err: any) {
      console.error('Error during bill scanning:', err);
      setScanMessage({
        type: 'error',
        text: 'Failed to extract bill automatically. File is attached for your records.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleClearReceipt = () => {
    setReceiptName('');
    setReceiptUrl('');
    setReceiptPreview('');
    setScanMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

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
        receiptUrl: receiptUrl || (receiptName ? receiptName : undefined),
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
    <>
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
            
            {/* AI Bill Scanner & Upload Module (Only shown for expenses or inflow bills) */}
            {type === 'expense' && (
              <div className="rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/10 p-3 sm:p-3.5 transition-all">
                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {!receiptName ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                        AI Bill &amp; Receipt Scanner
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Auto-fills amount, vendor &amp; date
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
                      >
                        <Upload size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Upload Bill / Invoice</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
                      >
                        <Camera size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Take Photo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Bill Preview & Status */}
                    <div className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {receiptPreview && !receiptName.endsWith('.pdf') ? (
                          <div
                            onClick={() => setIsViewerOpen(true)}
                            className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer group"
                            title="Click to view full receipt"
                          >
                            <img
                              src={receiptPreview}
                              alt="Receipt"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye size={12} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
                            <FileText size={20} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                            {receiptName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isScanning ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
                                <Loader2 size={11} className="animate-spin" />
                                Scanning with AI...
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={11} /> Bill Attached
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {receiptPreview && (
                          <button
                            type="button"
                            onClick={() => setIsViewerOpen(true)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="View Full Bill"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Replace Bill"
                        >
                          <RefreshCw size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={handleClearReceipt}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Remove Bill"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Scan Notification Banner */}
                    {scanMessage && (
                      <div
                        className={`mt-2 p-2 rounded-lg text-[11px] flex items-center justify-between gap-2 ${
                          scanMessage.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                            : scanMessage.type === 'error'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50'
                        }`}
                      >
                        <span className="truncate">{scanMessage.text}</span>
                        <span className="text-[10px] uppercase font-semibold shrink-0">Auto-filled</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
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
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notes &amp; Details (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional notes, invoice number, or breakdown"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white resize-none"
              />
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
                disabled={isSubmitting || isScanning}
                className="px-5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Transaction'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bill Preview Modal */}
      <ReceiptViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        receiptUrl={receiptPreview || receiptUrl}
        title={receiptName || 'Receipt Attachment'}
        amount={amount ? parseFloat(amount) : undefined}
        date={date}
      />
    </>
  );
};
