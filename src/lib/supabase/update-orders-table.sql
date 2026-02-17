-- UPDATE ORDERS TABLE FOR DYNAMIC PAYMENT METHODS
-- Adds columns to track payment method and discount.

DO $$
BEGIN
    -- Payment Method ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method_id') THEN
        ALTER TABLE orders ADD COLUMN payment_method_id TEXT;
    END IF;

    -- Payment Discount Amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_discount_amount') THEN
        ALTER TABLE orders ADD COLUMN payment_discount_amount DECIMAL(10,2) DEFAULT 0.00;
    END IF;
END $$;

-- Notify schema change
NOTIFY pgrst, 'reload schema';
