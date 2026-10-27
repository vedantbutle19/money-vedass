export type TransactionType = 'income' | 'expense' | 'transfer';

export type PaymentMethod = 'UPI' | 'Debit Card' | 'Credit Card' | 'Cash' | 'Bank Transfer';

export type CategoryId =
  | 'housing'
  | 'rent'
  | 'house_loan'
  | 'emi'
  | 'water'
  | 'electricity'
  | 'broadband'
  | 'mobile_recharge'
  | 'gas_bill'
  | 'maintenance'
  | 'insurance'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'salary'
  | 'investment'
  | 'health'
  | 'education'
  | 'transfer'
  | 'other'
  | (string & {});

export interface Category {
  id: CategoryId;
  name: string;
  iconName: string;
  color: string;
  type: 'expense' | 'income' | 'both';
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId?: string; // For transfers
  categoryId: CategoryId;
  type: TransactionType;
  amount: number;
  currency?: string;
  date: string; // ISO format: YYYY-MM-DD
  merchant?: string;
  description: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  isRecurring?: boolean;
}

export type AccountType = 'Bank' | 'Cash' | 'Credit Card' | 'Wallet' | 'Investment' | 'Loan';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  accountNumberMasked?: string;
  institution?: string;
  color?: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: CategoryId;
  categoryName: string;
  month: number; // 1-12
  year: number;
  limit: number;
  spent: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  monthlyContribution: number;
  category?: string;
  color?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'quarterly';
  nextBillingDate: string;
  category: CategoryId;
  accountId: string;
  status: 'active' | 'paused';
  icon: string;
  autoDeduct?: boolean;
  lastPaidDate?: string;
  billType?: string;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  dayOfMonth: number;
  category: CategoryId;
  accountId: string;
  status: 'active' | 'paused';
  nextRunDate: string;
}

export interface FinancialHealthScore {
  overall: number; // 0-100
  savingsRateScore: number;
  budgetDisciplineScore: number;
  expenseControlScore: number;
  emergencyFundScore: number;
  debtManagementScore: number;
  changePoints: number;
  positiveInsights: string[];
  warningInsights: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'budget' | 'subscription' | 'goal' | 'report' | 'system';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  monthlyIncomeBaseline: number;
  joinedDate: string;
}
