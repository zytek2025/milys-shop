-- Add multi-image support to products table
DO $$ BEGIN -- Add image_url_2 if it doesn' t exist IF NOT EXISTS (
SELECT 1
FROM information_schema.columns
WHERE table_name = 'products'
    AND column_name = 'image_url_2'
) THEN
ALTER TABLE products
ADD COLUMN image_url_2 TEXT;
END IF;
-- Add image_url_3 if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'image_url_3'
) THEN
ALTER TABLE products
ADD COLUMN image_url_3 TEXT;
END IF;
END $$;
NOTIFY pgrst,
'reload schema';