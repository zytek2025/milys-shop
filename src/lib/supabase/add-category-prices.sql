-- Añadir columnas de precios de diseño y personalización a la tabla de categorías
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS design_price_small NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_price_medium NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_price_large NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS text_price_small NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS text_price_large NUMERIC DEFAULT 0;

-- Recargar el caché de PostgREST para que los nuevos campos sean visibles en la API
NOTIFY pgrst, 'reload schema';
