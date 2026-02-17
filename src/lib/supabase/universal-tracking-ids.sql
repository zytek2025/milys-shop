-- UNIVERSAL TRACKING IDS & CRM VISIBILITY FIX
-- This script adds control IDs to all major entities and fixes Admin visibility.

-- 1. Create the ID generation function
CREATE OR REPLACE FUNCTION public.generate_control_id(prefix text) 
RETURNS text AS $$
DECLARE
    chars text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    result text := prefix || '-';
    i integer;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2. Add columns and set defaults/triggers for all tables
DO $$
BEGIN
    -- PROFILES (CLI)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'control_id') THEN
        ALTER TABLE profiles ADD COLUMN control_id TEXT;
        CREATE UNIQUE INDEX idx_profiles_control_id ON profiles(control_id);
    END IF;

    -- PRODUCTS (PRD)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'control_id') THEN
        ALTER TABLE products ADD COLUMN control_id TEXT;
        CREATE UNIQUE INDEX idx_products_control_id ON products(control_id);
    END IF;

    -- DESIGNS (DSG)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designs' AND column_name = 'control_id') THEN
        ALTER TABLE designs ADD COLUMN control_id TEXT;
        CREATE UNIQUE INDEX idx_designs_control_id ON designs(control_id);
    END IF;

    -- CATEGORIES (CAT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'control_id') THEN
        ALTER TABLE categories ADD COLUMN control_id TEXT;
        CREATE UNIQUE INDEX idx_categories_control_id ON categories(control_id);
    END IF;

    -- DESIGN_CATEGORIES (DCAT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'design_categories' AND column_name = 'control_id') THEN
        ALTER TABLE design_categories ADD COLUMN control_id TEXT;
        CREATE UNIQUE INDEX idx_design_categories_control_id ON design_categories(control_id);
    END IF;

    -- ORDERS (ORD)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'control_id') THEN
        ALTER TABLE orders ADD COLUMN control_id TEXT;
        CREATE UNIQUE INDEX idx_orders_control_id ON orders(control_id);
    END IF;

    -- STOCK_MOVEMENTS (MOV)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'control_id') THEN
        ALTER TABLE stock_movements ADD COLUMN control_id TEXT;
        CREATE UNIQUE INDEX idx_stock_movements_control_id ON stock_movements(control_id);
    END IF;
END $$;

-- 3. Trigger Function
CREATE OR REPLACE FUNCTION public.tr_assign_control_id()
RETURNS TRIGGER AS $$
DECLARE
    pfx text;
BEGIN
    IF NEW.control_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    CASE TG_TABLE_NAME
        WHEN 'profiles' THEN pfx := 'CLI';
        WHEN 'products' THEN pfx := 'PRD';
        WHEN 'designs' THEN pfx := 'DSG';
        WHEN 'categories' THEN pfx := 'CAT';
        WHEN 'design_categories' THEN pfx := 'DCAT';
        WHEN 'orders' THEN pfx := 'ORD';
        WHEN 'stock_movements' THEN pfx := 'MOV';
        ELSE pfx := 'GEN';
    END CASE;

    NEW.control_id := public.generate_control_id(pfx);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Triggers
DROP TRIGGER IF EXISTS t_profiles_control_id ON profiles;
CREATE TRIGGER t_profiles_control_id BEFORE INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION public.tr_assign_control_id();

DROP TRIGGER IF EXISTS t_products_control_id ON products;
CREATE TRIGGER t_products_control_id BEFORE INSERT ON products FOR EACH ROW EXECUTE FUNCTION public.tr_assign_control_id();

DROP TRIGGER IF EXISTS t_designs_control_id ON designs;
CREATE TRIGGER t_designs_control_id BEFORE INSERT ON designs FOR EACH ROW EXECUTE FUNCTION public.tr_assign_control_id();

DROP TRIGGER IF EXISTS t_categories_control_id ON categories;
CREATE TRIGGER t_categories_control_id BEFORE INSERT ON categories FOR EACH ROW EXECUTE FUNCTION public.tr_assign_control_id();

DROP TRIGGER IF EXISTS t_design_categories_control_id ON design_categories;
CREATE TRIGGER t_design_categories_control_id BEFORE INSERT ON design_categories FOR EACH ROW EXECUTE FUNCTION public.tr_assign_control_id();

DROP TRIGGER IF EXISTS t_orders_control_id ON orders;
CREATE TRIGGER t_orders_control_id BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION public.tr_assign_control_id();

DROP TRIGGER IF EXISTS t_stock_movements_control_id ON stock_movements;
CREATE TRIGGER t_stock_movements_control_id BEFORE INSERT ON stock_movements FOR EACH ROW EXECUTE FUNCTION public.tr_assign_control_id();

-- 5. Backfill existing records
UPDATE profiles SET control_id = generate_control_id('CLI') WHERE control_id IS NULL;
UPDATE products SET control_id = generate_control_id('PRD') WHERE control_id IS NULL;
UPDATE designs SET control_id = generate_control_id('DSG') WHERE control_id IS NULL;
UPDATE categories SET control_id = generate_control_id('CAT') WHERE control_id IS NULL;
UPDATE design_categories SET control_id = generate_control_id('DCAT') WHERE control_id IS NULL;
UPDATE orders SET control_id = generate_control_id('ORD') WHERE control_id IS NULL;
UPDATE stock_movements SET control_id = generate_control_id('MOV') WHERE control_id IS NULL;

-- 6. CRM VISIBILITY FIX (RLS)
-- Allow users with 'admin' role to see all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Notify schema change
NOTIFY pgrst, 'reload schema';
