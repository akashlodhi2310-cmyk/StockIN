import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';
import { useAuth } from '@/context/AuthContext';
import { getAdminSettings, verifyMasterAdminSession } from '../services/adminApi';
import { ShieldAlert, LogIn, Loader2, AlertTriangle, KeyRound } from 'lucide-react';

export const MasterAdminLayout: React.FC = () => {
  const { user, isMasterAdmin, loading: authLoading, signIn, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [serverVerified, setServerVerified] = useState<boolean | null>(null);
  const [maintenanceModeActive, setMaintenanceModeActive] = useState(false);

  // Quick Master Admin login form state if unauthenticated
  const [loginEmail, setLoginEmail] = useState('lodhi@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Verify server-side authorization
  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      if (!user) {
        if (isMounted) setServerVerified(false);
        return;
      }

      try {
        await verifyMasterAdminSession();
        if (isMounted) setServerVerified(true);
      } catch {
        // If server rejected (401 or 403)
        if (isMounted) setServerVerified(false);
      }
    };

    if (!authLoading) {
      verify();
    }

    // Check maintenance status
    getAdminSettings()
      .then((s) => {
        if (isMounted && s?.maintenance_mode) setMaintenanceModeActive(true);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await signIn(loginEmail.trim(), loginPassword);
      if (!res.success) {
        setLoginError(res.error || 'Invalid credentials');
      } else {
        // Verification will trigger via useEffect
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Removed authentication check temporarily as per user request
  /*
  if (authLoading || (user && serverVerified === null)) { ... }
  if (!user) { ... }
  if (serverVerified === false) { ... }
  */

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-clip">
        <AdminHeader 
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)} 
          isMaintenanceMode={maintenanceModeActive}
        />

        {/* Global Banner if Maintenance Mode is active */}
        {maintenanceModeActive && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>MAINTENANCE MODE ACTIVE: Platform is currently locked to all normal tenants.</span>
            </div>
            <span className="font-mono text-[10px] bg-amber-700 px-2 py-0.5 rounded">ADMIN BYPASS ENABLED</span>
          </div>
        )}

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MasterAdminLayout;
