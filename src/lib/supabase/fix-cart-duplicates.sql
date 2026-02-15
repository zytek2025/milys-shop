-- EXPLICACIÓN:
-- Por defecto, el esquema del carrito impedía agregar el mismo producto dos veces (ej. dos camisas iguales).
-- Sin embargo, en Mily's Shop necesitamos permitir agregar el mismo producto si tiene personalizaciones diferentes.
-- Este script elimina la restricción de unicidad para permitir múltiples filas del mismo producto en el mismo carrito.

-- 1. Eliminar la restricción de unicidad que causa el error
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_key;

-- 2. Opcional: Si existiera un índice similar con nombre automático, lo eliminamos también
DROP INDEX IF EXISTS cart_items_cart_id_product_id_idx;

-- 3. Recargar el esquema del postgrest (Supabase)
NOTIFY pgrst, 'reload schema';

-- RESULTADO:
-- Ahora podrás agregar el mismo producto varias veces con diferentes colores o logos.
-- El sistema agrupará automáticamente aquellos que sean exactos e incrementará su cantidad,
-- pero permitirá separar aquellos que tengan personalizaciones distintas.
