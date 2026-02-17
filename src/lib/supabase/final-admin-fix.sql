-- FINAL RECURSION FIX FOR PROFILES
-- This script safely handles admin permissions without infinite recursion.

-- 1. Create a function that bypasses RLS to get the current user's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  -- We query profiles directly. Since this is SECURITY DEFINER, 
  -- it runs as the owner (postgres) and bypasses RLS.
  SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();
  RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop troublesome policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all" ON profiles;

-- 3. Create new, clean policies using the function
CREATE POLICY "Self view" 
ON profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admin view all" 
ON profiles FOR SELECT 
TO authenticated
USING (public.get_auth_role() = 'admin');

-- 4. Sync metadata for good measure (alternative check)
-- This allows checking role via JWT metadata which never recurses
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE email = 'vanessa@milys.shop' AND role = 'admin' LIMIT 1;
  IF admin_id IS NOT NULL THEN
    UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb WHERE id = admin_id;
  END IF;
END $$;

-- Notify schema change
NOTIFY pgrst, 'reload schema';
