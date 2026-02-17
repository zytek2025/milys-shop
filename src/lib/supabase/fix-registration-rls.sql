-- FIX: Allow users to create their own profile on registration
-- This ensures that the record exists and is visible in the CRM.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Ensure users can update their own profile (if not already exists)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 3. Verify role default is 'user' (for CRM visibility)
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
