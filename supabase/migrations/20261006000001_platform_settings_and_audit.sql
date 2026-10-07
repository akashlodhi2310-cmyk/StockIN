-- Create platform_settings table as a singleton
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT DEFAULT 'Platform is temporarily under maintenance. Please try again later.',
    allow_new_registrations BOOLEAN DEFAULT true,
    allow_business_registration BOOLEAN DEFAULT true,
    allow_user_login BOOLEAN DEFAULT true,
    platform_name TEXT DEFAULT 'StockIN',
    system_alert_enabled BOOLEAN DEFAULT false,
    system_alert_message TEXT,
    system_alert_severity TEXT DEFAULT 'info',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT platform_settings_singleton CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Seed the initial settings
INSERT INTO public.platform_settings (id, maintenance_mode, allow_new_registrations, allow_user_login) 
VALUES ('00000000-0000-0000-0000-000000000001', false, true, true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone (so frontend can check maintenance mode)
CREATE POLICY "Allow public read access to platform_settings"
    ON public.platform_settings
    FOR SELECT
    USING (true);

-- Only service role (Master Admin backend) can update
CREATE POLICY "Allow service role to update platform_settings"
    ON public.platform_settings
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read/insert audit logs
CREATE POLICY "Allow service role to manage audit_logs"
    ON public.audit_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);
