-- Habilitar Seguridad a Nivel de Fila (RLS) en la tabla de categorías
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON categories;

-- Política 1: Permitir que cualquier persona vea las categorías (Necesario para la tienda)
CREATE POLICY "Categories are viewable by everyone" 
ON categories FOR SELECT 
USING (true);

-- Política 2: Permitir que solo los administradores realicen cambios (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin can manage categories" 
ON categories FOR ALL 
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

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
