-- Migration: Drop foreign key constraints on verified_by and activated_by
-- This allows payments and subscriptions to be approved/activated cleanly
-- even when admin IDs come from custom admin systems, dev bypasses, or service workers.

ALTER TABLE public.plan_payments 
  DROP CONSTRAINT IF EXISTS plan_payments_verified_by_fkey;

ALTER TABLE public.subscriptions 
  DROP CONSTRAINT IF EXISTS subscriptions_activated_by_fkey;
