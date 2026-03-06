-- ============================================================
-- Migration: 007_cleanup_signup.sql
-- Aggressive cleanup and hardening of signup trigger
-- ============================================================

-- 1. Drop any potential existing versions (schema-qualified and not)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. Create the hardened function in public schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We use ON CONFLICT to prevent 500 errors if a profile already exists
  -- and COALESCE to ensure hunter_name is never NULL.
  INSERT INTO public.profiles (id, hunter_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'hunter_name', 'Охотник')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Last resort: don't block auth user creation if profile fails, 
  -- but this shouldn't happen with the above guards.
  RETURN NEW;
END;
$$;

-- 3. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
