import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import React from 'react';
import { useFinance } from '../../context/FinanceContext';

export const SummaryCards: React.FC = () => {
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    formatCurrency,
  } = useFinance();

  const cards = [
    {
      id: 'balance',
      label: 'Total Balance',
      amount: totalBalance,
      changeText: totalBalance === 0 ? 'Current balance' : 'Live balance',
      changeType: 'neutral' as const,
      icon: Wallet,
      sparkline: [0, 0, 0, 0, totalBalance],
      accentColor: 'slate',
    },
    {
      id: 'income',
      label: 'Monthly Income',
      amount: monthlyIncome,
      changeText: monthlyIncome === 0 ? 'No income logged' : 'Recorded income',
      changeType: monthlyIncome > 0 ? ('positive' as const) : ('neutral' as const),
      icon: ArrowUpRight,
      sparkline: [0, 0, 0, 0, monthlyIncome],
      accentColor: 'emerald',
    },
    {
      id: 'expenses',
      label: 'Monthly Expenses',
      amount: monthlyExpenses,
      changeText: monthlyExpenses === 0 ? 'No expenses logged' : 'Total spent',
      changeType: 'neutral' as const,
      icon: ArrowDownRight,
      sparkline: [0, 0, 0, 0, monthlyExpenses],
      accentColor: 'rose',
    },
    {
      id: 'savings',
      label: 'Net Savings',
      amount: monthlySavings,
      changeText: monthlySavings === 0 ? 'Income minus expense' : monthlySavings > 0 ? 'Capital preserved' : 'Deficit',
      changeType: monthlySavings >= 0 ? ('positive' as const) : ('negative' as const),
      icon: PiggyBank,
      sparkline: [0, 0, 0, 0, Math.max(0, monthlySavings)],
      accentColor: 'indigo',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const minVal = Math.min(...card.sparkline);
        const maxVal = Math.max(...card.sparkline);
        const range = maxVal - minVal || 1;

        // Generate SVG points for mini sparkline
        const points = card.sparkline
          .map((val, idx) => {
            const x = (idx / (card.sparkline.length - 1)) * 64;
            const y = 20 - ((val - minVal) / range) * 16;
            return `${x},${y}`;
          })
          .join(' ');

        return (
          <div
            key={card.id}
            className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Icon size={15} />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-bold font-tabular tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(card.amount)}
              </div>

              {/* Mini Sparkline */}
              <div className="w-16 h-5 opacity-70 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 64 24" className="w-full h-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke={
                      card.id === 'expenses'
                        ? '#ef4444'
                        : card.id === 'income'
                        ? '#10b981'
                        : card.id === 'savings'
                        ? '#6366f1'
                        : '#0ea5e9'
                    }
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>
            </div>

            {/* Comparison line */}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${
                  card.id === 'expenses'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {card.id === 'expenses' ? (
                  <TrendingDown size={13} />
                ) : (
                  <TrendingUp size={13} />
                )}
                <span>{card.changeText}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
