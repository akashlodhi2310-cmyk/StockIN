import React from 'react';
import {
  Search,
  Filter,
  Building2,
  Package,
  Receipt,
  Eye,
  CheckCircle,
  Ban,
  Loader2,
} from 'lucide-react';

export interface AdminBusiness {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  businessType: string;
  gstin?: string;
  phone?: string;
  city?: string;
  status: 'active' | 'suspended';
  suspensionReason?: string;
  productsCount: number;
  invoicesCount: number;
  storageUsedMb: number;
  createdAt: string;
}

interface BusinessTableProps {
  businesses: AdminBusiness[];
  onToggleStatus: (business: AdminBusiness) => void;
  onViewDetails: (business: AdminBusiness) => void;
  search: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  actionLoadingId?: string | null;
}

export const BusinessTable: React.FC<BusinessTableProps> = ({
  businesses,
  onToggleStatus,
  onViewDetails,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  actionLoadingId,
}) => {
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
            placeholder="Search businesses or owners..."
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
            <option value="active">Active Tenants</option>
            <option value="suspended">Suspended Tenants</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="p-4">Organization</th>
              <th className="p-4">Owner Profile</th>
              <th className="p-4">Category</th>
              <th className="p-4">Catalog / Billing</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {businesses.map((business) => {
              const isActionLoading = actionLoadingId === business.id;

              return (
                <tr key={business.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 border border-indigo-100">
                        <Building2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{business.name}</p>
                        <p className="text-xs text-slate-400 truncate">GST: {business.gstin || 'Unregistered'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <p className="text-sm font-medium text-slate-800">{business.ownerName}</p>
                    <p className="text-xs text-slate-400">{business.ownerEmail}</p>
                  </td>

                  <td className="p-4 text-xs font-medium text-slate-600">{business.businessType}</td>

                  <td className="p-4">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1" title="Products Managed">
                        <Package size={13} className="text-slate-400" />
                        {business.productsCount} items
                      </span>
                      <span className="flex items-center gap-1" title="Invoices Generated">
                        <Receipt size={13} className="text-slate-400" />
                        {business.invoicesCount} inv
                      </span>
                    </div>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        business.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {business.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewDetails(business)}
                        title="View Tenant Info"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => onToggleStatus(business)}
                        disabled={isActionLoading}
                        title={business.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
                        className={`p-1.5 rounded-md transition-colors ${
                          business.status === 'active'
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {isActionLoading ? (
                          <Loader2 size={16} className="animate-spin text-slate-400" />
                        ) : business.status === 'active' ? (
                          <Ban size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {businesses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  <p className="font-medium text-slate-600">No organizations found</p>
                  <p className="text-xs text-slate-400 mt-1">Try modifying your search or filter options.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
