-- ============================================================
-- Migration: 006_fix_signup_trigger.sql
-- Hardening handle_new_user trigger for reliability
-- ============================================================

-- Use explicit schema and SECURITY DEFINER for permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, hunter_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'hunter_name', 'Охотник')
  );
  RETURN NEW;
END;
$$;

-- Ensure the trigger is re-attached to avoid any misconfiguration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
