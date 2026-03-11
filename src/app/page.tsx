'use client';

import { useState } from 'react';
import { Expense } from '@/types/expense';
import { exportToCSV } from '@/lib/utils';
import { useExpenses } from '@/hooks/useExpenses';
import Modal from '@/components/Modal';
import SummaryCards from '@/components/SummaryCards';
import MonthlyChart from '@/components/MonthlyChart';
import CategoryChart from '@/components/CategoryChart';
import FilterBar from '@/components/FilterBar';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';

type ModalState =
  | { type: 'closed' }
  | { type: 'add' }
  | { type: 'edit'; expense: Expense };

export default function Home() {
  const {
    expenses,
    filteredExpenses,
    filters,
    setFilters,
    resetFilters,
    addExpense,
    updateExpense,
    deleteExpense,
    summary,
    monthlyStats,
    categoryTotals,
    isLoaded,
  } = useExpenses();

  const [modal, setModal] = useState<ModalState>({ type: 'closed' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  function handleAdd(data: Omit<Expense, 'id' | 'createdAt'>) {
    addExpense(data);
    setModal({ type: 'closed' });
    showToast('Expense added successfully');
  }

  function handleUpdate(data: Omit<Expense, 'id' | 'createdAt'>) {
    if (modal.type !== 'edit') return;
    updateExpense(modal.expense.id, data);
    setModal({ type: 'closed' });
    showToast('Expense updated');
  }

  function handleDelete(id: string) {
    deleteExpense(id);
    showToast('Expense deleted', 'error');
  }

  function handleExport() {
    if (expenses.length === 0) {
      showToast('No expenses to export', 'error');
      return;
    }
    exportToCSV(expenses);
    showToast(`Exported ${expenses.length} expenses`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">Expense Tracker</h1>
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Personal finance manager</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              title="Export to CSV"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => setModal({ type: 'add' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <SummaryCards
          total={summary.total}
          thisMonth={summary.thisMonth}
          thisWeek={summary.thisWeek}
          count={summary.count}
          topCategory={summary.topCategory}
          topCategoryAmount={summary.topCategoryAmount}
        />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MonthlyChart data={monthlyStats} />
          <CategoryChart totals={categoryTotals} />
        </div>

        {/* Expense list section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">All Expenses</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {expenses.length} total · {filteredExpenses.length} shown
              </p>
            </div>
            <button
              onClick={() => setModal({ type: 'add' })}
              className="sm:hidden flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Filters */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              onReset={resetFilters}
              totalResults={filteredExpenses.length}
            />

            {/* List */}
            <ExpenseList
              expenses={filteredExpenses}
              onEdit={(expense) => setModal({ type: 'edit', expense })}
              onDelete={handleDelete}
              isLoading={!isLoaded}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-center text-xs text-slate-400">
          Data stored locally in your browser · No account required
        </p>
      </footer>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modal.type !== 'closed'}
        onClose={() => setModal({ type: 'closed' })}
        title={modal.type === 'edit' ? 'Edit Expense' : 'Add New Expense'}
      >
        <ExpenseForm
          onSubmit={modal.type === 'edit' ? handleUpdate : handleAdd}
          onCancel={() => setModal({ type: 'closed' })}
          initialData={modal.type === 'edit' ? modal.expense : undefined}
          isEdit={modal.type === 'edit'}
        />
      </Modal>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
