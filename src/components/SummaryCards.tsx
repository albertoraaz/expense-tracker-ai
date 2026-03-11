'use client';

import { CATEGORY_ICONS } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';

interface SummaryCardsProps {
  total: number;
  thisMonth: number;
  thisWeek: number;
  count: number;
  topCategory: string | null;
  topCategoryAmount: number;
}

interface CardProps {
  label: string;
  value: string;
  subvalue?: string;
  icon: string;
  color: string;
  bg: string;
}

function Card({ label, value, subvalue, icon, color, bg }: CardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold truncate ${color}`}>{value}</p>
          {subvalue && (
            <p className="text-xs text-slate-400 mt-1 truncate">{subvalue}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${bg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({
  total,
  thisMonth,
  thisWeek,
  count,
  topCategory,
  topCategoryAmount,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        label="Total Spent"
        value={formatCurrency(total)}
        subvalue={`${count} expense${count !== 1 ? 's' : ''} recorded`}
        icon="💰"
        color="text-slate-900"
        bg="bg-slate-100"
      />
      <Card
        label="This Month"
        value={formatCurrency(thisMonth)}
        subvalue="Current month spending"
        icon="📅"
        color="text-indigo-700"
        bg="bg-indigo-50"
      />
      <Card
        label="This Week"
        value={formatCurrency(thisWeek)}
        subvalue="Current week spending"
        icon="📊"
        color="text-emerald-700"
        bg="bg-emerald-50"
      />
      <Card
        label="Top Category"
        value={topCategory ?? '—'}
        subvalue={topCategory ? formatCurrency(topCategoryAmount) + ' total' : 'No data yet'}
        icon={topCategory ? CATEGORY_ICONS[topCategory as keyof typeof CATEGORY_ICONS] : '🏷️'}
        color="text-amber-700"
        bg="bg-amber-50"
      />
    </div>
  );
}
