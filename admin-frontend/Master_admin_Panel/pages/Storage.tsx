import React, { useEffect, useState } from 'react';
import {
  HardDrive,
  Cloud,
  Server,
  FileText,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Folder,
} from 'lucide-react';
import { getAdminStorage } from '../services/adminApi';

export const Storage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStorage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminStorage();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load storage telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="font-medium">Querying Supabase Storage buckets & objects...</p>
      </div>
    );
  }

  const buckets = data?.buckets || [];
  const largestFiles = data?.largestFiles || [];
  const usageByTenant = data?.usageByTenant || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="text-blue-600" size={26} />
            Storage & Object Quotas
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time inspection of Supabase Storage buckets, vector PDF archives, and database disk utilization.
          </p>
        </div>

        <button
          onClick={loadStorage}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <RefreshCw size={14} />
          Sync Storage
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Main Storage Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bucket Consumption */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cloud size={18} className="text-blue-600" />
            Supabase Object Storage Utilization
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-700">Storage Used</span>
                <span className="text-slate-900 font-bold">
                  {data?.totalStorageMb || 0} MB <span className="text-slate-400 font-normal">/ {data?.maxStorageLimitMb || 5000} MB</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        2,
                        (((data?.totalStorageMb || 0) / (data?.maxStorageLimitMb || 5000)) * 100)
                      )
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-slate-500 flex justify-between">
                <span>{Math.max(0, (data?.maxStorageLimitMb || 5000) - (data?.totalStorageMb || 0))} MB Available</span>
                <span>{data?.totalFileCount || 0} Total Archived Documents</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Server size={15} className="text-purple-600" />
                  PostgreSQL Database Engine
                </span>
                <span className="text-slate-900 font-bold">{data?.databaseSizeMb || 5} MB</span>
              </div>
              <p className="text-xs text-slate-400">
                Primary multi-tenant relational tables, RLS policies, indexing, and audit logs.
              </p>
            </div>
          </div>
        </div>

        {/* Bucket Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Folder size={18} className="text-indigo-600" />
            Active Buckets
          </h3>

          <div className="space-y-3">
            {buckets.map((b: any) => (
              <div key={b.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900">{b.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    b.isPublic ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {b.isPublic ? 'Public' : 'Private RLS'}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {b.fileCount} files recorded
                </div>
              </div>
            ))}

            {buckets.length === 0 && (
              <p className="text-xs text-slate-400 italic">No storage buckets detected</p>
            )}
          </div>
        </div>
      </div>

      {/* Largest Files Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Largest Stored Artifacts</h3>
          <p className="text-xs text-slate-500 mt-0.5">Top files stored in Supabase private storage.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">File Name</th>
                <th className="p-4">Bucket</th>
                <th className="p-4">Size</th>
                <th className="p-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {largestFiles.map((f: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                    <FileText size={14} className="text-blue-500 shrink-0" />
                    <span className="truncate max-w-sm">{f.name}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{f.bucketId}</td>
                  <td className="p-4 font-mono font-bold text-slate-800">{f.sizeFormatted}</td>
                  <td className="p-4 text-slate-500">{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}

              {largestFiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No files found in storage buckets. Documents generated by invoices will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Storage;
