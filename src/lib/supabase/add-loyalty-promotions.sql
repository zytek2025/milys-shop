-- Add loyalty columns to promotions table
ALTER TABLE promotions 
ADD COLUMN IF NOT EXISTS min_orders_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_order_value_condition NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_product_id UUID REFERENCES products(id);

-- Add 'gift' to promotion types (commented out as it might be handled in app logic, but good to have constraint)
-- ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_type_check;
-- ALTER TABLE promotions ADD CONSTRAINT promotions_type_check CHECK (type IN ('bogo', 'second_unit_50', 'percentage', 'fixed', 'gift'));

COMMENT ON COLUMN promotions.min_orders_required IS 'Cantidad de pedidos previos necesarios para activar la oferta';
COMMENT ON COLUMN promotions.min_order_value_condition IS 'Valor mínimo que debe tener cada pedido previo para ser contado';
COMMENT ON COLUMN promotions.reward_product_id IS 'ID del producto que se entrega como regalo si la oferta es de tipo gift';

-- Notify pgrst to reload schema
NOTIFY pgrst, 'reload schema';
