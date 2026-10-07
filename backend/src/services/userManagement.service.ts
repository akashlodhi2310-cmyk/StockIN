import fs from 'node:fs';
import path from 'node:path';
import { getSupabaseAdmin } from './supabase.service';
import { createAuditLog } from './auditLog.service';
import { logger } from '../utils/logger';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
  role: string;
  status: 'active' | 'suspended';
  suspensionReason?: string;
  createdAt: string;
  lastSignInAt: string | null;
  storageEstimateMb: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const USER_OVERRIDES_FILE = path.join(DATA_DIR, 'user_overrides.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readOverrides(): Record<string, { isSuspended: boolean; reason?: string; updatedAt: string }> {
  try {
    ensureDataDir();
    if (fs.existsSync(USER_OVERRIDES_FILE)) {
      return JSON.parse(fs.readFileSync(USER_OVERRIDES_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function writeOverrides(overrides: Record<string, { isSuspended: boolean; reason?: string; updatedAt: string }>) {
  try {
    ensureDataDir();
    fs.writeFileSync(USER_OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed to write user overrides', err);
  }
}

export function isUserSuspended(userId: string): boolean {
  const overrides = readOverrides();
  return Boolean(overrides[userId]?.isSuspended);
}

export async function listAllUsers(options: { search?: string; status?: string } = {}): Promise<UserSummary[]> {
  const supabase = getSupabaseAdmin();
  let authUsers: any[] = [];

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) {
      logger.error('Failed to list Supabase auth users', error);
    } else if (data?.users) {
      authUsers = data.users;
    }
  } catch (err) {
    logger.error('Exception fetching auth users', err);
  }

  // Fetch profiles for enriched metadata
  let profilesMap: Record<string, any> = {};
  try {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) {
      for (const p of profiles) {
        profilesMap[p.id] = p;
      }
    }
  } catch {}

  // Fetch business settings
  let businessMap: Record<string, any> = {};
  try {
    const { data: businesses } = await supabase.from('business_settings').select('*');
    if (businesses) {
      for (const b of businesses) {
        businessMap[b.user_id] = b;
      }
    }
  } catch {}

  const overrides = readOverrides();

  let formatted: UserSummary[] = authUsers.map((u) => {
    const profile = profilesMap[u.id] || {};
    const business = businessMap[u.id] || {};
    const override = overrides[u.id];

    const isSuspended = override ? override.isSuspended : Boolean(u.user_metadata?.is_suspended);
    const suspensionReason = override?.reason || u.user_metadata?.suspension_reason;

    return {
      id: u.id,
      email: u.email || 'No Email',
      fullName: profile.full_name || u.user_metadata?.full_name || 'Anonymous User',
      businessName: business.business_name || profile.business_name || u.user_metadata?.business_name || 'Standard Account',
      role: u.role || 'authenticated',
      status: isSuspended ? 'suspended' : 'active',
      suspensionReason,
      createdAt: u.created_at || new Date().toISOString(),
      lastSignInAt: u.last_sign_in_at || null,
      storageEstimateMb: 0.5,
    };
  });

  if (options.status) {
    formatted = formatted.filter(u => u.status === options.status);
  }
  if (options.search) {
    const q = options.search.toLowerCase();
    formatted = formatted.filter(u =>
      u.email.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.businessName.toLowerCase().includes(q)
    );
  }

  return formatted;
}

export async function updateUserStatus(
  userId: string,
  isSuspended: boolean,
  reason?: string,
  adminContext?: { id?: string; email?: string; ip?: string }
): Promise<boolean> {
  const overrides = readOverrides();
  overrides[userId] = {
    isSuspended,
    reason,
    updatedAt: new Date().toISOString(),
  };
  writeOverrides(overrides);

  // Update Supabase Auth metadata
  try {
    const supabase = getSupabaseAdmin();
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        is_suspended: isSuspended,
        suspension_reason: reason || null,
      },
    });

    await supabase.from('user_status_overrides').upsert({
      user_id: userId,
      is_suspended: isSuspended,
      suspension_reason: reason,
      suspended_at: isSuspended ? new Date().toISOString() : null,
      suspended_by: adminContext?.id || null,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('Failed to update Supabase user metadata for suspension (persisted locally)', err);
  }

  await createAuditLog({
    admin_id: adminContext?.id || null,
    admin_email: adminContext?.email || null,
    action: isSuspended ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
    target_type: 'user',
    target_id: userId,
    new_value: { is_suspended: isSuspended, reason },
    ip_address: adminContext?.ip,
  });

  return true;
}

export async function deleteUserAccount(
  userId: string,
  adminContext?: { id?: string; email?: string; ip?: string }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      logger.error(`Failed to delete Supabase user ${userId}`, error);
      throw error;
    }
  } catch (err) {
    logger.error(`Exception deleting user ${userId}`, err);
    throw err;
  }

  const overrides = readOverrides();
  delete overrides[userId];
  writeOverrides(overrides);

  await createAuditLog({
    admin_id: adminContext?.id || null,
    admin_email: adminContext?.email || null,
    action: 'USER_DELETED',
    target_type: 'user',
    target_id: userId,
    ip_address: adminContext?.ip,
  });

  return true;
}
