-- ADD UNIT_PRICE TO ORDER_ITEMS
-- This column is required for granular pricing in orders.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'order_items'
        AND column_name = 'unit_price'
) THEN
ALTER TABLE order_items
ADD COLUMN unit_price DECIMAL(10, 2) DEFAULT 0.00;
END IF;
END $$;
-- Notify schema change
NOTIFY pgrst,
'reload schema';