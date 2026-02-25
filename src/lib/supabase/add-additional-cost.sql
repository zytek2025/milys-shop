-- Add additional_cost to products and product_variants
DO $$ BEGIN -- 1. Add additional_cost to variants
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_variants'
        AND column_name = 'additional_cost'
) THEN
ALTER TABLE product_variants
ADD COLUMN additional_cost NUMERIC(12, 2) DEFAULT 0;
END IF;
-- 2. Add additional_cost to products
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'additional_cost'
) THEN
ALTER TABLE products
ADD COLUMN additional_cost NUMERIC(12, 2) DEFAULT 0;
END IF;
END $$;
NOTIFY pgrst,
'reload schema';