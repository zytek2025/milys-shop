-- 1. Add has_variants to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;

-- 2. Ensure cart_items has custom_metadata
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS custom_metadata JSONB DEFAULT '[]'::jsonb;

-- 3. Create Design Categories table if not exists
CREATE TABLE IF NOT EXISTS design_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Designs table if not exists
CREATE TABLE IF NOT EXISTS designs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES design_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS for new tables
ALTER TABLE design_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- Drop existing if needed to avoid conflicts when re-running
DROP POLICY IF EXISTS "Design categories are viewable by everyone" ON design_categories;
DROP POLICY IF EXISTS "Designs are viewable by everyone" ON designs;
DROP POLICY IF EXISTS "Admin can manage design categories" ON design_categories;
DROP POLICY IF EXISTS "Admin can manage designs" ON designs;

CREATE POLICY "Design categories are viewable by everyone" ON design_categories FOR SELECT USING (true);
CREATE POLICY "Designs are viewable by everyone" ON designs FOR SELECT USING (true);

CREATE POLICY "Admin can manage design categories" ON design_categories 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can manage designs" ON designs 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Trigger to refresh schema cache (optional but helpful)
-- NOTIFY pgrst, 'reload schema';
