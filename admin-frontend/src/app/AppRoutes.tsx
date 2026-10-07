import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MasterAdminLayout } from '../../Master_admin_Panel/layouts/MasterAdminLayout';
import { MasterAdminApp } from '../../Master_admin_Panel/MasterAdminApp';
import { LoginPage } from '@/features/auth/pages/LoginPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Master Admin Root & Sub-routes */}
      <Route element={<MasterAdminLayout />}>
        <Route path="/master-admin/*" element={<MasterAdminApp />} />
      </Route>

      {/* Default redirect to Master Admin dashboard */}
      <Route path="*" element={<Navigate to="/master-admin" replace />} />
    </Routes>
  );
};

export default AppRoutes;
