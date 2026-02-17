-- 1. Añadir columnas de permisos a la tabla de perfiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "can_manage_prices": false,
  "can_view_metrics": false,
  "can_manage_users": false,
  "can_manage_designs": false,
  "can_view_settings": false
}';

-- 2. Configurar a Vanessa como Super Admin y darle todos los permisos
UPDATE profiles 
SET 
  is_super_admin = TRUE,
  role = 'admin',
  permissions = '{
    "can_manage_prices": true,
    "can_view_metrics": true,
    "can_manage_users": true,
    "can_manage_designs": true,
    "can_view_settings": true
  }'
WHERE email = 'vanessa@milys.shop';

-- 3. Crear bucket de Storage para Diseños (si no existe)
-- Nota: Esto requiere permisos de superusuario en la base de datos o hacerlo vía UI de Supabase
INSERT INTO storage.buckets (id, name, public) 
VALUES ('designs', 'designs', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Políticas de Storage (Permitir a todos leer, solo autenticados subir)
CREATE POLICY "Accesible Publicamente" ON storage.objects FOR SELECT USING (bucket_id = 'designs');
CREATE POLICY "Solo Admins suben" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'designs' AND auth.role() = 'authenticated');
