import React, { useState, useEffect } from 'react';
import { usePlan } from '@/context/PlanContext';
import { PageHeader } from '@/components/common/PageHeader';
import { submitPayment, fetchUserPayments, PlanPayment } from '@/services/subscription.service';
import { useAppState } from '@/context/AppStateContext';
import { Sparkles, QrCode, Upload, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

export const UpgradePage: React.FC = () => {
  const { planData, loading, refreshPlan, isPro } = usePlan();
  const { showToast } = useAppState();

  const [paymentHistory, setPaymentHistory] = useState<PlanPayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Form State
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await fetchUserPayments();
      setPaymentHistory(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const hasPendingPayment = paymentHistory.some((p) => p.status === 'pending');
  const paymentConfig = planData?.paymentConfig;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.length < 6) {
      showToast('Validation Error', 'Please enter a valid UTR/Reference number', 'error');
      return;
    }

    if (hasPendingPayment) {
      showToast('Hold on', 'You already have a pending payment waiting for verification.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitPayment({
        amount: 499,
        utrNumber,
        paymentDate: new Date().toISOString(),
      });
      showToast('Payment Submitted', 'Your payment is pending verification. Pro plan will activate shortly.', 'success');
      setUtrNumber('');
      await Promise.all([loadHistory(), refreshPlan()]);
    } catch (err: any) {
      showToast('Submission Failed', err.message || 'Could not submit payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || historyLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="space-y-6">
        <PageHeader title="Subscription" subtitle="Manage your StockIN plan" />
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white shadow-lg flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-emerald-200" />
              <h2 className="text-3xl font-black">StockIN Pro Active</h2>
            </div>
            <p className="text-emerald-50 font-medium">
              You have unlimited access to all features. Thank you for your business!
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <CheckCircle2 className="w-12 h-12 text-white mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader 
        title="Upgrade to StockIN Pro" 
        subtitle="Unlock unlimited products, invoices, and premium features."
      />

      {hasPendingPayment && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 shadow-xs">
          <Clock className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 text-sm">Payment Verification Pending</h3>
            <p className="text-amber-700 text-xs mt-1">
              We have received your payment submission. An admin will verify the UTR number shortly. 
              Once verified, your Pro plan will be activated automatically.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Column: QR and Instructions */}
        <div className="md:col-span-2 bg-gradient-to-b from-blue-50 to-white border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          
          <h3 className="font-extrabold text-slate-900 text-xl mb-2">Pay via UPI</h3>
          <p className="text-slate-600 text-sm text-center mb-6 font-medium">
            Scan with GPay, PhonePe, or Paytm to pay <span className="font-bold text-blue-700">{formatCurrency(499)}</span>
          </p>
          
          <div className="bg-white p-2 rounded-2xl shadow-md border border-slate-100 mb-6 transition-transform hover:scale-105 duration-300">
            <img 
              src={`${paymentConfig?.qrCodeUrl || '/assets/payment-qr.png'}?v=2`} 
              alt="UPI QR Code" 
              className="w-56 h-56 rounded-xl object-contain" 
            />
          </div>

          <div className="w-full bg-white border border-blue-100 rounded-2xl p-4 text-center shadow-xs">
            <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest block mb-1">Official UPI ID</span>
            <p className="font-mono text-sm text-slate-800 font-semibold select-all">{paymentConfig?.upiId || '7869461895@ptyes'}</p>
          </div>
        </div>

        {/* Right Column: Submission Form */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs flex flex-col relative">
          <div className="mb-8">
            <h3 className="font-extrabold text-slate-900 text-2xl mb-2">Verify Your Payment</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Once you've completed the payment using the QR code, please provide the 12-digit UTR/Reference number. Our team will verify it and activate your Pro plan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
            <div className="space-y-6 flex-1">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                  12-Digit UTR / Reference No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 315423891045"
                  disabled={isSubmitting || hasPendingPayment}
                  className="w-full bg-white px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-hidden transition-colors font-mono text-lg text-slate-800 placeholder-slate-300"
                />
              </div>

              {paymentConfig?.paymentInstructions && (
                <div className="flex gap-3 items-start bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Important Instructions:</span>
                    {paymentConfig.paymentInstructions}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || hasPendingPayment || !utrNumber.trim()}
              className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
            >
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {hasPendingPayment ? 'Verification in Progress...' : 'Submit Payment for Verification'}
            </button>
          </form>
        </div>
      </div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">UTR Number</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-600">{formatDate(payment.createdAt)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{payment.utrNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${
                        payment.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        payment.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {payment.status.toUpperCase()}
                      </span>
                      {payment.status === 'rejected' && payment.rejectionReason && (
                        <p className="text-[10px] text-red-600 mt-1 max-w-xs truncate" title={payment.rejectionReason}>
                          {payment.rejectionReason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
