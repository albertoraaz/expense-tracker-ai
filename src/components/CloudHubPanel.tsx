'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Expense } from '@/types/expense';
import {
  IntegrationId,
  ScheduledExport,
  ShareLink,
  ShareExpiry,
  TemplateId,
  CloudHubState,
} from '@/types/cloud';
import {
  EXPORT_TEMPLATES,
  INTEGRATION_META,
  loadCloudState,
  saveCloudState,
  buildHistoryEntry,
  buildShareLink,
  generateTemplatePDF,
  generateCSV,
  generateJSON,
} from '@/lib/cloudStore';
import { formatCurrency } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'templates' | 'integrations' | 'schedule' | 'history' | 'share';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function isExpired(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

// ── QR-code-style visual (deterministic pattern from string hash) ─────────────
// Not a real QR code — a visually authentic-looking placeholder

function stringHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function QRVisual({ value, size = 120 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const CELLS = 21;
    const cell = size / CELLS;
    const hash = stringHash(value);

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Finder patterns (the three corners)
    const drawFinder = (r: number, c: number) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(c * cell, r * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((c + 1) * cell, (r + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect((c + 2) * cell, (r + 2) * cell, 3 * cell, 3 * cell);
    };
    drawFinder(0, 0);
    drawFinder(0, 14);
    drawFinder(14, 0);

    // Timing patterns
    ctx.fillStyle = '#1e293b';
    for (let i = 8; i < 13; i += 2) {
      ctx.fillRect(i * cell, 6 * cell, cell, cell);
      ctx.fillRect(6 * cell, i * cell, cell, cell);
    }

    // Data modules (deterministic pseudo-random fill)
    let seed = hash;
    for (let r = 0; r < CELLS; r++) {
      for (let c = 0; c < CELLS; c++) {
        // Skip finder pattern zones + timing
        const inFinder =
          (r < 8 && c < 8) ||
          (r < 8 && c >= 13) ||
          (r >= 13 && c < 8) ||
          (r === 6 || c === 6);
        if (inFinder) continue;
        seed = ((seed * 1664525) + 1013904223) >>> 0;
        if ((seed & 0b11) !== 0) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(c * cell, r * cell, cell * 0.9, cell * 0.9);
        }
      }
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg border border-slate-200"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// ── Tab icons ─────────────────────────────────────────────────────────────────

const TAB_DEFS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'templates',
    label: 'Templates',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'share',
    label: 'Share',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
];

// ── Accent color mapping ──────────────────────────────────────────────────────

const ACCENT: Record<string, { card: string; badge: string; btn: string; text: string }> = {
  amber:   { card: 'bg-amber-50 border-amber-200',   badge: 'bg-amber-100 text-amber-700',   btn: 'bg-amber-500 hover:bg-amber-600',   text: 'text-amber-600' },
  blue:    { card: 'bg-blue-50 border-blue-200',     badge: 'bg-blue-100 text-blue-700',     btn: 'bg-blue-500 hover:bg-blue-600',     text: 'text-blue-600' },
  violet:  { card: 'bg-violet-50 border-violet-200', badge: 'bg-violet-100 text-violet-700', btn: 'bg-violet-500 hover:bg-violet-600', text: 'text-violet-600' },
  emerald: { card: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', btn: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-emerald-600' },
  slate:   { card: 'bg-slate-50 border-slate-200',   badge: 'bg-slate-100 text-slate-700',   btn: 'bg-slate-600 hover:bg-slate-700',   text: 'text-slate-600' },
};

// ── Main component ────────────────────────────────────────────────────────────

export default function CloudHubPanel({ isOpen, onClose, expenses, onToast }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [hubState, setHubState] = useState<CloudHubState | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    if (isOpen && !hubState) {
      setHubState(loadCloudState());
    }
  }, [isOpen, hubState]);

  const persist = useCallback((updater: (s: CloudHubState) => CloudHubState) => {
    setHubState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveCloudState(next);
      return next;
    });
  }, []);

  // Keyboard close
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const connectedCount = useMemo(() => {
    if (!hubState) return 0;
    return Object.values(hubState.integrations).filter((i) => i.status === 'connected').length;
  }, [hubState]);

  if (!isOpen || !hubState) return null;

  // ── Tab render functions ────────────────────────────────────────────────────

  const renderTemplates = () => (
    <TemplatesTab expenses={expenses} hubState={hubState} persist={persist} onToast={onToast} />
  );

  const renderIntegrations = () => (
    <IntegrationsTab hubState={hubState} persist={persist} onToast={onToast} />
  );

  const renderSchedule = () => (
    <ScheduleTab hubState={hubState} persist={persist} onToast={onToast} />
  );

  const renderHistory = () => (
    <HistoryTab hubState={hubState} expenses={expenses} persist={persist} onToast={onToast} />
  );

  const renderShare = () => (
    <ShareTab hubState={hubState} persist={persist} onToast={onToast} />
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer — slides in from right */}
      <div
        className="fixed right-0 top-0 h-full z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right"
        style={{ animationFillMode: 'both' }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white leading-none">Sync Hub</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              {connectedCount} service{connectedCount !== 1 ? 's' : ''} connected · {hubState.schedules.filter(s => s.enabled).length} active schedule{hubState.schedules.filter(s => s.enabled).length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body: sidebar + content ──────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar nav */}
          <nav className="w-16 flex-shrink-0 flex flex-col items-center pt-3 pb-4 gap-1 border-r border-slate-100 bg-slate-50/70">
            {TAB_DEFS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-white'
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </nav>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {/* Tab label */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="text-sm font-semibold text-slate-800">
                {TAB_DEFS.find((t) => t.id === activeTab)?.label}
              </h3>
            </div>

            <div className="p-5">
              {activeTab === 'templates' && renderTemplates()}
              {activeTab === 'integrations' && renderIntegrations()}
              {activeTab === 'schedule' && renderSchedule()}
              {activeTab === 'history' && renderHistory()}
              {activeTab === 'share' && renderShare()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Templates Tab ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function TemplatesTab({
  expenses,
  hubState,
  persist,
  onToast,
}: {
  expenses: Expense[];
  hubState: CloudHubState;
  persist: (fn: (s: CloudHubState) => CloudHubState) => void;
  onToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [exporting, setExporting] = useState<TemplateId | null>(null);
  const [destination, setDestination] = useState<{ [k in TemplateId]?: string }>({});

  const connectedIntegrations = Object.values(hubState.integrations).filter(
    (i) => i.status === 'connected'
  );

  async function handleExport(templateId: TemplateId, dest: string) {
    setExporting(templateId);
    await new Promise((r) => setTimeout(r, 900));

    const template = EXPORT_TEMPLATES.find((t) => t.id === templateId)!;

    // Simulate destination-based export
    if (dest === 'download' || !dest) {
      for (const fmt of template.formats) {
        if (fmt === 'CSV') generateCSV(expenses, templateId);
        if (fmt === 'JSON') generateJSON(expenses, templateId);
        if (fmt === 'PDF') generateTemplatePDF(templateId, expenses);
      }
    } else if (dest === 'google-sheets') {
      // Simulate sync
      await new Promise((r) => setTimeout(r, 600));
    }

    const destLabel =
      dest === 'download' || !dest
        ? 'Downloaded'
        : INTEGRATION_META[dest as IntegrationId]?.label ?? dest;

    const entry = buildHistoryEntry(
      templateId,
      dest === 'download' || !dest ? 'download' : (dest as IntegrationId),
      destLabel,
      expenses
    );

    persist((s) => ({ ...s, history: [entry, ...s.history] }));
    setExporting(null);
    onToast(`${template.label} exported to ${destLabel}`);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 mb-4">
        Pre-built export templates optimised for different use cases. Each template applies the right format, date range, and layout automatically.
      </p>
      {EXPORT_TEMPLATES.map((tpl) => {
        const ac = ACCENT[tpl.accentColor];
        const dest = destination[tpl.id] ?? 'download';
        const isLoading = exporting === tpl.id;
        return (
          <div key={tpl.id} className={`rounded-xl border p-4 ${ac.card}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5 flex-shrink-0">{tpl.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{tpl.label}</span>
                  {tpl.recommended && (
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wide">Popular</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{tpl.description}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${ac.badge}`}>
                    {tpl.dateRangeLabel}
                  </span>
                  {tpl.formats.map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/70 text-slate-600 border border-slate-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination + Export button */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5">
              <select
                value={dest}
                onChange={(e) => setDestination((p) => ({ ...p, [tpl.id]: e.target.value }))}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="download">⬇ Download</option>
                {connectedIntegrations.map((i) => (
                  <option key={i.id} value={i.id}>
                    ↗ {INTEGRATION_META[i.id].label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleExport(tpl.id, dest)}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${ac.btn} disabled:opacity-60`}
              >
                {isLoading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Exporting…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Integrations Tab ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function IntegrationsTab({
  hubState,
  persist,
  onToast,
}: {
  hubState: CloudHubState;
  persist: (fn: (s: CloudHubState) => CloudHubState) => void;
  onToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [connecting, setConnecting] = useState<IntegrationId | null>(null);
  const [syncing, setSyncing] = useState<IntegrationId | null>(null);
  const [oauthStep, setOauthStep] = useState<0 | 1 | 2>(0); // 0=none 1=authorising 2=success

  async function handleConnect(id: IntegrationId) {
    setConnecting(id);
    setOauthStep(1);
    await new Promise((r) => setTimeout(r, 1800));
    setOauthStep(2);
    await new Promise((r) => setTimeout(r, 900));

    const email = `me@${id === 'google-sheets' ? 'gmail.com' : id === 'notion' ? 'notion.so' : id === 'slack' ? 'slack-workspace' : 'example.com'}`;
    persist((s) => ({
      ...s,
      integrations: {
        ...s.integrations,
        [id]: {
          id,
          status: 'connected',
          connectedAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
          accountLabel: email,
          itemsSynced: 0,
        },
      },
    }));
    setOauthStep(0);
    setConnecting(null);
    onToast(`${INTEGRATION_META[id].label} connected successfully`);
  }

  async function handleSync(id: IntegrationId) {
    setSyncing(id);
    persist((s) => ({
      ...s,
      integrations: { ...s.integrations, [id]: { ...s.integrations[id], status: 'syncing' } },
    }));
    await new Promise((r) => setTimeout(r, 2000));
    persist((s) => ({
      ...s,
      integrations: {
        ...s.integrations,
        [id]: {
          ...s.integrations[id],
          status: 'connected',
          lastSyncAt: new Date().toISOString(),
          itemsSynced: (s.integrations[id].itemsSynced ?? 0) + 1,
        },
      },
    }));
    setSyncing(null);
    onToast(`${INTEGRATION_META[id].label} synced`);
  }

  function handleDisconnect(id: IntegrationId) {
    persist((s) => ({
      ...s,
      integrations: { ...s.integrations, [id]: { id, status: 'disconnected' } },
    }));
    onToast(`${INTEGRATION_META[id].label} disconnected`, 'error');
  }

  const integrationIds = Object.keys(INTEGRATION_META) as IntegrationId[];

  return (
    <div>
      {/* OAuth overlay */}
      {connecting && (
        <div className="mb-4 rounded-xl bg-indigo-50 border border-indigo-200 p-4 flex items-center gap-3">
          {oauthStep === 1 ? (
            <>
              <svg className="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <div>
                <p className="text-sm font-semibold text-indigo-800">Authorising with {INTEGRATION_META[connecting].label}…</p>
                <p className="text-xs text-indigo-500 mt-0.5">Waiting for OAuth confirmation</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Authorization successful!</p>
                <p className="text-xs text-emerald-600 mt-0.5">Finalising connection…</p>
              </div>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 mb-4">
        Connect cloud services to sync expenses automatically. Connected integrations can be used as export destinations in Templates and Schedules.
      </p>

      <div className="space-y-3">
        {integrationIds.map((id) => {
          const meta = INTEGRATION_META[id];
          const intg = hubState.integrations[id];
          const isConnected = intg.status === 'connected';
          const isSyncing = intg.status === 'syncing' || syncing === id;

          return (
            <div key={id} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3">
                {/* Logo placeholder */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                  style={{ background: meta.logoBg, color: meta.logoColor }}
                >
                  {id === 'google-sheets' ? '☷' :
                   id === 'dropbox' ? '◈' :
                   id === 'onedrive' ? '⬡' :
                   id === 'email' ? '✉' :
                   id === 'slack' ? '#' : '◉'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{meta.label}</span>
                    {isConnected && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Connected
                      </span>
                    )}
                    {isSyncing && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Syncing
                      </span>
                    )}
                  </div>
                  {isConnected ? (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {intg.accountLabel} · Last sync {timeAgo(intg.lastSyncAt!)}
                      {intg.itemsSynced !== undefined && ` · ${intg.itemsSynced} exports`}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                  )}
                </div>

                {/* Actions */}
                {isConnected ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleSync(id)}
                      disabled={isSyncing}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      Sync
                    </button>
                    <button
                      onClick={() => handleDisconnect(id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(id)}
                    disabled={!!connecting}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors disabled:opacity-40"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Schedule Tab ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ScheduleTab({
  hubState,
  persist,
  onToast,
}: {
  hubState: CloudHubState;
  persist: (fn: (s: CloudHubState) => CloudHubState) => void;
  onToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    templateId: 'monthly-summary' as TemplateId,
    frequency: 'monthly' as ScheduledExport['frequency'],
    destinationType: 'email' as string,
    email: '',
  });

  const connectedIntegrations = Object.values(hubState.integrations).filter(
    (i) => i.status === 'connected'
  );

  function nextRun(freq: ScheduledExport['frequency']): string {
    const d = new Date();
    if (freq === 'daily') d.setDate(d.getDate() + 1);
    else if (freq === 'weekly') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }

  function handleCreate() {
    if (form.destinationType === 'email' && !form.email.trim()) {
      onToast('Please enter an email address', 'error');
      return;
    }
    const destLabel =
      form.destinationType === 'email'
        ? form.email.trim()
        : INTEGRATION_META[form.destinationType as IntegrationId]?.label ?? form.destinationType;

    const schedule: ScheduledExport = {
      id: `sched-${Date.now().toString(36)}`,
      enabled: true,
      templateId: form.templateId,
      frequency: form.frequency,
      destinationType: form.destinationType as ScheduledExport['destinationType'],
      destinationLabel: destLabel,
      nextRunAt: nextRun(form.frequency),
      createdAt: new Date().toISOString(),
      runCount: 0,
    };

    persist((s) => ({ ...s, schedules: [...s.schedules, schedule] }));
    setShowForm(false);
    setForm({ templateId: 'monthly-summary', frequency: 'monthly', destinationType: 'email', email: '' });
    onToast('Schedule created');
  }

  function toggleSchedule(id: string) {
    persist((s) => ({
      ...s,
      schedules: s.schedules.map((sc) =>
        sc.id === id ? { ...sc, enabled: !sc.enabled } : sc
      ),
    }));
  }

  function deleteSchedule(id: string) {
    persist((s) => ({ ...s, schedules: s.schedules.filter((sc) => sc.id !== id) }));
    onToast('Schedule removed', 'error');
  }

  const FREQ_LABEL: Record<ScheduledExport['frequency'], string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">
          Automate your exports. Scheduled exports run in the background and deliver to your chosen destination.
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex-shrink-0 ml-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          New
        </button>
      </div>

      {/* New schedule form */}
      {showForm && (
        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-indigo-800">New Scheduled Export</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Template</label>
              <select
                value={form.templateId}
                onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value as TemplateId }))}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
              >
                {EXPORT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value as ScheduledExport['frequency'] }))}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Destination</label>
              <select
                value={form.destinationType}
                onChange={(e) => setForm((p) => ({ ...p, destinationType: e.target.value }))}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
              >
                <option value="email">Email</option>
                {connectedIntegrations.map((i) => (
                  <option key={i.id} value={i.id}>{INTEGRATION_META[i.id].label}</option>
                ))}
              </select>
            </div>
            {form.destinationType === 'email' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 placeholder-slate-300"
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Create Schedule
            </button>
          </div>
        </div>
      )}

      {/* Schedule list */}
      {hubState.schedules.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm">No schedules yet</p>
          <p className="text-xs mt-1">Create one to automate your exports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hubState.schedules.map((sched) => {
            const tpl = EXPORT_TEMPLATES.find((t) => t.id === sched.templateId);
            return (
              <div
                key={sched.id}
                className={`rounded-xl border p-4 transition-colors ${
                  sched.enabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{tpl?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{tpl?.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wide">
                        {FREQ_LABEL[sched.frequency]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      → {sched.destinationLabel}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span>Next: {formatAbsolute(sched.nextRunAt)}</span>
                      {sched.lastRunAt && <span>Last: {timeAgo(sched.lastRunAt)}</span>}
                      <span>{sched.runCount} run{sched.runCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleSchedule(sched.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        sched.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          sched.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => deleteSchedule(sched.id)}
                      className="p-1 rounded text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── History Tab ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function HistoryTab({
  hubState,
  expenses,
  persist,
  onToast,
}: {
  hubState: CloudHubState;
  expenses: Expense[];
  persist: (fn: (s: CloudHubState) => CloudHubState) => void;
  onToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [rerunning, setRerunning] = useState<string | null>(null);

  async function handleRerun(entry: (typeof hubState.history)[0]) {
    setRerunning(entry.id);
    await new Promise((r) => setTimeout(r, 1000));

    // Actually trigger the export
    const tpl = EXPORT_TEMPLATES.find((t) => t.id === entry.templateId);
    if (entry.destinationType === 'download' && tpl) {
      for (const fmt of tpl.formats) {
        if (fmt === 'CSV') generateCSV(expenses, entry.templateId);
        if (fmt === 'JSON') generateJSON(expenses, entry.templateId);
        if (fmt === 'PDF') generateTemplatePDF(entry.templateId, expenses);
      }
    }

    const newEntry = buildHistoryEntry(
      entry.templateId,
      entry.destinationType,
      entry.destinationLabel,
      expenses
    );
    persist((s) => ({ ...s, history: [newEntry, ...s.history] }));
    setRerunning(null);
    onToast(`Re-exported ${entry.templateLabel}`);
  }

  function clearHistory() {
    persist((s) => ({ ...s, history: [] }));
    onToast('History cleared', 'error');
  }

  const DEST_ICON: Record<string, string> = {
    download: '⬇',
    'google-sheets': '☷',
    dropbox: '◈',
    onedrive: '⬡',
    email: '✉',
    slack: '#',
    notion: '◉',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">{hubState.history.length} export{hubState.history.length !== 1 ? 's' : ''} recorded</p>
        {hubState.history.length > 0 && (
          <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-600">
            Clear all
          </button>
        )}
      </div>

      {hubState.history.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p className="text-sm">No exports yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {hubState.history.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-slate-100 bg-white p-3.5 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3">
                {/* Destination icon */}
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                  {DEST_ICON[entry.destinationType] ?? '⬇'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-700 truncate">{entry.templateLabel}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        entry.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : entry.status === 'failed'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                    <span>{timeAgo(entry.timestamp)}</span>
                    <span>·</span>
                    <span>{entry.destinationLabel}</span>
                    <span>·</span>
                    <span>{entry.recordCount} records</span>
                    <span>·</span>
                    <span>{formatCurrency(entry.totalAmount)}</span>
                    {entry.fileSizeKb && <><span>·</span><span>{entry.fileSizeKb} KB</span></>}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    {entry.formats.map((f) => (
                      <span key={f} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-500">{f}</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleRerun(entry)}
                  disabled={rerunning === entry.id}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  {rerunning === entry.id ? (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  )}
                  Re-run
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Share Tab ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ShareTab({
  hubState,
  persist,
  onToast,
}: {
  hubState: CloudHubState;
  persist: (fn: (s: CloudHubState) => CloudHubState) => void;
  onToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [form, setForm] = useState({
    templateId: 'monthly-summary' as TemplateId,
    expiry: '7d' as ShareExpiry,
    passwordProtected: false,
  });
  const [generating, setGenerating] = useState(false);
  const [activeLink, setActiveLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  const BASE_URL = 'https://expense-tracker.app/share';

  async function handleGenerate() {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 700));
    const link = buildShareLink(form.templateId, form.expiry, form.passwordProtected);
    persist((s) => ({ ...s, shareLinks: [link, ...s.shareLinks] }));
    setActiveLink(link);
    setGenerating(false);
    onToast('Share link generated');
  }

  function copyLink(shortCode: string) {
    const url = `${BASE_URL}/${shortCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onToast('Link copied to clipboard');
  }

  function revokeLink(id: string) {
    persist((s) => ({
      ...s,
      shareLinks: s.shareLinks.map((l) => (l.id === id ? { ...l, active: false } : l)),
    }));
    if (activeLink?.id === id) setActiveLink(null);
    onToast('Link revoked', 'error');
  }

  const EXPIRY_LABEL: Record<ShareExpiry, string> = {
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
    never: 'Never expires',
  };

  const activeLinks = hubState.shareLinks.filter((l) => l.active && !isExpired(l.expiresAt));

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        Generate a shareable read-only link to your expense report. Recipients can view the data without needing an account.
      </p>

      {/* Generator form */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-700">Generate New Share Link</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Template</label>
            <select
              value={form.templateId}
              onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value as TemplateId }))}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
            >
              {EXPORT_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Expires in</label>
            <select
              value={form.expiry}
              onChange={(e) => setForm((p) => ({ ...p, expiry: e.target.value as ShareExpiry }))}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
            >
              {(Object.keys(EXPIRY_LABEL) as ShareExpiry[]).map((k) => (
                <option key={k} value={k}>{EXPIRY_LABEL[k]}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={form.passwordProtected}
              onChange={(e) => setForm((p) => ({ ...p, passwordProtected: e.target.checked }))}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                form.passwordProtected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
              }`}
            >
              {form.passwordProtected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
          </div>
          <span className="text-xs text-slate-600">Password protect this link</span>
        </label>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {generating ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generating…
            </>
          ) : 'Generate Link'}
        </button>
      </div>

      {/* Newly generated link spotlight */}
      {activeLink && (
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/>
            </svg>
            <span className="text-xs font-semibold text-indigo-800">Share link ready</span>
            {activeLink.passwordProtected && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-800 text-[10px] font-bold">🔒 Protected</span>
            )}
          </div>

          {/* QR + URL side by side */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <QRVisual value={`${BASE_URL}/${activeLink.shortCode}`} size={100} />
              <p className="text-[10px] text-slate-400 mt-1 text-center">Scan to open</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 mb-1">Share URL</p>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-indigo-200 px-2.5 py-2 mb-3">
                <code className="text-xs text-slate-700 flex-1 truncate">
                  {BASE_URL}/{activeLink.shortCode}
                </code>
                <button
                  onClick={() => copyLink(activeLink.shortCode)}
                  className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                    copied ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <p>📋 <b>{activeLink.templateLabel}</b></p>
                <p>⏰ Expires: {activeLink.expiresAt ? formatAbsolute(activeLink.expiresAt) : 'Never'}</p>
                <p>👁 {activeLink.accessCount} views</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active links list */}
      {activeLinks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Active Links ({activeLinks.length})</p>
          <div className="space-y-2">
            {activeLinks.map((link) => (
              <div key={link.id} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-indigo-600">{link.shortCode}</code>
                    {link.passwordProtected && <span className="text-[10px]">🔒</span>}
                    <span className="text-[10px] text-slate-400">{link.templateLabel}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {link.accessCount} view{link.accessCount !== 1 ? 's' : ''} ·{' '}
                    {link.expiresAt
                      ? `expires ${formatAbsolute(link.expiresAt)}`
                      : 'never expires'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyLink(link.shortCode)}
                    className="px-2 py-1 rounded text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => revokeLink(link.id)}
                    className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-50 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
