-- 1. Añadir columnas de precios a design_categories
ALTER TABLE design_categories ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE design_categories ADD COLUMN IF NOT EXISTS price_small DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE design_categories ADD COLUMN IF NOT EXISTS price_medium DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE design_categories ADD COLUMN IF NOT EXISTS price_large DECIMAL(10,2) DEFAULT 0.00;

-- 2. (Opcional) Migrar datos existentes si hay categorías predominantes
-- Por ejemplo, si un diseño tiene precios, se podrían promediar o tomar el primero para la categoría.
-- Pero usualmente el usuario prefiere definirlos de cero.

-- 3. Limpiar columnas de precios en la tabla designs para evitar confusiones
-- (Comentado por seguridad, el usuario puede decidir si borrarlas físicamente o solo ignorarlas en UI)
-- ALTER TABLE designs DROP COLUMN IF EXISTS price;
-- ALTER TABLE designs DROP COLUMN IF EXISTS price_small;
-- ALTER TABLE designs DROP COLUMN IF EXISTS price_medium;
-- ALTER TABLE designs DROP COLUMN IF EXISTS price_large;

NOTIFY pgrst, 'reload schema';
