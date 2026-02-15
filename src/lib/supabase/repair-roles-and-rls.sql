-- REPARAR PERMISOS Y ROLES DEFINITIVAMENTE

-- 1. Asegurar que los perfiles son legibles por el sistema
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are public" ON profiles;
CREATE POLICY "Profiles are public" ON profiles FOR SELECT USING (true);

-- 2. Asegurar que los usuarios actuales son ADMIN
UPDATE profiles SET role = 'admin' WHERE email = 'dfornerino.usa@gmail.com';
UPDATE profiles SET role = 'admin' WHERE email = 'BEJARANO.V189@GMAIL.COM';

-- 3. POLÍTICA DE PEDIDOS SIMPLIFICADA (Para evitar recursión lenta)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do everything on orders" ON orders;
DROP POLICY IF EXISTS "admin_all" ON orders;

CREATE POLICY "Admins can do everything on orders" ON orders
FOR ALL TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. RECARGAR SISTEMA
NOTIFY pgrst, 'reload schema';
