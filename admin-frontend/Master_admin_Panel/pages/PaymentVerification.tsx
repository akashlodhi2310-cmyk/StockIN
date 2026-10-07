import React, { useState, useEffect } from 'react';
import { getPlanPayments, approvePlanPayment, rejectPlanPayment } from '../services/adminApi';
import { Search, Filter, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface PlanPayment {
  id: string;
  userId: string;
  plan: string;
  amount: number;
  currency: string;
  utrNumber: string | null;
  paymentDate: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  userEmail?: string;
  userFullName?: string;
  userBusinessName?: string;
}

export const PaymentVerification: React.FC = () => {
  const [payments, setPayments] = useState<PlanPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // payment ID
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPlanPayments(statusFilter === 'all' ? undefined : statusFilter);
      setPayments(res.payments || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Approve payment and activate Pro plan for this user?')) return;
    try {
      setIsProcessing(id);
      await approvePlanPayment(id);
      setPayments((prev) => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReasonMap[id] || 'Invalid or missing UTR number. Payment unverified.';
    if (!window.confirm(`Reject payment?\nReason: ${reason}`)) return;
    try {
      setIsProcessing(id);
      await rejectPlanPayment(id, reason);
      setPayments((prev) => prev.map(p => p.id === id ? { ...p, status: 'rejected', rejectionReason: reason } : p));
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (p.userEmail?.toLowerCase().includes(q)) ||
      (p.userBusinessName?.toLowerCase().includes(q)) ||
      (p.utrNumber?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Verification</h1>
          <p className="text-slate-500 mt-1">Approve manual UPI payments to activate Pro subscriptions.</p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Email, Business Name, or UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Date</th>
                <th className="p-4 font-bold border-b border-slate-200">Business / User</th>
                <th className="p-4 font-bold border-b border-slate-200">Payment</th>
                <th className="p-4 font-bold border-b border-slate-200">Status</th>
                <th className="p-4 font-bold border-b border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading payments...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No payments found.</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm text-slate-600">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{payment.userBusinessName || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{payment.userEmail}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-emerald-600">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs font-mono text-slate-500 mt-1">UTR: {payment.utrNumber}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                        payment.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        payment.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      {payment.status === 'pending' ? (
                        <div className="flex flex-col gap-2 w-48">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(payment.id)}
                              disabled={isProcessing === payment.id}
                              className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(payment.id)}
                              disabled={isProcessing === payment.id}
                              className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white py-1.5 px-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Reason for rejection (optional)"
                            value={rejectReasonMap[payment.id] || ''}
                            onChange={(e) => setRejectReasonMap(prev => ({ ...prev, [payment.id]: e.target.value }))}
                            className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded-md"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
