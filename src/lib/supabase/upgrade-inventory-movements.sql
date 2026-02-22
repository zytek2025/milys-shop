-- ADVANCED INVENTORY TRACKING (ERP PHASE)
-- This script adds financial columns to stock_movements to track costs and utility.
DO $$ BEGIN -- 1. Add unit_cost
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'stock_movements'
        AND column_name = 'unit_cost'
) THEN
ALTER TABLE stock_movements
ADD COLUMN unit_cost NUMERIC(12, 2) DEFAULT 0;
END IF;
-- 2. Add utility_percentage
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'stock_movements'
        AND column_name = 'utility_percentage'
) THEN
ALTER TABLE stock_movements
ADD COLUMN utility_percentage NUMERIC(12, 2) DEFAULT 0;
END IF;
-- 3. Add unit_price (final sales price at time of entry)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'stock_movements'
        AND column_name = 'unit_price'
) THEN
ALTER TABLE stock_movements
ADD COLUMN unit_price NUMERIC(12, 2) DEFAULT 0;
END IF;
-- 4. Add exchange_rate (BCV rate at time of entry)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'stock_movements'
        AND column_name = 'exchange_rate'
) THEN
ALTER TABLE stock_movements
ADD COLUMN exchange_rate NUMERIC(12, 2) DEFAULT 0;
END IF;
-- 5. Add total_value (quantity * unit_cost)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'stock_movements'
        AND column_name = 'total_value'
) THEN
ALTER TABLE stock_movements
ADD COLUMN total_value NUMERIC(12, 2) DEFAULT 0;
END IF;
END $$;
-- 6. Update existing movements if possible (Optional, setting defaults)
UPDATE stock_movements
SET exchange_rate = (
        SELECT exchange_rate
        FROM store_settings
        WHERE id = 'global'
        LIMIT 1
    )
WHERE exchange_rate = 0;
-- 7. Notify Schema Reload
NOTIFY pgrst,
'reload schema';