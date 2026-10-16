import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Info,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';

export const FinancialHealthPage: React.FC = () => {
  const {
    accounts,
    transactions,
    budgets,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    formatCurrency,
  } = useFinance();

  const healthData = useMemo(() => {
    const hasActivity = transactions.length > 0;

    // Debt calculation
    const debtBalance = accounts
      .filter((a) => a.balance < 0)
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const liquidAssets = accounts
      .filter((a) => a.balance > 0)
      .reduce((sum, a) => sum + a.balance, 0);

    const creditUtilizationPct =
      liquidAssets > 0 ? Math.min(100, (debtBalance / liquidAssets) * 100) : debtBalance > 0 ? 100 : 0;

    // Runway calculation
    const runwayMonths =
      monthlyExpenses > 0
        ? Number((liquidAssets / monthlyExpenses).toFixed(1))
        : liquidAssets > 0
        ? 6
        : 0;

    // Scores (0-100)
    const savingsScore = hasActivity ? Math.min(100, Math.max(0, Math.round((savingsRate / 40) * 100))) : 100;
    
    let budgetScore = 100;
    if (budgets.length > 0) {
      const overBudgets = budgets.filter((b) => b.spent > b.limit).length;
      budgetScore = Math.max(20, 100 - overBudgets * 20);
    }

    const expenseControlScore =
      monthlyIncome > 0
        ? Math.min(100, Math.max(20, Math.round(100 - (monthlyExpenses / monthlyIncome) * 50)))
        : 100;

    const emergencyScore = Math.min(100, Math.max(0, Math.round((liquidAssets / 200000) * 100)));
    const debtScore = Math.max(0, Math.round(100 - creditUtilizationPct));

    const overall = hasActivity
      ? Math.round(
          savingsScore * 0.3 +
            budgetScore * 0.2 +
            expenseControlScore * 0.2 +
            emergencyScore * 0.15 +
            debtScore * 0.15
        )
      : totalBalance > 0
      ? 95
      : 100;

    const positiveInsights: string[] = [];
    const warningInsights: string[] = [];

    if (!hasActivity) {
      positiveInsights.push('Account freshly initialized with clean balance ledger and zero debt obligations.');
      positiveInsights.push('You are starting with a clean slate ready for disciplined tracking.');
      warningInsights.push('Record your first transaction to begin tracking live cash flow and savings velocity.');
      warningInsights.push('Set monthly category budget ceilings in the Budgets tab to monitor expense discipline.');
    } else {
      if (savingsRate >= 20) {
        positiveInsights.push(`Healthy net savings rate of ${savingsRate.toFixed(1)}% achieved this month.`);
      }
      if (debtBalance === 0) {
        positiveInsights.push('Zero revolving credit card debt detected. Pristine debt-free liability status.');
      }
      if (liquidAssets > 50000) {
        positiveInsights.push(`Liquid cash buffer of ${formatCurrency(liquidAssets)} available.`);
      }

      if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) {
        warningInsights.push('Monthly outflow exceeds logged income. Audit discretionary purchases.');
      }
      if (emergencyScore < 50) {
        warningInsights.push(`Emergency fund is funded at ${emergencyScore}%. Target 6 months of expenses.`);
      }
      if (positiveInsights.length === 0) {
        positiveInsights.push('Track all transactions continuously to gain visibility into your spending trends.');
      }
      if (warningInsights.length === 0) {
        warningInsights.push('Maintain consistent expense logging to preserve healthy financial habits.');
      }
    }

    return {
      overall,
      changePoints: hasActivity ? 3 : 0,
      runwayMonths,
      creditUtilizationPct: Number(creditUtilizationPct.toFixed(1)),
      categories: [
        {
          name: 'Savings Rate',
          score: savingsScore,
          description: hasActivity
            ? `${savingsRate.toFixed(1)}% of monthly net income preserved`
            : 'Clean baseline with 0 debt deductions',
          benchmark: 'Target: >30%',
        },
        {
          name: 'Budget Discipline',
          score: budgetScore,
          description:
            budgets.length > 0
              ? `${budgets.filter((b) => b.spent <= b.limit).length} of ${budgets.length} envelopes on track`
              : 'No budget overruns recorded',
          benchmark: 'Target: <80% usage',
        },
        {
          name: 'Expense Control',
          score: expenseControlScore,
          description:
            monthlyIncome > 0
              ? `Expenses represent ${((monthlyExpenses / monthlyIncome) * 100).toFixed(1)}% of income`
              : 'Zero fixed expense leakage',
          benchmark: 'Target: <60%',
        },
        {
          name: 'Emergency Fund',
          score: emergencyScore,
          description: `${formatCurrency(liquidAssets)} of ${formatCurrency(200000)} reserve goal`,
          benchmark: 'Target: 6 months runway',
        },
        {
          name: 'Debt Management',
          score: debtScore,
          description:
            debtBalance > 0
              ? `${formatCurrency(debtBalance)} credit exposure`
              : 'No revolving debt or liabilities',
          benchmark: 'Target: <15% utilization',
        },
      ],
      positiveInsights,
      warningInsights,
    };
  }, [accounts, transactions, budgets, totalBalance, monthlyIncome, monthlyExpenses, savingsRate, formatCurrency]);

  // SVG circular gauge math
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthData.overall / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Financial Health Audit
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Holistic diagnostic evaluating savings velocity, liquidity safety, and debt leverage.
        </p>
      </div>

      {/* Main Score Hero Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: Circular gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-900 dark:stroke-white transition-all duration-1000 ease-out"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Centered Score */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold font-tabular text-slate-900 dark:text-white tracking-tight">
                {healthData.overall}
              </span>
              <span className="text-xs text-slate-400 font-medium">out of 100</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={14} />
            <span>
              {transactions.length > 0
                ? `Calculated from ${transactions.length} recorded ledger events`
                : 'Clean Starting Baseline Score'}
            </span>
          </div>
        </div>

        {/* Right: Score explanation & tier */}
        <div className="md:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck size={14} />
            <span>{healthData.overall >= 80 ? 'Optimal Financial Standing' : 'Healthy Financial Standing'}</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {transactions.length > 0
              ? 'Real-time financial diagnostic computed from your records.'
              : 'Clean slate: You are starting with zero liabilities.'}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {transactions.length > 0
              ? `Your recorded net savings rate is ${savingsRate.toFixed(1)}%. Keep tracking all outflows and category budgets to preserve liquidity.`
              : 'As you log your daily income and expense transactions, your savings velocity, emergency runway, and budget discipline will be tracked in real-time here.'}
          </p>

          <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-[11px]">Runway Stability</span>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                {healthData.runwayMonths} Months Protected
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-[11px]">Credit Exposure</span>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {healthData.creditUtilizationPct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Component Categories Breakdown */}
      <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Score Decomposition by Domain
        </h3>

        <div className="space-y-4 pt-1">
          {healthData.categories.map((cat) => (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {cat.name}
                  </span>
                  <span className="text-slate-400 ml-2">· {cat.description}</span>
                </div>
                <div className="flex items-center gap-2 font-tabular">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {cat.score} / 100
                  </span>
                  <span className="text-[11px] text-slate-400">{cat.benchmark}</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    cat.score >= 80
                      ? 'bg-emerald-500'
                      : cat.score >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Insights */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={16} />
            <span>Positive Capital Drivers</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {healthData.positiveInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Warning Insights */}
        <div className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <AlertTriangle size={16} />
            <span>Risk Factors &amp; Opportunities</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {healthData.warningInsights.map((warning, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
