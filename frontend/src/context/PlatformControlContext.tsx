import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface PlatformConfig {
  platform_name: string;
  platform_status: 'operational' | 'degraded' | 'maintenance';
  maintenance_mode: boolean;
  maintenance_message: string;
  allow_new_registrations: boolean;
  allow_business_registration: boolean;
  allow_user_login: boolean;
  system_alert_enabled: boolean;
  system_alert_message: string;
  system_alert_severity: 'info' | 'warning' | 'critical';
  feature_flags: {
    inventory: boolean;
    quotations: boolean;
    invoices: boolean;
    payments: boolean;
    reports: boolean;
    history: boolean;
    export: boolean;
    [key: string]: boolean;
  };
  updated_at?: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'important' | 'maintenance';
  target: 'all' | 'business' | 'user';
  created_at: string;
}

interface PlatformControlContextType {
  config: PlatformConfig;
  announcements: PlatformAnnouncement[];
  loading: boolean;
  refreshConfig: () => Promise<void>;
  isFeatureEnabled: (moduleKey: string) => boolean;
  dismissedAnnouncementIds: string[];
  dismissAnnouncement: (id: string) => void;
}

const DEFAULT_CONFIG: PlatformConfig = {
  platform_name: 'StockIN',
  platform_status: 'operational',
  maintenance_mode: false,
  maintenance_message: 'Platform is temporarily under maintenance. Please try again later.',
  allow_new_registrations: true,
  allow_business_registration: true,
  allow_user_login: true,
  system_alert_enabled: false,
  system_alert_message: '',
  system_alert_severity: 'info',
  feature_flags: {
    inventory: true,
    quotations: true,
    invoices: true,
    payments: true,
    reports: true,
    history: true,
    export: true,
  },
};

const PlatformControlContext = createContext<PlatformControlContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const PlatformControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('stockin_dismissed_announcements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchPlatformData = useCallback(async () => {
    try {
      const [cfgRes, annRes] = await Promise.all([
        fetch(`${API_BASE}/platform/config`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/platform/announcements`).then(r => r.json()).catch(() => null),
      ]);

      if (cfgRes?.success && cfgRes.data) {
        setConfig(prev => ({
          ...prev,
          ...cfgRes.data,
          feature_flags: {
            ...prev.feature_flags,
            ...(cfgRes.data.feature_flags || {}),
          },
        }));
      }

      if (annRes?.success && Array.isArray(annRes.data)) {
        setAnnouncements(annRes.data);
      }
    } catch {
      // Keep existing state on transient network blip
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatformData();

    // Periodic synchronization every 20 seconds
    const interval = setInterval(fetchPlatformData, 20000);

    // Also sync on window focus
    const onFocus = () => fetchPlatformData();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchPlatformData]);

  const dismissAnnouncement = useCallback((id: string) => {
    setDismissedAnnouncementIds(prev => {
      const next = [...prev, id];
      try {
        localStorage.setItem('stockin_dismissed_announcements', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const isFeatureEnabled = useCallback((moduleKey: string) => {
    return config.feature_flags[moduleKey] !== false;
  }, [config.feature_flags]);

  return (
    <PlatformControlContext.Provider
      value={{
        config,
        announcements,
        loading,
        refreshConfig: fetchPlatformData,
        isFeatureEnabled,
        dismissedAnnouncementIds,
        dismissAnnouncement,
      }}
    >
      {children}
    </PlatformControlContext.Provider>
  );
};

export function usePlatformControl(): PlatformControlContextType {
  const ctx = useContext(PlatformControlContext);
  if (!ctx) {
    throw new Error('usePlatformControl must be used within a PlatformControlProvider');
  }
  return ctx;
}
