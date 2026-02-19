-- 1. Función para verificar Super Admin de forma segura (sin recursión)
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.staff_users 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar la política problemática
DROP POLICY IF EXISTS "Super admins can manage staff" ON public.staff_users;

-- 3. Crear la nueva política usando la función segura
CREATE POLICY "Super admins can manage staff" ON public.staff_users
    FOR ALL USING (
        public.check_is_super_admin()
    );

-- 4. Asegurar que los miembros puedan leer su propio registro (opcional, pero buena práctica)
DROP POLICY IF EXISTS "Staff can read own record" ON public.staff_users;
CREATE POLICY "Staff can read own record" ON public.staff_users
    FOR SELECT USING (auth.uid() = id);

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
