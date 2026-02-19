-- Create staff_users table to separate administrators from customers
CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    is_super_admin BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{
        "can_manage_prices": false,
        "can_view_metrics": false,
        "can_manage_users": false,
        "can_manage_designs": false,
        "can_view_settings": false
    }'::JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Activar RLS
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso
DROP POLICY IF EXISTS "Staff can read own record" ON public.staff_users;
CREATE POLICY "Staff can read own record" ON public.staff_users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can manage staff" ON public.staff_users;
CREATE POLICY "Super admins can manage staff" ON public.staff_users
    FOR ALL USING (
        (SELECT is_super_admin FROM public.staff_users WHERE id = auth.uid()) = true
    );

-- Migrate existing admins from profiles if any
INSERT INTO public.staff_users (id, email, full_name, is_super_admin, permissions)
SELECT 
    id, 
    email, 
    full_name, 
    COALESCE(is_super_admin, false),
    COALESCE(permissions, '{
        "can_manage_prices": true,
        "can_view_metrics": true,
        "can_manage_users": true,
        "can_manage_designs": true,
        "can_view_settings": true
    }'::JSONB)
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (id) DO NOTHING;

-- Log the action
NOTIFY pgrst, 'reload schema';
