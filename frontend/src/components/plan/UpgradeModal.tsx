import React from 'react';
import { Modal } from '@/components/common/Modal';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/app/routes/routeConfig';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose,
  title = "You've reached a limit",
  message = "Upgrade to StockIN Pro to unlock unlimited products and invoices."
}) => {
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    onClose();
    navigate(ROUTES.UPGRADE);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="relative overflow-hidden bg-white rounded-2xl">
        {/* Decorative background */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10" />
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20" />
        
        <div className="relative pt-6 px-6 pb-2 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30 transform -rotate-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-600 mb-6 px-2">{message}</p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              StockIN Pro Includes
            </h4>
            <ul className="space-y-2.5">
              {[
                'Unlimited Products & Categories',
                'Unlimited Invoices & Quotations',
                'Unlimited Customers',
                'Advanced PDF Export & Analytics',
                'Priority Email Support'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 w-full pb-4">
            <button
              onClick={handleUpgradeClick}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro Now
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
