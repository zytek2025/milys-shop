-- Add Marketing fields to Profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_marketing_contact TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketing_segment TEXT DEFAULT 'new_lead';

-- Update RLS policies if necessary (Admins can do everything)
-- Existing policies for profiles usually cover this, but we ensure admins can update these fields.

-- Index for segmentation performance
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_segment ON profiles(marketing_segment);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent ON profiles(marketing_consent);
