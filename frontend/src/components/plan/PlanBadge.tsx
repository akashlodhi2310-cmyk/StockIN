import React from 'react';
import { usePlan } from '@/context/PlanContext';
import { NavLink } from 'react-router-dom';
import { Sparkles, AlertTriangle } from 'lucide-react';

export const PlanBadge: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { planData, loading, isPro } = usePlan();

  if (loading || !planData) return null;

  if (isCollapsed) {
    return null;
  }

  if (isPro) {
    return (
      <div className="mx-3 mb-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800">StockIN Pro</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">
          ACTIVE
        </span>
      </div>
    );
  }

  const { productsUsed, maxProducts, invoicesUsed, maxInvoices } = planData.usage;
  
  const productPercent = Math.min(100, Math.round((productsUsed / maxProducts) * 100));
  const invoicePercent = Math.min(100, Math.round((invoicesUsed / maxInvoices) * 100));
  
  const isProductWarning = productsUsed >= maxProducts;
  const isInvoiceWarning = invoicesUsed >= maxInvoices;

  return (
    <NavLink 
      to="/upgrade"
      className="mx-3 mb-2 block p-3 bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-blue-300 shadow-xs rounded-xl transition-all group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          Free Trial
        </span>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md group-hover:bg-blue-100 transition-colors">
          UPGRADE
        </span>
      </div>

      <div className="space-y-2.5">
        {/* Products Bar */}
        <div>
          <div className="flex justify-between text-[10px] font-medium mb-1">
            <span className={isProductWarning ? 'text-red-600 font-bold' : 'text-slate-500'}>
              Products
            </span>
            <span className={isProductWarning ? 'text-red-600 font-bold' : 'text-slate-700 font-bold'}>
              {productsUsed} / {maxProducts}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${isProductWarning ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${productPercent}%` }}
            />
          </div>
        </div>

        {/* Invoices Bar */}
        <div>
          <div className="flex justify-between text-[10px] font-medium mb-1">
            <span className={isInvoiceWarning ? 'text-red-600 font-bold' : 'text-slate-500'}>
              Invoices
            </span>
            <span className={isInvoiceWarning ? 'text-red-600 font-bold' : 'text-slate-700 font-bold'}>
              {invoicesUsed} / {maxInvoices}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${isInvoiceWarning ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${invoicePercent}%` }}
            />
          </div>
        </div>
      </div>
      
      {(isProductWarning || isInvoiceWarning) && (
        <div className="mt-2.5 flex items-start gap-1.5 p-1.5 bg-red-50 rounded-lg">
          <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 shrink-0" />
          <p className="text-[9px] font-medium text-red-700 leading-tight">
            You've reached a limit. Upgrade to continue adding data.
          </p>
        </div>
      )}
    </NavLink>
  );
};
