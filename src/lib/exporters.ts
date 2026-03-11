import { Expense, Category, CATEGORIES, CATEGORY_COLORS } from '@/types/expense';
import { formatCurrency, getToday } from '@/lib/utils';

export type ExportFormat = 'csv' | 'json' | 'pdf';

export type DatePreset = 'all' | 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'custom';

export interface ExportConfig {
  format: ExportFormat;
  dateFrom: string;
  dateTo: string;
  datePreset: DatePreset;
  categories: Set<Category>;
  filename: string;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildExportFilename(base: string, format: ExportFormat): string {
  const clean = base.trim() || `expenses-${getToday()}`;
  if (clean.endsWith(`.${format}`)) return clean;
  // Strip any existing extension then add format
  const stripped = clean.replace(/\.(csv|json|pdf)$/, '');
  return `${stripped}.${format}`;
}

export function filterExpensesForExport(
  expenses: Expense[],
  config: Pick<ExportConfig, 'dateFrom' | 'dateTo' | 'categories'>
): Expense[] {
  return expenses.filter((e) => {
    if (config.dateFrom && e.date < config.dateFrom) return false;
    if (config.dateTo && e.date > config.dateTo) return false;
    if (config.categories.size > 0 && !config.categories.has(e.category)) return false;
    return true;
  });
}

export function getPresetDates(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = fmt(today);

  switch (preset) {
    case 'this-month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dateFrom: fmt(from), dateTo: todayStr };
    }
    case 'last-month': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { dateFrom: fmt(from), dateTo: fmt(to) };
    }
    case 'last-3-months': {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { dateFrom: fmt(from), dateTo: todayStr };
    }
    case 'this-year': {
      const from = new Date(today.getFullYear(), 0, 1);
      return { dateFrom: fmt(from), dateTo: todayStr };
    }
    case 'all':
    case 'custom':
    default:
      return { dateFrom: '', dateTo: '' };
  }
}

// ── CSV ──────────────────────────────────────────────────────────────────────

export function exportAsCSV(expenses: Expense[], filename: string): void {
  const headers = ['Date', 'Category', 'Description', 'Amount (USD)', 'Created At'];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
    e.createdAt,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

// ── JSON ─────────────────────────────────────────────────────────────────────

export function exportAsJSON(expenses: Expense[], filename: string): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    totalRecords: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      description: e.description,
      amount: e.amount,
      createdAt: e.createdAt,
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  triggerDownload(blob, filename);
}

// ── PDF ──────────────────────────────────────────────────────────────────────

export function exportAsPDF(expenses: Expense[], filename: string): void {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const exportedAt = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Build category breakdown
  const byCategory: Partial<Record<Category, number>> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  }
  const categoryRows = CATEGORIES.filter((c) => (byCategory[c] ?? 0) > 0)
    .sort((a, b) => (byCategory[b] ?? 0) - (byCategory[a] ?? 0))
    .map(
      (c) =>
        `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${CATEGORY_COLORS[c]};margin-right:6px;vertical-align:middle;"></span>${c}
          </td>
          <td style="padding:6px 10px;text-align:right;border-bottom:1px solid #f1f5f9;">${formatCurrency(byCategory[c] ?? 0)}</td>
        </tr>`
    )
    .join('');

  const expenseRows = expenses
    .map(
      (e, i) =>
        `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
          <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;">${e.date}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;">
            <span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;background:${CATEGORY_COLORS[e.category]}22;color:${CATEGORY_COLORS[e.category]};font-weight:600;">${e.category}</span>
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;max-width:280px;">${e.description}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;font-weight:500;">${formatCurrency(e.amount)}</td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${filename.replace('.pdf', '')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; }
    @page { margin: 20mm 15mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body style="padding:40px 48px;max-width:900px;margin:0 auto;">
  <!-- Header -->
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e2e8f0;">
    <div style="width:44px;height:44px;background:#4f46e5;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    <div>
      <h1 style="font-size:22px;font-weight:700;color:#0f172a;">Expense Report</h1>
      <p style="font-size:13px;color:#64748b;margin-top:2px;">Exported on ${exportedAt}</p>
    </div>
    <div style="margin-left:auto;text-align:right;">
      <p style="font-size:26px;font-weight:700;color:#4f46e5;">${formatCurrency(total)}</p>
      <p style="font-size:12px;color:#94a3b8;">${expenses.length} record${expenses.length !== 1 ? 's' : ''}</p>
    </div>
  </div>

  <!-- Summary by Category -->
  ${categoryRows ? `
  <div style="margin-bottom:28px;">
    <h2 style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">By Category</h2>
    <table style="width:260px;border-collapse:collapse;">
      <tbody>${categoryRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Expense Table -->
  <div>
    <h2 style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">All Transactions</h2>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 10px;text-align:left;font-size:12px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0;">Date</th>
          <th style="padding:10px 10px;text-align:left;font-size:12px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0;">Category</th>
          <th style="padding:10px 10px;text-align:left;font-size:12px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0;">Description</th>
          <th style="padding:10px 10px;text-align:right;font-size:12px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0;">Amount</th>
        </tr>
      </thead>
      <tbody>${expenseRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:10px 10px;font-size:13px;font-weight:700;color:#0f172a;border-top:2px solid #e2e8f0;">Total</td>
          <td style="padding:10px 10px;text-align:right;font-size:14px;font-weight:700;color:#4f46e5;border-top:2px solid #e2e8f0;">${formatCurrency(total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="font-size:11px;color:#94a3b8;">Generated by Expense Tracker · Data stored locally in your browser</p>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 500);
}
