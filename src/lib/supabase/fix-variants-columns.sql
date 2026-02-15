-- 1. Añadir la columna faltante si no existe
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color_hex TEXT;

-- 2. Asegurar que 'color' existe (la usamos para el nombre)
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color TEXT;

-- 3. Notificar a Supabase que recargue el esquema (muy importante)
NOTIFY pgrst, 'reload schema';
