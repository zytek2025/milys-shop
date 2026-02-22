-- Create the finance_accounts table
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    currency TEXT NOT NULL,
    balance NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Admins can do everything on finance_accounts" ON finance_accounts FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_finance_account_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_finance_accounts_updated_at ON finance_accounts;
CREATE TRIGGER tr_finance_accounts_updated_at BEFORE
UPDATE ON finance_accounts FOR EACH ROW EXECUTE FUNCTION update_finance_account_timestamp();
-- Refresh Postgrest cache
NOTIFY pgrst,
'reload schema';