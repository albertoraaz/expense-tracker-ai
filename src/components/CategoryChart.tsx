'use client';

import { Category, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';

interface CategoryChartProps {
  totals: Record<Category, number>;
}

export default function CategoryChart({ totals }: CategoryChartProps) {
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  const sorted = CATEGORIES.map((cat) => ({
    cat,
    amount: totals[cat],
    pct: grandTotal > 0 ? (totals[cat] / grandTotal) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">By Category</h3>
          <p className="text-xs text-slate-400 mt-0.5">All-time breakdown</p>
        </div>
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
          {formatCurrency(grandTotal)} total
        </span>
      </div>

      {grandTotal === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-sm">No spending data yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(({ cat, amount, pct }) => (
            <div key={cat} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-sm font-medium text-slate-700 truncate">{cat}</span>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span className="text-xs text-slate-400">{pct.toFixed(1)}%</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatCurrency(amount)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CATEGORY_COLORS[cat],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
