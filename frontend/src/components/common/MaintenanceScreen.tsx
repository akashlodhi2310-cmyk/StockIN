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
    <div className="min-h-screen bg-[#06080F] flex flex-col items-center justify-center p-4 select-none font-sans">
      <div className="max-w-md w-full text-center flex flex-col items-center space-y-6">
        
        {/* Animated Icon Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-[1.25rem] bg-[#1F140A] border border-[#D97706]/40 flex items-center justify-center text-[#F59E0B] shadow-xl shadow-amber-900/10">
            <ShieldAlert size={28} strokeWidth={1.5} />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#F59E0B] border-2 border-[#06080F]"></span>
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1F140A]/60 border border-[#D97706]/30 text-[#F59E0B] rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Clock size={12} strokeWidth={2} />
            Scheduled Maintenance Active
          </div>
          
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Platform Under Maintenance
          </h1>
          
          <p className="text-[13px] text-slate-400 leading-relaxed max-w-[280px] mx-auto text-center">
            {message || 'StockIN is undergoing emergency scheduled maintenance.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-blue-900/20 cursor-pointer"
            >
              <RefreshCw size={14} strokeWidth={2} />
              Check Status
            </button>
          )}

          {isMasterAdmin && (
            <a
              href={import.meta.env.VITE_MASTER_ADMIN_URL || 'https://stock-in-z5kr.vercel.app/master-admin'}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[13px] font-semibold transition-all cursor-pointer"
            >
              <ExternalLink size={14} strokeWidth={2} />
              Master Admin Control
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8">
          <p className="text-[11px] text-slate-600 max-w-[300px] mx-auto text-center leading-relaxed">
            StockIN Enterprise Platform &bull; System integrity & transactional consistency guaranteed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
