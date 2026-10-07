/**
 * planPayments.service.ts
 *
 * Manual QR payment management for StockIN Pro upgrades.
 * Handles payment submission, listing, approval, and rejection.
 *
 * SECURITY: Only Master Admin can approve/reject payments.
 * Pro plan is NEVER activated on payment submission — only on approval.
 */

import { getSupabaseAdmin } from './supabase.service';
import { createAuditLog } from './auditLog.service';
import { activateProPlan } from './subscriptionPlan.service';
import { logger } from '../utils/logger';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface PlanPayment {
  id: string;
  userId: string;
  plan: string;
  amount: number;
  currency: string;
  utrNumber: string | null;
  paymentDate: string | null;
  proofUrl: string | null;
  status: PaymentStatus;
  rejectionReason: string | null;
  submittedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  // Joined from profiles
  userEmail?: string;
  userFullName?: string;
  userBusinessName?: string;
}

function mapPayment(row: any): PlanPayment {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    amount: row.amount,
    currency: row.currency,
    utrNumber: row.utr_number ?? null,
    paymentDate: row.payment_date ?? null,
    proofUrl: row.proof_url ?? null,
    status: row.status as PaymentStatus,
    rejectionReason: row.rejection_reason ?? null,
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at ?? null,
    verifiedBy: row.verified_by ?? null,
    createdAt: row.created_at,
    userEmail: row.profiles?.email,
    userFullName: row.profiles?.full_name,
    userBusinessName: row.profiles?.business_name,
  };
}

/**
 * Submit a new payment request.
 * Status is set to 'pending' — Pro is NOT activated yet.
 */
export async function submitPayment(
  userId: string,
  data: {
    amount: number;
    utrNumber?: string;
    paymentDate?: string;
    proofUrl?: string;
  }
): Promise<PlanPayment> {
  const supabase = getSupabaseAdmin();

  // Check for already-pending payment to prevent spam
  const { data: existing } = await supabase
    .from('plan_payments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    throw new Error('You already have a pending payment request. Please wait for verification.');
  }

  const { data: payment, error } = await supabase
    .from('plan_payments')
    .insert({
      user_id: userId,
      plan: 'pro',
      amount: data.amount,
      currency: 'INR',
      utr_number: data.utrNumber || null,
      payment_date: data.paymentDate || null,
      proof_url: data.proofUrl || null,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !payment) {
    logger.error('[PlanPayments] Failed to submit payment', { userId, error });
    throw new Error(`Failed to submit payment: ${error?.message}`);
  }

  await createAuditLog({
    admin_id: null,
    admin_email: null,
    action: 'PAYMENT_SUBMITTED',
    target_type: 'plan_payment',
    target_id: payment.id,
    new_value: { user_id: userId, amount: data.amount, utr: data.utrNumber },
  });

  logger.info('[PlanPayments] Payment submitted', { paymentId: payment.id, userId });

  return mapPayment(payment);
}

/**
 * List all payment requests (for Master Admin).
 */
export async function listAllPayments(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ payments: PlanPayment[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  let query = supabase
    .from('plan_payments')
    .select(`
      *,
      profiles:user_id (
        email,
        full_name,
        business_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error('[PlanPayments] Failed to list payments', error);
    throw new Error(`Failed to list payments: ${error.message}`);
  }

  return {
    payments: (data || []).map(mapPayment),
    total: count ?? 0,
  };
}

/**
 * Get a single payment by ID (admin use).
 */
export async function getPaymentById(paymentId: string): Promise<PlanPayment | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('plan_payments')
    .select(`
      *,
      profiles:user_id (
        email,
        full_name,
        business_name
      )
    `)
    .eq('id', paymentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }

  return data ? mapPayment(data) : null;
}

/**
 * Get payment requests for a specific user (user-facing).
 */
export async function getUserPayments(userId: string): Promise<PlanPayment[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('plan_payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user payments: ${error.message}`);
  }

  return (data || []).map(mapPayment);
}

/**
 * APPROVE a payment — activates Pro plan for the user.
 * ONLY Master Admin should call this.
 */
export async function approvePayment(
  paymentId: string,
  adminContext: { id?: string; email?: string; ip?: string }
): Promise<PlanPayment> {
  const supabase = getSupabaseAdmin();

  const payment = await getPaymentById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }
  if (payment.status !== 'pending') {
    throw new Error(`Cannot approve a payment with status: ${payment.status}`);
  }

  const now = new Date().toISOString();
  const safeAdminId = (adminContext.id && adminContext.id !== '00000000-0000-0000-0000-000000000000')
    ? adminContext.id
    : null;

  // 1. Update payment status
  let { data: updated, error: updateError } = await supabase
    .from('plan_payments')
    .update({
      status: 'approved',
      verified_at: now,
      verified_by: safeAdminId,
      updated_at: now,
    })
    .eq('id', paymentId)
    .select()
    .single();

  // If failed due to foreign key on verified_by, retry with null
  if (updateError && (updateError.message?.includes('plan_payments_verified_by_fkey') || updateError.message?.includes('foreign key'))) {
    logger.warn('[approvePayment] Foreign key error on verified_by, retrying with null', { safeAdminId });
    const retry = await supabase
      .from('plan_payments')
      .update({
        status: 'approved',
        verified_at: now,
        verified_by: null,
        updated_at: now,
      })
      .eq('id', paymentId)
      .select()
      .single();
    updated = retry.data;
    updateError = retry.error;
  }

  if (updateError || !updated) {
    throw new Error(`Failed to approve payment: ${updateError?.message}`);
  }

  // 2. Activate Pro plan for the user (atomic upsert in subscriptions)
  await activateProPlan(payment.userId, {
    ...adminContext,
    id: safeAdminId || undefined,
  });

  // 3. Audit log
  await createAuditLog({
    admin_id: safeAdminId,
    admin_email: adminContext.email || null,
    action: 'PAYMENT_APPROVED',
    target_type: 'plan_payment',
    target_id: paymentId,
    new_value: {
      payment_id: paymentId,
      user_id: payment.userId,
      amount: payment.amount,
      status: 'approved',
    },
    ip_address: adminContext.ip,
  });

  logger.info('[PlanPayments] Payment approved, Pro activated', {
    paymentId,
    userId: payment.userId,
    adminId: safeAdminId,
  });

  return mapPayment(updated);
}

/**
 * REJECT a payment — user stays on Free Trial.
 * ONLY Master Admin should call this.
 */
export async function rejectPayment(
  paymentId: string,
  rejectionReason: string,
  adminContext: { id?: string; email?: string; ip?: string }
): Promise<PlanPayment> {
  const supabase = getSupabaseAdmin();

  const payment = await getPaymentById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }
  if (payment.status !== 'pending') {
    throw new Error(`Cannot reject a payment with status: ${payment.status}`);
  }

  const now = new Date().toISOString();
  const safeAdminId = (adminContext.id && adminContext.id !== '00000000-0000-0000-0000-000000000000')
    ? adminContext.id
    : null;

  let { data: updated, error } = await supabase
    .from('plan_payments')
    .update({
      status: 'rejected',
      rejection_reason: rejectionReason || 'Payment could not be verified.',
      verified_at: now,
      verified_by: safeAdminId,
      updated_at: now,
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error && (error.message?.includes('plan_payments_verified_by_fkey') || error.message?.includes('foreign key'))) {
    logger.warn('[rejectPayment] Foreign key error on verified_by, retrying with null', { safeAdminId });
    const retry = await supabase
      .from('plan_payments')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason || 'Payment could not be verified.',
        verified_at: now,
        verified_by: null,
        updated_at: now,
      })
      .eq('id', paymentId)
      .select()
      .single();
    updated = retry.data;
    error = retry.error;
  }

  if (error || !updated) {
    throw new Error(`Failed to reject payment: ${error?.message}`);
  }

  await createAuditLog({
    admin_id: safeAdminId,
    admin_email: adminContext.email || null,
    action: 'PAYMENT_REJECTED',
    target_type: 'plan_payment',
    target_id: paymentId,
    new_value: {
      payment_id: paymentId,
      user_id: payment.userId,
      reason: rejectionReason,
      status: 'rejected',
    },
    ip_address: adminContext.ip,
  });

  logger.info('[PlanPayments] Payment rejected', {
    paymentId,
    userId: payment.userId,
    adminId: adminContext.id,
  });

  return mapPayment(updated);
}

/**
 * Cancel a payment (by user). Only pending payments can be cancelled.
 */
export async function cancelPayment(paymentId: string, userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('plan_payments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw new Error(`Failed to cancel payment: ${error.message}`);
  }
}
