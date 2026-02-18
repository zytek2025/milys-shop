-- SQL Migration: Add demographic fields to profiles

-- 1. Add columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- 2. (Optional but recommended) Update existing profile trigger if it exists
-- This ensures that when a user signs up, the metadata is copied to the profile.
-- Note: This is an example of what the trigger usually looks like in Supabase.
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, full_name, avatar_url, whatsapp, age, city, gender)
--   VALUES (
--     new.id,
--     new.email,
--     new.raw_user_meta_data->>'full_name',
--     new.raw_user_meta_data->>'avatar_url',
--     new.raw_user_meta_data->>'whatsapp',
--     (new.raw_user_meta_data->>'age')::integer,
--     new.raw_user_meta_data->>'city',
--     new.raw_user_meta_data->>'gender'
--   );
--   RETURN new;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- RECHARGE SCHEMA
NOTIFY pgrst, 'reload schema';
