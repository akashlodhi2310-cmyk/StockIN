-- ==============================================================================
-- Migration: Add missing foreign key for plan_payments to public.profiles
-- Description: Allows PostgREST to automatically join user profile data.
-- ==============================================================================

ALTER TABLE public.plan_payments 
  ADD CONSTRAINT plan_payments_user_id_profiles_fk 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
