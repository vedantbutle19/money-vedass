import React from 'react';
import { X, Download, ExternalLink, Receipt as ReceiptIcon } from 'lucide-react';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl?: string;
  title?: string;
  amount?: number;
  date?: string;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  receiptUrl,
  title = 'Receipt / Bill View',
  amount,
  date,
}) => {
  if (!isOpen || !receiptUrl) return null;

  const isPdf = receiptUrl.endsWith('.pdf') || receiptUrl.startsWith('data:application/pdf');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ReceiptIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              {(amount !== undefined || date) && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {amount !== undefined ? `₹${amount.toLocaleString('en-IN')}` : ''}
                  {amount !== undefined && date ? ' • ' : ''}
                  {date || ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={receiptUrl}
              download="receipt_document"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Open or Download"
            >
              <Download size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/60 dark:bg-slate-950/60 min-h-[300px]">
          {isPdf ? (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-center p-6">
              <ReceiptIcon size={48} className="text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  PDF Document Attached
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Click below to view or download the attached PDF receipt
                </p>
              </div>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-xs transition-colors"
              >
                <ExternalLink size={14} /> Open PDF in New Tab
              </a>
            </div>
          ) : (
            <img
              src={receiptUrl}
              alt="Receipt Attachment"
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-slate-200 dark:border-slate-800"
            />
          )}
        </div>
      </div>
    </div>
  );
};
