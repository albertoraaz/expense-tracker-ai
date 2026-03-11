'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Expense, ExpenseFilters, Category } from '@/types/expense';
import { getExpenses, saveExpenses } from '@/lib/storage';
import {
  generateId,
  getToday,
  getMonthStart,
  getWeekStart,
  filterExpenses,
  getMonthlyStats,
  getCategoryTotals,
} from '@/lib/utils';

const DEFAULT_FILTERS: ExpenseFilters = {
  search: '',
  category: 'All',
  dateFrom: '',
  dateTo: '',
  sortBy: 'date',
  sortOrder: 'desc',
};

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setExpenses(getExpenses());
    setIsLoaded(true);
  }, []);

  // Persist to localStorage whenever expenses change
  useEffect(() => {
    if (isLoaded) saveExpenses(expenses);
  }, [expenses, isLoaded]);

  const addExpense = useCallback(
    (data: Omit<Expense, 'id' | 'createdAt'>) => {
      const expense: Expense = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setExpenses((prev) => [expense, ...prev]);
    },
    []
  );

  const updateExpense = useCallback(
    (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data } : e))
      );
    },
    []
  );

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, filters),
    [expenses, filters]
  );

  const summary = useMemo(() => {
    const monthStart = getMonthStart();
    const weekStart = getWeekStart();
    const today = getToday();

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const thisMonth = expenses
      .filter((e) => e.date >= monthStart && e.date <= today)
      .reduce((s, e) => s + e.amount, 0);
    const thisWeek = expenses
      .filter((e) => e.date >= weekStart && e.date <= today)
      .reduce((s, e) => s + e.amount, 0);

    const byCategory = getCategoryTotals(expenses);
    const topEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] as
      | [Category, number]
      | undefined;

    return {
      total,
      thisMonth,
      thisWeek,
      byCategory,
      topCategory: topEntry ? topEntry[0] : null,
      topCategoryAmount: topEntry ? topEntry[1] : 0,
      count: expenses.length,
    };
  }, [expenses]);

  const monthlyStats = useMemo(() => getMonthlyStats(expenses, 6), [expenses]);

  const categoryTotals = useMemo(() => getCategoryTotals(expenses), [expenses]);

  return {
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
  };
}
