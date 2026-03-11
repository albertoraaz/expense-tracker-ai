'use client';

import { Expense } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import ExpenseItem from './ExpenseItem';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export default function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  isLoading = false,
}: ExpenseListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="h-4 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4">
          🔍
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">No expenses found</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          Try adjusting your filters or add a new expense to get started.
        </p>
      </div>
    );
  }

  // Group by date for display
  const grouped: Record<string, Expense[]> = {};
  for (const e of expenses) {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const dayExpenses = grouped[date];
        const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);

        return (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {formatDateGroupHeader(date)}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {formatCurrency(dayTotal)}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-100">
              {dayExpenses.map((expense) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDateGroupHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}
