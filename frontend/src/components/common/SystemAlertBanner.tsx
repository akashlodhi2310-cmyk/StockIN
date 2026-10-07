import React, { useState } from 'react';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const SystemAlertBanner: React.FC = () => {
  const { config } = usePlatformControl();
  const [dismissed, setDismissed] = useState(false);

  if (!config.system_alert_enabled || !config.system_alert_message || dismissed) {
    return null;
  }

  const severity = config.system_alert_severity || 'info';

  const styles = {
    info: 'bg-blue-600 text-white',
    warning: 'bg-amber-600 text-white',
    critical: 'bg-rose-600 text-white',
  }[severity];

  const Icon = {
    info: Info,
    warning: AlertTriangle,
    critical: AlertCircle,
  }[severity];

  return (
    <div className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-3 shadow-xs select-none sticky top-0 z-50 ${styles}`}>
      <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1 justify-center text-center">
        <Icon size={16} className="shrink-0" />
        <span className="font-semibold tracking-wide">{config.system_alert_message}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-black/10 rounded-md transition-colors cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
};
