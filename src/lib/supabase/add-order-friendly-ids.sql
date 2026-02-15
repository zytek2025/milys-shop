-- 1. Secuencia para pedidos
CREATE SEQUENCE IF NOT EXISTS seq_ord_code START 1;

-- 2. Columna friendly_id a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS friendly_id TEXT UNIQUE;

-- 3. Función generadora
CREATE OR REPLACE FUNCTION generate_ord_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.friendly_id IS NULL THEN
        NEW.friendly_id := 'ORD-' || LPAD(nextval('seq_ord_code')::text, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger
DROP TRIGGER IF EXISTS trg_assign_ord_code ON orders;
CREATE TRIGGER trg_assign_ord_code BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION generate_ord_code();

-- 5. Inicializar existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM orders WHERE friendly_id IS NULL ORDER BY created_at LOOP
        UPDATE orders SET friendly_id = 'ORD-' || LPAD(nextval('seq_ord_code')::text, 5, '0') WHERE id = r.id;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
