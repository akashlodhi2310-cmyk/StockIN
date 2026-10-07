-- ==============================================================================
-- Migration: Free Trial / Pro Subscriptions + Manual QR Payment Verification
-- Description:
--   1. subscriptions   — per-user plan tracking (trial | active | expired | cancelled)
--   2. plan_payments   — manual QR payment requests with admin verification
--   3. Extend platform_settings with payment config (upi_id, qr_code_url, pro_price)
--   4. plan_limits()   — DB function returning current limits for caller
--   5. RLS policies    — users see only their own data; admins see all
-- ==============================================================================

-- ==============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan         TEXT NOT NULL DEFAULT 'trial'
                 CHECK (plan IN ('trial', 'pro')),
  status       TEXT NOT NULL DEFAULT 'trial'
                 CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  started_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at   TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  activated_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT subscriptions_user_unique UNIQUE (user_id)
);

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users see only their own subscription
DROP POLICY IF EXISTS "subscriptions_own" ON public.subscriptions;
CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (backend) can insert/update (bypasses RLS)
-- Admins can see all (via service role in backend)


-- ==============================================================================
-- 2. PLAN PAYMENTS TABLE
-- (Named plan_payments to avoid conflict with existing payments table)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.plan_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan             TEXT NOT NULL DEFAULT 'pro',
  amount           NUMERIC(10, 2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'INR',
  utr_number       TEXT,
  payment_date     TEXT,
  proof_url        TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  rejection_reason TEXT,
  submitted_at     TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  verified_at      TIMESTAMPTZ,
  verified_by      UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS set_plan_payments_updated_at ON public.plan_payments;
CREATE TRIGGER set_plan_payments_updated_at
  BEFORE UPDATE ON public.plan_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.plan_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment requests
DROP POLICY IF EXISTS "plan_payments_own_select" ON public.plan_payments;
CREATE POLICY "plan_payments_own_select" ON public.plan_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payment requests
DROP POLICY IF EXISTS "plan_payments_own_insert" ON public.plan_payments;
CREATE POLICY "plan_payments_own_insert" ON public.plan_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own pending requests
DROP POLICY IF EXISTS "plan_payments_own_cancel" ON public.plan_payments;
CREATE POLICY "plan_payments_own_cancel" ON public.plan_payments
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');


-- ==============================================================================
-- 3. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id    ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status     ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_plan_payments_user_id    ON public.plan_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_payments_status     ON public.plan_payments(status);
CREATE INDEX IF NOT EXISTS idx_plan_payments_created_at ON public.plan_payments(created_at DESC);


-- ==============================================================================
-- 4. EXTEND platform_settings WITH PAYMENT CONFIG
-- Safe column additions (idempotent)
-- ==============================================================================
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS payment_upi_id           TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_qr_code_url       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pro_price                 NUMERIC(10, 2) DEFAULT 999,
  ADD COLUMN IF NOT EXISTS payment_instructions      TEXT DEFAULT
    '1. Scan the QR code with any UPI app.' || chr(10) ||
    '2. Complete the payment.' || chr(10) ||
    '3. Note your UTR/Reference number.' || chr(10) ||
    '4. Upload payment screenshot (optional).' || chr(10) ||
    '5. Submit for verification. Activation within 1 hour.',
  ADD COLUMN IF NOT EXISTS free_trial_product_limit  INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS free_trial_invoice_limit  INTEGER DEFAULT 5;


-- ==============================================================================
-- 5. HELPER FUNCTION: get_user_plan(uid)
-- Returns the current plan status for a given user.
-- Used by backend service-role queries for limit checking.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_user_plan(uid UUID)
RETURNS TABLE(plan TEXT, status TEXT, expires_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.plan, s.status, s.expires_at
  FROM public.subscriptions s
  WHERE s.user_id = uid
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_plan(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_plan(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_plan(UUID) TO authenticated;


-- ==============================================================================
-- 6. HELPER FUNCTION: upsert_trial_subscription(uid)
-- Ensures a trial subscription exists for the given user.
-- Called by backend on first login to guarantee a subscription row.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.upsert_trial_subscription(uid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, started_at)
  VALUES (uid, 'trial', 'trial', timezone('utc'::text, now()))
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_trial_subscription(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_trial_subscription(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_trial_subscription(UUID) TO authenticated;


-- ==============================================================================
-- 7. SEED: Ensure all existing users have a trial subscription
-- ==============================================================================
INSERT INTO public.subscriptions (user_id, plan, status, started_at)
SELECT id, 'trial', 'trial', created_at
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
