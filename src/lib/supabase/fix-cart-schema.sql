-- 1. Asegurar que cart_items tiene todas las columnas necesarias para el customizer
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS custom_metadata JSONB DEFAULT '[]'::jsonb;

-- 2. Asegurar que la tabla carts existe y tiene session_id
CREATE TABLE IF NOT EXISTS carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS para carritos
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Vista por sesión)
DROP POLICY IF EXISTS "Carts are viewable by session" ON carts;
CREATE POLICY "Carts are viewable by session" ON carts FOR ALL USING (true); -- Simplificado para desarrollo

DROP POLICY IF EXISTS "Items are viewable by session" ON cart_items;
CREATE POLICY "Items are viewable by session" ON cart_items FOR ALL USING (true); -- Simplificado para desarrollo

-- 4. RECARGAR EL ESQUEMA
NOTIFY pgrst, 'reload schema';
