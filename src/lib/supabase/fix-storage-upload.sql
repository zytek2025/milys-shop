-- 1. Asegurar que el bucket existe (Si falla por permisos, créalo manualmente en el Dashboard)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Limpiar políticas antiguas (si las hay) para evitar duplicados
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;

-- 3. Permitir a los ADMINS hacer TODO en el bucket 'product-images'
CREATE POLICY "Admin Full Access" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (
  bucket_id = 'product-images' 
  AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
)
WITH CHECK (
  bucket_id = 'product-images' 
  AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

-- 4. Permitir lectura PÚBLICA de las imágenes
CREATE POLICY "Public Read Access" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'product-images');
