-- Reparación definitiva de la tabla productos
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Por si acaso, asegurar que las variantes también permiten model_type opcional
ALTER TABLE product_variants ALTER COLUMN model_type DROP NOT NULL;
ALTER TABLE product_variants ALTER COLUMN model_type SET DEFAULT 'Franela';
