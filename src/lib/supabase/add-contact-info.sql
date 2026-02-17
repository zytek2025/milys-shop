-- ADD CONTACT INFO TO STORE SETTINGS
-- This script adds social media and contact fields to the global configuration.

DO $$
BEGIN
    -- WhatsApp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE store_settings ADD COLUMN whatsapp_number TEXT;
    END IF;

    -- Instagram
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'instagram_handle') THEN
        ALTER TABLE store_settings ADD COLUMN instagram_handle TEXT;
    END IF;

    -- Telegram
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'telegram_username') THEN
        ALTER TABLE store_settings ADD COLUMN telegram_username TEXT;
    END IF;

    -- Facebook
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'facebook_url') THEN
        ALTER TABLE store_settings ADD COLUMN facebook_url TEXT;
    END IF;
END $$;

-- Notify schema change
NOTIFY pgrst, 'reload schema';
