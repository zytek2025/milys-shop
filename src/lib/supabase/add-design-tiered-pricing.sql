-- Añadir columnas para precios por tamaño en los diseños
ALTER TABLE designs ADD COLUMN IF NOT EXISTS price_small DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS price_medium DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS price_large DECIMAL(10,2) DEFAULT 0.00;

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
