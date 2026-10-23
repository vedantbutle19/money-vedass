import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Globe,
  HeartPulse,
  Lock,
  Moon,
  PieChart,
  PiggyBank,
  Receipt,
  Repeat,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import React from 'react';
import { Logo } from '../components/common/Logo';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  isAuthenticated?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenLogin,
  onOpenSignup,
  isAuthenticated = false,
}) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Logo size="md" />

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <a href="#dashboard-preview" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Dashboard Visuals
          </a>
          <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Capabilities
          </a>
          <a href="#free-service" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            100% Free Service
          </a>
          <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Privacy &amp; Isolation
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={onEnterApp}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={onOpenSignup}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
              >
                Register Free Account
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Sparkles size={13} className="text-emerald-500" />
          <span>100% Free Personal Finance Suite · Private Multi-User Records</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance leading-tight max-w-3xl mx-auto">
          Take complete control of your personal finances.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Register your email to unlock your private financial ledger. Track every transaction across multi-currency accounts, budgets, goals, and subscriptions—completely free forever with zero paid tiers.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Your Dashboard</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button
                onClick={onOpenSignup}
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Register Your Free Account</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer"
              >
                Sign in to Existing Account
              </button>
            </>
          )}
        </div>
      </section>

      {/* Visual Dashboard Guide & Architecture Preview for User Understanding */}
      <section id="dashboard-preview" className="py-10 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
            <BarChart3 size={13} />
            <span>Interactive Visual Overview · Understand Your Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            How Your Personal Finance Dashboard Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            When you register, your account starts clean at zero. As you log transactions, your private dashboard automatically computes real-time visual analytics:
          </p>
        </div>

        {/* Annotated Browser Frame Dashboard Visual */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shadow-2xl overflow-hidden">
          {/* Mock Window Top Bar */}
          <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                money vedass — Private User Dashboard Visual
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 font-medium">
                <Sun size={12} className="text-amber-500" /> / <Moon size={12} className="text-indigo-400" /> Day &amp; Night Mode
              </span>
              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium items-center gap-1">
                <Globe size={12} /> Multi-Currency (INR, USD, EUR, GBP)
              </span>
            </div>
          </div>

          {/* Dashboard Visual Body */}
          <div className="p-5 sm:p-7 space-y-6">
            {/* Step 1: 4 Real-Time KPI Summary Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  1. Real-Time Summary KPI Cards
                </span>
                <span className="text-slate-400">Auto-updates on every transaction</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Net Balance</span>
                    <Wallet size={15} className="text-slate-700 dark:text-slate-300" />
                  </div>
                  <div className="text-xl font-bold font-tabular text-slate-900 dark:text-white mt-1.5">
                    ₹1,42,500
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight size={12} /> Across Bank, Cash &amp; Investments
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Monthly Income</span>
                    <ArrowUpRight size={15} className="text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold font-tabular text-emerald-600 dark:text-emerald-400 mt-1.5">
                    +₹85,000
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Salary, Freelance &amp; Dividends
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Monthly Expenses</span>
                    <ArrowDownRight size={15} className="text-rose-500" />
                  </div>
                  <div className="text-xl font-bold font-tabular text-rose-600 dark:text-rose-400 mt-1.5">
                    -₹31,200
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Tracked across 10+ categories
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Monthly Savings</span>
                    <TrendingUp size={15} className="text-indigo-500" />
                  </div>
                  <div className="text-xl font-bold font-tabular text-indigo-600 dark:text-indigo-400 mt-1.5">
                    ₹53,800
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    63.2% Savings Rate
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Visual Charts & Category Budget Bars */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Cash Flow Visual Bar Chart */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      2. Cash Flow Trend Visual
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      Income vs Expenses Comparison
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Income
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Expense
                    </span>
                  </div>
                </div>

                {/* Visual CSS Bar Chart */}
                <div className="grid grid-cols-6 gap-3 pt-4 pb-1 items-end h-40 border-b border-slate-100 dark:border-slate-800">
                  {[
                    { m: 'May', inc: 75, exp: 42 },
                    { m: 'Jun', inc: 80, exp: 38 },
                    { m: 'Jul', inc: 78, exp: 48 },
                    { m: 'Aug', inc: 85, exp: 35 },
                    { m: 'Sep', inc: 82, exp: 40 },
                    { m: 'Oct', inc: 92, exp: 34 },
                  ].map((bar) => (
                    <div key={bar.m} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1.5 h-28">
                        <div
                          style={{ height: `${bar.inc}%` }}
                          className="w-3 sm:w-4 bg-emerald-500/90 rounded-t-md transition-all"
                          title={`Income: ${bar.inc}%`}
                        />
                        <div
                          style={{ height: `${bar.exp}%` }}
                          className="w-3 sm:w-4 bg-rose-500/90 rounded-t-md transition-all"
                          title={`Expense: ${bar.exp}%`}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">{bar.m}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Visualizes 6-month inflow vs outflow trajectories and daily spending velocity automatically.
                </p>
              </div>

              {/* Category Budget & Allocation Visual */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      3. Budget &amp; Category Visuals
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      Monthly Spend Limits &amp; Alerts
                    </h3>
                  </div>
                  <PieChart size={16} className="text-slate-400" />
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Housing &amp; Rent</span>
                      <span className="font-tabular text-slate-500">₹15,000 / ₹20,000 (75%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Food &amp; Dining</span>
                      <span className="font-tabular text-amber-600 dark:text-amber-400">₹8,400 / ₹10,000 (84% Alert)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '84%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Groceries &amp; Daily</span>
                      <span className="font-tabular text-emerald-600 dark:text-emerald-400">₹4,200 / ₹8,000 (52%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '52%' }} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Multi-Currency Ledger Support:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹ INR · $ USD · € EUR · £ GBP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-100 dark:border-slate-900 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Everything you need to master your money.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Engineered for precision, strict privacy, and long-term expense tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Receipt,
              title: 'Multi-Account Transaction Ledger',
              desc: 'Record income, expenses, and internal transfers across UPI, bank accounts, cards, and cash wallets with instant balance updates.',
            },
            {
              icon: BarChart3,
              title: 'Live Cash Flow & Analytics',
              desc: 'Interactive cash flow trends, category spending breakdowns, merchant concentration tracking, and month-over-month comparisons.',
            },
            {
              icon: PiggyBank,
              title: 'Monthly Category Budgets',
              desc: 'Set custom spending limits per category with real-time utilization bars, 80% caution alerts, and overflow warnings.',
            },
            {
              icon: Target,
              title: 'Financial Goals & Milestones',
              desc: 'Create dedicated savings targets for emergency funds, purchases, or investments with instant contribution tracking.',
            },
            {
              icon: Repeat,
              title: 'Subscriptions & Recurring Bills',
              desc: 'Monitor all monthly and yearly subscriptions, SIPs, EMIs, and utility bills with annualized outflow calculations.',
            },
            {
              icon: HeartPulse,
              title: 'Financial Health & Audit Reports',
              desc: 'Automated health scoring across savings rate, emergency runway, debt ratio, and budget adherence with printable monthly reports.',
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Free Forever Service Section (No Paid Tiers) */}
      <section id="free-service" className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-100 dark:border-slate-900 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
            <CheckCircle2 size={13} />
            <span>Zero Subscriptions · No Paid Upgrades · No Feature Locks</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            100% Free Forever — Complete Feature Specification
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Every registered user receives full, unrestricted access to the entire Money Vedass financial operating system at ₹0 forever.
          </p>
        </div>

        <div className="p-8 rounded-3xl border-2 border-slate-900 dark:border-white bg-slate-50/60 dark:bg-slate-900 shadow-lg space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Complete Personal Finance Edition
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                All Capabilities Included Free
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Isolated personal database ledger tied to your registered email address.
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-3xl font-extrabold font-tabular text-slate-900 dark:text-white">
                ₹0 <span className="text-xs font-normal text-slate-500">/ forever</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                No credit card required · Unlimited usage
              </div>
            </div>
          </div>

          {/* Detailed 3-Column Breakdown of Free Services */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <Wallet size={16} className="text-indigo-500" />
                <span>Accounts &amp; Ledger</span>
              </div>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Accounts:</strong> Track bank accounts, cash wallets, credit cards, and investments.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Transactions:</strong> Log income, expenses, and account-to-account transfers with ACID precision.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Rich Metadata:</strong> Attach merchants, payment methods (UPI, Card, NEFT, Cash), custom tags, and notes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Instant Global Search:</strong> Filter by month, year, category, account, or keyword (`⌘K` or `/`).</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <PiggyBank size={16} className="text-emerald-500" />
                <span>Budgets, Goals &amp; Bills</span>
              </div>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Smart Category Budgets:</strong> Automatic spend tracking against monthly limits with visual alerts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Savings Goals:</strong> Track progress toward emergency funds, travel, or major purchases with one-click top-ups.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Subscription Tracker:</strong> Manage active/paused recurring memberships and calculate annual drain.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Recurring Schedules:</strong> Track automated monthly salary credits, rent, EMIs, and SIP commitments.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <FileSpreadsheet size={16} className="text-amber-500" />
                <span>Analytics, Reports &amp; Data</span>
              </div>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Financial Health Score:</strong> Real-time grading of savings rate, emergency runway, and debt-to-asset ratio.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Monthly Audit Reports:</strong> Printable executive summaries with category breakdown and savings metrics.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>CSV &amp; JSON Portability:</strong> Export transactions to CSV/Excel or download full JSON database backups anytime.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Strict Email Isolation:</strong> Your data is stored privately under your registered account in SQLite WAL.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>Registration is mandatory to ensure every user has a private, isolated record.</span>
            </div>
            <button
              onClick={isAuthenticated ? onEnterApp : onOpenSignup}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isAuthenticated ? 'Enter Your Dashboard' : 'Create Your Free Account Now'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Security & Isolation Section */}
      <section id="security" className="py-12 px-6 max-w-5xl mx-auto border-t border-slate-100 dark:border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Lock size={16} className="text-indigo-500" />
              <span>Strict Per-User Data Isolation</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every user registers with their own email and password. Your accounts, transactions, budgets, and goals are strictly isolated to your user ID—no other user or unregistered visitor can view or modify your records.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Database size={16} className="text-emerald-500" />
              <span>Durable SQLite WAL Persistence</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All records are stored in a persistent local SQLite database with Write-Ahead Logging (WAL) and ACID transactions, ensuring your financial history remains intact for years to come.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-10 px-6 max-w-7xl mx-auto w-full text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-slate-400">· 100% Free Personal Finance Operating System</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-slate-900 dark:hover:text-white">Capabilities</a>
          <a href="#free-service" className="hover:text-slate-900 dark:hover:text-white">Free Service Details</a>
          <a href="#security" className="hover:text-slate-900 dark:hover:text-white">Privacy</a>
        </div>
      </footer>
    </div>
  );
};
