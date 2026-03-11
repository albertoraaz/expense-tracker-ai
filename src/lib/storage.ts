import { Expense } from '@/types/expense';

const STORAGE_KEY = 'expense-tracker-data';

const SAMPLE_EXPENSES: Expense[] = [
  {
    id: 'sample-1',
    date: '2026-03-10',
    amount: 87.45,
    category: 'Food',
    description: 'Weekly grocery shopping',
    createdAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'sample-2',
    date: '2026-03-08',
    amount: 32.0,
    category: 'Transportation',
    description: 'Uber to airport',
    createdAt: '2026-03-08T14:30:00Z',
  },
  {
    id: 'sample-3',
    date: '2026-03-07',
    amount: 120.0,
    category: 'Bills',
    description: 'Internet bill',
    createdAt: '2026-03-07T09:00:00Z',
  },
  {
    id: 'sample-4',
    date: '2026-03-05',
    amount: 89.99,
    category: 'Entertainment',
    description: 'Streaming subscriptions (Netflix + Spotify)',
    createdAt: '2026-03-05T11:00:00Z',
  },
  {
    id: 'sample-5',
    date: '2026-03-03',
    amount: 65.0,
    category: 'Shopping',
    description: 'New shirt and accessories',
    createdAt: '2026-03-03T16:00:00Z',
  },
  {
    id: 'sample-6',
    date: '2026-02-28',
    amount: 23.5,
    category: 'Food',
    description: 'Restaurant dinner with friends',
    createdAt: '2026-02-28T20:00:00Z',
  },
  {
    id: 'sample-7',
    date: '2026-02-25',
    amount: 180.0,
    category: 'Bills',
    description: 'Electric and gas bill',
    createdAt: '2026-02-25T08:00:00Z',
  },
  {
    id: 'sample-8',
    date: '2026-02-22',
    amount: 15.0,
    category: 'Transportation',
    description: 'Monthly bus pass',
    createdAt: '2026-02-22T09:00:00Z',
  },
  {
    id: 'sample-9',
    date: '2026-02-20',
    amount: 245.0,
    category: 'Shopping',
    description: 'Amazon — home office supplies',
    createdAt: '2026-02-20T13:00:00Z',
  },
  {
    id: 'sample-10',
    date: '2026-02-18',
    amount: 55.0,
    category: 'Entertainment',
    description: 'Movie tickets (2 people)',
    createdAt: '2026-02-18T18:00:00Z',
  },
  {
    id: 'sample-11',
    date: '2026-02-15',
    amount: 78.0,
    category: 'Food',
    description: 'Bi-weekly grocery run',
    createdAt: '2026-02-15T11:30:00Z',
  },
  {
    id: 'sample-12',
    date: '2026-02-10',
    amount: 12.0,
    category: 'Transportation',
    description: 'Parking fee downtown',
    createdAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'sample-13',
    date: '2026-02-05',
    amount: 45.0,
    category: 'Food',
    description: 'Meal prep ingredients',
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'sample-14',
    date: '2026-01-28',
    amount: 99.0,
    category: 'Entertainment',
    description: 'Concert tickets',
    createdAt: '2026-01-28T12:00:00Z',
  },
  {
    id: 'sample-15',
    date: '2026-01-20',
    amount: 320.0,
    category: 'Bills',
    description: 'Phone and internet bundle',
    createdAt: '2026-01-20T09:00:00Z',
  },
  {
    id: 'sample-16',
    date: '2026-01-15',
    amount: 38.0,
    category: 'Food',
    description: 'Lunch with colleagues',
    createdAt: '2026-01-15T13:00:00Z',
  },
  {
    id: 'sample-17',
    date: '2026-01-10',
    amount: 150.0,
    category: 'Shopping',
    description: 'Winter jacket sale',
    createdAt: '2026-01-10T15:00:00Z',
  },
];

export function getExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Expense[];
    // First load — seed with sample data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_EXPENSES));
    return SAMPLE_EXPENSES;
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    console.error('Failed to persist expenses to localStorage');
  }
}
