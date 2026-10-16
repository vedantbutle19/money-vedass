import {
  BarChart3,
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Repeat,
  Settings,
  ShieldCheck,
  Target,
} from 'lucide-react';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenHelp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onOpenHelp,
}) => {
  const { user } = useAuth();

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    badge?: string;
  }

  const primaryNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'accounts', label: 'Accounts', icon: Landmark },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'recurring', label: 'Recurring', icon: CalendarClock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'health', label: 'Financial Health', icon: ShieldCheck },
  ];

  const utilityNavItems: NavItem[] = [
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-200 ease-in-out flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
        collapsed ? 'w-18' : 'w-64'
      } hidden md:flex`}
    >
      {/* Brand & Collapse Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800/80">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-left focus:outline-none rounded-lg p-1 hover:opacity-90"
          title="money vedass Dashboard"
        >
          <Logo collapsed={collapsed} />
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Primary Sections */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Management
            </div>
          )}
          <nav className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 ${
                      isActive
                        ? 'text-white dark:text-slate-900'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        isActive
                          ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Utilities */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Utilities
            </div>
          )}
          <nav className="space-y-1">
            {utilityNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Area: Help & Profile */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          onClick={onOpenHelp}
          title={collapsed ? 'Help & Keyboard Shortcuts' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <HelpCircle size={16} className="shrink-0" />
          {!collapsed && <span>Help & Shortcuts</span>}
        </button>

        {/* User Card */}
        <div
          onClick={() => onNavigate('settings')}
          role="button"
          tabIndex={0}
          title={collapsed ? user?.name : undefined}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
            {user?.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
              : 'MV'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.name || 'My Account'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {user?.email || 'user@finora.io'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
