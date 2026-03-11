import {
  CloudHubState,
  Integration,
  IntegrationId,
  ScheduledExport,
  ExportHistoryEntry,
  ShareLink,
  ShareExpiry,
  TemplateId,
  ExportTemplate,
} from '@/types/cloud';
import { Expense, CATEGORIES, CATEGORY_COLORS } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';

// ── Template definitions ──────────────────────────────────────────────────────

export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'tax-report',
    label: 'Tax Report',
    description: 'Annual expense summary with category totals, formatted for tax preparation and accountants.',
    emoji: '🧾',
    formats: ['PDF', 'CSV'],
    dateRangeLabel: 'This year',
    accentColor: 'amber',
    recommended: false,
  },
  {
    id: 'monthly-summary',
    label: 'Monthly Summary',
    description: 'Last 30 days with daily breakdown, category trends, and month-over-month comparison.',
    emoji: '📊',
    formats: ['PDF'],
    dateRangeLabel: 'Last 30 days',
    accentColor: 'blue',
    recommended: true,
  },
  {
    id: 'category-analysis',
    label: 'Category Analysis',
    description: 'Deep-dive into spending patterns by category with percentage breakdowns.',
    emoji: '🔍',
    formats: ['PDF', 'JSON'],
    dateRangeLabel: 'All time',
    accentColor: 'violet',
    recommended: false,
  },
  {
    id: 'business-expenses',
    label: 'Business Expenses',
    description: 'Reimbursement-ready expense report with line items, receipts summary, and totals.',
    emoji: '💼',
    formats: ['CSV', 'PDF'],
    dateRangeLabel: 'This month',
    accentColor: 'emerald',
    recommended: false,
  },
  {
    id: 'full-export',
    label: 'Full Data Export',
    description: 'Complete backup of all records in all formats. Use for migration or archiving.',
    emoji: '📦',
    formats: ['CSV', 'JSON', 'PDF'],
    dateRangeLabel: 'All time',
    accentColor: 'slate',
    recommended: false,
  },
];

// ── Integration metadata (static) ─────────────────────────────────────────────

export const INTEGRATION_META: Record<
  IntegrationId,
  { label: string; description: string; logoColor: string; logoBg: string }
> = {
  'google-sheets': {
    label: 'Google Sheets',
    description: 'Auto-sync expenses to a spreadsheet in real time.',
    logoColor: '#34a853',
    logoBg: '#e8f5e9',
  },
  dropbox: {
    label: 'Dropbox',
    description: 'Save exports directly to your Dropbox folder.',
    logoColor: '#0061ff',
    logoBg: '#e3eeff',
  },
  onedrive: {
    label: 'OneDrive',
    description: 'Automatically back up to your Microsoft OneDrive.',
    logoColor: '#0078d4',
    logoBg: '#e3f2fd',
  },
  email: {
    label: 'Email Delivery',
    description: 'Receive scheduled reports straight in your inbox.',
    logoColor: '#ea4335',
    logoBg: '#fce8e6',
  },
  slack: {
    label: 'Slack',
    description: 'Post spending summaries to a Slack channel.',
    logoColor: '#4a154b',
    logoBg: '#f4e6f4',
  },
  notion: {
    label: 'Notion',
    description: 'Sync expenses as a Notion database table.',
    logoColor: '#000000',
    logoBg: '#f5f5f5',
  },
};

// ── localStorage persistence ──────────────────────────────────────────────────

const STORAGE_KEY = 'expense-cloud-hub-v1';

function defaultState(): CloudHubState {
  const now = new Date();
  const ago = (days: number) =>
    new Date(now.getTime() - days * 86400000).toISOString();

  const state: CloudHubState = {
    integrations: {
      'google-sheets': {
        id: 'google-sheets',
        status: 'connected',
        connectedAt: ago(14),
        lastSyncAt: ago(0.04), // ~1 hour ago
        accountLabel: 'me@gmail.com',
        itemsSynced: 312,
      },
      email: {
        id: 'email',
        status: 'connected',
        connectedAt: ago(30),
        lastSyncAt: ago(7),
        accountLabel: 'me@gmail.com',
        itemsSynced: 4,
      },
      dropbox: { id: 'dropbox', status: 'disconnected' },
      onedrive: { id: 'onedrive', status: 'disconnected' },
      slack: { id: 'slack', status: 'disconnected' },
      notion: { id: 'notion', status: 'disconnected' },
    },
    schedules: [
      {
        id: 'sched-1',
        enabled: true,
        templateId: 'monthly-summary',
        frequency: 'monthly',
        destinationType: 'email',
        destinationLabel: 'me@gmail.com',
        nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
        lastRunAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        createdAt: ago(45),
        runCount: 3,
      },
      {
        id: 'sched-2',
        enabled: true,
        templateId: 'full-export',
        frequency: 'weekly',
        destinationType: 'google-sheets',
        destinationLabel: 'Google Sheets · me@gmail.com',
        nextRunAt: new Date(now.getTime() + 2 * 86400000).toISOString(),
        lastRunAt: ago(5),
        createdAt: ago(14),
        runCount: 2,
      },
    ],
    history: [
      {
        id: 'h-1',
        timestamp: ago(0.1),
        templateId: 'monthly-summary',
        templateLabel: 'Monthly Summary',
        destinationType: 'download',
        destinationLabel: 'Downloaded',
        formats: ['PDF'],
        recordCount: 23,
        totalAmount: 1847.5,
        status: 'completed',
        fileSizeKb: 48,
      },
      {
        id: 'h-2',
        timestamp: ago(2),
        templateId: 'full-export',
        templateLabel: 'Full Data Export',
        destinationType: 'google-sheets',
        destinationLabel: 'Google Sheets',
        formats: ['CSV', 'JSON', 'PDF'],
        recordCount: 87,
        totalAmount: 6234.1,
        status: 'completed',
        fileSizeKb: 210,
      },
      {
        id: 'h-3',
        timestamp: ago(7),
        templateId: 'monthly-summary',
        templateLabel: 'Monthly Summary',
        destinationType: 'email',
        destinationLabel: 'me@gmail.com',
        formats: ['PDF'],
        recordCount: 31,
        totalAmount: 2103.2,
        status: 'completed',
        fileSizeKb: 51,
      },
      {
        id: 'h-4',
        timestamp: ago(9),
        templateId: 'tax-report',
        templateLabel: 'Tax Report',
        destinationType: 'download',
        destinationLabel: 'Downloaded',
        formats: ['PDF', 'CSV'],
        recordCount: 142,
        totalAmount: 11420.75,
        status: 'failed',
      },
      {
        id: 'h-5',
        timestamp: ago(14),
        templateId: 'business-expenses',
        templateLabel: 'Business Expenses',
        destinationType: 'email',
        destinationLabel: 'finance@company.com',
        formats: ['CSV', 'PDF'],
        recordCount: 18,
        totalAmount: 934.6,
        status: 'completed',
        fileSizeKb: 32,
      },
    ],
    shareLinks: [
      {
        id: 'sl-1',
        shortCode: 'xp-m7n2k9',
        createdAt: ago(3),
        expiresAt: new Date(now.getTime() + 4 * 86400000).toISOString(),
        expiryLabel: '7d',
        templateId: 'monthly-summary',
        templateLabel: 'Monthly Summary',
        accessCount: 2,
        passwordProtected: false,
        active: true,
      },
    ],
  };

  return state;
}

export function loadCloudState(): CloudHubState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as CloudHubState;
    // Back-fill any new integration keys that didn't exist in stored state
    const defaults = defaultState();
    for (const key of Object.keys(defaults.integrations) as IntegrationId[]) {
      if (!parsed.integrations[key]) {
        parsed.integrations[key] = defaults.integrations[key];
      }
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveCloudState(state: CloudHubState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Simulation helpers ────────────────────────────────────────────────────────

export function buildHistoryEntry(
  templateId: TemplateId,
  destinationType: ExportHistoryEntry['destinationType'],
  destinationLabel: string,
  expenses: Expense[]
): ExportHistoryEntry {
  const template = EXPORT_TEMPLATES.find((t) => t.id === templateId)!;
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  return {
    id: `h-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    templateId,
    templateLabel: template.label,
    destinationType,
    destinationLabel,
    formats: template.formats,
    recordCount: expenses.length,
    totalAmount: total,
    status: 'completed',
    fileSizeKb: Math.round(expenses.length * 0.8 + template.formats.length * 15),
  };
}

export function buildShareLink(
  templateId: TemplateId,
  expiry: ShareExpiry,
  passwordProtected: boolean
): ShareLink {
  const template = EXPORT_TEMPLATES.find((t) => t.id === templateId)!;
  const now = new Date();
  const expiryMs: Record<ShareExpiry, number | null> = {
    '24h': 86400000,
    '7d': 7 * 86400000,
    '30d': 30 * 86400000,
    never: null,
  };
  const ms = expiryMs[expiry];
  return {
    id: `sl-${Date.now().toString(36)}`,
    shortCode: `xp-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now.toISOString(),
    expiresAt: ms ? new Date(now.getTime() + ms).toISOString() : null,
    expiryLabel: expiry,
    templateId,
    templateLabel: template.label,
    accessCount: 0,
    passwordProtected,
    active: true,
  };
}

// ── PDF generator (same technique as v2 but branded differently) ──────────────

export function generateTemplatePDF(templateId: TemplateId, expenses: Expense[]): void {
  const template = EXPORT_TEMPLATES.find((t) => t.id === templateId)!;
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const now = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const byCategory: Partial<Record<string, number>> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  }

  const catRows = CATEGORIES.filter((c) => (byCategory[c] ?? 0) > 0)
    .sort((a, b) => (byCategory[b] ?? 0) - (byCategory[a] ?? 0))
    .map((c) => {
      const pct = ((byCategory[c] ?? 0) / total * 100).toFixed(1);
      return `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${CATEGORY_COLORS[c]};margin-right:8px;"></span>${c}
        </td>
        <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #f1f5f9;">${formatCurrency(byCategory[c] ?? 0)}</td>
        <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #f1f5f9;color:#94a3b8;">${pct}%</td>
      </tr>`;
    }).join('');

  const expRows = expenses
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;">${e.date}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;">
        <span style="padding:2px 8px;border-radius:99px;font-size:11px;background:${CATEGORY_COLORS[e.category]}22;color:${CATEGORY_COLORS[e.category]};font-weight:600;">${e.category}</span>
      </td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;">${e.description}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;font-weight:500;">${formatCurrency(e.amount)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>${template.label}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1e293b;}@page{margin:15mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
  </head><body style="padding:40px 48px">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #e2e8f0;">
    <div style="font-size:36px">${template.emoji}</div>
    <div style="flex:1">
      <p style="font-size:11px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Expense Tracker Cloud · Auto-Generated Report</p>
      <h1 style="font-size:22px;font-weight:700;color:#0f172a">${template.label}</h1>
      <p style="font-size:12px;color:#64748b;margin-top:2px">Generated ${now} · ${template.dateRangeLabel}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:28px;font-weight:800;color:#6366f1">${formatCurrency(total)}</p>
      <p style="font-size:12px;color:#94a3b8">${expenses.length} transactions</p>
    </div>
  </div>
  ${catRows ? `<div style="margin-bottom:28px"><h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:10px">Category Breakdown</h2>
  <table style="width:320px;border-collapse:collapse"><thead><tr>
    <th style="text-align:left;padding:6px 12px;font-size:11px;color:#94a3b8;border-bottom:2px solid #e2e8f0">Category</th>
    <th style="text-align:right;padding:6px 12px;font-size:11px;color:#94a3b8;border-bottom:2px solid #e2e8f0">Total</th>
    <th style="text-align:right;padding:6px 12px;font-size:11px;color:#94a3b8;border-bottom:2px solid #e2e8f0">Share</th>
  </tr></thead><tbody>${catRows}</tbody></table></div>` : ''}
  <div><h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:10px">Transactions</h2>
  <table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8fafc">
    <th style="text-align:left;padding:9px 10px;font-size:11px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0">Date</th>
    <th style="text-align:left;padding:9px 10px;font-size:11px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0">Category</th>
    <th style="text-align:left;padding:9px 10px;font-size:11px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0">Description</th>
    <th style="text-align:right;padding:9px 10px;font-size:11px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0">Amount</th>
  </tr></thead><tbody>${expRows}</tbody>
  <tfoot><tr><td colspan="3" style="padding:10px;font-weight:700;color:#0f172a;border-top:2px solid #e2e8f0">Total</td>
  <td style="padding:10px;text-align:right;font-weight:800;font-size:15px;color:#6366f1;border-top:2px solid #e2e8f0">${formatCurrency(total)}</td></tr></tfoot>
  </table></div>
  <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="font-size:10px;color:#94a3b8">Expense Tracker Cloud · ${template.label} · Generated ${now}</p>
  </div>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

export function generateCSV(expenses: Expense[], templateId: TemplateId): void {
  const headers = ['Date', 'Category', 'Description', 'Amount (USD)', 'Created At'];
  const rows = expenses.map((e) => [
    e.date, e.category,
    `"${e.description.replace(/"/g, '""')}"`,
    e.amount.toFixed(2), e.createdAt,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const template = EXPORT_TEMPLATES.find((t) => t.id === templateId)!;
  a.download = `${template.label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateJSON(expenses: Expense[], templateId: TemplateId): void {
  const template = EXPORT_TEMPLATES.find((t) => t.id === templateId)!;
  const payload = {
    exportedAt: new Date().toISOString(),
    template: template.label,
    totalRecords: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
