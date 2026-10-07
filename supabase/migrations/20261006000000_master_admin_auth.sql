-- ==============================================================================
-- Master Admin Authentication and Authorization
-- ==============================================================================

-- 1. Table to store master admin users
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'master_admin',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Secure RLS for admin_users (only admins can read, nobody can write from frontend)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 3. Secure helper function to check if a user is a master admin
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

-- Revoke execute from anon, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.is_master_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_master_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_master_admin() TO authenticated;
