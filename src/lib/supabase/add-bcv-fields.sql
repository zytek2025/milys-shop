-- Add BCV synchronization tracking to store_settings
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS bcv_last_sync_at TIMESTAMPTZ;