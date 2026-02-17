-- ADD DYNAMIC PAYMENT METHODS TO STORE SETTINGS
-- This script adds a JSONB column to store multiple payment methods.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'payment_methods') THEN
        ALTER TABLE store_settings ADD COLUMN payment_methods JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Notify schema change
NOTIFY pgrst, 'reload schema';
