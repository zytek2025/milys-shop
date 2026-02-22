-- SQL Migration: Add account management fields to profiles
-- 1. Add columns for status and marketing
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT true;
-- 2. Update RLS if necessary (usually profiles are already protected)
-- No changes needed if users can already update their own profiles.
-- 3. Notify schema reload
NOTIFY pgrst,
'reload schema';