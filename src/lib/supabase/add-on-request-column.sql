-- AGREGAR COLUMNA ON_REQUEST A ORDER_ITEMS
-- Esta columna identifica si un producto fue comprado bajo pedido (sin stock)

-- 1. Agregar la columna si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='on_request') THEN
        ALTER TABLE order_items ADD COLUMN on_request BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Asegurar que los permisos sean correctos
GRANT ALL ON TABLE order_items TO authenticated;
GRANT ALL ON TABLE order_items TO service_role;

-- 3. Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN order_items.on_request IS 'Indica si el item se pidió sin stock (bajo pedido)';
