-- SCRIPT DE REPARACIÓN DEFINITIVA (Ejecutar todo junto)

-- 1. Asegurar columnas en PRODUCTOS
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE products ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE products ALTER COLUMN description DROP NOT NULL;
ALTER TABLE products ALTER COLUMN category DROP NOT NULL;

-- 2. Asegurar columnas en VARIANTES
-- Usamos ALTER TABLE para que funcione aunque la tabla ya exista
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color_hex TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS price_override DECIMAL(10,2);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Limpiar y asegurar permisos Admin
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage products" ON products;
CREATE POLICY "Admin can manage products" ON products FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can manage product variants" ON product_variants;
CREATE POLICY "Admin can manage product variants" ON product_variants FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. RECARGAR EL ESQUEMA (CRÍTICO)
NOTIFY pgrst, 'reload schema';
