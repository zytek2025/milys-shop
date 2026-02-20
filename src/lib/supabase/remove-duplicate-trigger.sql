-- 1. Eliminar el trigger `tr_decrement_stock` de la tabla `order_items`
-- Esto previene el doble descuento durante compras
DROP TRIGGER IF EXISTS tr_decrement_stock ON order_items;
-- 2. Eliminar la función asociada ya que no la necesitamos
DROP FUNCTION IF EXISTS decrement_stock_on_order_item();
-- 3. Notificar a PostgREST
NOTIFY pgrst,
'reload schema';