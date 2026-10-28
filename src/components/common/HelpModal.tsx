import { HelpCircle, Keyboard, Sparkles, X } from 'lucide-react';
import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      style={{
        paddingTop: 'max(calc(1rem + env(safe-area-inset-top, 0px)), 1.25rem)',
        paddingBottom: 'max(calc(1rem + env(safe-area-inset-bottom, 0px)), 1.25rem)',
      }}
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 z-10 text-xs space-y-4 my-auto overflow-y-auto"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2.5rem)',
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-slate-600 dark:text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              money vedass Help &amp; Shortcuts
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Keyboard size={14} />
            <span>Keyboard Shortcuts</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-600 dark:text-slate-300">Open Command Palette / Search</span>
              <div className="flex gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                  ⌘K
                </kbd>
                <span className="text-slate-400">or</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                  /
                </kbd>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-600 dark:text-slate-300">Close active modal or drawer</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ESC
              </kbd>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-500" />
            <span>money vedass Core Financial Pillars</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
            money vedass is built around 10 golden personal finance questions: Total balance, monthly earnings, spending categories, budget variances, recurring subscriptions, and capital runway.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
