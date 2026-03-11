export type Category =
  | 'Food'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#10b981',
  Transportation: '#3b82f6',
  Entertainment: '#8b5cf6',
  Shopping: '#ec4899',
  Bills: '#f59e0b',
  Other: '#6b7280',
};

export const CATEGORY_BG: Record<Category, string> = {
  Food: 'bg-emerald-100 text-emerald-700',
  Transportation: 'bg-blue-100 text-blue-700',
  Entertainment: 'bg-violet-100 text-violet-700',
  Shopping: 'bg-pink-100 text-pink-700',
  Bills: 'bg-amber-100 text-amber-700',
  Other: 'bg-slate-100 text-slate-600',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: '🍕',
  Transportation: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Bills: '📄',
  Other: '📦',
};

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: Category;
  description: string;
  createdAt: string; // ISO datetime
}

export interface ExpenseFilters {
  search: string;
  category: Category | 'All';
  dateFrom: string;
  dateTo: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}

export interface MonthlyStat {
  month: string; // YYYY-MM
  label: string; // "Jan '26"
  amount: number;
}
