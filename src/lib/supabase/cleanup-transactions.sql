-- ADVERTENCIA: Este script borrará TODOS los pedidos y carritos del sistema de forma irreversible.
-- La estructura de las tablas, los productos y los usuarios NO se verán afectados.

-- 1. Borrar detalles de productos en pedidos
DELETE FROM order_items;

-- 2. Borrar cabeceras de pedidos
DELETE FROM orders;

-- 3. Borrar artículos en carritos
DELETE FROM cart_items;

-- 4. Borrar sesiones de carritos
DELETE FROM carts;

-- 5. Reiniciar los secuenciadores (si se usan IDs autoincrementales numéricos para números de pedido)
-- Nota: Si usas UUIDs, esto no es necesario. Si usas enteros, descomenta la siguiente línea:
-- ALTER SEQUENCE orders_id_seq RESTART WITH 1;

-- 6. Recargar esquema (Opcional pero recomendado)
NOTIFY pgrst, 'reload schema';

-- RESULTADO:
-- El sistema de pedidos y el historial del cliente ahora están vacíos y listos para el lanzamiento oficial.
