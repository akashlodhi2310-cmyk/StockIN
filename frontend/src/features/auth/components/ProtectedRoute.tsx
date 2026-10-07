import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';
import { Loader2, Boxes, ShieldAlert, AlertTriangle } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { user, loading, isMasterAdmin, signOut } = useAuth();
  const { config, refreshConfig, isFeatureEnabled } = usePlatformControl();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center text-center space-y-4 max-w-xs animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Boxes className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">StockIN</h2>
            <p className="text-xs text-slate-500 mt-0.5">Checking session...</p>
          </div>
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  // 1. Enforce Maintenance Mode (Master Admins bypass)
  if (config.maintenance_mode && !isMasterAdmin) {
    return (
      <MaintenanceScreen
        message={config.maintenance_message}
        onRefresh={refreshConfig}
        isMasterAdmin={isMasterAdmin}
      />
    );
  }

  // 2. Authentication Gate
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Enforce User Suspension
  if (user.user_metadata?.is_suspended) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/40 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-14 h-14 bg-rose-950 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-800">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Suspended</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Your account has been suspended by the platform administrator. Access to invoices, products, and customer records is temporarily blocked.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 4. Feature Flag Route Protection
  const path = location.pathname.toLowerCase();
  let disabledModule: string | null = null;

  if ((path.includes('/products') || path.includes('/stock')) && !isFeatureEnabled('inventory')) {
    disabledModule = 'Inventory & Stock Management';
  } else if (path.includes('/quotations') && !isFeatureEnabled('quotations')) {
    disabledModule = 'Quotation Estimates';
  } else if ((path.includes('/invoices') || path.includes('/billing')) && !isFeatureEnabled('invoices')) {
    disabledModule = 'GST Invoicing & Billing';
  } else if (path.includes('/payments') && !isFeatureEnabled('payments')) {
    disabledModule = 'Payment Tracking';
  } else if (path.includes('/reports') && !isFeatureEnabled('reports')) {
    disabledModule = 'Financial Reports';
  } else if (path.includes('/history') && !isFeatureEnabled('history')) {
    disabledModule = 'Document Archival History';
  }

  if (disabledModule) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 m-6 shadow-xs">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 border border-amber-200">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Module Temporarily Disabled</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md">
          The <strong className="text-slate-800">{disabledModule}</strong> module has been temporarily disabled by the platform administrator.
        </p>
      </div>
    );
  }

  return <Outlet />;
};
