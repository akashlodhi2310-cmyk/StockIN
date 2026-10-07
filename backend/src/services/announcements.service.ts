import fs from 'node:fs';
import path from 'node:path';
import { getSupabaseAdmin } from './supabase.service';
import { createAuditLog } from './auditLog.service';
import { logger } from '../utils/logger';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'important' | 'maintenance';
  target: 'all' | 'business' | 'user';
  target_id?: string | null;
  is_active: boolean;
  expires_at?: string | null;
  created_by?: string | null;
  created_at: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFromFile(): Announcement[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(ANNOUNCEMENTS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    logger.error('Failed to read announcements file', err);
    return [];
  }
}

function writeToFile(items: Announcement[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed to write announcements file', err);
  }
}

export async function getAnnouncements(options: { activeOnly?: boolean; target?: string; targetId?: string } = {}): Promise<Announcement[]> {
  // Try Supabase first
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from('announcements').select('*');
    if (options.activeOnly) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      return data;
    }
  } catch {
    // fallback to file
  }

  let items = readFromFile();
  if (options.activeOnly) {
    items = items.filter(a => a.is_active);
  }
  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createAnnouncement(
  data: Omit<Announcement, 'id' | 'created_at'>,
  adminContext?: { id?: string; email?: string; ip?: string }
): Promise<Announcement> {
  const newAnnouncement: Announcement = {
    id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
    ...data,
  };

  const items = readFromFile();
  items.unshift(newAnnouncement);
  writeToFile(items);

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('announcements').insert([{
      id: newAnnouncement.id,
      title: newAnnouncement.title,
      message: newAnnouncement.message,
      type: newAnnouncement.type,
      target: newAnnouncement.target,
      target_id: newAnnouncement.target_id,
      is_active: newAnnouncement.is_active,
      expires_at: newAnnouncement.expires_at,
      created_by: adminContext?.id,
      created_at: newAnnouncement.created_at,
    }]);
  } catch (err) {
    // fallback
  }

  await createAuditLog({
    admin_id: adminContext?.id || null,
    admin_email: adminContext?.email || null,
    action: 'ANNOUNCEMENT_CREATED',
    target_type: 'announcement',
    target_id: newAnnouncement.id,
    new_value: { title: newAnnouncement.title, type: newAnnouncement.type, target: newAnnouncement.target },
    ip_address: adminContext?.ip,
  });

  return newAnnouncement;
}

export async function toggleAnnouncement(
  id: string,
  isActive: boolean,
  adminContext?: { id?: string; email?: string; ip?: string }
): Promise<Announcement | null> {
  const items = readFromFile();
  const index = items.findIndex(a => a.id === id);
  if (index === -1) return null;

  items[index].is_active = isActive;
  writeToFile(items);

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('announcements').update({ is_active: isActive }).eq('id', id);
  } catch {}

  await createAuditLog({
    admin_id: adminContext?.id || null,
    admin_email: adminContext?.email || null,
    action: isActive ? 'ANNOUNCEMENT_ACTIVATED' : 'ANNOUNCEMENT_DEACTIVATED',
    target_type: 'announcement',
    target_id: id,
    new_value: { is_active: isActive },
    ip_address: adminContext?.ip,
  });

  return items[index];
}

export async function deleteAnnouncement(
  id: string,
  adminContext?: { id?: string; email?: string; ip?: string }
): Promise<boolean> {
  const items = readFromFile();
  const filtered = items.filter(a => a.id !== id);
  if (filtered.length === items.length) return false;

  writeToFile(filtered);

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('announcements').delete().eq('id', id);
  } catch {}

  await createAuditLog({
    admin_id: adminContext?.id || null,
    admin_email: adminContext?.email || null,
    action: 'ANNOUNCEMENT_DELETED',
    target_type: 'announcement',
    target_id: id,
    ip_address: adminContext?.ip,
  });

  return true;
}
