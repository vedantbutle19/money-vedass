import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import React from 'react';
import { useFinance } from '../../context/FinanceContext';

export const ToastBanner: React.FC = () => {
  const { toast } = useFinance();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 text-xs font-medium animate-in slide-in-from-bottom-5 duration-200">
      {toast.type === 'success' ? (
        <CheckCircle size={16} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
      ) : toast.type === 'error' ? (
        <AlertCircle size={16} className="text-rose-400 dark:text-rose-600 shrink-0" />
      ) : (
        <Info size={16} className="text-blue-400 dark:text-blue-600 shrink-0" />
      )}
      <span>{toast.text}</span>
    </div>
  );
};
