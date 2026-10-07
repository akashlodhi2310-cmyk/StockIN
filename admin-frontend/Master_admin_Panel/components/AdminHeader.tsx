import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AdminHeaderProps {
  onToggleMobileSidebar: () => void;
  isMaintenanceMode?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  onToggleMobileSidebar,
  isMaintenanceMode = false 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/users')) return 'Users Management';
    if (pathname.includes('/businesses')) return 'Businesses';
    if (pathname.includes('/feature-flags')) return 'Feature Flags';
    if (pathname.includes('/settings')) return 'Global Settings';
    if (pathname.includes('/analytics')) return 'Platform Analytics';
    if (pathname.includes('/storage')) return 'Storage';
    if (pathname.includes('/notifications')) return 'Notifications';
    if (pathname.includes('/activity')) return 'Audit Logs';
    if (pathname.includes('/system-health')) return 'System Health';
    return 'Platform Overview';
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight truncate">
            {getPageTitle(location.pathname)}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              StockIN • Master Admin
            </p>
            {isMaintenanceMode && (
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">
                <ShieldAlert className="w-3 h-3" />
                Maintenance ON
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Global Search Trigger (Placeholder for Admin) */}
        <button
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 min-h-[38px] text-xs font-medium text-slate-500 bg-slate-100/80 hover:bg-slate-200/80 hover:text-slate-800 rounded-xl border border-slate-200/60 transition-all cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="hidden md:inline">Search platform...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <NavLink
            to="/master-admin/notifications"
            className={({ isActive }) =>
              `relative min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`
            }
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </NavLink>
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 min-h-[40px] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Admin profile"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {(user?.email || 'M').charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:block text-left pr-1 max-w-[140px]">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">Master Admin</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">Master Admin</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/master-admin/settings');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Admin Settings
                </button>
              </div>

              <div className="my-1 border-t border-slate-100" />

              <div className="py-1">
                <button
                  disabled={isSigningOut}
                  onClick={async () => {
                    setIsSigningOut(true);
                    try {
                      await signOut();
                      navigate('/login', { replace: true });
                    } catch {
                      setIsSigningOut(false);
                      navigate('/login', { replace: true });
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSigningOut ? (
                    <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
