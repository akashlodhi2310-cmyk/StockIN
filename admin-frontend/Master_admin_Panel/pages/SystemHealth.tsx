import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Server,
  Database,
  Globe,
  RefreshCcw,
  Activity,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { getAdminHealthDiagnostics } from '../services/adminApi';

export const SystemHealth: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await getAdminHealthDiagnostics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Health check failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const components = data?.components || {};
  const controls = data?.platformControls || {};
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            System Health & Diagnostics
            <span
              className={`px-3 py-1 text-xs rounded-full font-semibold border flex items-center gap-1.5 ${
                data?.status === 'healthy'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : data?.status === 'maintenance'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    data?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    data?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              {data?.status === 'healthy'
                ? 'All Services Operational'
                : data?.status === 'maintenance'
                ? 'Maintenance Mode Active'
                : 'Degraded Service'}
            </span>
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time ping latency, database connectivity checks, memory telemetry, and server journal.
          </p>
          {data?.timestamp && (
            <p className="text-xs text-slate-400 mt-1">
              Last Diagnostic: {new Date(data.timestamp).toLocaleTimeString()} • Server Uptime: {data.uptimeSeconds}s • Memory: {data.memoryUsageMb} MB
            </p>
          )}
        </div>

        <button
          onClick={runDiagnostics}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-xs"
        >
          <RefreshCcw size={16} className={isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
          {isRefreshing ? 'Running Diagnostics...' : 'Run Live Diagnostic'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Real Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Backend API */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase">Backend API (Express)</span>
            <Server size={18} className="text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {components.backendApi?.status === 'online' ? 'Online' : 'Offline'}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
            <span>Response Latency</span>
            <span className="font-mono font-bold text-emerald-600">{components.backendApi?.responseTimeMs || 0} ms</span>
          </div>
        </div>

        {/* PostgreSQL Database */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase">PostgreSQL Database</span>
            <Database size={18} className="text-purple-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {components.database?.status === 'online' ? 'Connected' : 'Degraded / Reconnecting'}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
            <span>Query Roundtrip</span>
            <span className="font-mono font-bold text-emerald-600">{components.database?.responseTimeMs || 0} ms</span>
          </div>
        </div>

        {/* Supabase Auth */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase">Supabase Auth API</span>
            <ShieldCheck size={18} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {components.authService?.status === 'online' ? 'Operational' : 'Unreachable'}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
            <span>Auth Service Ping</span>
            <span className="font-mono font-bold text-emerald-600">{components.authService?.responseTimeMs || 0} ms</span>
          </div>
        </div>

        {/* Supabase Storage */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase">Storage Buckets</span>
            <HardDrive size={18} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {components.storageService?.status === 'online' ? 'Operational' : 'Unavailable'}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
            <span>Bucket API Ping</span>
            <span className="font-mono font-bold text-emerald-600">{components.storageService?.responseTimeMs || 0} ms</span>
          </div>
        </div>
      </div>

      {/* Platform Policy Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Current Platform Gate Enforcement</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Maintenance Mode</span>
            <span className={`font-bold ${controls.maintenanceMode ? 'text-rose-600' : 'text-emerald-600'}`}>
              {controls.maintenanceMode ? 'ENABLED (LOCKED)' : 'DISABLED (OPEN)'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">New Registrations</span>
            <span className={`font-bold ${controls.allowRegistrations ? 'text-emerald-600' : 'text-rose-600'}`}>
              {controls.allowRegistrations ? 'ALLOWED' : 'BLOCKED'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">User Login Gate</span>
            <span className={`font-bold ${controls.allowUserLogin ? 'text-emerald-600' : 'text-rose-600'}`}>
              {controls.allowUserLogin ? 'ALLOWED' : 'DISABLED'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Broadcast Alert Banner</span>
            <span className={`font-bold ${controls.systemAlertActive ? 'text-amber-600' : 'text-slate-500'}`}>
              {controls.systemAlertActive ? 'ACTIVE ON CLIENT' : 'INACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Server Logs (Real server events) */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">Live Server Diagnostic Events</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs shadow-md">
          <div className="bg-slate-800 px-4 py-3 flex justify-between items-center text-slate-400 border-b border-slate-700">
            <span className="font-semibold text-slate-300">Live Event Feed</span>
            <span>Real-time Stream</span>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto space-y-2">
            {recentLogs.map((log: any, idx: number) => (
              <div key={idx} className="text-slate-300 flex items-start gap-2">
                <span className="text-slate-500 shrink-0 font-mono">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={log.level === 'WARN' ? 'text-amber-400 font-bold shrink-0' : 'text-emerald-400 font-bold shrink-0'}>
                  {log.level}
                </span>
                <span className="text-blue-400 shrink-0">[{log.source}]</span>
                <span className="text-slate-200">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
