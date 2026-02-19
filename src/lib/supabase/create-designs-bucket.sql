-- 1. Crear bucket 'custom-designs' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-designs', 'custom-designs', true) ON CONFLICT (id) DO NOTHING;
-- 2. Permitir acceso PÚBLICO para subir archivos (necesario para usuarios no logueados que añaden al carrito)
-- NOTA: En producción idealmente se restringe, pero para evitar fricción en el carrito se permite.
CREATE POLICY "Custom Designs Public Upload" ON storage.objects FOR
INSERT TO public WITH CHECK (bucket_id = 'custom-designs');
-- 3. Permitir lectura pública
CREATE POLICY "Custom Designs Public Read" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'custom-designs');
-- 4. Permitir update/delete solo a quien lo subió (si es auth) o admins
CREATE POLICY "Custom Designs Owner Manage" ON storage.objects FOR ALL TO public USING (
    bucket_id = 'custom-designs'
    AND (
        (auth.uid() = owner)
        OR (
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE id = auth.uid()
                    AND role = 'admin'
            )
        )
    )
);