import React, { useState } from 'react';
import { AddTransactionModal } from './components/common/AddTransactionModal';
import { ExportModal } from './components/common/ExportModal';
import { HelpModal } from './components/common/HelpModal';
import { ToastBanner } from './components/common/ToastBanner';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { MobileNav } from './components/layout/MobileNav';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { ThemeProvider } from './context/ThemeContext';
import { AccountDetailPage } from './pages/AccountDetailPage';
import { AccountsPage } from './pages/AccountsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuthPage } from './pages/AuthPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { FinancialHealthPage } from './pages/FinancialHealthPage';
import { GoalsPage } from './pages/GoalsPage';
import { LandingPage } from './pages/LandingPage';
import { MonthlyReportPage } from './pages/MonthlyReportPage';
import { RecurringPage } from './pages/RecurringPage';
import { SettingsPage } from './pages/SettingsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { TransactionsPage } from './pages/TransactionsPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { isSearchModalOpen, closeSearchModal } = useFinance();

  // Primary top-level view state: 'landing' | 'auth' | 'app'
  const [viewMode, setViewMode] = useState<'app' | 'landing' | 'auth'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Internal app route
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // If user explicitly switched to landing or auth
  if (viewMode === 'landing') {
    return (
      <LandingPage
        onEnterApp={() => setViewMode('app')}
        onOpenLogin={() => {
          setAuthMode('login');
          setViewMode('auth');
        }}
        onOpenSignup={() => {
          setAuthMode('signup');
          setViewMode('auth');
        }}
      />
    );
  }

  if (viewMode === 'auth' || !isAuthenticated) {
    return (
      <AuthPage
        initialMode={authMode}
        onSuccess={() => setViewMode('app')}
        onBackToLanding={() => setViewMode('landing')}
      />
    );
  }

  // App routing
  const navigateTo = (route: string) => {
    setSelectedAccountId(null);
    setCurrentRoute(route);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageTitleAndBreadcrumbs = () => {
    if (selectedAccountId) {
      return {
        title: 'Account Detail',
        breadcrumbs: ['money vedass', 'Accounts', 'Detail'],
      };
    }

    switch (currentRoute) {
      case 'dashboard':
        return { title: 'Dashboard Overview', breadcrumbs: ['money vedass', 'Dashboard'] };
      case 'transactions':
        return { title: 'Transaction Ledger', breadcrumbs: ['money vedass', 'Transactions'] };
      case 'calendar':
        return { title: 'Transaction Calendar', breadcrumbs: ['money vedass', 'Calendar'] };
      case 'accounts':
        return { title: 'Accounts & Cards', breadcrumbs: ['money vedass', 'Accounts'] };
      case 'budgets':
        return { title: 'Monthly Budgets', breadcrumbs: ['money vedass', 'Budgets'] };
      case 'goals':
        return { title: 'Financial Goals', breadcrumbs: ['money vedass', 'Goals'] };
      case 'subscriptions':
        return { title: 'Subscriptions', breadcrumbs: ['money vedass', 'Subscriptions'] };
      case 'recurring':
        return { title: 'Recurring Schedules', breadcrumbs: ['money vedass', 'Recurring'] };
      case 'analytics':
        return { title: 'Financial Analytics', breadcrumbs: ['money vedass', 'Analytics'] };
      case 'reports':
        return { title: 'Monthly Reports', breadcrumbs: ['money vedass', 'Reports'] };
      case 'health':
        return { title: 'Financial Health Score', breadcrumbs: ['money vedass', 'Health'] };
      case 'settings':
        return { title: 'Settings & Profile', breadcrumbs: ['money vedass', 'Settings'] };
      default:
        return { title: 'money vedass', breadcrumbs: ['money vedass'] };
    }
  };

  const { title, breadcrumbs } = getPageTitleAndBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Collapsible Desktop Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'md:ml-18' : 'md:ml-64'
        } pb-20 md:pb-8`}
      >
        {/* Top Navigation */}
        <TopNavbar
          title={title}
          breadcrumbs={breadcrumbs}
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
          onNavigate={navigateTo}
          onViewLanding={() => setViewMode('landing')}
        />

        {/* Page Viewports */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {selectedAccountId ? (
            <AccountDetailPage
              accountId={selectedAccountId}
              onBack={() => setSelectedAccountId(null)}
            />
          ) : currentRoute === 'dashboard' ? (
            <DashboardPage onNavigate={navigateTo} />
          ) : currentRoute === 'transactions' ? (
            <TransactionsPage />
          ) : currentRoute === 'calendar' ? (
            <CalendarPage />
          ) : currentRoute === 'accounts' ? (
            <AccountsPage
              onSelectAccount={(accId) => setSelectedAccountId(accId)}
            />
          ) : currentRoute === 'budgets' ? (
            <BudgetsPage />
          ) : currentRoute === 'goals' ? (
            <GoalsPage />
          ) : currentRoute === 'subscriptions' ? (
            <SubscriptionsPage />
          ) : currentRoute === 'recurring' ? (
            <RecurringPage />
          ) : currentRoute === 'analytics' ? (
            <AnalyticsPage />
          ) : currentRoute === 'reports' ? (
            <MonthlyReportPage />
          ) : currentRoute === 'health' ? (
            <FinancialHealthPage />
          ) : currentRoute === 'settings' ? (
            <SettingsPage />
          ) : (
            <DashboardPage onNavigate={navigateTo} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation & Drawer */}
      <MobileNav
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        isOpenDrawer={mobileDrawerOpen}
        onCloseDrawer={() => setMobileDrawerOpen(false)}
      />

      {/* Modals & Command Palettes */}
      <AddTransactionModal />
      <ExportModal />
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={closeSearchModal}
        onNavigate={navigateTo}
      />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ToastBanner />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
