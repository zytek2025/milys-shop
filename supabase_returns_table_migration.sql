-- Create Returns Table for detailed tracking
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES profiles(id) NOT NULL,
    product_variant_id UUID REFERENCES product_variants(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    amount_credited NUMERIC(10, 2) DEFAULT 0,
    reason TEXT,
    status TEXT DEFAULT 'completed', -- 'received', 'inspected', 'completed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all returns" ON returns
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert returns" ON returns
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
