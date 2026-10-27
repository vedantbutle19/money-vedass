import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Cloud,
  CreditCard,
  Droplets,
  Flame,
  GraduationCap,
  Home,
  Landmark,
  Layers,
  Music,
  Pause,
  Play,
  Plus,
  Receipt,
  Repeat,
  Shield,
  Smartphone,
  Trash2,
  Tv,
  Wifi,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryId, Subscription } from '../types';

interface PresetItem {
  label: string;
  category: CategoryId;
  defaultAmount: number;
  icon: string;
  billType: string;
}

const PRESETS: PresetItem[] = [
  { label: 'House Rent', category: 'rent', defaultAmount: 15000, icon: 'Home', billType: 'rent' },
  { label: 'Home Loan EMI', category: 'house_loan', defaultAmount: 25000, icon: 'Landmark', billType: 'loan' },
  { label: 'Loan / EMI', category: 'emi', defaultAmount: 7500, icon: 'CreditCard', billType: 'emi' },
  { label: 'Water Bill', category: 'water', defaultAmount: 450, icon: 'Droplets', billType: 'bill' },
  { label: 'Electricity Bill', category: 'electricity', defaultAmount: 1800, icon: 'Zap', billType: 'bill' },
  { label: 'WiFi & Broadband', category: 'broadband', defaultAmount: 899, icon: 'Wifi', billType: 'bill' },
  { label: 'Mobile Recharge', category: 'mobile_recharge', defaultAmount: 399, icon: 'Smartphone', billType: 'bill' },
  { label: 'LPG Gas Bill', category: 'gas_bill', defaultAmount: 950, icon: 'Flame', billType: 'bill' },
  { label: 'Society Maintenance', category: 'maintenance', defaultAmount: 2000, icon: 'Wrench', billType: 'bill' },
  { label: 'Insurance Premium', category: 'insurance', defaultAmount: 3500, icon: 'Shield', billType: 'bill' },
  { label: 'OTT / Streaming', category: 'entertainment', defaultAmount: 499, icon: 'Tv', billType: 'subscription' },
];

export const SubscriptionsPage: React.FC = () => {
  const {
    subscriptions,
    accounts,
    categories,
    addSubscription,
    deleteSubscription,
    toggleSubscriptionStatus,
    deductSubscription,
    formatCurrency,
  } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Add Bill Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'quarterly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [category, setCategory] = useState<CategoryId>('bills');
  const [billType, setBillType] = useState<string>('bill');
  const [autoDeduct, setAutoDeduct] = useState<boolean>(true);
  const [icon, setIcon] = useState<string>('Receipt');

  // Deduct Modal State
  const [deductModalSub, setDeductModalSub] = useState<Subscription | null>(null);
  const [deductAmount, setDeductAmount] = useState<string>('');
  const [deductAccountId, setDeductAccountId] = useState<string>('');
  const [deductDate, setDeductDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deductNotes, setDeductNotes] = useState<string>('');
  const [isDeducting, setIsDeducting] = useState<boolean>(false);

  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const totalMonthly = activeSubs.reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + s.amount;
    if (s.billingCycle === 'quarterly') return sum + s.amount / 3;
    return sum + s.amount / 12;
  }, 0);

  const totalAnnual = totalMonthly * 12;
  const autoDeductCount = activeSubs.filter((s) => s.autoDeduct).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = activeSubs.filter((s) => s.nextBillingDate && s.nextBillingDate < todayStr).length;

  const handleOpenPreset = (preset: PresetItem) => {
    setName(preset.label);
    setCategory(preset.category);
    setAmount(String(preset.defaultAmount));
    setBillingCycle('monthly');
    setBillType(preset.billType);
    setIcon(preset.icon);
    setAutoDeduct(true);
    setAccountId(accounts[0]?.id || '');
    setNextBillingDate(new Date().toISOString().split('T')[0]);
    setIsAddOpen(true);
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    await addSubscription({
      name: name.trim(),
      amount: parsedAmount,
      billingCycle,
      nextBillingDate,
      category,
      accountId: accountId || accounts[0]?.id || '',
      status: 'active',
      icon,
      autoDeduct,
      billType,
    });

    setIsAddOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setCategory('bills');
    setBillType('bill');
    setIcon('Receipt');
    setAutoDeduct(true);
  };

  const handleOpenDeductModal = (sub: Subscription) => {
    setDeductModalSub(sub);
    setDeductAmount(String(sub.amount));
    setDeductAccountId(sub.accountId || accounts[0]?.id || '');
    setDeductDate(new Date().toISOString().split('T')[0]);
    setDeductNotes(`Paid ${sub.name} on ${new Date().toISOString().split('T')[0]}`);
  };

  const handleConfirmDeduct = async () => {
    if (!deductModalSub) return;
    const parsed = parseFloat(deductAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    try {
      setIsDeducting(true);
      await deductSubscription(deductModalSub.id, {
        amount: parsed,
        accountId: deductAccountId,
        date: deductDate,
        notes: deductNotes.trim(),
      });
      setDeductModalSub(null);
    } finally {
      setIsDeducting(false);
    }
  };

  const getSubIcon = (subCategory: string, iconName?: string) => {
    switch (subCategory) {
      case 'rent':
        return <Home size={18} className="text-purple-600 dark:text-purple-400" />;
      case 'house_loan':
        return <Landmark size={18} className="text-indigo-600 dark:text-indigo-400" />;
      case 'emi':
        return <CreditCard size={18} className="text-pink-600 dark:text-pink-400" />;
      case 'water':
        return <Droplets size={18} className="text-cyan-600 dark:text-cyan-400" />;
      case 'electricity':
        return <Zap size={18} className="text-amber-600 dark:text-amber-400" />;
      case 'broadband':
        return <Wifi size={18} className="text-blue-600 dark:text-blue-400" />;
      case 'mobile_recharge':
        return <Smartphone size={18} className="text-emerald-600 dark:text-emerald-400" />;
      case 'gas_bill':
        return <Flame size={18} className="text-orange-600 dark:text-orange-400" />;
      case 'maintenance':
        return <Wrench size={18} className="text-slate-600 dark:text-slate-400" />;
      case 'insurance':
        return <Shield size={18} className="text-teal-600 dark:text-teal-400" />;
      case 'education':
        return <GraduationCap size={18} className="text-sky-600 dark:text-sky-400" />;
      case 'entertainment':
        return <Tv size={18} className="text-violet-600 dark:text-violet-400" />;
      default:
        if (iconName === 'Music') return <Music size={18} className="text-emerald-600 dark:text-emerald-400" />;
        if (iconName === 'Cloud') return <Cloud size={18} className="text-amber-600 dark:text-amber-400" />;
        return <Receipt size={18} className="text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getDueStatus = (nextDate: string) => {
    if (!nextDate) return { text: 'Scheduled', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    if (nextDate < todayStr) {
      return { text: 'Overdue', badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-semibold' };
    }
    if (nextDate === todayStr) {
      return { text: 'Due Today', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold' };
    }
    return { text: `Due ${nextDate}`, badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
  };

  const filteredSubscriptions = subscriptions.filter((s) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'rent_loan') return ['rent', 'house_loan', 'emi'].includes(s.category);
    if (filterCategory === 'utilities') return ['water', 'electricity', 'broadband', 'mobile_recharge', 'gas_bill', 'maintenance', 'bills'].includes(s.category);
    if (filterCategory === 'subs') return ['entertainment', 'other'].includes(s.category);
    return s.category === filterCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Recurring Bills, EMIs & Subscriptions</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track monthly commitments: House Rent, Loan EMIs, Utility Bills (Water, Electricity, WiFi), and Subscriptions.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Bill / Commitment</span>
        </button>
      </div>

      {/* Quick Add Presets Bar */}
      <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quick Add Common Recurring Bills
          </span>
          <span className="text-[11px] text-slate-400">Click to configure</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleOpenPreset(preset)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs cursor-pointer"
            >
              {getSubIcon(preset.category, preset.icon)}
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards: Total Monthly, Annual, Auto-Deduct, Overdue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Total Monthly Outflow
          </span>
          <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalMonthly)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ mo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {activeSubs.length} active recurring commitments
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Projected Annual Outflow
          </span>
          <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalAnnual)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ yr</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Fixed annual non-discretionary commitments
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Auto-Deduct Active
          </span>
          <div className="text-2xl font-bold font-tabular text-emerald-600 dark:text-emerald-400 mt-1">
            {autoDeductCount} <span className="text-xs font-normal text-slate-400">bills</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Auto-recorded & deducted on their due dates
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Pending / Overdue
          </span>
          <div className={`text-2xl font-bold font-tabular mt-1 ${overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {overdueCount} <span className="text-xs font-normal text-slate-400">due now</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {overdueCount > 0 ? 'Requires immediate deduction or payment' : 'All scheduled bills are up to date'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { id: 'all', label: 'All Recurring' },
          { id: 'rent_loan', label: 'Rent & Loan EMIs' },
          { id: 'utilities', label: 'Utilities & Bills' },
          { id: 'subs', label: 'Subscriptions & OTT' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              filterCategory === tab.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscriptions & Bills List */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        {filteredSubscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No recurring bills found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Add your monthly repeating bills like House Rent, Loan EMI, Water, Electricity, or WiFi using the presets above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredSubscriptions.map((sub) => {
              const accName = accounts.find((a) => a.id === sub.accountId)?.name || 'Default Account';
              const isPaused = sub.status === 'paused';
              const dueInfo = getDueStatus(sub.nextBillingDate);
              const isOverdue = sub.nextBillingDate && sub.nextBillingDate < todayStr;

              return (
                <div
                  key={sub.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isPaused ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/20' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getSubIcon(sub.category, sub.icon)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {sub.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${dueInfo.badgeClass}`}>
                          {dueInfo.text}
                        </span>
                        {sub.autoDeduct ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                            <Zap size={10} /> Auto-Deduct ON
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Manual Pay
                          </span>
                        )}
                        {isPaused && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>Debited from: <strong className="text-slate-700 dark:text-slate-300 font-medium">{accName}</strong></span>
                        <span>•</span>
                        <span>Next due: <span className="font-tabular text-slate-700 dark:text-slate-300 font-medium">{sub.nextBillingDate}</span></span>
                        {sub.lastPaidDate && (
                          <>
                            <span>•</span>
                            <span>Last paid: <span className="font-tabular text-slate-700 dark:text-slate-300">{sub.lastPaidDate}</span></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold font-tabular text-slate-900 dark:text-white">
                        {formatCurrency(sub.amount)}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {sub.billingCycle} {sub.billType ? `· ${sub.billType}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDeductModal(sub)}
                        title="Deduct & Record Payment Now"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer ${
                          isOverdue
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <CheckCircle2 size={13} strokeWidth={2.5} />
                        <span>Pay & Deduct</span>
                      </button>

                      <button
                        onClick={() => toggleSubscriptionStatus(sub.id)}
                        title={isPaused ? 'Resume commitment' : 'Pause commitment'}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {isPaused ? <Play size={15} /> : <Pause size={15} />}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete recurring bill "${sub.name}"?`)) {
                            deleteSubscription(sub.id);
                          }
                        }}
                        title="Delete bill"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pay & Deduct Modal */}
      {deductModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => !isDeducting && setDeductModalSub(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 z-10 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pay & Deduct Bill
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {deductModalSub.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isDeducting && setDeductModalSub(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="text-[11px] leading-relaxed">
                Deducting this bill will record an expense in your ledger, deduct the amount from your selected account, update this month's budget, and advance the next due date forward automatically.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Amount to Deduct (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={deductAmount}
                  onChange={(e) => setDeductAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold font-tabular text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Pay From Account
                </label>
                <select
                  value={deductAccountId}
                  onChange={(e) => setDeductAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Balance: {formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={deductDate}
                    onChange={(e) => setDeductDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-tabular text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Category
                  </label>
                  <input
                    type="text"
                    disabled
                    value={deductModalSub.category}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg font-medium text-slate-500 capitalize"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Payment Description / Notes
                </label>
                <input
                  type="text"
                  value={deductNotes}
                  onChange={(e) => setDeductNotes(e.target.value)}
                  placeholder="Optional reference, bill receipt number, etc."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeducting}
                onClick={() => setDeductModalSub(null)}
                className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeducting}
                onClick={handleConfirmDeduct}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeducting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirm & Deduct ₹{deductAmount || deductModalSub.amount}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Configure Bill Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsAddOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 z-10 text-xs animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Recurring Commitment / Bill
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Commitment Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 3BHK Apartment Rent, SBI Home Loan, Water Board, JioFiber"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value as CategoryId;
                      setCategory(newCat);
                      const matchingPreset = PRESETS.find((p) => p.category === newCat);
                      if (matchingPreset) {
                        setIcon(matchingPreset.icon);
                        setBillType(matchingPreset.billType);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="rent">🏠 House Rent</option>
                    <option value="house_loan">🏦 House Loan EMI</option>
                    <option value="emi">💳 Loan & Personal EMI</option>
                    <option value="water">💧 Water Bill</option>
                    <option value="electricity">⚡ Electricity Bill</option>
                    <option value="broadband">📶 WiFi & Broadband</option>
                    <option value="mobile_recharge">📱 Mobile Recharge</option>
                    <option value="gas_bill">🔥 Gas / LPG Cylinder</option>
                    <option value="maintenance">🔧 Society Maintenance</option>
                    <option value="insurance">🛡️ Insurance Premium</option>
                    <option value="education">🎓 Education & School Fees</option>
                    <option value="entertainment">📺 OTT / Streaming</option>
                    <option value="bills">🧾 General Bills & Utilities</option>
                    <option value="housing">🏘️ Housing Other</option>
                    <option value="other">📦 Other Recurring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-tabular text-slate-900 dark:text-white focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Billing Frequency
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="monthly">Monthly (Every Month)</option>
                    <option value="quarterly">Quarterly (Every 3 Months)</option>
                    <option value="yearly">Yearly (Annual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Next Due / Billing Date
                  </label>
                  <input
                    type="date"
                    required
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-tabular text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Debit Account
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Balance: {formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto Deduct Option */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start gap-3 cursor-pointer" onClick={() => setAutoDeduct(!autoDeduct)}>
                <input
                  type="checkbox"
                  id="autoDeductCheck"
                  checked={autoDeduct}
                  onChange={(e) => setAutoDeduct(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="autoDeductCheck" className="font-semibold text-slate-900 dark:text-white cursor-pointer block">
                    Auto-deduct on due date
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Automatically logs an expense transaction, decreases the account balance, and advances the next billing date when the bill is due.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Save Recurring Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
