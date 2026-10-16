import { AlertCircle, Calendar, CheckCheck, FileText, Target, Trash2, X } from 'lucide-react';
import React from 'react';
import { useFinance } from '../../context/FinanceContext';

interface NotificationDropdownProps {
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
  onNavigate,
}) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useFinance();

  const getIcon = (type: string) => {
    switch (type) {
      case 'budget':
        return <AlertCircle size={15} className="text-amber-500" />;
      case 'subscription':
        return <Calendar size={15} className="text-indigo-500" />;
      case 'goal':
        return <Target size={15} className="text-emerald-500" />;
      case 'report':
        return <FileText size={15} className="text-blue-500" />;
      default:
        return <AlertCircle size={15} className="text-slate-400" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">Notifications</span>
          {notifications.some((n) => !n.read) && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              {notifications.filter((n) => !n.read).length} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              onClick={() => clearAllNotifications()}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
              title="Clear all"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <CheckCheck size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p>You are all caught up</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markNotificationRead(n.id);
                if (n.actionUrl) {
                  const route = n.actionUrl.replace('/', '');
                  onNavigate(route);
                }
              }}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                n.read
                  ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  : 'bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="mt-0.5 shrink-0 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
              </div>
              {!n.read && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
