-- Add shipping_address column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN public.profiles.shipping_address IS 'The default shipping address for the user.';
