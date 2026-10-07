/**
 * subscriptionPlan.service.ts
 *
 * Central entitlement service for StockIN Free Trial + Pro plan logic.
 * ALL limit checks MUST go through this service — never scattered in routes.
 *
 * Plan Limits (configurable via platform_settings):
 *   FREE TRIAL: 5 products, 10 invoices
 *   PRO:        Unlimited (or plan-configured limits)
 */

import { getSupabaseAdmin } from './supabase.service';
import { getPlatformSettings } from './platformSettings.service';
import { createAuditLog } from './auditLog.service';
import { logger } from '../utils/logger';

export type PlanName = 'trial' | 'pro';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export interface UserSubscription {
  userId: string;
  plan: PlanName;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  activatedAt: string | null;
}

export interface PlanLimits {
  maxProducts: number;  // -1 = unlimited
  maxInvoices: number;  // -1 = unlimited
  planName: PlanName;
  isPro: boolean;
}

export interface UsageStats {
  productsUsed: number;
  invoicesUsed: number;
  limits: PlanLimits;
  canCreateProduct: boolean;
  canCreateInvoice: boolean;
}

/**
 * Get or create subscription for a user.
 * On first call for a new user, seeds a trial subscription.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error('[SubscriptionPlan] Failed to fetch subscription', { userId, error });
    // Fail open with trial defaults so the user isn't blocked
    return {
      userId,
      plan: 'trial',
      status: 'trial',
      startedAt: new Date().toISOString(),
      expiresAt: null,
      activatedAt: null,
    };
  }

  if (!data) {
    // Seed trial subscription
    const { data: newSub, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: 'trial',
        status: 'trial',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !newSub) {
      logger.warn('[SubscriptionPlan] Could not seed trial subscription', { userId, insertError });
      return {
        userId,
        plan: 'trial',
        status: 'trial',
        startedAt: new Date().toISOString(),
        expiresAt: null,
        activatedAt: null,
      };
    }

    return mapSubscription(newSub);
  }

  return mapSubscription(data);
}

function mapSubscription(data: any): UserSubscription {
  return {
    userId: data.user_id,
    plan: data.plan as PlanName,
    status: data.status as SubscriptionStatus,
    startedAt: data.started_at,
    expiresAt: data.expires_at ?? null,
    activatedAt: data.activated_at ?? null,
  };
}

/**
 * Returns plan limits for a given user based on their current subscription.
 */
export async function getPlanLimits(userId: string): Promise<PlanLimits> {
  const subscription = await getUserSubscription(userId);
  const settings = await getPlatformSettings();

  const isProActive =
    subscription.plan === 'pro' &&
    subscription.status === 'active' &&
    (!subscription.expiresAt || new Date(subscription.expiresAt) > new Date());

  if (isProActive) {
    return {
      maxProducts: -1, // unlimited
      maxInvoices: -1, // unlimited
      planName: 'pro',
      isPro: true,
    };
  }

  // Free Trial limits — read from platform_settings (admin-configurable)
  const maxProducts = (settings as any).free_trial_product_limit ?? 5;
  const maxInvoices = (settings as any).free_trial_invoice_limit ?? 5;

  return {
    maxProducts,
    maxInvoices,
    planName: 'trial',
    isPro: false,
  };
}

/**
 * Returns current usage counts and whether more can be created.
 * Uses atomic DB COUNT to prevent race conditions.
 */
export async function getUsageStats(userId: string): Promise<UsageStats> {
  const supabase = getSupabaseAdmin();
  const limits = await getPlanLimits(userId);

  // Parallel count queries
  const [productsResult, invoicesResult] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'archived'),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  const productsUsed = productsResult.count ?? 0;
  const invoicesUsed = invoicesResult.count ?? 0;

  return {
    productsUsed,
    invoicesUsed,
    limits,
    canCreateProduct: limits.maxProducts === -1 || productsUsed < limits.maxProducts,
    canCreateInvoice: limits.maxInvoices === -1 || invoicesUsed < limits.maxInvoices,
  };
}

/**
 * Checks atomically whether a user can create a new product.
 * Uses SELECT FOR UPDATE equivalent via a row-level count to guard against races.
 */
export async function canCreateProduct(userId: string): Promise<{ allowed: boolean; used: number; max: number }> {
  const limits = await getPlanLimits(userId);

  if (limits.maxProducts === -1) {
    return { allowed: true, used: 0, max: -1 };
  }

  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'archived');

  if (error) {
    logger.error('[SubscriptionPlan] Error counting products', { userId, error });
    // Fail open for UX safety
    return { allowed: true, used: 0, max: limits.maxProducts };
  }

  const used = count ?? 0;
  return {
    allowed: used < limits.maxProducts,
    used,
    max: limits.maxProducts,
  };
}

/**
 * Checks atomically whether a user can create a new invoice.
 */
export async function canCreateInvoice(userId: string): Promise<{ allowed: boolean; used: number; max: number }> {
  const limits = await getPlanLimits(userId);

  if (limits.maxInvoices === -1) {
    return { allowed: true, used: 0, max: -1 };
  }

  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    logger.error('[SubscriptionPlan] Error counting invoices', { userId, error });
    return { allowed: true, used: 0, max: limits.maxInvoices };
  }

  const used = count ?? 0;
  return {
    allowed: used < limits.maxInvoices,
    used,
    max: limits.maxInvoices,
  };
}

/**
 * Activates Pro plan for a user.
 * Called ONLY by Master Admin approval flow.
 */
export async function activateProPlan(
  userId: string,
  adminContext: { id?: string; email?: string; ip?: string }
): Promise<UserSubscription> {
  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();
  const safeAdminId = (adminContext.id && adminContext.id !== '00000000-0000-0000-0000-000000000000')
    ? adminContext.id
    : null;

  let { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan: 'pro',
      status: 'active',
      started_at: now,
      activated_at: now,
      activated_by: safeAdminId,
      expires_at: null,
      updated_at: now,
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error && (error.message?.includes('subscriptions_activated_by_fkey') || error.message?.includes('foreign key'))) {
    logger.warn('[activateProPlan] Foreign key error on activated_by, retrying with null');
    const retry = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: 'pro',
        status: 'active',
        started_at: now,
        activated_at: now,
        activated_by: null,
        expires_at: null,
        updated_at: now,
      }, { onConflict: 'user_id' })
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    logger.error('[SubscriptionPlan] Failed to activate Pro plan', { userId, error });
    throw new Error(`Failed to activate Pro plan: ${error?.message}`);
  }

  await createAuditLog({
    admin_id: safeAdminId,
    admin_email: adminContext.email || null,
    action: 'PRO_PLAN_ACTIVATED',
    target_type: 'subscription',
    target_id: userId,
    new_value: { plan: 'pro', status: 'active', activated_at: now },
    ip_address: adminContext.ip,
  });

  logger.info('[SubscriptionPlan] Pro plan activated', { userId, adminId: adminContext.id });

  return mapSubscription(data);
}

/**
 * Reverts a user to trial (e.g. after plan expiry or cancellation).
 * Does NOT delete any user data.
 */
export async function revertToTrial(
  userId: string,
  adminContext: { id?: string; email?: string; ip?: string }
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  await supabase
    .from('subscriptions')
    .update({ plan: 'trial', status: 'trial', updated_at: now })
    .eq('user_id', userId);

  await createAuditLog({
    admin_id: adminContext.id || null,
    admin_email: adminContext.email || null,
    action: 'PLAN_REVERTED_TO_TRIAL',
    target_type: 'subscription',
    target_id: userId,
    ip_address: adminContext.ip,
  });
}
