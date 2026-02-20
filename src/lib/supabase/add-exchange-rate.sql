-- SQL Migration: Add multi-currency and country support to store_settings
DO $$ BEGIN -- 1. Add store_country column
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'store_settings'
        AND column_name = 'store_country'
) THEN
ALTER TABLE store_settings
ADD COLUMN store_country TEXT DEFAULT 'VE';
END IF;
-- 2. Add currency_symbol column
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'store_settings'
        AND column_name = 'currency_symbol'
) THEN
ALTER TABLE store_settings
ADD COLUMN currency_symbol TEXT DEFAULT '$';
END IF;
-- 3. Add exchange_rate column
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'store_settings'
        AND column_name = 'exchange_rate'
) THEN
ALTER TABLE store_settings
ADD COLUMN exchange_rate NUMERIC DEFAULT 60.0;
END IF;
END $$;
-- 4. Update the global row just in case
UPDATE store_settings
SET store_country = COALESCE(store_country, 'VE'),
    currency_symbol = COALESCE(currency_symbol, '$'),
    exchange_rate = COALESCE(exchange_rate, 60.0)
WHERE id = 'global';