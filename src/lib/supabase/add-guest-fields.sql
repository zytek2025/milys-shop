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
-- Update RLS to allow guest orders
-- Allow anonymous inserts if the status is 'quote'
DROP POLICY IF EXISTS "Allow anonymous quote requests" ON orders;
CREATE POLICY "Allow anonymous quote requests" ON orders FOR
INSERT TO anon,
    authenticated WITH CHECK (status = 'quote');
-- Allow guests to view their own order if they have the ID
DROP POLICY IF EXISTS "Allow guest to view their order" ON orders;
CREATE POLICY "Allow guest to view their order" ON orders FOR
SELECT TO anon,
    authenticated USING (true);