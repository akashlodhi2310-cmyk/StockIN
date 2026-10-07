import React, { useState } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  MoreVertical,
  ShieldAlert,
  Loader2,
  Calendar,
  Clock,
  Building,
} from 'lucide-react';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
  role: string;
  status: 'active' | 'suspended';
  suspensionReason?: string;
  createdAt: string;
  lastSignInAt: string | null;
  storageEstimateMb: number;
}

interface UserTableProps {
  users: AdminUser[];
  onToggleStatus: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onViewDetails: (user: AdminUser) => void;
  search: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  actionLoadingId?: string | null;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onToggleStatus,
  onDelete,
  onViewDetails,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  actionLoadingId,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-xl overflow-hidden">
      {/* Search & Filters */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, email, or business..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="p-4">User</th>
              <th className="p-4">Business</th>
              <th className="p-4">Registration</th>
              <th className="p-4">Last Sign In</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isActionLoading = actionLoadingId === user.id;

              return (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-sm text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Building size={14} className="text-slate-400" />
                      <span className="truncate max-w-[180px]">{user.businessName}</span>
                    </div>
                  </td>

                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                    {user.lastSignInAt ? (
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" />
                        {new Date(user.lastSignInAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-slate-400">Never</span>
                    )}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        user.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>

                  <td className="p-4 text-right relative whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewDetails(user)}
                        title="View Details"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => onToggleStatus(user)}
                        disabled={isActionLoading}
                        title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                        className={`p-1.5 rounded-md transition-colors ${
                          user.status === 'active'
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {isActionLoading ? (
                          <Loader2 size={16} className="animate-spin text-slate-400" />
                        ) : user.status === 'active' ? (
                          <UserX size={16} />
                        ) : (
                          <UserCheck size={16} />
                        )}
                      </button>

                      <button
                        onClick={() => onDelete(user)}
                        disabled={isActionLoading}
                        title="Delete Permanently"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert size={28} className="text-slate-300" />
                    <p className="font-medium text-slate-600">No users found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search criteria or status filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
