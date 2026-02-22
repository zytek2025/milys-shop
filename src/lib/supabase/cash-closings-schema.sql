-- Cash Closings table for daily register close
CREATE TABLE IF NOT EXISTS cash_closings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    close_date DATE NOT NULL,
    summary_json JSONB NOT NULL DEFAULT '{}',
    total_income_usd NUMERIC(12, 2) DEFAULT 0,
    total_income_ves NUMERIC(12, 2) DEFAULT 0,
    total_expense_usd NUMERIC(12, 2) DEFAULT 0,
    total_expense_ves NUMERIC(12, 2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Unique constraint: only one close per date
CREATE UNIQUE INDEX IF NOT EXISTS cash_closings_date_unique ON cash_closings(close_date);
-- Enable RLS
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;
-- Admin-only policy
CREATE POLICY "Allow admin full access on cash_closings" ON cash_closings FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM staff_users su
        WHERE su.user_id = auth.uid()
    )
);