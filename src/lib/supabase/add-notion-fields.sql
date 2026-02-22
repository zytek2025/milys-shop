-- Add Notion sync tracking to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS notion_synced BOOLEAN DEFAULT FALSE;
-- Add Notion configuration to store_settings
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS notion_database_id TEXT;