import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Businesses } from './pages/Businesses';
import { Analytics } from './pages/Analytics';
import { Storage } from './pages/Storage';
import { Activity } from './pages/Activity';
import { Notifications } from './pages/Notifications';
import { Plans } from './pages/Plans';
import { SystemHealth } from './pages/SystemHealth';
import { Settings } from './pages/Settings';
import { FeatureFlags } from './pages/FeatureFlags';
import { PaymentVerification } from './pages/PaymentVerification';

export const MasterAdminApp: React.FC = () => {
  return (
    <div className="w-full h-full bg-slate-50 min-h-full">
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="users/*" element={<Users />} />
        <Route path="businesses/*" element={<Businesses />} />
        <Route path="feature-flags/*" element={<FeatureFlags />} />
        <Route path="plans/*" element={<Plans />} />
        <Route path="payments/*" element={<PaymentVerification />} />
        <Route path="analytics/*" element={<Analytics />} />
        <Route path="storage/*" element={<Storage />} />
        <Route path="activity/*" element={<Activity />} />
        <Route path="notifications/*" element={<Notifications />} />
        <Route path="system/*" element={<SystemHealth />} />
        <Route path="settings/*" element={<Settings />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </div>
  );
};

export default MasterAdminApp;
