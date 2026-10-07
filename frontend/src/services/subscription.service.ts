/**
 * subscription.service.ts
 *
 * Frontend service to fetch subscription status, usage, and submit payments
 * from the backend API.
 */

import { supabase } from '@/lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }
  
  return data.data || data;
}

export type PlanName = 'trial' | 'pro';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface UserSubscription {
  userId: string;
  plan: PlanName;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  activatedAt: string | null;
}

export interface UsageStats {
  productsUsed: number;
  invoicesUsed: number;
  maxProducts: number;
  maxInvoices: number;
  canCreateProduct: boolean;
  canCreateInvoice: boolean;
  isPro: boolean;
  planName: PlanName;
}

export interface PaymentConfig {
  upiId: string;
  qrCodeUrl: string;
  proPrice: number;
  paymentInstructions: string;
}

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
}

export interface SubscriptionStatusResponse {
  subscription: UserSubscription;
  usage: UsageStats;
  paymentConfig: PaymentConfig;
}

/**
 * Fetch current subscription status, limits, and payment config
 */
export async function fetchSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  const data = await apiCall('/api/v1/subscription/status');
  return data;
}

/**
 * Submit a manual QR payment request
 */
export async function submitPayment(payload: {
  amount: number;
  utrNumber?: string;
  paymentDate?: string;
  proofUrl?: string;
}): Promise<PlanPayment> {
  const data = await apiCall('/api/v1/subscription/payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Fetch user's own payment history
 */
export async function fetchUserPayments(): Promise<PlanPayment[]> {
  const data = await apiCall('/api/v1/subscription/payments');
  return data;
}

/**
 * Cancel a pending payment
 */
export async function cancelPayment(paymentId: string): Promise<void> {
  await apiCall(`/api/v1/subscription/payment/${paymentId}/cancel`, {
    method: 'POST',
  });
}
