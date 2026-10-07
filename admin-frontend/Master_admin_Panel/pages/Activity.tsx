import React, { useState, useEffect } from 'react';
import { ActivityTable, AuditLogItem } from '../components/ActivityTable';
import { getAdminAuditLogs } from '../services/adminApi';
import { Shield, RefreshCw, Loader2 } from 'lucide-react';

export const Activity: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAdminAuditLogs({ search, action: actionFilter, limit: 100 });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-blue-600" size={26} />
            Master Admin Audit Trail
          </h1>
          <p className="text-slate-500 mt-1">
            Immutable log of all administrative actions, policy adjustments, suspensions, and platform changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            Total Logged: <strong>{total}</strong>
          </span>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="font-medium">Reading audit journal from database...</p>
        </div>
      ) : (
        <ActivityTable
          logs={logs}
          search={search}
          onSearchChange={setSearch}
          actionFilter={actionFilter}
          onActionFilterChange={setActionFilter}
        />
      )}
    </div>
  );
};

export default Activity;
