import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { financeService } from '../services/financeService';
import { useAuth } from './AuthContext';
import {
  Account,
  Budget,
  Category,
  Goal,
  NotificationItem,
  RecurringTransaction,
  Subscription,
  Transaction,
} from '../types';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  subscriptions: Subscription[];
  recurring: RecurringTransaction[];
  categories: Category[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  isLoading: boolean;
  selectedMonth: { month: number; year: number; label: string };
  setSelectedMonth: (m: { month: number; year: number; label: string }) => void;
  formatCurrency: (amount: number, options?: { showSign?: boolean; hideSymbol?: boolean; currency?: string }) => string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  monthlyTransfers: number;
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  budgetUsagePercent: number;
  // Modals & global UI
  isAddTxModalOpen: boolean;
  openAddTxModal: (defaultType?: 'expense' | 'income' | 'transfer', defaultAccount?: string) => void;
  closeAddTxModal: () => void;
  addTxModalDefaults: { type?: 'expense' | 'income' | 'transfer'; accountId?: string };
  isSearchModalOpen: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  isExportModalOpen: boolean;
  openExportModal: () => void;
  closeExportModal: () => void;
  // Toast notifications
  toast: { text: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  // CRUD actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId'>) => Promise<Transaction>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactionsBatch: (ids: string[]) => Promise<void>;
  addAccount: (acc: Omit<Account, 'id' | 'updatedAt'>) => Promise<Account>;
  updateAccount: (id: string, acc: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  updateBudgetLimit: (id: string, limit: number) => Promise<Budget>;
  addBudget: (categoryId: string, categoryName: string, limit: number) => Promise<Budget>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<Goal>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
  addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<Subscription>;
  updateSubscription: (id: string, sub: Partial<Subscription>) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;
  toggleSubscriptionStatus: (id: string) => Promise<void>;
  deductSubscription: (
    id: string,
    options?: { amount?: number; accountId?: string; date?: string; notes?: string }
  ) => Promise<{ success: boolean; message: string; deductedAmount: number; nextBillingDate: string; subscription: Subscription }>;
  addRecurring: (rec: Omit<RecurringTransaction, 'id'>) => Promise<RecurringTransaction>;
  updateRecurring: (id: string, rec: Partial<RecurringTransaction>) => Promise<RecurringTransaction>;
  deleteRecurring: (id: string) => Promise<void>;
  toggleRecurringStatus: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  resetDemoData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const AVAILABLE_MONTHS = [
  { month: 10, year: 2026, label: 'October 2026' },
  { month: 9, year: 2026, label: 'September 2026' },
  { month: 8, year: 2026, label: 'August 2026' },
  { month: 7, year: 2026, label: 'July 2026' },
];

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ) - UAE Dirham' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$) - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) - Australian Dollar' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$) - Singapore Dollar' },
];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedMonth, setSelectedMonth] = useState(AVAILABLE_MONTHS[0]);

  // Modals state
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [addTxModalDefaults, setAddTxModalDefaults] = useState<{
    type?: 'expense' | 'income' | 'transfer';
    accountId?: string;
  }>({});
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accs, txs, bdgs, gls, subs, recs, cats, notifs] = await Promise.all([
        financeService.getAccounts(),
        financeService.getTransactions(),
        financeService.getBudgets(),
        financeService.getGoals(),
        financeService.getSubscriptions(),
        financeService.getRecurring(),
        financeService.getCategories(),
        financeService.getNotifications(),
      ]);
      setAccounts(accs);
      setTransactions(txs);
      setBudgets(bdgs);
      setGoals(gls);
      setSubscriptions(subs);
      setRecurring(recs);
      setCategories(cats);
      setNotifications(notifs);
    } catch (e) {
      console.error('Failed to load financial records:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setAccounts([]);
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setSubscriptions([]);
      setRecurring([]);
      setNotifications([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Global Keyboard shortcuts: '/' or 'Cmd+K' / 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Multi-currency formatter
  const formatCurrency = (
    amount: number,
    options?: { showSign?: boolean; hideSymbol?: boolean; currency?: string }
  ): string => {
    const absVal = Math.abs(amount);
    const currCode = options?.currency || user?.currency || 'INR';
    const foundCurr = SUPPORTED_CURRENCIES.find((c) => c.code === currCode);
    const symbol = options?.hideSymbol ? '' : foundCurr ? foundCurr.symbol : '₹';

    const locale = currCode === 'INR' ? 'en-IN' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: absVal % 1 !== 0 ? 2 : 0,
    }).format(absVal);

    if (options?.showSign) {
      if (amount > 0) return `+${symbol}${formatted}`;
      if (amount < 0) return `-${symbol}${formatted}`;
      return `${symbol}${formatted}`;
    }

    if (amount < 0) {
      return `-${symbol}${formatted}`;
    }

    return `${symbol}${formatted}`;
  };

  // Calculations for selected Month
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    monthlyTransfers,
  } = useMemo(() => {
    // Total Balance = sum of positive liquid accounts + investments + credit card debt
    const balance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Selected month prefix: e.g. "2026-10"
    const monthStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;
    const monthTx = transactions.filter((t) => t.date.startsWith(monthStr));

    let income = 0;
    let expenses = 0;
    let transfers = 0;

    monthTx.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        expenses += t.amount;
      } else if (t.type === 'transfer') {
        transfers += t.amount;
      }
    });

    // If viewing October 2026 baseline from user prompt:
    // User requested Total Balance ₹52,450, Income ₹53,750, Expenses ₹28,650, Savings ₹25,100
    // If calculated is within a few, let's ensure base values match prompt specs
    const netSavings = income - expenses;
    const rate = income > 0 ? (netSavings / income) * 100 : 0;

    return {
      totalBalance: balance,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      monthlySavings: netSavings,
      savingsRate: Number(rate.toFixed(1)),
      monthlyTransfers: transfers,
    };
  }, [accounts, transactions, selectedMonth]);

  const { totalBudgetLimit, totalBudgetSpent, budgetUsagePercent } = useMemo(() => {
    const monthBudgets = budgets.filter((b) => Number(b.month) === Number(selectedMonth.month) && Number(b.year) === Number(selectedMonth.year));
    const activeBudgets = monthBudgets.length > 0 ? monthBudgets : budgets;
    const limit = activeBudgets.reduce((sum, b) => sum + Number(b.limit), 0);
    const spent = activeBudgets.reduce((sum, b) => sum + Number(b.spent), 0);
    const usage = limit > 0 ? (spent / limit) * 100 : 0;
    return {
      totalBudgetLimit: Math.round((limit + Number.EPSILON) * 100) / 100,
      totalBudgetSpent: Math.round((spent + Number.EPSILON) * 100) / 100,
      budgetUsagePercent: Number(usage.toFixed(1)),
    };
  }, [budgets, selectedMonth]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Modal open helpers
  const openAddTxModal = (
    defaultType: 'expense' | 'income' | 'transfer' = 'expense',
    defaultAccount?: string
  ) => {
    setAddTxModalDefaults({ type: defaultType, accountId: defaultAccount });
    setIsAddTxModalOpen(true);
  };
  const closeAddTxModal = () => setIsAddTxModalOpen(false);

  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);

  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);

  // Operations
  const addTransaction = async (data: Omit<Transaction, 'id' | 'userId'>) => {
    const newTx = await financeService.createTransaction(data);
    await loadData();
    showToast('Transaction recorded successfully', 'success');
    return newTx;
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    const updated = await financeService.updateTransaction(id, data);
    await loadData();
    showToast('Transaction updated', 'success');
    return updated;
  };

  const deleteTransaction = async (id: string) => {
    await financeService.deleteTransaction(id);
    await loadData();
    showToast('Transaction deleted', 'info');
  };

  const deleteTransactionsBatch = async (ids: string[]) => {
    await financeService.deleteTransactionsBatch(ids);
    await loadData();
    showToast(`${ids.length} transactions deleted`, 'info');
  };

  const addAccount = async (data: Omit<Account, 'id' | 'updatedAt'>) => {
    const newAcc = await financeService.createAccount(data);
    await loadData();
    showToast(`Account "${newAcc.name}" created`, 'success');
    return newAcc;
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    const updated = await financeService.updateAccount(id, data);
    await loadData();
    showToast('Account updated', 'success');
    return updated;
  };

  const deleteAccount = async (id: string) => {
    await financeService.deleteAccount(id);
    await loadData();
    showToast('Account removed', 'info');
  };

  const updateBudgetLimit = async (id: string, limit: number) => {
    const updated = await financeService.updateBudget(id, limit);
    await loadData();
    showToast('Budget allocation updated', 'success');
    return updated;
  };

  const addBudget = async (categoryId: string, categoryName: string, limit: number) => {
    const created = await financeService.createBudget(categoryId, categoryName, limit, selectedMonth.month, selectedMonth.year);
    await loadData();
    showToast(`Budget for ${categoryName} created`, 'success');
    return created;
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const created = await financeService.createGoal(goal);
    await loadData();
    showToast(`Goal "${created.name}" established`, 'success');
    return created;
  };

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    const updated = await financeService.updateGoal(id, data);
    await loadData();
    showToast('Goal updated', 'success');
    return updated;
  };

  const deleteGoal = async (id: string) => {
    await financeService.deleteGoal(id);
    await loadData();
    showToast('Goal removed', 'info');
  };

  const contributeToGoal = async (id: string, amount: number) => {
    const g = goals.find((item) => item.id === id);
    if (!g) return;
    await financeService.contributeToGoal(id, amount);
    await loadData();
    showToast(`Contributed ${formatCurrency(amount)} to ${g.name}!`, 'success');
  };

  const addSubscription = async (sub: Omit<Subscription, 'id'>) => {
    const created = await financeService.createSubscription(sub);
    await loadData();
    showToast(`Subscription "${created.name}" added`, 'success');
    return created;
  };

  const updateSubscription = async (id: string, sub: Partial<Subscription>) => {
    const updated = await financeService.updateSubscription(id, sub);
    await loadData();
    showToast('Subscription updated', 'success');
    return updated;
  };

  const deleteSubscription = async (id: string) => {
    await financeService.deleteSubscription(id);
    await loadData();
    showToast('Subscription removed', 'info');
  };

  const toggleSubscriptionStatus = async (id: string) => {
    const s = subscriptions.find((item) => item.id === id);
    if (!s) return;
    const updated = await financeService.toggleSubscriptionStatus(id);
    await loadData();
    showToast(`Subscription ${updated.status === 'active' ? 'resumed' : 'paused'}`, 'info');
  };

  const deductSubscription = async (
    id: string,
    options?: { amount?: number; accountId?: string; date?: string; notes?: string }
  ) => {
    const result = await financeService.deductSubscription(id, options);
    await loadData();
    showToast(result.message || 'Payment deducted successfully', 'success');
    return result;
  };

  const addRecurring = async (rec: Omit<RecurringTransaction, 'id'>) => {
    const created = await financeService.createRecurring(rec);
    await loadData();
    showToast(`Recurring item "${created.name}" scheduled`, 'success');
    return created;
  };

  const updateRecurring = async (id: string, rec: Partial<RecurringTransaction>) => {
    const updated = await financeService.updateRecurring(id, rec);
    await loadData();
    showToast('Recurring item updated', 'success');
    return updated;
  };

  const deleteRecurring = async (id: string) => {
    await financeService.deleteRecurring(id);
    await loadData();
    showToast('Recurring schedule deleted', 'info');
  };

  const toggleRecurringStatus = async (id: string) => {
    const r = recurring.find((item) => item.id === id);
    if (!r) return;
    const updated = await financeService.toggleRecurringStatus(id);
    await loadData();
    showToast(`Recurring payment ${updated.status === 'active' ? 'activated' : 'paused'}`, 'info');
  };

  const markNotificationRead = async (id: string) => {
    await financeService.markNotificationRead(id);
    await loadData();
  };

  const clearAllNotifications = async () => {
    await financeService.clearAllNotifications();
    await loadData();
    showToast('Notifications cleared', 'info');
  };

  const resetDemoData = async () => {
    await financeService.resetAllData();
    await loadData();
    showToast('Personal ledger cleared to zero', 'info');
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        budgets,
        goals,
        subscriptions,
        recurring,
        categories,
        notifications,
        unreadNotificationCount,
        isLoading,
        selectedMonth,
        setSelectedMonth,
        formatCurrency,
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        savingsRate,
        monthlyTransfers,
        totalBudgetLimit,
        totalBudgetSpent,
        budgetUsagePercent,
        isAddTxModalOpen,
        openAddTxModal,
        closeAddTxModal,
        addTxModalDefaults,
        isSearchModalOpen,
        openSearchModal,
        closeSearchModal,
        isExportModalOpen,
        openExportModal,
        closeExportModal,
        toast,
        showToast,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactionsBatch,
        addAccount,
        updateAccount,
        deleteAccount,
        updateBudgetLimit,
        addBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        toggleSubscriptionStatus,
        deductSubscription,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        toggleRecurringStatus,
        markNotificationRead,
        clearAllNotifications,
        resetDemoData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
