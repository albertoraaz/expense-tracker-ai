// ── Integration types ─────────────────────────────────────────────────────────

export type IntegrationId =
  | 'google-sheets'
  | 'dropbox'
  | 'onedrive'
  | 'email'
  | 'slack'
  | 'notion';

export type IntegrationStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export interface Integration {
  id: IntegrationId;
  status: IntegrationStatus;
  connectedAt?: string;   // ISO
  lastSyncAt?: string;    // ISO
  accountLabel?: string;  // email or workspace name
  itemsSynced?: number;
}

// ── Template types ────────────────────────────────────────────────────────────

export type TemplateId =
  | 'tax-report'
  | 'monthly-summary'
  | 'category-analysis'
  | 'business-expenses'
  | 'full-export';

export interface ExportTemplate {
  id: TemplateId;
  label: string;
  description: string;
  emoji: string;
  formats: string[];         // e.g. ['PDF', 'CSV']
  dateRangeLabel: string;
  accentColor: string;       // Tailwind color name
  recommended?: boolean;
}

// ── Schedule types ────────────────────────────────────────────────────────────

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export interface ScheduledExport {
  id: string;
  enabled: boolean;
  templateId: TemplateId;
  frequency: ScheduleFrequency;
  destinationType: 'email' | IntegrationId;
  destinationLabel: string;
  nextRunAt: string;   // ISO
  lastRunAt?: string;  // ISO
  createdAt: string;   // ISO
  runCount: number;
}

// ── Export history ────────────────────────────────────────────────────────────

export type ExportStatus = 'completed' | 'failed' | 'processing';

export interface ExportHistoryEntry {
  id: string;
  timestamp: string;    // ISO
  templateId: TemplateId;
  templateLabel: string;
  destinationType: 'download' | 'email' | IntegrationId;
  destinationLabel: string;
  formats: string[];
  recordCount: number;
  totalAmount: number;
  status: ExportStatus;
  fileSizeKb?: number;
}

// ── Share links ───────────────────────────────────────────────────────────────

export type ShareExpiry = '24h' | '7d' | '30d' | 'never';

export interface ShareLink {
  id: string;
  shortCode: string;     // e.g. "xp-a1b2c3"
  createdAt: string;     // ISO
  expiresAt: string | null;
  expiryLabel: ShareExpiry;
  templateId: TemplateId;
  templateLabel: string;
  accessCount: number;
  passwordProtected: boolean;
  active: boolean;
}

// ── Hub state ─────────────────────────────────────────────────────────────────

export interface CloudHubState {
  integrations: Record<IntegrationId, Integration>;
  schedules: ScheduledExport[];
  history: ExportHistoryEntry[];
  shareLinks: ShareLink[];
}
