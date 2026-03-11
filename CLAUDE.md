# Expense Tracker AI — Claude Code Context

## Project overview
NextJS 14 personal expense tracking app. All data is stored in `localStorage` — no backend, no database, no auth.

## Stack
- **Framework:** Next.js 14.2.5 (App Router, single-page client component)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3
- **Persistence:** `localStorage` only
- **Charts:** Custom SVG (no charting library)

## Key source files

| File | Role |
|------|------|
| `src/types/expense.ts` | `Category` type, `CATEGORIES` array, color/icon maps, `Expense` interface, `ExpenseFilters` |
| `src/lib/storage.ts` | `getExpenses` / `saveExpenses` localStorage helpers; seeds 17 sample expenses on first load |
| `src/lib/utils.ts` | `formatCurrency`, `formatDate`, `filterExpenses`, `getMonthlyStats`, `getCategoryTotals`, `exportToCSV` |
| `src/hooks/useExpenses.ts` | Central state hook — CRUD, filters, summary stats, monthly/category aggregates |
| `src/app/page.tsx` | Single-page client component, orchestrates all state and modals |
| `src/components/` | `Modal`, `SummaryCards`, `MonthlyChart`, `CategoryChart`, `FilterBar`, `ExpenseForm`, `ExpenseItem`, `ExpenseList` |

## Dev commands
```bash
npm run dev    # dev server on http://localhost:3000
npm run build  # production build (verifies types + lint)
npm run lint   # ESLint only
```

## Architecture notes
- `useExpenses` is the single source of truth — all components receive data via props from `page.tsx`
- `filterExpenses` in `utils.ts` handles search, category, date range, and sort — used by the hook's `filteredExpenses` memo
- Charts are pure SVG with no external dependencies
- `Modal` component (`src/components/Modal.tsx`) supports Escape-to-close and body scroll lock; it uses `max-w-lg` by default — build self-contained overlays for wider dialogs

## Important gotchas
- `next.config` must be `.js`, not `.ts` — Next.js 14.2.5 doesn't support TypeScript config files
- The original `package-lock.json` was root-owned; deleted and reinstalled to fix permissions
- `localStorage` access must be guarded with `typeof window !== 'undefined'` checks in any server-rendered context
- All date strings are `YYYY-MM-DD`; `createdAt` is ISO datetime

## Branch structure
| Branch | Description |
|--------|-------------|
| `main` | Clean baseline — no export feature |
| `feature-data-export-v1` | Simple one-click CSV export button |
| `feature-data-export-v2` | Advanced export modal (CSV/JSON/PDF, date range, category filter, live preview) |
| `feature-data-export-v3` | Cloud Sync Hub drawer (integrations, scheduling, history, shareable links, QR codes) |

## Expense data shape
```ts
interface Expense {
  id: string;          // generateId() → timestamp36 + random
  date: string;        // YYYY-MM-DD
  amount: number;      // USD, positive
  category: Category;  // 'Food' | 'Transportation' | 'Entertainment' | 'Shopping' | 'Bills' | 'Other'
  description: string;
  createdAt: string;   // ISO datetime
}
```
