import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchSubscriptionStatus,
  SubscriptionStatusResponse,
} from '@/services/subscription.service';
import { useLocation } from 'react-router-dom';

interface PlanContextType {
  planData: SubscriptionStatusResponse | null;
  loading: boolean;
  error: string | null;
  refreshPlan: () => Promise<void>;
  isPro: boolean;
  canCreateProduct: boolean;
  canCreateInvoice: boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [planData, setPlanData] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPlan = useCallback(async () => {
    if (!user) {
      setPlanData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchSubscriptionStatus();
      setPlanData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load plan details');
      console.error('[PlanContext] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    refreshPlan();
  }, [refreshPlan]);

  // Refresh plan status when navigating to key pages (e.g., after creating an invoice)
  useEffect(() => {
    if (user && planData) {
      // Don't refresh on every route, but good to refresh on dashboard or main list pages
      if (['/dashboard', '/products', '/invoices'].includes(location.pathname)) {
        refreshPlan();
      }
    }
  }, [location.pathname, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPro = planData?.usage.isPro ?? false;
  const canCreateProduct = planData?.usage.canCreateProduct ?? true; // default to true if loading to avoid flash
  const canCreateInvoice = planData?.usage.canCreateInvoice ?? true;

  const value = {
    planData,
    loading,
    error,
    refreshPlan,
    isPro,
    canCreateProduct,
    canCreateInvoice,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};
