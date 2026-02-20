-- 1. Create expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Enable Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- 3. Create RLS Policies
-- Only authenticated users can view expenses (or restrict to admins if desired, but we'll apply admin rules at API level and read for all staff)
CREATE POLICY "Enable read access for authenticated users" ON expenses FOR
SELECT TO authenticated USING (true);
-- Only authenticated users (admins) can insert expenses
CREATE POLICY "Enable insert for authenticated users" ON expenses FOR
INSERT TO authenticated WITH CHECK (true);
-- Only authenticated users can update expenses
CREATE POLICY "Enable update for authenticated users" ON expenses FOR
UPDATE TO authenticated USING (true);
-- Only authenticated users can delete 
CREATE POLICY "Enable delete for authenticated users" ON expenses FOR DELETE TO authenticated USING (true);
-- 4. Notify PostgREST to reload schema
NOTIFY pgrst,
'reload schema';