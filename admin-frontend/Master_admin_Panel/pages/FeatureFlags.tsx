import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  FileSpreadsheet,
  Receipt,
  IndianRupee,
  BarChart3,
  History,
  Download,
  Save,
} from 'lucide-react';
import { getAdminFeatureFlags, updateAdminFeatureFlags } from '../services/adminApi';

interface FeatureDef {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const MODULES: FeatureDef[] = [
  {
    key: 'inventory',
    label: 'Inventory & Stock Management',
    description: 'Enables product catalogs, warehouse stock tracking, and batch updates.',
    icon: Package,
    color: 'text-blue-500 bg-blue-50',
  },
  {
    key: 'quotations',
    label: 'Quotation Estimates',
    description: 'Enables sales quotations, revision management, and quote-to-invoice conversion.',
    icon: FileSpreadsheet,
    color: 'text-purple-500 bg-purple-50',
  },
  {
    key: 'invoices',
    label: 'GST Tax Invoicing & Billing',
    description: 'Enables invoice creation, PDF generation, customer balance accounting.',
    icon: Receipt,
    color: 'text-emerald-500 bg-emerald-50',
  },
  {
    key: 'payments',
    label: 'Payment Tracking',
    description: 'Enables payment records, installment history, and reconciliation.',
    icon: IndianRupee,
    color: 'text-amber-500 bg-amber-50',
  },
  {
    key: 'reports',
    label: 'Advanced Financial Reports',
    description: 'Enables monthly sales analysis, GST filing summaries, and margin reports.',
    icon: BarChart3,
    color: 'text-indigo-500 bg-indigo-50',
  },
  {
    key: 'history',
    label: 'Document Archival History',
    description: 'Enables signed vector PDF archiving in Supabase Storage with audit trail.',
    icon: History,
    color: 'text-cyan-500 bg-cyan-50',
  },
  {
    key: 'export',
    label: 'Data Export & CSV Backups',
    description: 'Allows businesses to bulk export customer, invoice, and product records.',
    icon: Download,
    color: 'text-rose-500 bg-rose-50',
  },
];

export const FeatureFlags: React.FC = () => {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    inventory: true,
    quotations: true,
    invoices: true,
    payments: true,
    reports: true,
    history: true,
    export: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const data = await getAdminFeatureFlags();
        if (data && typeof data === 'object') {
          setFlags(prev => ({ ...prev, ...data }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load feature flags');
      } finally {
        setLoading(false);
      }
    };
    fetchFlags();
  }, []);

  const handleToggle = async (key: string) => {
    const nextState = !flags[key];
    const newFlags = { ...flags, [key]: nextState };
    setFlags(newFlags);

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateAdminFeatureFlags(newFlags);
      setSuccess(`Module "${key}" ${nextState ? 'enabled' : 'disabled'} globally.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      // Revert on error
      setFlags(prev => ({ ...prev, [key]: !nextState }));
      setError(err.message || 'Failed to update feature flag on server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="font-medium">Loading platform feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="text-blue-600" size={26} />
          Platform Feature Flags
        </h1>
        <p className="text-slate-500 mt-1">
          Enable or disable specific platform capabilities across client navigation, application routing, and backend APIs.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isEnabled = flags[mod.key] !== false;

          return (
            <div
              key={mod.key}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start justify-between gap-4 transition-all hover:border-slate-300"
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-lg shrink-0 ${mod.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{mod.label}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.description}</p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
                      isEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isEnabled ? 'Active in Production' : 'Disabled Globally'}
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  disabled={saving}
                  className="sr-only peer"
                  checked={isEnabled}
                  onChange={() => handleToggle(mod.key)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureFlags;
