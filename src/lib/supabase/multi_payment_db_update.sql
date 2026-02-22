-- Ensure payment_methods column exists in store_settings
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'store_settings'
        AND column_name = 'payment_methods'
) THEN
ALTER TABLE store_settings
ADD COLUMN payment_methods JSONB DEFAULT '[]'::jsonb;
END IF;
END $$;
-- Update payment_confirmations to track which account the payment was sent to
ALTER TABLE payment_confirmations
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES finance_accounts(id) ON DELETE
SET NULL;
-- Notify schema change
NOTIFY pgrst,
'reload schema';