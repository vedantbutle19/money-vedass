import { Check, Download, FileSpreadsheet, FileText, Printer, X } from 'lucide-react';
import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

export const ExportModal: React.FC = () => {
  const {
    isExportModalOpen,
    closeExportModal,
    transactions,
    accounts,
    budgets,
    selectedMonth,
    formatCurrency,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    showToast,
  } = useFinance();

  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeBudgets, setIncludeBudgets] = useState(true);
  const [includeAccounts, setIncludeAccounts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isExportModalOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);

    if (exportFormat === 'csv') {
      // Generate actual downloadable CSV
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += `FINORA FINANCIAL AUDIT REPORT - ${selectedMonth.label}\r\n`;
      csvContent += `Generated at: ${new Date().toLocaleString()}\r\n\r\n`;
      csvContent += `FINANCIAL OVERVIEW\r\n`;
      csvContent += `Total Net Balance,₹${totalBalance}\r\n`;
      csvContent += `Total Monthly Income,₹${monthlyIncome}\r\n`;
      csvContent += `Total Monthly Expenses,₹${monthlyExpenses}\r\n`;
      csvContent += `Net Monthly Savings,₹${monthlySavings}\r\n`;
      csvContent += `Savings Rate,${savingsRate}%\r\n\r\n`;

      if (includeTransactions) {
        csvContent += `TRANSACTIONS REGISTER\r\n`;
        csvContent += `ID,Date,Merchant,Description,Category,Type,Amount (INR),Payment Method,Account\r\n`;
        transactions.forEach((t) => {
          const accName = accounts.find((a) => a.id === t.accountId)?.name || t.accountId;
          csvContent += `"${t.id}","${t.date}","${t.merchant || ''}","${t.description.replace(/"/g, '""')}","${t.categoryId}","${t.type}",${t.amount},"${t.paymentMethod}","${accName}"\r\n`;
        });
        csvContent += '\r\n';
      }

      if (includeBudgets) {
        csvContent += `BUDGET PERFORMANCE\r\n`;
        csvContent += `Category,Limit (INR),Spent (INR),Remaining (INR),Usage %\r\n`;
        budgets.forEach((b) => {
          csvContent += `"${b.categoryName}",${b.limit},${b.spent},${b.limit - b.spent},${((b.spent / b.limit) * 100).toFixed(1)}%\r\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `MoneyVedass_Report_${selectedMonth.year}_${selectedMonth.month}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV report generated and downloaded', 'success');
    } else {
      // Print preview for clean PDF saving
      window.print();
      showToast('PDF print preview opened', 'info');
    }

    setIsExporting(false);
    closeExportModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeExportModal} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Export Financial Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit for {selectedMonth.label}
            </p>
          </div>
          <button
            onClick={closeExportModal}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* Format selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Report Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  exportFormat === 'csv'
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 font-medium'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileSpreadsheet size={18} className="text-emerald-500" />
                <div>
                  <div className="text-slate-900 dark:text-white">CSV Data</div>
                  <div className="text-[10px] text-slate-400">Excel, Sheets & Raw</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  exportFormat === 'pdf'
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 font-medium'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText size={18} className="text-rose-500" />
                <div>
                  <div className="text-slate-900 dark:text-white">PDF Document</div>
                  <div className="text-[10px] text-slate-400">Printable Executive Audit</div>
                </div>
              </button>
            </div>
          </div>

          {/* Included Data Sections */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Data Sections to Include
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeTransactions}
                onChange={(e) => setIncludeTransactions(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Full Itemized Transaction Ledger ({transactions.length} rows)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeBudgets}
                onChange={(e) => setIncludeBudgets(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Category Budget Allocations &amp; Variance</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeAccounts}
                onChange={(e) => setIncludeAccounts(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Bank &amp; Investment Account Balances</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={closeExportModal}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-2xs"
          >
            <Download size={14} />
            <span>{exportFormat === 'csv' ? 'Download CSV' : 'Generate & Print PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
