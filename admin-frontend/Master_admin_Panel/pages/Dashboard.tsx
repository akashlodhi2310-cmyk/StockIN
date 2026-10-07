import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  ShoppingCart,
  Receipt,
  HardDrive,
  Database,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Bell,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { UsageChart } from '../components/UsageChart';
import { getAdminAnalytics, getAdminSettings, getAdminStorage } from '../services/adminApi';
import { NavLink } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [storage, setStorage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [anData, stData, storData] = await Promise.all([
        getAdminAnalytics(),
        getAdminSettings(),
        getAdminStorage(),
      ]);
      setAnalytics(anData);
      setSettings(stData);
      setStorage(storData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="font-medium">Aggregating live platform metrics from database...</p>
      </div>
    );
  }

  const kpis = analytics?.kpis || {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalBusinesses: 0,
    totalProducts: 0,
    totalInvoices: 0,
    totalTurnover: 0,
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Platform Master Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time multi-tenant telemetry aggregated directly from PostgreSQL & Supabase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <NavLink
            to="/master-admin/settings"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Sliders size={14} />
            Control Center
          </NavLink>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Critical Status Alert if Maintenance Mode is active */}
      {settings?.maintenance_mode && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Maintenance Mode is currently ACTIVE.</span>
              <p className="text-xs text-amber-700 mt-0.5">{settings.maintenance_message}</p>
            </div>
          </div>
          <NavLink
            to="/master-admin/settings"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold"
          >
            Manage
          </NavLink>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Registered Users"
          value={kpis.totalUsers.toLocaleString()}
          subtitle={`${kpis.activeUsers} Active • ${kpis.suspendedUsers} Suspended`}
          icon={Users}
          colorClass="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Active Organizations"
          value={kpis.totalBusinesses.toLocaleString()}
          subtitle={`${kpis.totalBusinesses} Total Tenants`}
          icon={Building2}
          colorClass="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          title="Catalog Products"
          value={kpis.totalProducts.toLocaleString()}
          subtitle="Across all warehouses"
          icon={ShoppingCart}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          title="Invoices Generated"
          value={kpis.totalInvoices.toLocaleString()}
          subtitle={`₹${kpis.totalTurnover.toLocaleString()} Document Volume`}
          icon={Receipt}
          colorClass="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Real Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UsageChart
          title="Tenant Growth (Users vs Businesses)"
          data={analytics?.growthTimeline || []}
          xKey="period"
          yKey1="users"
          yKey2="businesses"
          color1="#3b82f6"
          color2="#6366f1"
        />

        <UsageChart
          title="Platform Activity Trend (Invoices vs Products)"
          data={analytics?.activityTimeline || []}
          xKey="period"
          yKey1="invoices"
          yKey2="products"
          color1="#10b981"
          color2="#f59e0b"
        />
      </div>

      {/* Bottom Infrastructure Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Health */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HardDrive size={18} className="text-blue-600" />
              Supabase Storage & Archival
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Healthy
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>File Storage Used: {storage?.totalStorageMb || 0} MB</span>
              <span>Quota: {storage?.maxStorageLimitMb || 5000} MB</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      2,
                      (((storage?.totalStorageMb || 0) / (storage?.maxStorageLimitMb || 5000)) * 100)
                    )
                  )}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Total Archived PDFs: {storage?.totalFileCount || 0}</span>
              <NavLink to="/master-admin/storage" className="text-blue-600 hover:underline">
                View Storage Details →
              </NavLink>
            </div>
          </div>
        </div>

        {/* Platform Policy Status */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-purple-600" />
              Active Platform Policy Gates
            </h3>
            <NavLink to="/master-admin/settings" className="text-xs text-blue-600 hover:underline">
              Configure
            </NavLink>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block mb-1">New Registrations</span>
              <span className={`font-bold ${settings?.allow_new_registrations ? 'text-emerald-600' : 'text-rose-600'}`}>
                {settings?.allow_new_registrations ? 'ALLOWED' : 'BLOCKED'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block mb-1">User Login Gate</span>
              <span className={`font-bold ${settings?.allow_user_login ? 'text-emerald-600' : 'text-rose-600'}`}>
                {settings?.allow_user_login ? 'ALLOWED' : 'LOCKED'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block mb-1">Maintenance Mode</span>
              <span className={`font-bold ${settings?.maintenance_mode ? 'text-rose-600' : 'text-emerald-600'}`}>
                {settings?.maintenance_mode ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block mb-1">Broadcast Banner</span>
              <span className={`font-bold ${settings?.system_alert_enabled ? 'text-amber-600' : 'text-slate-500'}`}>
                {settings?.system_alert_enabled ? 'DISPLAYED' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
