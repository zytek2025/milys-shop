-- Corregir políticas de RLS para administración total
DROP POLICY IF EXISTS "Admin can manage design categories" ON design_categories;
DROP POLICY IF EXISTS "Admin can manage designs" ON designs;

-- Política para categorías (ADMIN TODO)
CREATE POLICY "Admin manage categories" ON design_categories 
    FOR ALL 
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Política para diseños (ADMIN TODO)
CREATE POLICY "Admin manage designs" ON designs 
    FOR ALL 
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
