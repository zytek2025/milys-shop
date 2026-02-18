-- Habilitar Seguridad a Nivel de Fila (RLS) en la tabla store_credits
ALTER TABLE store_credits ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Admins can do everything on store_credits" ON store_credits;
DROP POLICY IF EXISTS "Users can view their own store_credits" ON store_credits;

-- Política 1: Administradores tienen acceso total
CREATE POLICY "Admins can do everything on store_credits"
ON store_credits FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Política 2: Usuarios pueden ver sus propios créditos
CREATE POLICY "Users can view their own store_credits"
ON store_credits FOR SELECT TO authenticated
USING (profile_id = auth.uid());

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
