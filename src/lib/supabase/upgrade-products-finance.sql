DO $$ BEGIN -- 1. Add last_unit_cost to variants
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_variants'
        AND column_name = 'last_unit_cost'
) THEN
ALTER TABLE product_variants
ADD COLUMN last_unit_cost NUMERIC(12, 2) DEFAULT 0;
END IF;
-- 2. Add last_utility_percentage to variants
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_variants'
        AND column_name = 'last_utility_percentage'
) THEN
ALTER TABLE product_variants
ADD COLUMN last_utility_percentage NUMERIC(12, 2) DEFAULT 0;
END IF;
-- 3. Also add to products for legacy/non-variant items
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'last_unit_cost'
) THEN
ALTER TABLE products
ADD COLUMN last_unit_cost NUMERIC(12, 2) DEFAULT 0;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'last_utility_percentage'
) THEN
ALTER TABLE products
ADD COLUMN last_utility_percentage NUMERIC(12, 2) DEFAULT 0;
END IF;
END $$;
NOTIFY pgrst,
'reload schema';