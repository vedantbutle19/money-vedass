import { Account, Budget, Category, Goal, NotificationItem, RecurringTransaction, Subscription, Transaction, UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'usr_default',
  name: 'My Account',
  email: 'user@finora.io',
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',
  monthlyIncomeBaseline: 0,
  joinedDate: new Date().toISOString().split('T')[0],
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'housing', name: 'Housing & Rent', iconName: 'Home', color: '#6366F1', type: 'expense' },
  { id: 'food', name: 'Food & Dining', iconName: 'UtensilsCrossed', color: '#F97316', type: 'expense' },
  { id: 'transport', name: 'Transportation', iconName: 'Car', color: '#0EA5E9', type: 'expense' },
  { id: 'shopping', name: 'Shopping & Retail', iconName: 'ShoppingBag', color: '#EC4899', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', iconName: 'Tv', color: '#8B5CF6', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', iconName: 'Receipt', color: '#10B981', type: 'expense' },
  { id: 'health', name: 'Health & Wellness', iconName: 'HeartPulse', color: '#EF4444', type: 'expense' },
  { id: 'salary', name: 'Salary & Professional', iconName: 'Briefcase', color: '#059669', type: 'income' },
  { id: 'investment', name: 'Investments & Returns', iconName: 'TrendingUp', color: '#0284C7', type: 'income' },
  { id: 'transfer', name: 'Internal Transfer', iconName: 'ArrowRightLeft', color: '#64748B', type: 'both' },
  { id: 'other', name: 'Other Expenses', iconName: 'Layers', color: '#94A3B8', type: 'expense' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_primary',
    name: 'Primary Bank Account',
    type: 'Bank',
    balance: 0,
    currency: 'INR',
    accountNumberMasked: '••0000',
    institution: 'Bank',
    color: '#004c8f',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc_cash',
    name: 'Cash Wallet',
    type: 'Cash',
    balance: 0,
    currency: 'INR',
    accountNumberMasked: 'Cash',
    institution: 'Physical Cash',
    color: '#10B981',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_GOALS: Goal[] = [];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

export const INITIAL_RECURRING: RecurringTransaction[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
