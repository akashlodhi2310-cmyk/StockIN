import React from 'react';
import { Search, Filter, Shield, Clock, FileCode } from 'lucide-react';

export interface AuditLogItem {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  action: string;
  target_type?: string;
  target_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  created_at: string;
}

interface ActivityTableProps {
  logs: AuditLogItem[];
  search: string;
  onSearchChange: (q: string) => void;
  actionFilter: string;
  onActionFilterChange: (a: string) => void;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({
  logs,
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search action, admin, or target..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => onActionFilterChange(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Audit Actions</option>
            <option value="MAINTENANCE_MODE_ENABLED">Maintenance Mode Enabled</option>
            <option value="MAINTENANCE_MODE_DISABLED">Maintenance Mode Disabled</option>
            <option value="REGISTRATIONS_ENABLED">Registrations Enabled</option>
            <option value="REGISTRATIONS_DISABLED">Registrations Disabled</option>
            <option value="USER_SUSPENDED">User Suspended</option>
            <option value="USER_ACTIVATED">User Activated</option>
            <option value="BUSINESS_SUSPENDED">Business Suspended</option>
            <option value="BUSINESS_ACTIVATED">Business Activated</option>
            <option value="ANNOUNCEMENT_CREATED">Announcement Created</option>
            <option value="PLATFORM_SETTINGS_UPDATED">Settings Updated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Initiator (Admin)</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target</th>
              <th className="p-4">Details / Delta</th>
              <th className="p-4">Client IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const isWarning = log.action.includes('SUSPEND') || log.action.includes('DELETED') || log.action.includes('DISABLED');

              return (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock size={12} className="text-slate-400" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>

                  <td className="p-4 font-semibold text-slate-800 whitespace-nowrap">
                    {log.admin_email || 'System / Service Role'}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                        isWarning
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="p-4 text-slate-700 font-mono">
                    {log.target_type ? `${log.target_type}${log.target_id ? ` #${log.target_id.slice(-6)}` : ''}` : 'Global'}
                  </td>

                  <td className="p-4 max-w-xs font-mono text-[11px] text-slate-600 truncate">
                    {log.new_value ? JSON.stringify(log.new_value) : '—'}
                  </td>

                  <td className="p-4 font-mono text-slate-400 whitespace-nowrap">
                    {log.ip_address || 'Internal'}
                  </td>
                </tr>
              );
            })}

            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <p className="font-medium text-slate-600">No audit log records found</p>
                  <p className="text-xs text-slate-400 mt-1">Actions performed by Master Admin will be permanently journaled here.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
