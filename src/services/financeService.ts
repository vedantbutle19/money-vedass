import {
  Account,
  Budget,
  Category,
  FinancialHealthScore,
  Goal,
  NotificationItem,
  RecurringTransaction,
  Subscription,
  Transaction,
  UserProfile,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_CATEGORIES,
  INITIAL_GOALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_RECURRING,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_USER,
} from './mockData';

const STORAGE_KEYS = {
  USER: 'finora_user',
  ACCOUNTS: 'finora_accounts',
  TRANSACTIONS: 'finora_transactions',
  BUDGETS: 'finora_budgets',
  GOALS: 'finora_goals',
  SUBSCRIPTIONS: 'finora_subscriptions',
  RECURRING: 'finora_recurring',
  NOTIFICATIONS: 'finora_notifications',
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage save failed:', e);
  }
}

import { API_BASE } from '../config/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('finora_token') || sessionStorage.getItem('finora_token');
}

export function clearUserSessionData(): void {
  localStorage.removeItem('finora_token');
  sessionStorage.removeItem('finora_token');
  localStorage.removeItem('finora_user_session');
  sessionStorage.removeItem('finora_user_session');
  Object.values(STORAGE_KEYS).forEach((k) => {
    localStorage.removeItem(k);
  });
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as any),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearUserSessionData();
    }
    throw new Error(errorBody.error || `API request to ${endpoint} failed with status ${res.status}`);
  }

  return res.json();
}

export const financeService = {
  // User Profile
  async getUserProfile(): Promise<UserProfile> {
    try {
      const user = await apiRequest<UserProfile>('/user/profile');
      saveStorage(STORAGE_KEYS.USER, user);
      return user;
    } catch (e) {
      console.warn('Backend unavailable, using cached profile:', e);
      return loadStorage(STORAGE_KEYS.USER, INITIAL_USER);
    }
  },

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const updated = await apiRequest<UserProfile>('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      saveStorage(STORAGE_KEYS.USER, updated);
      return updated;
    } catch (e) {
      console.warn('Backend update failed, using local fallback:', e);
      const current = await this.getUserProfile();
      const fallback = { ...current, ...profile };
      saveStorage(STORAGE_KEYS.USER, fallback);
      return fallback;
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      return await apiRequest<Category[]>('/categories');
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  // Accounts
  async getAccounts(): Promise<Account[]> {
    try {
      const data = await apiRequest<Account[]>('/accounts');
      saveStorage(STORAGE_KEYS.ACCOUNTS, data);
      return data;
    } catch (e) {
      console.warn('Backend unavailable, using cached accounts:', e);
      return loadStorage(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    }
  },

  async getAccountById(id: string): Promise<Account | undefined> {
    try {
      return await apiRequest<Account>(`/accounts/${id}`);
    } catch {
      const accounts = await this.getAccounts();
      return accounts.find((a) => a.id === id);
    }
  },

  async createAccount(data: Omit<Account, 'id' | 'updatedAt'>): Promise<Account> {
    try {
      const created = await apiRequest<Account>('/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return created;
    } catch (e) {
      console.warn('Backend error on createAccount, saving locally:', e);
      const accounts = await this.getAccounts();
      const newAccount: Account = {
        ...data,
        id: `acc_${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      saveStorage(STORAGE_KEYS.ACCOUNTS, [newAccount, ...accounts]);
      return newAccount;
    }
  },

  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    try {
      return await apiRequest<Account>(`/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const accounts = await this.getAccounts();
      const index = accounts.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Account not found');
      const updated = { ...accounts[index], ...data, updatedAt: new Date().toISOString() };
      accounts[index] = updated;
      saveStorage(STORAGE_KEYS.ACCOUNTS, accounts);
      return updated;
    }
  },

  async deleteAccount(id: string): Promise<void> {
    try {
      await apiRequest<void>(`/accounts/${id}`, { method: 'DELETE' });
    } catch (e) {
      const accounts = await this.getAccounts();
      saveStorage(STORAGE_KEYS.ACCOUNTS, accounts.filter((a) => a.id !== id));
    }
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await apiRequest<Transaction[]>('/transactions');
      saveStorage(STORAGE_KEYS.TRANSACTIONS, data);
      return data;
    } catch (e) {
      console.warn('Backend unavailable, using cached transactions:', e);
      return loadStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    }
  },

  async createTransaction(data: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> {
    try {
      const created = await apiRequest<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return created;
    } catch (e) {
      console.warn('Backend error on createTransaction, using local fallback:', e);
      const transactions = await this.getTransactions();
      const user = await this.getUserProfile();
      const newTx: Transaction = {
        ...data,
        id: `tx_${Date.now()}`,
        userId: user.id,
      };
      saveStorage(STORAGE_KEYS.TRANSACTIONS, [newTx, ...transactions]);
      return newTx;
    }
  },

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    try {
      return await apiRequest<Transaction>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('Transaction not found');
      const updated = { ...transactions[index], ...data };
      transactions[index] = updated;
      saveStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
      return updated;
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    try {
      await apiRequest<void>(`/transactions/${id}`, { method: 'DELETE' });
    } catch (e) {
      const transactions = await this.getTransactions();
      saveStorage(STORAGE_KEYS.TRANSACTIONS, transactions.filter((t) => t.id !== id));
    }
  },

  async deleteTransactionsBatch(ids: string[]): Promise<void> {
    try {
      await apiRequest<void>('/transactions/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
    } catch (e) {
      const transactions = await this.getTransactions();
      saveStorage(STORAGE_KEYS.TRANSACTIONS, transactions.filter((t) => !ids.includes(t.id)));
    }
  },

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    try {
      const data = await apiRequest<Budget[]>('/budgets');
      saveStorage(STORAGE_KEYS.BUDGETS, data);
      return data;
    } catch (e) {
      return loadStorage(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
    }
  },

  async updateBudget(id: string, limit: number): Promise<Budget> {
    try {
      return await apiRequest<Budget>(`/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ limit }),
      });
    } catch (e) {
      const budgets = await this.getBudgets();
      const index = budgets.findIndex((b) => b.id === id);
      if (index === -1) throw new Error('Budget not found');
      budgets[index].limit = limit;
      saveStorage(STORAGE_KEYS.BUDGETS, budgets);
      return budgets[index];
    }
  },

  async createBudget(categoryId: string, categoryName: string, limit: number, month: number = 10, year: number = 2026): Promise<Budget> {
    try {
      return await apiRequest<Budget>('/budgets', {
        method: 'POST',
        body: JSON.stringify({ categoryId, categoryName, limit, month, year }),
      });
    } catch (e) {
      const budgets = await this.getBudgets();
      const newBudget: Budget = {
        id: `b_${categoryId}_${Date.now()}`,
        categoryId: categoryId as any,
        categoryName,
        month,
        year,
        limit,
        spent: 0,
      };
      saveStorage(STORAGE_KEYS.BUDGETS, [...budgets, newBudget]);
      return newBudget;
    }
  },

  // Goals
  async getGoals(): Promise<Goal[]> {
    try {
      const data = await apiRequest<Goal[]>('/goals');
      saveStorage(STORAGE_KEYS.GOALS, data);
      return data;
    } catch (e) {
      return loadStorage(STORAGE_KEYS.GOALS, INITIAL_GOALS);
    }
  },

  async createGoal(data: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    try {
      return await apiRequest<Goal>('/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const goals = await this.getGoals();
      const newGoal: Goal = {
        ...data,
        id: `g_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      saveStorage(STORAGE_KEYS.GOALS, [...goals, newGoal]);
      return newGoal;
    }
  },

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    try {
      return await apiRequest<Goal>(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const goals = await this.getGoals();
      const index = goals.findIndex((g) => g.id === id);
      if (index === -1) throw new Error('Goal not found');
      const updated = { ...goals[index], ...data };
      goals[index] = updated;
      saveStorage(STORAGE_KEYS.GOALS, goals);
      return updated;
    }
  },

  async deleteGoal(id: string): Promise<void> {
    try {
      await apiRequest<void>(`/goals/${id}`, { method: 'DELETE' });
    } catch (e) {
      const goals = await this.getGoals();
      saveStorage(STORAGE_KEYS.GOALS, goals.filter((g) => g.id !== id));
    }
  },

  async contributeToGoal(id: string, amount: number): Promise<Goal> {
    try {
      return await apiRequest<Goal>(`/goals/${id}/contribute`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    } catch (e) {
      const goals = await this.getGoals();
      const index = goals.findIndex((g) => g.id === id);
      if (index === -1) throw new Error('Goal not found');
      const updated = { ...goals[index], currentAmount: goals[index].currentAmount + amount };
      goals[index] = updated;
      saveStorage(STORAGE_KEYS.GOALS, goals);
      return updated;
    }
  },

  // Subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      const data = await apiRequest<Subscription[]>('/subscriptions');
      saveStorage(STORAGE_KEYS.SUBSCRIPTIONS, data);
      return data;
    } catch (e) {
      return loadStorage(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    }
  },

  async createSubscription(data: Omit<Subscription, 'id'>): Promise<Subscription> {
    try {
      return await apiRequest<Subscription>('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const subs = await this.getSubscriptions();
      const newSub: Subscription = {
        ...data,
        id: `sub_${Date.now()}`,
      };
      saveStorage(STORAGE_KEYS.SUBSCRIPTIONS, [...subs, newSub]);
      return newSub;
    }
  },

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription> {
    try {
      return await apiRequest<Subscription>(`/subscriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const subs = await this.getSubscriptions();
      const index = subs.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Subscription not found');
      subs[index] = { ...subs[index], ...data };
      saveStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);
      return subs[index];
    }
  },

  async deleteSubscription(id: string): Promise<void> {
    try {
      await apiRequest<void>(`/subscriptions/${id}`, { method: 'DELETE' });
    } catch (e) {
      const subs = await this.getSubscriptions();
      saveStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs.filter((s) => s.id !== id));
    }
  },

  async toggleSubscriptionStatus(id: string): Promise<Subscription> {
    try {
      return await apiRequest<Subscription>(`/subscriptions/${id}/toggle`, { method: 'PATCH' });
    } catch (e) {
      const subs = await this.getSubscriptions();
      const index = subs.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Subscription not found');
      const updated = { ...subs[index], status: (subs[index].status === 'active' ? 'paused' : 'active') as any };
      subs[index] = updated;
      saveStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);
      return updated;
    }
  },

  // Recurring
  async getRecurring(): Promise<RecurringTransaction[]> {
    try {
      const data = await apiRequest<RecurringTransaction[]>('/recurring');
      saveStorage(STORAGE_KEYS.RECURRING, data);
      return data;
    } catch (e) {
      return loadStorage(STORAGE_KEYS.RECURRING, INITIAL_RECURRING);
    }
  },

  async createRecurring(data: Omit<RecurringTransaction, 'id'>): Promise<RecurringTransaction> {
    try {
      return await apiRequest<RecurringTransaction>('/recurring', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const items = await this.getRecurring();
      const newItem: RecurringTransaction = {
        ...data,
        id: `rec_${Date.now()}`,
      };
      saveStorage(STORAGE_KEYS.RECURRING, [...items, newItem]);
      return newItem;
    }
  },

  async updateRecurring(id: string, data: Partial<RecurringTransaction>): Promise<RecurringTransaction> {
    try {
      return await apiRequest<RecurringTransaction>(`/recurring/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const items = await this.getRecurring();
      const index = items.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Recurring not found');
      items[index] = { ...items[index], ...data };
      saveStorage(STORAGE_KEYS.RECURRING, items);
      return items[index];
    }
  },

  async deleteRecurring(id: string): Promise<void> {
    try {
      await apiRequest<void>(`/recurring/${id}`, { method: 'DELETE' });
    } catch (e) {
      const items = await this.getRecurring();
      saveStorage(STORAGE_KEYS.RECURRING, items.filter((r) => r.id !== id));
    }
  },

  async toggleRecurringStatus(id: string): Promise<RecurringTransaction> {
    try {
      return await apiRequest<RecurringTransaction>(`/recurring/${id}/toggle`, { method: 'PATCH' });
    } catch (e) {
      const items = await this.getRecurring();
      const index = items.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Recurring not found');
      const updated = { ...items[index], status: (items[index].status === 'active' ? 'paused' : 'active') as any };
      items[index] = updated;
      saveStorage(STORAGE_KEYS.RECURRING, items);
      return updated;
    }
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const data = await apiRequest<NotificationItem[]>('/notifications');
      saveStorage(STORAGE_KEYS.NOTIFICATIONS, data);
      return data;
    } catch (e) {
      return loadStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await apiRequest<void>(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {
      const notifs = await this.getNotifications();
      saveStorage(STORAGE_KEYS.NOTIFICATIONS, notifs.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  },

  async clearAllNotifications(): Promise<void> {
    try {
      await apiRequest<void>('/notifications/clear', { method: 'DELETE' });
      saveStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    } catch (e) {
      saveStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    }
  },

  // Financial Health Calculation
  async getFinancialHealth(): Promise<FinancialHealthScore> {
    try {
      return await apiRequest<FinancialHealthScore>('/financial-health');
    } catch (e) {
      return {
        overall: 50,
        savingsRateScore: 50,
        budgetDisciplineScore: 80,
        expenseControlScore: 80,
        emergencyFundScore: 0,
        debtManagementScore: 100,
        changePoints: 0,
        positiveInsights: [
          'Zero debt liabilities detected on your account.',
          'All monthly category budgets are currently within limits.',
        ],
        warningInsights: [
          'Add your first income and expense transactions to calculate your live financial health score.',
        ],
      };
    }
  },

  // Reset & Backup
  async resetAllData(): Promise<void> {
    try {
      await apiRequest<void>('/backup/reset', { method: 'POST' });
    } catch {}
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  },

  async exportBackup(): Promise<any> {
    return await apiRequest<any>('/backup/export');
  },

  async importBackup(data: any): Promise<void> {
    await apiRequest<void>('/backup/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
