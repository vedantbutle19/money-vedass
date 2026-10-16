import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import React from 'react';
import { AVAILABLE_MONTHS, useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { BudgetOverviewCard } from '../components/dashboard/BudgetOverviewCard';
import { CashFlowChart } from '../components/dashboard/CashFlowChart';
import { ExpenseDonutChart } from '../components/dashboard/ExpenseDonutChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { SummaryCards } from '../components/dashboard/SummaryCards';

interface DashboardPageProps {
  onNavigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const {
    selectedMonth,
    setSelectedMonth,
    openAddTxModal,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    transactions,
    goals,
    formatCurrency,
  } = useFinance();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome, {user?.name ? user.name.split(' ')[0] : 'there'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here's your private financial overview for {selectedMonth.label}.
          </p>
        </div>

        {/* Right side: Month selector & Add Transaction CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month selector */}
          <div className="relative">
            <select
              value={selectedMonth.month}
              onChange={(e) => {
                const found = AVAILABLE_MONTHS.find(
                  (m) => m.month === parseInt(e.target.value, 10)
                );
                if (found) setSelectedMonth(found);
              }}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer focus:outline-none"
            >
              {AVAILABLE_MONTHS.map((m) => (
                <option key={m.month} value={m.month}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
          </div>

          <button
            onClick={() => openAddTxModal('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Summary Cards */}
      <SummaryCards />

      {/* Dynamic Smart Insight Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-800/90 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 text-amber-300 shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold flex items-center gap-2">
              <span>money vedass Live Insight</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-normal">
                {savingsRate}% Savings Rate
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {transactions.length === 0
                ? 'Your private ledger is clean at zero. Record your first income or expense transaction to start tracking real-time cash flow.'
                : monthlySavings >= 0
                ? `You have saved ${formatCurrency(monthlySavings)} in ${selectedMonth.label} (${formatCurrency(monthlyIncome)} income vs ${formatCurrency(monthlyExpenses)} expenses).${goals.length > 0 ? ` Tracking ${goals.length} active financial goal(s).` : ''}`
                : `Your expenses exceed income by ${formatCurrency(Math.abs(monthlySavings))} in ${selectedMonth.label}. Review your category budgets to optimize spending.`}
            </p>
          </div>
        </div>
        <button
          onClick={() => (transactions.length === 0 ? openAddTxModal('income') : onNavigate('goals'))}
          className="self-start sm:self-auto px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{transactions.length === 0 ? 'Add First Record' : 'View Goals'}</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Large Cash Flow Card */}
      <CashFlowChart />

      {/* Expense Breakdown & Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ExpenseDonutChart />
        </div>
        <div className="lg:col-span-5">
          <BudgetOverviewCard onViewBudgets={() => onNavigate('budgets')} />
        </div>
      </div>

      {/* Recent Transactions Table */}
      <RecentTransactions onViewAll={() => onNavigate('transactions')} />
    </div>
  );
};
