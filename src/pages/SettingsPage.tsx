import {
  Bell,
  Check,
  CreditCard,
  Database,
  Globe,
  Key,
  Moon,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { financeService } from '../services/financeService';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { resetDemoData, showToast } = useFinance();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [subscriptionReminders, setSubscriptionReminders] = useState(true);
  const [aiGroundedOnly, setAiGroundedOnly] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser({ name, email, phone, currency, dateFormat });
    setIsSaved(true);
    showToast('Preferences updated successfully', 'success');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings &amp; Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure profile identity, mobile SMS OTP recovery, localization, and security parameters.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User size={18} className="text-slate-600 dark:text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">User Profile</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Mobile Number (SMS OTP)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                {isSaved ? <Check size={14} /> : null}
                <span>{isSaved ? 'Saved' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Appearance & Localization */}
        <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Globe size={18} className="text-slate-600 dark:text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Appearance &amp; Localization
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Theme mode */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
                Interface Theme
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  aria-pressed={theme === 'light'}
                  className={`py-1.5 font-medium rounded-md text-center ${
                    theme === 'light'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  aria-pressed={theme === 'dark'}
                  className={`py-1.5 font-medium rounded-md text-center ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  aria-pressed={theme === 'system'}
                  className={`py-1.5 font-medium rounded-md text-center ${
                    theme === 'system'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  System
                </button>
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
              >
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>

            {/* Date format */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
                Date Notation
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (08/10/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (10/08/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-08)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications & AI Preferences */}
        <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Bell size={18} className="text-slate-600 dark:text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Alerts &amp; Intelligence Controls
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Budget Threshold Alerts
                </span>
                <span className="text-slate-400">
                  Notify when category envelope exceeds 80% usage
                </span>
              </div>
              <input
                type="checkbox"
                checked={budgetAlerts}
                onChange={(e) => setBudgetAlerts(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Subscription Renewals
                </span>
                <span className="text-slate-400">
                  Alert 24 hours prior to recurring subscription debits
                </span>
              </div>
              <input
                type="checkbox"
                checked={subscriptionReminders}
                onChange={(e) => setSubscriptionReminders(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Grounded AI Intelligence Strict Mode
                </span>
                <span className="text-slate-400">
                  Require calculated mathematical proof for all assistant answers
                </span>
              </div>
              <input
                type="checkbox"
                checked={aiGroundedOnly}
                onChange={(e) => setAiGroundedOnly(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Free Service Plan Details */}
        <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-900/50">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Active Service Plan — 100% Free Forever Edition
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              ₹0 / Forever · All Features Unlocked
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Your registered account (<strong>{user?.email}</strong>) has unrestricted, permanent access to the full Money Vedass personal finance suite with zero paid upgrades or subscription fees:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>Unlimited Bank, Cash, Card &amp; Investment Accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>Unlimited Income, Expense &amp; Transfer Ledger</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>Monthly Category Budgets &amp; Overflow Guards</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>Savings Goals &amp; Target Runway Projections</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>Subscription &amp; Recurring Bill Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>Financial Health Score &amp; Printable Audit Reports</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>Private Email-Isolated SQLite Database</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>Multi-Currency Transaction Support (INR, USD, EUR, GBP &amp; more)</span>
            </div>
          </div>
        </div>

        {/* Data Management & Ledger Reset */}
        <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Database size={18} className="text-slate-600 dark:text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Data Management &amp; Ledger Reset
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-rose-600 dark:text-rose-400 block">
                Clear Personal Ledger to Zero
              </span>
              <span className="text-slate-400">
                Permanently clear your transactions, budgets, goals, and reset your account balances to ₹0
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all your transactions, budgets, and goals back to zero?')) {
                  resetDemoData();
                }
              }}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg font-medium hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Ledger to Zero</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
