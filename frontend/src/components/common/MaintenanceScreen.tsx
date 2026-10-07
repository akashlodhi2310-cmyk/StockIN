import React from 'react';
import { ShieldAlert, RefreshCw, ExternalLink, Clock } from 'lucide-react';

interface MaintenanceScreenProps {
  message?: string;
  onRefresh?: () => void;
  isMasterAdmin?: boolean;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  message,
  onRefresh,
  isMasterAdmin,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 select-none">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Icon Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <ShieldAlert size={40} />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 border border-amber-800 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Clock size={12} />
            Scheduled Maintenance Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Platform Under Maintenance
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            {message || 'StockIN is currently undergoing scheduled platform upgrades and maintenance. Please try again shortly.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer"
            >
              <RefreshCw size={15} />
              Check Status
            </button>
          )}

          {isMasterAdmin && (
            <a
              href="http://localhost:5174/master-admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <ExternalLink size={15} />
              Master Admin Control
            </a>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 pt-6">
          StockIN Enterprise Platform • System integrity & transactional consistency guaranteed.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
