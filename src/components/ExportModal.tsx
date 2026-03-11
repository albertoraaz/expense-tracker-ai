'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Expense, Category, CATEGORIES, CATEGORY_COLORS, CATEGORY_BG, CATEGORY_ICONS } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ExportFormat,
  DatePreset,
  ExportConfig,
  buildExportFilename,
  filterExpensesForExport,
  getPresetDates,
  exportAsCSV,
  exportAsJSON,
  exportAsPDF,
} from '@/lib/exporters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onExportComplete: (count: number, format: ExportFormat) => void;
}

const FORMAT_INFO: Record<ExportFormat, { label: string; ext: string; icon: React.ReactNode; desc: string; color: string }> = {
  csv: {
    label: 'CSV',
    ext: '.csv',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    desc: 'Spreadsheet compatible',
    color: 'emerald',
  },
  json: {
    label: 'JSON',
    ext: '.json',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    desc: 'Developer friendly',
    color: 'blue',
  },
  pdf: {
    label: 'PDF',
    ext: '.pdf',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    desc: 'Print-ready report',
    color: 'rose',
  },
};

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-3-months', label: 'Last 3 months' },
  { value: 'this-year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

const PREVIEW_LIMIT = 8;

export default function ExportModal({ isOpen, onClose, expenses, onExportComplete }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(CATEGORIES));
  const [filenameBase, setFilenameBase] = useState(`expenses-${getTodayStr()}`);
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'done'>('idle');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setFormat('csv');
      setDatePreset('all');
      setDateFrom('');
      setDateTo('');
      setSelectedCategories(new Set(CATEGORIES));
      setFilenameBase(`expenses-${getTodayStr()}`);
      setExportState('idle');
    }
  }, [isOpen]);

  // Keyboard close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Apply preset dates
  useEffect(() => {
    if (datePreset !== 'custom') {
      const { dateFrom: df, dateTo: dt } = getPresetDates(datePreset);
      setDateFrom(df);
      setDateTo(dt);
    }
  }, [datePreset]);

  const filteredExpenses = useMemo(() => {
    const cats = selectedCategories.size === CATEGORIES.length ? new Set<Category>() : selectedCategories;
    return filterExpensesForExport(expenses, { dateFrom, dateTo, categories: cats });
  }, [expenses, dateFrom, dateTo, selectedCategories]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((s, e) => s + e.amount, 0),
    [filteredExpenses]
  );

  const filename = buildExportFilename(filenameBase, format);

  const allCatsSelected = selectedCategories.size === CATEGORIES.length;

  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const toggleAllCategories = useCallback(() => {
    setSelectedCategories(
      allCatsSelected ? new Set() : new Set(CATEGORIES)
    );
  }, [allCatsSelected]);

  async function handleExport() {
    if (filteredExpenses.length === 0) return;
    setExportState('exporting');

    // Brief simulated delay for UX (especially PDF which opens new window)
    await new Promise((r) => setTimeout(r, 600));

    try {
      if (format === 'csv') exportAsCSV(filteredExpenses, filename);
      else if (format === 'json') exportAsJSON(filteredExpenses, filename);
      else exportAsPDF(filteredExpenses, filename);

      setExportState('done');
      await new Promise((r) => setTimeout(r, 1200));
      onExportComplete(filteredExpenses.length, format);
      onClose();
    } catch {
      setExportState('idle');
    }
  }

  if (!isOpen) return null;

  const fmtInfo = FORMAT_INFO[format];
  const previewRows = filteredExpenses.slice(0, PREVIEW_LIMIT);
  const overflowCount = filteredExpenses.length - PREVIEW_LIMIT;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Export data"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Export Data</h2>
            <p className="text-xs text-slate-400">Configure your export and preview before downloading</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

          {/* ── Left: Config panel ─────────────────────────────────── */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-5 space-y-5">

            {/* Format selection */}
            <section>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                Format
              </label>
              <div className="space-y-2">
                {(Object.keys(FORMAT_INFO) as ExportFormat[]).map((f) => {
                  const info = FORMAT_INFO[f];
                  const isSelected = format === f;
                  const colorMap: Record<string, string> = {
                    emerald: isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 text-slate-600',
                    blue: isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-slate-600',
                    rose: isSelected
                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500'
                      : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50/50 text-slate-600',
                  };
                  return (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${colorMap[info.color]}`}
                    >
                      {info.icon}
                      <div className="text-left">
                        <span className="block font-semibold">{info.label}</span>
                        <span className="block text-xs opacity-70 font-normal">{info.desc}</span>
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Date range */}
            <section>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                Date Range
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setDatePreset(p.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      datePreset === p.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Custom date inputs — always visible but disabled unless custom */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDatePreset('custom');
                      setDateFrom(e.target.value);
                    }}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDatePreset('custom');
                      setDateTo(e.target.value);
                    }}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 disabled:opacity-40"
                  />
                </div>
              </div>
            </section>

            {/* Categories */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Categories
                </label>
                <button
                  onClick={toggleAllCategories}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {allCatsSelected ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => {
                  const isChecked = selectedCategories.has(cat);
                  return (
                    <label
                      key={cat}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                        isChecked ? 'bg-slate-50' : 'opacity-50 hover:opacity-75'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                            isChecked ? 'border-0' : 'border-2 border-slate-300 bg-white'
                          }`}
                          style={isChecked ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
                        >
                          {isChecked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm">{CATEGORY_ICONS[cat]}</span>
                      <span className="text-sm font-medium text-slate-700 flex-1">{cat}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Filename */}
            <section>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Filename
              </label>
              <div className="flex items-stretch rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-300">
                <input
                  type="text"
                  value={filenameBase}
                  onChange={(e) => setFilenameBase(e.target.value)}
                  className="flex-1 text-sm px-3 py-2 focus:outline-none text-slate-700 bg-white min-w-0"
                  placeholder="expenses"
                />
                <span className="flex items-center px-2.5 bg-slate-50 text-xs font-mono text-slate-400 border-l border-slate-200 flex-shrink-0">
                  {fmtInfo.ext}
                </span>
              </div>
            </section>
          </div>

          {/* ── Right: Preview panel ────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Preview header / summary bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-xs font-semibold text-slate-600">Preview</span>
              </div>
              <div className="flex items-center gap-3">
                {filteredExpenses.length > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/>
                      </svg>
                      {filteredExpenses.length} records
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {formatCurrency(totalAmount)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">No records match filters</span>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500">No expenses match your filters</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting the date range or categories</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Category</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((e, i) => (
                      <tr
                        key={e.id}
                        className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-slate-50/30'
                        }`}
                      >
                        <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BG[e.category]}`}>
                            <span className="text-[10px]">{CATEGORY_ICONS[e.category]}</span>
                            {e.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600 max-w-[180px] truncate">{e.description}</td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-800 text-right whitespace-nowrap">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                    {overflowCount > 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-3 text-center text-xs text-slate-400 italic">
                          + {overflowCount} more record{overflowCount !== 1 ? 's' : ''} not shown in preview
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex-shrink-0">
          {/* Format hint */}
          <p className="text-xs text-slate-400 hidden sm:block">
            {filename}
          </p>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={filteredExpenses.length === 0 || exportState !== 'idle'}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                filteredExpenses.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : exportState === 'done'
                  ? 'bg-emerald-500 text-white shadow-emerald-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-95'
              }`}
            >
              {exportState === 'exporting' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting…
                </>
              ) : exportState === 'done' ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Done!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export {filteredExpenses.length} Record{filteredExpenses.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
