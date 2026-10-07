import React, { useState, useEffect } from 'react';
import { BusinessTable, AdminBusiness } from '../components/BusinessTable';
import { getAdminBusinesses, updateBusinessStatus } from '../services/adminApi';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
  Store,
} from 'lucide-react';

export const Businesses: React.FC = () => {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [detailsBusiness, setDetailsBusiness] = useState<AdminBusiness | null>(null);
  const [suspendBusiness, setSuspendBusiness] = useState<AdminBusiness | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminBusinesses({ search, status: statusFilter });
      setBusinesses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load business organizations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [search, statusFilter]);

  const handleToggleClick = (b: AdminBusiness) => {
    if (b.status === 'active') {
      setSuspendBusiness(b);
      setSuspendReason('');
    } else {
      handleConfirmStatus(b, false);
    }
  };

  const handleConfirmStatus = async (b: AdminBusiness, isSuspended: boolean, reason?: string) => {
    setActionLoadingId(b.id);
    setError(null);
    try {
      await updateBusinessStatus(b.id, isSuspended, reason);
      setNotification(`Organization "${b.name}" ${isSuspended ? 'suspended' : 'activated'} successfully.`);
      setTimeout(() => setNotification(null), 4000);
      setSuspendBusiness(null);
      await fetchBusinesses();
    } catch (err: any) {
      setError(err.message || 'Failed to update business status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={26} />
            Business Organization Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage tenant accounts, company details, catalog scale, and commercial status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs">
            <Store size={14} className="text-indigo-500" />
            Total Businesses: {businesses.length}
          </span>
        </div>
      </div>

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

      {loading && businesses.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="font-medium">Loading organization records from database...</p>
        </div>
      ) : (
        <BusinessTable
          businesses={businesses}
          onToggleStatus={handleToggleClick}
          onViewDetails={(b) => setDetailsBusiness(b)}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          actionLoadingId={actionLoadingId}
        />
      )}

      {/* Details Modal */}
      {detailsBusiness && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setDetailsBusiness(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-lg font-bold">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{detailsBusiness.name}</h3>
                <p className="text-sm text-slate-500">{detailsBusiness.businessType}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Business ID</span>
                <span className="font-mono text-xs text-slate-700 select-all">{detailsBusiness.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Owner Name</span>
                <span className="font-semibold text-slate-900">{detailsBusiness.ownerName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Owner Email</span>
                <span className="text-slate-700">{detailsBusiness.ownerEmail}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">GSTIN</span>
                <span className="font-mono text-xs text-slate-800">{detailsBusiness.gstin || 'None Provided'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Products in Catalog</span>
                <span className="font-semibold text-slate-900">{detailsBusiness.productsCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Tax Invoices Issued</span>
                <span className="font-semibold text-slate-900">{detailsBusiness.invoicesCount}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Status</span>
                <span className={`font-bold ${detailsBusiness.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {detailsBusiness.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetailsBusiness(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendBusiness && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-amber-100 text-amber-600 rounded-full shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Suspend Business</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Suspension blocks the business from billing and document creation.
                </p>
              </div>
            </div>

            <div className="my-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for suspension (logged for audit)
              </label>
              <textarea
                rows={2}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Account review or unpaid subscription fee"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSuspendBusiness(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmStatus(suspendBusiness, true, suspendReason)}
                className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Businesses;
