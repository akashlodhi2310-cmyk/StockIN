import React, { useEffect, useState } from 'react';
import { UsageChart } from '../components/UsageChart';
import { getAdminAnalytics } from '../services/adminApi';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Building2,
  Receipt,
  ShoppingCart,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="font-medium">Aggregating live platform metrics from database...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={26} />
            Platform Telemetry & Analytics
          </h1>
          <p className="text-slate-500 mt-1">
            Real usage, registration growth, and billing velocity aggregated across all tenants.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <RefreshCw size={14} />
          Sync Analytics
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500">New Users (Today)</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{kpis.newUsersToday || 0}</p>
          <span className="text-[11px] text-slate-400">{kpis.newUsersThisWeek || 0} this week</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Active Tenants</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{kpis.activeBusinesses || 0}</p>
          <span className="text-[11px] text-slate-400">{kpis.totalBusinesses || 0} total registered</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Products Managed</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{kpis.totalProducts || 0}</p>
          <span className="text-[11px] text-slate-400">Total catalog inventory</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Invoices Processed</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{kpis.totalInvoices || 0}</p>
          <span className="text-[11px] text-slate-400">₹{(kpis.totalTurnover || 0).toLocaleString()} volume</span>
        </div>
      </div>

      {/* Real Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UsageChart
          title="Tenant Scale (Users vs Businesses)"
          data={data?.growthTimeline || []}
          xKey="period"
          yKey1="users"
          yKey2="businesses"
          color1="#3b82f6"
          color2="#6366f1"
        />

        <UsageChart
          title="Commercial Velocity (Invoices vs Products)"
          data={data?.activityTimeline || []}
          xKey="period"
          yKey1="invoices"
          yKey2="products"
          color1="#10b981"
          color2="#f59e0b"
        />
      </div>
    </div>
  );
};

export default Analytics;
