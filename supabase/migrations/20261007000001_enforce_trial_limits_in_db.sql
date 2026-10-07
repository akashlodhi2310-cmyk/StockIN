-- ==============================================================================
-- Migration: Enforce Trial Limits Strict Mode in DB
-- Description:
--   1. Adds BEFORE INSERT triggers to products and invoices to block creation 
--      if the Free Trial limit is reached. This mathematically guarantees the 
--      limit cannot be bypassed by any frontend client or API call.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_trial_limits_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_used INTEGER;
  v_max_prod INTEGER;
  v_max_inv INTEGER;
  v_user_id UUID;
BEGIN
  -- We only enforce this on INSERT
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;

  -- 1. Check if the user is on trial or pro
  v_plan := public.get_user_plan(v_user_id);
  
  IF v_plan = 'trial' THEN
    -- Fetch limits from platform settings
    SELECT free_trial_max_products, free_trial_max_invoices
    INTO v_max_prod, v_max_inv
    FROM public.platform_settings
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

    IF TG_TABLE_NAME = 'products' THEN
      SELECT COUNT(*) INTO v_used FROM public.products WHERE user_id = v_user_id AND status != 'archived';
      IF v_max_prod != -1 AND v_used >= v_max_prod THEN
        RAISE EXCEPTION 'PRODUCT_LIMIT_REACHED';
      END IF;
    ELSIF TG_TABLE_NAME = 'invoices' THEN
      SELECT COUNT(*) INTO v_used FROM public.invoices WHERE user_id = v_user_id;
      IF v_max_inv != -1 AND v_used >= v_max_inv THEN
        RAISE EXCEPTION 'INVOICE_LIMIT_REACHED';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_product_limits ON public.products;
CREATE TRIGGER trg_check_product_limits
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_trial_limits_trigger();

DROP TRIGGER IF EXISTS trg_check_invoice_limits ON public.invoices;
CREATE TRIGGER trg_check_invoice_limits
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.check_trial_limits_trigger();

