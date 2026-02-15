-- 1. Extend cart_items to support custom metadata (Logos, etc.)
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS custom_metadata JSONB DEFAULT '[]'::jsonb;

-- 2. Create Design Categories table
CREATE TABLE IF NOT EXISTS design_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Designs table (The library of arts)
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

-- 4. RLS for new tables
ALTER TABLE design_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Design categories are viewable by everyone" ON design_categories FOR SELECT USING (true);
CREATE POLICY "Designs are viewable by everyone" ON designs FOR SELECT USING (true);

-- Admin policies (requires 'role' column in profiles, which we already added)
CREATE POLICY "Admin can manage design categories" ON design_categories 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can manage designs" ON designs 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
