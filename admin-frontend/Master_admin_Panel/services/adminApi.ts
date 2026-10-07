import { supabase } from '@/lib/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    // If not logged in, pass empty to let backend return 401
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = json.message || json.error || `HTTP error ${res.status}`;
    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).code = json.code;
    throw err;
  }

  return json.data !== undefined ? json.data : json;
}

// 1. Settings
export async function getAdminSettings() {
  return request<any>('/admin/settings');
}

export async function updateAdminSettings(updates: any) {
  return request<any>('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// 2. Analytics
export async function getAdminAnalytics() {
  return request<any>('/admin/analytics');
}

// 3. Users
export async function getAdminUsers(params: { search?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  const qStr = query.toString();
  return request<any[]>(`/admin/users${qStr ? `?${qStr}` : ''}`);
}

export async function updateUserStatus(id: string, isSuspended: boolean, reason?: string) {
  return request<any>(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isSuspended, reason }),
  });
}

export async function deleteUser(id: string) {
  return request<any>(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

// 4. Businesses
export async function getAdminBusinesses(params: { search?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  const qStr = query.toString();
  return request<any[]>(`/admin/businesses${qStr ? `?${qStr}` : ''}`);
}

export async function updateBusinessStatus(id: string, isSuspended: boolean, reason?: string) {
  return request<any>(`/admin/businesses/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isSuspended, reason }),
  });
}

// 5. Storage
export async function getAdminStorage() {
  return request<any>('/admin/storage');
}

// 6. Announcements
export async function getAdminAnnouncements() {
  return request<any[]>('/admin/announcements');
}

export async function createAdminAnnouncement(data: {
  title: string;
  message: string;
  type?: string;
  target?: string;
  target_id?: string | null;
  expires_at?: string | null;
}) {
  return request<any>('/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function toggleAdminAnnouncement(id: string, isActive: boolean) {
  return request<any>(`/admin/announcements/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function deleteAdminAnnouncement(id: string) {
  return request<any>(`/admin/announcements/${id}`, {
    method: 'DELETE',
  });
}

// 7. Audit Logs
export async function getAdminAuditLogs(params: { limit?: number; offset?: number; search?: string; action?: string } = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  if (params.search) query.set('search', params.search);
  if (params.action) query.set('action', params.action);
  const qStr = query.toString();
  return request<{ logs: any[]; total: number }>(`/admin/audit-logs${qStr ? `?${qStr}` : ''}`);
}

// 8. Health Diagnostics
export async function getAdminHealthDiagnostics() {
  return request<any>('/admin/health-diagnostics');
}

// 9. Feature Flags
export async function getAdminFeatureFlags() {
  return request<any>('/admin/feature-flags');
}

export async function updateAdminFeatureFlags(flags: Record<string, boolean>) {
  return request<any>('/admin/feature-flags', {
    method: 'PATCH',
    body: JSON.stringify(flags),
  });
}

// 10. Auth Verification
export async function verifyMasterAdminSession() {
  return request<any>('/admin/auth/verify');
}
