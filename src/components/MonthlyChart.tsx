'use client';

import { MonthlyStat } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';

interface MonthlyChartProps {
  data: MonthlyStat[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Monthly Spending</h3>
          <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
        </div>
        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
          {formatCurrency(total)} total
        </span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2 h-36">
        {data.map((d) => {
          const pct = d.amount === 0 ? 0 : Math.max(4, (d.amount / max) * 100);
          const isCurrentMonth = d.month === new Date().toISOString().slice(0, 7);
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-8 bg-slate-800 text-white text-xs px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-10">
                {formatCurrency(d.amount)}
              </div>

              {/* Amount label */}
              {d.amount > 0 && (
                <span className="text-xs text-slate-400 truncate w-full text-center hidden sm:block">
                  {d.amount >= 1000 ? `$${(d.amount / 1000).toFixed(1)}k` : `$${Math.round(d.amount)}`}
                </span>
              )}

              {/* Bar */}
              <div className="w-full relative flex items-end" style={{ height: '88px' }}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
                    isCurrentMonth
                      ? 'bg-indigo-500 hover:bg-indigo-400'
                      : 'bg-indigo-200 hover:bg-indigo-300'
                  }`}
                  style={{ height: `${pct}%` }}
                  title={`${d.label}: ${formatCurrency(d.amount)}`}
                />
              </div>

              {/* Label */}
              <span className={`text-xs truncate w-full text-center font-medium ${isCurrentMonth ? 'text-indigo-600' : 'text-slate-400'}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
