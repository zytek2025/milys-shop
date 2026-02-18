-- FIX PROFILES RLS (Middleware Access)
-- This ensures the middleware can correctly read the user's role

-- 1. Allow users to read their own profile (Critical for authentication)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- 2. Allow admins to read all profiles (Critical for CRM/Admin)
-- We use a secure function to avoid infinite recursion in RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (is_admin());

-- 3. Ensure role exists and is correct for your user
-- (Optional verification update)
UPDATE profiles 
SET role = 'admin' 
WHERE id = auth.uid();
