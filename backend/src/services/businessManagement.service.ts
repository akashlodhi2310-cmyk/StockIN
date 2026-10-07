import fs from 'node:fs';
import path from 'node:path';
import { getSupabaseAdmin } from './supabase.service';
import { createAuditLog } from './auditLog.service';
import { logger } from '../utils/logger';

export interface BusinessSummary {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  businessType: string;
  gstin?: string;
  phone?: string;
  city?: string;
  status: 'active' | 'suspended';
  suspensionReason?: string;
  productsCount: number;
  invoicesCount: number;
  storageUsedMb: number;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BUSINESS_OVERRIDES_FILE = path.join(DATA_DIR, 'business_overrides.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readOverrides(): Record<string, { isSuspended: boolean; reason?: string }> {
  try {
    ensureDataDir();
    if (fs.existsSync(BUSINESS_OVERRIDES_FILE)) {
      return JSON.parse(fs.readFileSync(BUSINESS_OVERRIDES_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function writeOverrides(data: Record<string, { isSuspended: boolean; reason?: string }>) {
  try {
    ensureDataDir();
    fs.writeFileSync(BUSINESS_OVERRIDES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed to write business overrides', err);
  }
}

export function isBusinessSuspended(businessId: string): boolean {
  const overrides = readOverrides();
  return Boolean(overrides[businessId]?.isSuspended);
}

export async function listAllBusinesses(options: { search?: string; status?: string } = {}): Promise<BusinessSummary[]> {
  const supabase = getSupabaseAdmin();
  const overrides = readOverrides();

  let businesses: any[] = [];
  try {
    const { data } = await supabase.from('business_settings').select('*');
    if (data) businesses = data;
  } catch {}

  // Also query users to ensure every registered tenant has a business record
  let authUsers: any[] = [];
  try {
    const { data } = await supabase.auth.admin.listUsers();
    if (data?.users) authUsers = data.users;
  } catch {}

  const userMap: Record<string, any> = {};
  for (const u of authUsers) {
    userMap[u.id] = u;
  }

  // If no business_settings entries yet, generate representations for registered users
  if (businesses.length === 0 && authUsers.length > 0) {
    businesses = authUsers.map(u => ({
      id: u.id,
      user_id: u.id,
      business_name: u.user_metadata?.business_name || `${u.user_metadata?.full_name || 'User'}'s Enterprise`,
      business_type: 'Retail & Wholesale',
      created_at: u.created_at,
    }));
  }

  // Count products and invoices per business
  let productCounts: Record<string, number> = {};
  let invoiceCounts: Record<string, number> = {};
  try {
    const { data: pData } = await supabase.from('products').select('user_id');
    if (pData) {
      for (const p of pData) {
        productCounts[p.user_id] = (productCounts[p.user_id] || 0) + 1;
      }
    }
    const { data: iData } = await supabase.from('invoices').select('user_id');
    if (iData) {
      for (const i of iData) {
        invoiceCounts[i.user_id] = (invoiceCounts[i.user_id] || 0) + 1;
      }
    }
  } catch {}

  let results: BusinessSummary[] = businesses.map(b => {
    const owner = userMap[b.user_id] || {};
    const override = overrides[b.id] || overrides[b.user_id];
    const isSuspended = Boolean(override?.isSuspended);

    return {
      id: b.id,
      name: b.business_name || 'StockIN Tenant',
      ownerId: b.user_id || 'unknown',
      ownerEmail: owner.email || 'unknown@stockin.io',
      ownerName: owner.user_metadata?.full_name || 'Business Owner',
      businessType: b.business_type || 'Retail & Distribution',
      gstin: b.gstin || 'None Provided',
      phone: b.phone || owner.phone || 'N/A',
      city: b.city || 'India',
      status: isSuspended ? 'suspended' : 'active',
      suspensionReason: override?.reason,
      productsCount: productCounts[b.user_id] || 0,
      invoicesCount: invoiceCounts[b.user_id] || 0,
      storageUsedMb: 1.2,
      createdAt: b.created_at || owner.created_at || new Date().toISOString(),
    };
  });

  if (options.status) {
    results = results.filter(b => b.status === options.status);
  }
  if (options.search) {
    const q = options.search.toLowerCase();
    results = results.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.ownerEmail.toLowerCase().includes(q) ||
      b.ownerName.toLowerCase().includes(q)
    );
  }

  return results;
}

export async function updateBusinessStatus(
  businessId: string,
  isSuspended: boolean,
  reason?: string,
  adminContext?: { id?: string; email?: string; ip?: string }
): Promise<boolean> {
  const overrides = readOverrides();
  overrides[businessId] = { isSuspended, reason };
  writeOverrides(overrides);

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('business_status_overrides').upsert({
      business_id: businessId,
      is_suspended: isSuspended,
      suspension_reason: reason,
      suspended_at: isSuspended ? new Date().toISOString() : null,
      suspended_by: adminContext?.id,
      updated_at: new Date().toISOString(),
    });
  } catch {}

  await createAuditLog({
    admin_id: adminContext?.id || null,
    admin_email: adminContext?.email || null,
    action: isSuspended ? 'BUSINESS_SUSPENDED' : 'BUSINESS_ACTIVATED',
    target_type: 'business',
    target_id: businessId,
    new_value: { is_suspended: isSuspended, reason },
    ip_address: adminContext?.ip,
  });

  return true;
}
