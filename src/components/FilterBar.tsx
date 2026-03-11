'use client';

import { ExpenseFilters, CATEGORIES, Category } from '@/types/expense';
import { Dispatch, SetStateAction } from 'react';

interface FilterBarProps {
  filters: ExpenseFilters;
  setFilters: Dispatch<SetStateAction<ExpenseFilters>>;
  onReset: () => void;
  totalResults: number;
}

export default function FilterBar({ filters, setFilters, onReset, totalResults }: FilterBarProps) {
  const hasActiveFilters =
    filters.search ||
    filters.category !== 'All' ||
    filters.dateFrom ||
    filters.dateTo;

  function update(partial: Partial<ExpenseFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search expenses..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
        />
        {filters.search && (
          <button
            onClick={() => update({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Row: Category + Date range + Sort */}
      <div className="flex flex-wrap gap-2">
        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => update({ category: e.target.value as Category | 'All' })}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 flex-1 min-w-[120px]"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Date from */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 flex-1 min-w-[130px]"
        />

        {/* Date to */}
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 flex-1 min-w-[130px]"
        />

        {/* Sort */}
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-') as [
              'date' | 'amount',
              'asc' | 'desc'
            ];
            update({ sortBy, sortOrder });
          }}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 flex-1 min-w-[140px]"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
        </select>
      </div>

      {/* Results count + Reset */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {totalResults} result{totalResults !== 1 ? 's' : ''}
        </span>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
