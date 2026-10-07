import fs from 'node:fs';
import path from 'node:path';
import { getSupabaseAdmin } from './supabase.service';
import { logger } from '../utils/logger';

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  action: string;
  target_type?: string;
  target_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  created_at: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLogsFromFile(): AuditLogEntry[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(AUDIT_FILE)) {
      return [];
    }
    const content = fs.readFileSync(AUDIT_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    logger.error('Failed to read audit logs file', err);
    return [];
  }
}

function writeLogsToFile(logs: AuditLogEntry[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs.slice(-1000), null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed to write audit logs file', err);
  }
}

export async function createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<AuditLogEntry> {
  const newLog: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
    ...entry,
  };

  // 1. Persist to local store
  const existing = readLogsFromFile();
  existing.unshift(newLog);
  writeLogsToFile(existing);

  // 2. Persist to Supabase if table exists
  try {
    const supabase = getSupabaseAdmin();
    const safeAdminId = (entry.admin_id && entry.admin_id !== '00000000-0000-0000-0000-000000000000')
      ? entry.admin_id
      : null;
    await supabase.from('audit_logs').insert([{
      admin_id: safeAdminId,
      admin_email: entry.admin_email,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      old_value: entry.old_value,
      new_value: entry.new_value,
      ip_address: entry.ip_address,
      created_at: newLog.created_at,
    }]);
  } catch (err) {
    // Graceful fallback if table is pending migration
  }

  logger.info(`[AUDIT] ${entry.action} by ${entry.admin_email || 'system'} target: ${entry.target_type || 'none'}`);
  return newLog;
}

export async function getAuditLogs(options: {
  limit?: number;
  offset?: number;
  action?: string;
  search?: string;
} = {}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  // Try fetching from Supabase first
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from('audit_logs').select('*', { count: 'exact' });

    if (options.action) {
      query = query.eq('action', options.action);
    }
    if (options.search) {
      query = query.or(`action.ilike.%${options.search}%,admin_email.ilike.%${options.search}%,target_type.ilike.%${options.search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data, count, error } = await query;

    if (!error && data) {
      return {
        logs: data.map((d: any) => ({
          id: d.id,
          admin_id: d.admin_id,
          admin_email: d.admin_email,
          action: d.action,
          target_type: d.target_type,
          target_id: d.target_id,
          old_value: d.old_value,
          new_value: d.new_value,
          ip_address: d.ip_address,
          created_at: d.created_at,
        })),
        total: count || data.length,
      };
    }
  } catch {
    // Fall back to local file store
  }

  // Fallback to local store
  let logs = readLogsFromFile();
  if (options.action) {
    logs = logs.filter(l => l.action.toLowerCase() === options.action?.toLowerCase());
  }
  if (options.search) {
    const s = options.search.toLowerCase();
    logs = logs.filter(l =>
      l.action.toLowerCase().includes(s) ||
      (l.admin_email && l.admin_email.toLowerCase().includes(s)) ||
      (l.target_type && l.target_type.toLowerCase().includes(s))
    );
  }

  const total = logs.length;
  const sliced = logs.slice(offset, offset + limit);
  return { logs: sliced, total };
}
