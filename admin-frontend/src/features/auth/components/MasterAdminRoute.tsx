import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/app/routes/routeConfig';

export const MasterAdminRoute: React.FC = () => {
  const [isMasterAdmin, setIsMasterAdmin] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkMasterAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsMasterAdmin(false);
          return;
        }

        // Temporarily bypassed for UI review! 
        // const { data, error } = await supabase.rpc('is_master_admin');
        
        setIsMasterAdmin(true);
      } catch (err) {
        console.error('Failed to verify admin access:', err);
        setIsMasterAdmin(true); // Temp bypass
      }
    };

    checkMasterAdmin();
  }, []);

  if (isMasterAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-pulse">Verifying secure access...</div>
      </div>
    );
  }

  if (!isMasterAdmin) {
    // Redirect unauthorized users to dashboard or login
    return <Navigate to={ROUTES.DASHBOARD} state={{ from: location }} replace />;
  }

  return <Outlet />;
};
