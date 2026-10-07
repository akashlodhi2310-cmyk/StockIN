import React, { useState, useEffect } from 'react';
import {
  Save,
  AlertTriangle,
  Shield,
  Globe,
  HardDrive,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Lock,
  Layers,
} from 'lucide-react';
import { getAdminSettings, updateAdminSettings } from '../services/adminApi';

export const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    platform_name: 'StockIN',
    platform_status: 'operational' as 'operational' | 'degraded' | 'maintenance',
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
    system_alert_severity: 'info' as 'info' | 'warning' | 'critical',
    session_timeout_minutes: 120,
    updated_at: '',
    payment_upi_id: '',
    payment_qr_code_url: '',
    pro_price: 999,
    payment_instructions: '',
    free_trial_product_limit: 5,
    free_trial_invoice_limit: 5,
  });

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSettings();
      setForm({
        platform_name: data.platform_name || 'StockIN',
        platform_status: data.platform_status || 'operational',
        maintenance_mode: Boolean(data.maintenance_mode),
        maintenance_message: data.maintenance_message || 'Platform is temporarily under maintenance. Please try again later.',
        allow_new_registrations: data.allow_new_registrations !== false,
        allow_business_registration: data.allow_business_registration !== false,
        allow_user_login: data.allow_user_login !== false,
        allow_user_access: data.allow_user_access !== false,
        max_file_upload_size_mb: data.max_file_upload_size_mb || 10,
        max_storage_per_business_mb: data.max_storage_per_business_mb || 500,
        max_storage_per_user_mb: data.max_storage_per_user_mb || 100,
        notifications_enabled: data.notifications_enabled !== false,
        email_notifications_enabled: Boolean(data.email_notifications_enabled),
        system_alert_enabled: Boolean(data.system_alert_enabled),
        system_alert_message: data.system_alert_message || '',
        system_alert_severity: data.system_alert_severity || 'info',
        session_timeout_minutes: data.session_timeout_minutes || 120,
        updated_at: data.updated_at || '',
        payment_upi_id: data.payment_upi_id || '',
        payment_qr_code_url: data.payment_qr_code_url || '',
        pro_price: data.pro_price ?? 999,
        payment_instructions: data.payment_instructions || '',
        free_trial_product_limit: data.free_trial_product_limit ?? 5,
        free_trial_invoice_limit: data.free_trial_invoice_limit ?? 5,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load platform settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateAdminSettings(form);
      setForm(prev => ({
        ...prev,
        ...updated,
        updated_at: updated.updated_at || new Date().toISOString(),
      }));
      setSuccessMessage('Global platform settings updated and persisted successfully.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="font-medium">Loading platform configuration from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="text-blue-600" size={26} />
            Global Platform Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Centrally control platform availability, authentication gates, quotas, and broadcast alerts.
          </p>
          {form.updated_at && (
            <p className="text-xs text-slate-400 mt-1">
              Last saved to database: {new Date(form.updated_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw size={16} />
            Reload
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 text-sm font-medium">{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1 text-sm font-medium">{successMessage}</div>
        </div>
      )}

      {/* Active Maintenance Warning Banner */}
      {form.maintenance_mode && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div className="text-sm">
            <span className="font-bold">Maintenance Mode is ACTIVE.</span> Normal users and business owners are currently blocked from accessing the client application and protected APIs. Only Master Admins can access this panel.
          </div>
        </div>
      )}

      {/* Section 1: Platform & Maintenance Mode */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Globe size={20} className="text-blue-500" />
          Platform State & Maintenance Control
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform Brand Name</label>
            <input
              type="text"
              value={form.platform_name}
              onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform Status Headline</label>
            <select
              value={form.platform_status}
              onChange={(e) => setForm({ ...form, platform_status: e.target.value as any })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="operational">Operational (All systems active)</option>
              <option value="degraded">Degraded Performance</option>
              <option value="maintenance">Maintenance in Progress</option>
            </select>
          </div>
        </div>

        {/* Maintenance Toggle */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Lock size={16} className={form.maintenance_mode ? 'text-rose-500' : 'text-slate-400'} />
              Maintenance Mode
            </h4>
            <p className="text-xs text-slate-500 max-w-xl">
              When ON, the platform globally locks out normal users and returns HTTP 503 maintenance response on protected APIs. Master Admins bypass the block.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.maintenance_mode}
              onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
            />
            <div className="w-12 h-6.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {form.maintenance_mode && (
          <div className="space-y-1.5 pt-2">
            <label className="block text-sm font-medium text-slate-700">Public Maintenance Message</label>
            <textarea
              rows={2}
              value={form.maintenance_message}
              onChange={(e) => setForm({ ...form, maintenance_message: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Platform is undergoing scheduled upgrades. Service will resume shortly."
            />
          </div>
        )}
      </div>

      {/* Section 2: Registration & Access Gates */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield size={20} className="text-purple-500" />
          Registration & Access Control Gates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allow Registrations */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-semibold text-slate-900">Allow New Registrations</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Block new signups globally via backend API (HTTP 403) and disable client registration forms.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.allow_new_registrations}
                onChange={(e) => setForm({ ...form, allow_new_registrations: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Allow Business Registration */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-semibold text-slate-900">Allow Business Registration</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Permit new commercial organizations and multi-tenant billing profiles to register.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.allow_business_registration}
                onChange={(e) => setForm({ ...form, allow_business_registration: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Allow User Login */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-semibold text-slate-900">Allow User Login</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Disable user logins during emergencies. Master Admin accounts remain able to authenticate.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.allow_user_login}
                onChange={(e) => setForm({ ...form, allow_user_login: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Allow User Access */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-semibold text-slate-900">Allow General Platform Access</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Permits existing sessions to interact with invoices, stock entries, and quotations.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.allow_user_access}
                onChange={(e) => setForm({ ...form, allow_user_access: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Website Under Maintenance Show */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between md:col-span-2 shadow-sm border-blue-100">
            <div className="pr-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Show "Website Under Maintenance" Page
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] uppercase tracking-wider font-bold">Public Setting</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays a dedicated "Website Under Maintenance" UI to all public visitors. Master Admins can still log in and access the platform normally.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.maintenance_mode}
                onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Section 3: Global System Alert Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bell size={20} className="text-amber-500" />
          Global System Announcement Banner
        </h3>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Enable Broadcast Banner</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Displays a prominent banner across all client application pages in real time.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.system_alert_enabled}
              onChange={(e) => setForm({ ...form, system_alert_enabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {form.system_alert_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Banner Message</label>
              <input
                type="text"
                value={form.system_alert_message}
                onChange={(e) => setForm({ ...form, system_alert_message: e.target.value })}
                placeholder="e.g. GST portal integration update scheduled at 10 PM IST."
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Severity</label>
              <select
                value={form.system_alert_severity}
                onChange={(e) => setForm({ ...form, system_alert_severity: e.target.value as any })}
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="info">Info (Blue Notice)</option>
                <option value="warning">Warning (Amber Alert)</option>
                <option value="critical">Critical (Red Urgency)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Storage Quotas & Limits */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <HardDrive size={20} className="text-indigo-500" />
          Storage Limits & File Quotas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Max File Upload Size (MB)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.max_file_upload_size_mb}
              onChange={(e) => setForm({ ...form, max_file_upload_size_mb: Number(e.target.value) })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Per document/invoice vector PDF</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Storage Per Business (MB)</label>
            <input
              type="number"
              min={50}
              max={10000}
              value={form.max_storage_per_business_mb}
              onChange={(e) => setForm({ ...form, max_storage_per_business_mb: Number(e.target.value) })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Total Supabase bucket ceiling</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Timeout (Minutes)</label>
            <input
              type="number"
              min={15}
              max={1440}
              value={form.session_timeout_minutes}
              onChange={(e) => setForm({ ...form, session_timeout_minutes: Number(e.target.value) })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Automatic JWT refresh window</p>
          </div>
        </div>
      </div>

      {/* Section 5: Subscriptions & Payment Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Globe size={20} className="text-emerald-500" />
          Subscription & Payment Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Free Trial: Product Limit</label>
            <input
              type="number"
              value={form.free_trial_product_limit}
              onChange={(e) => setForm({ ...form, free_trial_product_limit: Number(e.target.value) })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Free Trial: Invoice Limit</label>
            <input
              type="number"
              value={form.free_trial_invoice_limit}
              onChange={(e) => setForm({ ...form, free_trial_invoice_limit: Number(e.target.value) })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">StockIN Pro Price (INR)</label>
            <input
              type="number"
              value={form.pro_price}
              onChange={(e) => setForm({ ...form, pro_price: Number(e.target.value) })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment UPI ID</label>
            <input
              type="text"
              value={form.payment_upi_id}
              onChange={(e) => setForm({ ...form, payment_upi_id: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">QR Code Image URL</label>
            <input
              type="text"
              value={form.payment_qr_code_url}
              onChange={(e) => setForm({ ...form, payment_qr_code_url: e.target.value })}
              placeholder="https://example.com/qr-code.png"
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Instructions</label>
            <textarea
              rows={4}
              value={form.payment_instructions}
              onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bottom Save Action */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition-all cursor-pointer"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving to Database...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
