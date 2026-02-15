-- 1. Crear la tabla de variantes de producto (Matriz de Talla/Color)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    model_type TEXT DEFAULT 'Franela',
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    color_hex TEXT,
    stock INTEGER DEFAULT 0,
    price_override DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS para variantes
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS
DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON product_variants;
DROP POLICY IF EXISTS "Admin can manage product variants" ON product_variants;

CREATE POLICY "Product variants are viewable by everyone" 
ON product_variants FOR SELECT USING (true);

CREATE POLICY "Admin can manage product variants" 
ON product_variants FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
