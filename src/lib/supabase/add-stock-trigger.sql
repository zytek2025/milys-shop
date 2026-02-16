-- GESTIÓN DE INVENTARIO AUTOMÁTICA (Fase 40)

-- 1. Función para descontar stock al crear un item de pedido
CREATE OR REPLACE FUNCTION decrement_stock_on_order_item()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Solo actuamos si el item tiene un variant_id (productos con talla/color)
    IF NEW.variant_id IS NOT NULL THEN
        -- Obtener el stock actual
        SELECT stock INTO current_stock 
        FROM product_variants 
        WHERE id = NEW.variant_id;

        IF current_stock > 0 THEN
            -- Restar stock si hay disponibilidad
            UPDATE product_variants 
            SET stock = stock - NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.variant_id;
        ELSE
            -- Si no hay stock, nos aseguramos de que el item esté marcado como 'bajo pedido' en su metadata
            -- Nota: Esto es principalmente informativo en el registro de la orden
            -- El frontend ya debe enviar 'on_request': true en custom_metadata
            NULL;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para order_items
DROP TRIGGER IF EXISTS tr_decrement_stock ON order_items;
CREATE TRIGGER tr_decrement_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_order_item();

-- 3. Recargar esquema
NOTIFY pgrst, 'reload schema';
