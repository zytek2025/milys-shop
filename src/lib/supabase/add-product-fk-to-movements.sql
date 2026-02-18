-- FIX STOCK MOVEMENTS RELATIONS
-- This script adds product_id FK to allow direct joining with products table

-- 1. Ensure product_id column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'product_id') THEN
        ALTER TABLE stock_movements ADD COLUMN product_id UUID REFERENCES products(id);
    END IF;
END $$;

-- 2. Backfill product_id from variants if possible (optional but good for data integrity)
UPDATE stock_movements sm
SET product_id = pv.product_id
FROM product_variants pv
WHERE sm.variant_id = pv.id
AND sm.product_id IS NULL;

-- 3. Notify Schema Reload
NOTIFY pgrst, 'reload schema';
