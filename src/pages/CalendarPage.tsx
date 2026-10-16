import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';

type CalendarView = 'day' | 'month' | 'year';

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const monthLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const dateLabel = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const getTotals = (transactions: Transaction[]) =>
  transactions.reduce(
    (totals, transaction) => {
      totals[transaction.type] += transaction.amount;
      return totals;
    },
    { income: 0, expense: 0, transfer: 0 }
  );

export const CalendarPage: React.FC = () => {
  const { transactions, accounts, formatCurrency, openAddTxModal } = useFinance();
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const selectedDayKey = toDateKey(selectedDate);
  const selectedMonthKey = selectedDayKey.slice(0, 7);
  const selectedYear = selectedDate.getFullYear();

  const dayTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date === selectedDayKey),
    [transactions, selectedDayKey]
  );

  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date.startsWith(selectedMonthKey)),
    [transactions, selectedMonthKey]
  );

  const yearTransactions = useMemo(
    () =>
      transactions.filter((transaction) => transaction.date.startsWith(`${selectedYear}-`)),
    [transactions, selectedYear]
  );

  const visibleTransactions =
    view === 'day' ? dayTransactions : view === 'month' ? monthTransactions : yearTransactions;
  const periodTotals = getTotals(visibleTransactions);
  const periodLabel =
    view === 'day'
      ? dateLabel(selectedDate)
      : view === 'month'
        ? monthLabel(selectedDate)
        : String(selectedYear);

  const movePeriod = (direction: number) => {
    setSelectedDate((current) => {
      if (view === 'day') {
        const next = new Date(current);
        next.setDate(next.getDate() + direction);
        return next;
      }

      const targetMonth =
        view === 'month' ? current.getMonth() + direction : current.getMonth();
      const targetYear =
        view === 'year' ? current.getFullYear() + direction : current.getFullYear();
      const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      return new Date(targetYear, targetMonth, Math.min(current.getDate(), lastDay));
    });
  };

  const setDay = (dateKey: string) => setSelectedDate(fromDateKey(dateKey));

  const transactionsByDate = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    monthTransactions.forEach((transaction) => {
      const day = grouped.get(transaction.date) || [];
      day.push(transaction);
      grouped.set(transaction.date, day);
    });
    return grouped;
  }, [monthTransactions]);

  const monthsOfYear = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) => {
        const datePrefix = `${selectedYear}-${pad(month + 1)}`;
        const monthItems = transactions.filter((transaction) =>
          transaction.date.startsWith(datePrefix)
        );
        return { month, transactions: monthItems, totals: getTotals(monthItems) };
      }),
    [transactions, selectedYear]
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Calendar
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Explore your financial records by day, month, or year.
          </p>
        </div>
        <button
          onClick={() => openAddTxModal('expense')}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-2xs transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Transaction
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="inline-flex w-fit rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(['day', 'month', 'year'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  view === option
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <div className="flex items-center gap-1">
              <button
                onClick={() => movePeriod(-1)}
                aria-label={`Previous ${view}`}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Today
              </button>
              <button
                onClick={() => movePeriod(1)}
                aria-label={`Next ${view}`}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white sm:min-w-44 sm:text-right">
              {periodLabel}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <SummaryItem
            label="Income"
            amount={periodTotals.income}
            formatCurrency={formatCurrency}
            color="text-emerald-600 dark:text-emerald-400"
            icon={<ArrowDown size={14} />}
          />
          <SummaryItem
            label="Expenses"
            amount={periodTotals.expense}
            formatCurrency={formatCurrency}
            color="text-rose-600 dark:text-rose-400"
            icon={<ArrowUp size={14} />}
          />
          <SummaryItem
            label="Transfers"
            amount={periodTotals.transfer}
            formatCurrency={formatCurrency}
            color="text-blue-600 dark:text-blue-400"
            icon={<ArrowRightLeft size={14} />}
          />
        </div>
      </section>

      {view === 'day' ? (
        <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <label className="mb-4 flex w-fit items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CalendarDays size={15} />
            <span>Choose a date</span>
            <input
              type="date"
              value={selectedDayKey}
              onChange={(event) => setDay(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </label>
          <TransactionList
            transactions={dayTransactions}
            accounts={accounts}
            formatCurrency={formatCurrency}
            emptyLabel="No records for this day."
          />
        </section>
      ) : view === 'month' ? (
        <>
          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="grid grid-cols-7 border-b border-slate-100 pb-2 dark:border-slate-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs"
                >
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                  <span className="hidden sm:inline">{day}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: new Date(selectedYear, selectedDate.getMonth(), 1).getDay() }, (_, i) => (
                <div key={`blank-${i}`} className="min-h-[4.5rem] border-b border-r border-slate-100 dark:border-slate-800 sm:min-h-24" />
              ))}
              {Array.from(
                { length: new Date(selectedYear, selectedDate.getMonth() + 1, 0).getDate() },
                (_, index) => {
                  const day = index + 1;
                  const dateKey = `${selectedMonthKey}-${pad(day)}`;
                  const dayItems = transactionsByDate.get(dateKey) || [];
                  const totals = getTotals(dayItems);
                  const selected = dateKey === selectedDayKey;
                  return (
                    <button
                      key={dateKey}
                      onClick={() => setDay(dateKey)}
                      aria-label={`${dateLabel(fromDateKey(dateKey))}, ${dayItems.length} records`}
                      aria-pressed={selected}
                      className={`min-h-[4.5rem] border-b border-r border-slate-100 p-1.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70 sm:min-h-24 sm:p-2 ${
                        selected ? 'bg-slate-50 ring-1 ring-inset ring-slate-400 dark:bg-slate-800/70 dark:ring-slate-500' : ''
                      }`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                        selected ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {day}
                      </span>
                      {dayItems.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          <span className="block truncate text-[9px] font-semibold text-slate-500 dark:text-slate-400 sm:text-[10px]">
                            {dayItems.length} {dayItems.length === 1 ? 'record' : 'records'}
                          </span>
                          {totals.expense > 0 && (
                            <span className="hidden truncate text-[10px] font-medium text-rose-600 dark:text-rose-400 sm:block">
                              -{formatCurrency(totals.expense)}
                            </span>
                          )}
                          {totals.income > 0 && (
                            <span className="hidden truncate text-[10px] font-medium text-emerald-600 dark:text-emerald-400 sm:block">
                              +{formatCurrency(totals.income)}
                            </span>
                          )}
                          <span className="flex gap-0.5 sm:hidden">
                            {totals.expense > 0 && <i className="h-1 w-1 rounded-full bg-rose-500" />}
                            {totals.income > 0 && <i className="h-1 w-1 rounded-full bg-emerald-500" />}
                            {totals.transfer > 0 && <i className="h-1 w-1 rounded-full bg-blue-500" />}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {dateLabel(selectedDate)}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {dayTransactions.length} {dayTransactions.length === 1 ? 'record' : 'records'}
                </p>
              </div>
              <button
                onClick={() => setView('day')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                View day
              </button>
            </div>
            <TransactionList
              transactions={dayTransactions}
              accounts={accounts}
              formatCurrency={formatCurrency}
              emptyLabel="No records for this day."
            />
          </section>
        </>
      ) : (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {monthsOfYear.map(({ month, transactions: items, totals }) => {
            const date = new Date(selectedYear, month, 1);
            return (
              <button
                key={month}
                onClick={() => {
                  setSelectedDate(date);
                  setView('month');
                }}
                className="rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-2xs transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {date.toLocaleDateString(undefined, { month: 'long' })}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {items.length} {items.length === 1 ? 'record' : 'records'}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Income</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(totals.income)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Expenses</span>
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      -{formatCurrency(totals.expense)}
                    </span>
                  </div>
                  {items.length > 0 && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-rose-400"
                        style={{
                          width: `${Math.min(
                            100,
                            (totals.expense / Math.max(totals.expense + totals.income, 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
};

interface SummaryItemProps {
  label: string;
  amount: number;
  formatCurrency: (amount: number) => string;
  color: string;
  icon: React.ReactNode;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, amount, formatCurrency, color, icon }) => (
  <div className="flex items-center justify-between px-4 py-3 sm:px-5">
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
      <span className={color}>{icon}</span>
      {label}
    </div>
    <span className={`text-sm font-bold font-tabular ${color}`}>{formatCurrency(amount)}</span>
  </div>
);

interface TransactionListProps {
  transactions: Transaction[];
  accounts: { id: string; name: string }[];
  formatCurrency: (amount: number, options?: { currency?: string }) => string;
  emptyLabel: string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  formatCurrency,
  emptyLabel,
}) => {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400 dark:border-slate-700">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {[...transactions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
        .map((transaction) => {
          const tone =
            transaction.type === 'income'
              ? 'text-emerald-600 dark:text-emerald-400'
              : transaction.type === 'expense'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-blue-600 dark:text-blue-400';
          const sign =
            transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '';
          const account = accounts.find((item) => item.id === transaction.accountId)?.name || transaction.accountId;
          return (
            <div key={transaction.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {transaction.merchant || transaction.description}
                </div>
                <div className="mt-1 truncate text-[11px] capitalize text-slate-400">
                  {transaction.description} · {transaction.categoryId} · {account}
                </div>
              </div>
              <div className={`shrink-0 text-right text-xs font-semibold font-tabular ${tone}`}>
                {sign}{formatCurrency(transaction.amount, { currency: transaction.currency })}
                <div className="mt-1 text-[10px] font-normal capitalize text-slate-400">
                  {transaction.type}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
