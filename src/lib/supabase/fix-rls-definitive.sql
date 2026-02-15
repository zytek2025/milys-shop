-- 1. Asegurar permisos de administrador en productos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage products" ON products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Admin can manage products" ON products FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. Asegurar permisos en variantes
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON product_variants;
DROP POLICY IF EXISTS "Admin can manage product variants" ON product_variants;

CREATE POLICY "Product variants are viewable by everyone" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Admin can manage product variants" ON product_variants FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
