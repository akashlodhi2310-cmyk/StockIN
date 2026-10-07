import React, { useState, useEffect } from 'react';
import { UserTable, AdminUser } from '../components/UserTable';
import { getAdminUsers, updateUserStatus, deleteUser } from '../services/adminApi';
import {
  Users as UsersIcon,
  UserCheck,
  UserX,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
} from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals state
  const [detailsUser, setDetailsUser] = useState<AdminUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUser | null>(null);
  const [suspendModalUser, setSuspendModalUser] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers({ search, status: statusFilter });
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  const handleToggleStatusClick = (user: AdminUser) => {
    if (user.status === 'active') {
      setSuspendModalUser(user);
      setSuspendReason('');
    } else {
      handleConfirmStatusChange(user, false);
    }
  };

  const handleConfirmStatusChange = async (user: AdminUser, isSuspended: boolean, reason?: string) => {
    setActionLoadingId(user.id);
    setError(null);
    try {
      await updateUserStatus(user.id, isSuspended, reason);
      setNotification(`User ${user.email} ${isSuspended ? 'suspended' : 'activated'} successfully.`);
      setTimeout(() => setNotification(null), 4000);
      setSuspendModalUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    setActionLoadingId(deleteConfirmUser.id);
    setError(null);
    try {
      await deleteUser(deleteConfirmUser.id);
      setNotification(`User ${deleteConfirmUser.email} has been permanently deleted.`);
      setTimeout(() => setNotification(null), 4000);
      setDeleteConfirmUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user account.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeCount = users.filter((u) => u.status === 'active').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UsersIcon className="text-blue-600" size={26} />
            User & Account Management
          </h1>
          <p className="text-slate-500 mt-1">
            View, audit, suspend, and manage all registered platform users and credentials.
          </p>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs">
            <UsersIcon size={14} className="text-blue-500" />
            Total: {users.length}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700">
            <UserCheck size={14} />
            Active: {activeCount}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">
            <UserX size={14} />
            Suspended: {suspendedCount}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Table */}
      {loading && users.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="font-medium">Loading user records from database...</p>
        </div>
      ) : (
        <UserTable
          users={users}
          onToggleStatus={handleToggleStatusClick}
          onDelete={(u) => setDeleteConfirmUser(u)}
          onViewDetails={(u) => setDetailsUser(u)}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          actionLoadingId={actionLoadingId}
        />
      )}

      {/* User Details Modal */}
      {detailsUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setDetailsUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-lg">
                {detailsUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{detailsUser.fullName}</h3>
                <p className="text-sm text-slate-500">{detailsUser.email}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Account ID</span>
                <span className="font-mono text-xs text-slate-700 select-all">{detailsUser.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Business Name</span>
                <span className="font-semibold text-slate-900">{detailsUser.businessName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">System Role</span>
                <span className="font-medium text-slate-700 capitalize">{detailsUser.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Account Status</span>
                <span className={`font-bold ${detailsUser.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {detailsUser.status.toUpperCase()}
                </span>
              </div>
              {detailsUser.suspensionReason && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Suspension Reason</span>
                  <span className="text-rose-600 text-xs italic">{detailsUser.suspensionReason}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Registered On</span>
                <span className="text-slate-700">{new Date(detailsUser.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Last Session Login</span>
                <span className="text-slate-700">
                  {detailsUser.lastSignInAt ? new Date(detailsUser.lastSignInAt).toLocaleString() : 'Never logged in'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetailsUser(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-amber-100 text-amber-600 rounded-full shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Suspend Account</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Suspension blocks the user from accessing platform features and invoking companion APIs.
                </p>
              </div>
            </div>

            <div className="my-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for suspension (visible in audit logs)
              </label>
              <textarea
                rows={2}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Suspected policy violation or payment lapse"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSuspendModalUser(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmStatusChange(suspendModalUser, true, suspendReason)}
                className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-full shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete User Account</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-800">{deleteConfirmUser.email}</strong>? This will purge all associated auth sessions and profile data permanently. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
