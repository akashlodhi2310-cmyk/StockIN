import fs from 'node:fs';
import path from 'node:path';
import { getSupabaseAdmin } from './supabase.service';
import { createAuditLog } from './auditLog.service';
import { logger } from '../utils/logger';

export interface FeatureFlags {
  inventory: boolean;
  quotations: boolean;
  invoices: boolean;
  payments: boolean;
  reports: boolean;
  history: boolean;
  export: boolean;
}

export interface PlatformSettings {
  id: string;
  platform_name: string;
  platform_status: 'operational' | 'degraded' | 'maintenance';
  maintenance_mode: boolean;
  maintenance_message: string;
  allow_new_registrations: boolean;
  allow_business_registration: boolean;
  allow_user_login: boolean;
  allow_user_access: boolean;
  max_file_upload_size_mb: number;
  max_storage_per_business_mb: number;
  max_storage_per_user_mb: number;
  notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  system_alert_enabled: boolean;
  system_alert_message: string;
  system_alert_severity: 'info' | 'warning' | 'critical';
  system_alert_start_time: string | null;
  system_alert_end_time: string | null;
  feature_flags: FeatureFlags;
  session_timeout_minutes: number;
  updated_at: string;
  updated_by: string | null;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  platform_name: 'StockIN',
  platform_status: 'operational',
  maintenance_mode: false,
  maintenance_message: 'Platform is temporarily under maintenance. Please try again later.',
  allow_new_registrations: true,
  allow_business_registration: true,
  allow_user_login: true,
  allow_user_access: true,
  max_file_upload_size_mb: 10,
  max_storage_per_business_mb: 500,
  max_storage_per_user_mb: 100,
  notifications_enabled: true,
  email_notifications_enabled: false,
  system_alert_enabled: false,
  system_alert_message: '',
  system_alert_severity: 'info',
  system_alert_start_time: null,
  system_alert_end_time: null,
  feature_flags: {
    inventory: true,
    quotations: true,
    invoices: true,
    payments: true,
    reports: true,
    history: true,
    export: true,
  },
  session_timeout_minutes: 120,
  updated_at: new Date().toISOString(),
  updated_by: null,
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'platform_settings.json');

// In-memory cache for fast lookups
let cachedSettings: PlatformSettings | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readSettingsFromFile(): PlatformSettings {
  try {
    ensureDataDir();
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        feature_flags: {
          ...DEFAULT_SETTINGS.feature_flags,
          ...(parsed.feature_flags || {}),
        },
      };
    }
  } catch (err) {
    logger.error('Failed to read platform settings from file, using defaults', err);
  }
  return { ...DEFAULT_SETTINGS };
}

function writeSettingsToFile(settings: PlatformSettings) {
  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    cachedSettings = settings;
  } catch (err) {
    logger.error('Failed to write platform settings to file', err);
  }
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  // If memory cache is present, return it
  if (cachedSettings) {
    return cachedSettings;
  }

  // 1. Try fetching from Supabase database
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', DEFAULT_SETTINGS.id)
      .maybeSingle();

    if (!error && data) {
      const merged: PlatformSettings = {
        ...DEFAULT_SETTINGS,
        ...data,
        feature_flags: {
          ...DEFAULT_SETTINGS.feature_flags,
          ...(typeof data.feature_flags === 'object' && data.feature_flags !== null ? data.feature_flags : {}),
        },
      };
      writeSettingsToFile(merged);
      return merged;
    }
  } catch {
    // Supabase table may not exist yet, fall back to file
  }

  // 2. Read from persistent file
  const fileSettings = readSettingsFromFile();
  cachedSettings = fileSettings;
  return fileSettings;
}

export function getCachedPlatformSettings(): PlatformSettings {
  if (!cachedSettings) {
    cachedSettings = readSettingsFromFile();
  }
  return cachedSettings;
}

export async function updatePlatformSettings(
  updates: Partial<PlatformSettings>,
  adminContext?: { id?: string; email?: string; ip?: string }
): Promise<PlatformSettings> {
  const current = await getPlatformSettings();
  const updated: PlatformSettings = {
    ...current,
    ...updates,
    feature_flags: {
      ...current.feature_flags,
      ...(updates.feature_flags || {}),
    },
    updated_at: new Date().toISOString(),
    updated_by: adminContext?.id || current.updated_by,
  };

  // 1. Persist synchronously to local file storage
  writeSettingsToFile(updated);

  // 2. Persist to Supabase if table is available
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('platform_settings').upsert({
      id: updated.id,
      platform_name: updated.platform_name,
      platform_status: updated.platform_status,
      maintenance_mode: updated.maintenance_mode,
      maintenance_message: updated.maintenance_message,
      allow_new_registrations: updated.allow_new_registrations,
      allow_business_registration: updated.allow_business_registration,
      allow_user_login: updated.allow_user_login,
      allow_user_access: updated.allow_user_access,
      max_file_upload_size_mb: updated.max_file_upload_size_mb,
      max_storage_per_business_mb: updated.max_storage_per_business_mb,
      max_storage_per_user_mb: updated.max_storage_per_user_mb,
      notifications_enabled: updated.notifications_enabled,
      email_notifications_enabled: updated.email_notifications_enabled,
      system_alert_enabled: updated.system_alert_enabled,
      system_alert_message: updated.system_alert_message,
      system_alert_severity: updated.system_alert_severity,
      system_alert_start_time: updated.system_alert_start_time,
      system_alert_end_time: updated.system_alert_end_time,
      feature_flags: updated.feature_flags,
      session_timeout_minutes: updated.session_timeout_minutes,
      updated_at: updated.updated_at,
      updated_by: updated.updated_by,
    });
  } catch (err) {
    logger.warn('Failed to upsert to Supabase platform_settings (saved to persistent local file)', err);
  }

  // 3. Create Audit Log for changed settings
  const changedKeys = Object.keys(updates).filter(
    (key) => JSON.stringify((current as any)[key]) !== JSON.stringify((updated as any)[key])
  );

  if (changedKeys.length > 0) {
    const actionDesc = changedKeys.includes('maintenance_mode')
      ? (updated.maintenance_mode ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED')
      : changedKeys.includes('allow_new_registrations')
      ? (updated.allow_new_registrations ? 'REGISTRATIONS_ENABLED' : 'REGISTRATIONS_DISABLED')
      : 'PLATFORM_SETTINGS_UPDATED';

    await createAuditLog({
      admin_id: adminContext?.id || null,
      admin_email: adminContext?.email || null,
      action: actionDesc,
      target_type: 'platform_settings',
      target_id: updated.id,
      old_value: Object.fromEntries(changedKeys.map(k => [k, (current as any)[k]])),
      new_value: Object.fromEntries(changedKeys.map(k => [k, (updated as any)[k]])),
      ip_address: adminContext?.ip,
    });
  }

  return updated;
}

// Public-safe view of settings that any client or visitor can read
export function getPublicSettingsView(settings: PlatformSettings) {
  return {
    platform_name: settings.platform_name,
    platform_status: settings.platform_status,
    maintenance_mode: settings.maintenance_mode,
    maintenance_message: settings.maintenance_message,
    allow_new_registrations: settings.allow_new_registrations,
    allow_business_registration: settings.allow_business_registration,
    allow_user_login: settings.allow_user_login,
    system_alert_enabled: settings.system_alert_enabled,
    system_alert_message: settings.system_alert_message,
    system_alert_severity: settings.system_alert_severity,
    system_alert_start_time: settings.system_alert_start_time,
    system_alert_end_time: settings.system_alert_end_time,
    feature_flags: settings.feature_flags,
    updated_at: settings.updated_at,
  };
}
