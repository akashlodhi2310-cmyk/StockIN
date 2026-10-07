-- ==============================================================================
-- Migration: Master Admin, Platform Settings, Announcements & Audit Logs
-- Description: Complete schema for global platform control, RLS, and functions
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Master Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'master_admin',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 3. Helper function: is_master_admin()
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_master_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_master_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_master_admin() TO authenticated;

-- 4. Global Platform Settings Table (Singleton pattern)
DROP TABLE IF EXISTS public.platform_settings CASCADE;
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    platform_name TEXT DEFAULT 'StockIN',
    platform_status TEXT DEFAULT 'operational', -- 'operational' | 'degraded' | 'maintenance'
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT DEFAULT 'Platform is temporarily under maintenance. Please try again later.',
    allow_new_registrations BOOLEAN DEFAULT true,
    allow_business_registration BOOLEAN DEFAULT true,
    allow_user_login BOOLEAN DEFAULT true,
    allow_user_access BOOLEAN DEFAULT true,
    max_file_upload_size_mb INTEGER DEFAULT 10,
    max_storage_per_business_mb INTEGER DEFAULT 500,
    max_storage_per_user_mb INTEGER DEFAULT 100,
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications_enabled BOOLEAN DEFAULT false,
    system_alert_enabled BOOLEAN DEFAULT false,
    system_alert_message TEXT DEFAULT '',
    system_alert_severity TEXT DEFAULT 'info', -- 'info' | 'warning' | 'critical'
    system_alert_start_time TIMESTAMPTZ,
    system_alert_end_time TIMESTAMPTZ,
    feature_flags JSONB DEFAULT '{"inventory": true, "quotations": true, "invoices": true, "payments": true, "reports": true, "history": true, "export": true}'::jsonb,
    session_timeout_minutes INTEGER DEFAULT 120,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT platform_settings_singleton CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Seed initial record if missing
INSERT INTO public.platform_settings (
    id, platform_name, platform_status, maintenance_mode,
    allow_new_registrations, allow_user_login
) VALUES (
    '00000000-0000-0000-0000-000000000001', 'StockIN', 'operational', false, true, true
) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to platform_settings" ON public.platform_settings;
CREATE POLICY "Allow public read access to platform_settings"
    ON public.platform_settings
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow master admin update platform_settings" ON public.platform_settings;
CREATE POLICY "Allow master admin update platform_settings"
    ON public.platform_settings
    FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 5. Announcements / Notifications Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'important', 'maintenance'
    target TEXT NOT NULL DEFAULT 'all', -- 'all', 'business', 'user'
    target_id TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read active announcements" ON public.announcements;
CREATE POLICY "Allow public read active announcements"
    ON public.announcements
    FOR SELECT
    USING (is_active = true);

-- 6. Platform Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    admin_email TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 7. User Suspension / Status Overrides Table
CREATE TABLE IF NOT EXISTS public.user_status_overrides (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_suspended BOOLEAN DEFAULT false NOT NULL,
    suspension_reason TEXT,
    suspended_at TIMESTAMPTZ,
    suspended_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_status_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage user status overrides" ON public.user_status_overrides;
CREATE POLICY "Admins can manage user status overrides"
    ON public.user_status_overrides
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 8. Business Suspension / Status Overrides Table
CREATE TABLE IF NOT EXISTS public.business_status_overrides (
    business_id UUID PRIMARY KEY,
    is_suspended BOOLEAN DEFAULT false NOT NULL,
    suspension_reason TEXT,
    suspended_at TIMESTAMPTZ,
    suspended_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.business_status_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage business status overrides" ON public.business_status_overrides;
CREATE POLICY "Admins can manage business status overrides"
    ON public.business_status_overrides
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 9. Automatic master admin bootstrap for known admin email
DO $$
BEGIN
    INSERT INTO public.admin_users (user_id, role)
    SELECT id, 'master_admin'
    FROM auth.users
    WHERE email IN ('lodhi@1122')
    ON CONFLICT (user_id) DO NOTHING;
END $$;
