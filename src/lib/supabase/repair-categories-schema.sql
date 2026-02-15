-- Reparar tabla de categorías añadiendo columnas faltantes de personalización y matriz de variantes
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS available_sizes JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS available_colors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS design_price_small NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_price_medium NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_price_large NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS text_price_small NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS text_price_large NUMERIC DEFAULT 0;

-- Comentarios explicativos para documentación del esquema
COMMENT ON COLUMN categories.available_sizes IS 'Lista de tallas estándar para esta categoría (ej: ["S", "M", "L"])';
COMMENT ON COLUMN categories.available_colors IS 'Lista de colores estándar para esta categoría (ej: [{"name": "Blanco", "hex": "#FFFFFF"}])';
COMMENT ON COLUMN categories.is_customizable IS 'Indica si los productos de esta categoría admiten personalización por el cliente';

-- Forzar recarga del esquema en PostgREST (Supabase)
NOTIFY pgrst, 'reload schema';
