'use client';

import { useState } from 'react';
import { Expense, CATEGORY_BG, CATEGORY_ICONS } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick() {
    if (confirming) {
      onDelete(expense.id);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  }

  return (
    <div className="group flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
      {/* Category icon */}
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
        {CATEGORY_ICONS[expense.category]}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-800 truncate">{expense.description}</p>
          <span className="text-sm font-semibold text-slate-900 flex-shrink-0">
            {formatCurrency(expense.amount)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BG[expense.category]}`}>
            {expense.category}
          </span>
          <span className="text-xs text-slate-400">{formatDate(expense.date)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onEdit(expense)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Edit expense"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={handleDeleteClick}
          className={`p-1.5 rounded-lg transition-colors text-sm ${
            confirming
              ? 'bg-red-500 text-white hover:bg-red-600 px-2.5 font-medium'
              : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
          }`}
          title={confirming ? 'Click again to confirm' : 'Delete expense'}
        >
          {confirming ? (
            'Confirm?'
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
