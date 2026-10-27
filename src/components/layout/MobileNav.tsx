import {
  BarChart3,
  CalendarDays,
  CalendarClock,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Logo } from '../common/Logo';

interface MobileNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isOpenDrawer: boolean;
  onCloseDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentRoute,
  onNavigate,
  isOpenDrawer,
  onCloseDrawer,
}) => {
  const { openAddTxModal } = useFinance();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: ReceiptText },
    { id: 'add', label: 'Add', icon: Plus, isAction: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'more', label: 'More', icon: MoreHorizontal, isSheet: true },
  ];

  const drawerItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'accounts', label: 'Accounts & Cards', icon: Landmark },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'subscriptions', label: 'Bills & Subscriptions', icon: Repeat },
    { id: 'recurring', label: 'Recurring Schedules', icon: CalendarClock },
    { id: 'analytics', label: 'Financial Analytics', icon: BarChart3 },
    { id: 'health', label: 'Financial Health', icon: ShieldCheck },
    { id: 'reports', label: 'Monthly Reports', icon: ReceiptText },
    { id: 'settings', label: 'Preferences & Settings', icon: MoreHorizontal },
  ];

  return (
    <>
      {/* Bottom Sticky Tab Bar (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRoute === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={() => openAddTxModal('expense')}
                className="-mt-5 w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md active:scale-95 transition-transform"
                aria-label="Add Transaction"
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
            );
          }

          if (tab.isSheet) {
            return (
              <button
                key={tab.id}
                onClick={() => setShowMoreSheet(true)}
                className="flex flex-col items-center justify-center min-w-[56px] py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
                isActive
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Side Navigation Drawer (Triggered by TopBar burger) */}
      {(isOpenDrawer || showMoreSheet) && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => {
              onCloseDrawer();
              setShowMoreSheet(false);
            }}
          />

          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <Logo />
                <button
                  onClick={() => {
                    onCloseDrawer();
                    setShowMoreSheet(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                {drawerItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseDrawer();
                        setShowMoreSheet(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              Money Vedass · 2026
            </div>
          </div>
        </div>
      )}
    </>
  );
};
