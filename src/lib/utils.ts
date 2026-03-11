import { Expense, ExpenseFilters, Category, CATEGORIES, MonthlyStat } from '@/types/expense';

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getMonthStart(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  let result = [...expenses];

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }

  if (filters.category !== 'All') {
    result = result.filter((e) => e.category === filters.category);
  }

  if (filters.dateFrom) {
    result = result.filter((e) => e.date >= filters.dateFrom);
  }

  if (filters.dateTo) {
    result = result.filter((e) => e.date <= filters.dateTo);
  }

  result.sort((a, b) => {
    if (filters.sortBy === 'date') {
      const cmp = b.date.localeCompare(a.date);
      return filters.sortOrder === 'desc' ? cmp : -cmp;
    } else {
      const cmp = b.amount - a.amount;
      return filters.sortOrder === 'desc' ? cmp : -cmp;
    }
  });

  return result;
}

export function getMonthlyStats(expenses: Expense[], numMonths = 6): MonthlyStat[] {
  const now = new Date();
  return Array.from({ length: numMonths }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (numMonths - 1 - i), 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const amount = expenses
      .filter((e) => e.date.startsWith(month))
      .reduce((sum, e) => sum + e.amount, 0);
    return { month, label, amount };
  });
}

export function getCategoryTotals(expenses: Expense[]): Record<Category, number> {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const e of expenses) {
    totals[e.category] += e.amount;
  }
  return totals;
}

export function exportToCSV(expenses: Expense[]): void {
  const headers = ['Date', 'Amount (USD)', 'Category', 'Description'];
  const rows = expenses.map((e) => [
    e.date,
    e.amount.toFixed(2),
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${getToday()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
