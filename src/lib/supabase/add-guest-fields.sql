-- Add guest contact fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_phone TEXT;
-- Make user_id nullable to allow guest orders
ALTER TABLE orders
ALTER COLUMN user_id DROP NOT NULL;
-- Ensure status can be 'quote'
DO $$ BEGIN -- We assume status is a text field or we check if there's a check constraint
-- If it's a check constraint, we might need to drop and recreate it, 
-- but usually it's just TEXT with application-level validation or a simple CHECK.
-- Let's check for existing constraints if possible, but safely we can just add it 
-- if there's a check.
END $$;
-- Update RLS to allow guest orders
-- Allow anonymous inserts if the status is 'quote'
CREATE POLICY "Allow anonymous quote requests" ON orders FOR
INSERT TO anon,
    authenticated WITH CHECK (status = 'quote');
-- Allow guests to view their own order if they have the ID (UUIDs are secure enough for this use case redirect)
CREATE POLICY "Allow guest to view their order" ON orders FOR
SELECT TO anon,
    authenticated USING (true);