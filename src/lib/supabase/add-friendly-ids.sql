-- 1. Crear secuencias para cada entidad
CREATE SEQUENCE IF NOT EXISTS seq_cli_code START 1;
CREATE SEQUENCE IF NOT EXISTS seq_cat_code START 1;
CREATE SEQUENCE IF NOT EXISTS seq_dsn_code START 1;
CREATE SEQUENCE IF NOT EXISTS seq_prd_code START 1;

-- 2. Añadir columnas de código a las tablas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friendly_id TEXT UNIQUE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS friendly_id TEXT UNIQUE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS friendly_id TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS friendly_id TEXT UNIQUE;

-- 3. Funciones para generar los códigos
CREATE OR REPLACE FUNCTION generate_cli_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.friendly_id IS NULL THEN
        NEW.friendly_id := 'CLI-' || LPAD(nextval('seq_cli_code')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_cat_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.friendly_id IS NULL THEN
        NEW.friendly_id := 'CAT-' || LPAD(nextval('seq_cat_code')::text, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_dsn_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.friendly_id IS NULL THEN
        NEW.friendly_id := 'DSN-' || LPAD(nextval('seq_dsn_code')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_prd_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.friendly_id IS NULL THEN
        NEW.friendly_id := 'PRD-' || LPAD(nextval('seq_prd_code')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers para auto-asignación
DROP TRIGGER IF EXISTS trg_assign_cli_code ON profiles;
CREATE TRIGGER trg_assign_cli_code BEFORE INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION generate_cli_code();

DROP TRIGGER IF EXISTS trg_assign_cat_code ON categories;
CREATE TRIGGER trg_assign_cat_code BEFORE INSERT ON categories
FOR EACH ROW EXECUTE FUNCTION generate_cat_code();

DROP TRIGGER IF EXISTS trg_assign_dsn_code ON designs;
CREATE TRIGGER trg_assign_dsn_code BEFORE INSERT ON designs
FOR EACH ROW EXECUTE FUNCTION generate_dsn_code();

DROP TRIGGER IF EXISTS trg_assign_prd_code ON products;
CREATE TRIGGER trg_assign_prd_code BEFORE INSERT ON products
FOR EACH ROW EXECUTE FUNCTION generate_prd_code();

-- 5. Inicializar registros existentes (opcional, pero recomendado)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM profiles WHERE friendly_id IS NULL ORDER BY created_at LOOP
        UPDATE profiles SET friendly_id = 'CLI-' || LPAD(nextval('seq_cli_code')::text, 4, '0') WHERE id = r.id;
    END LOOP;
    
    FOR r IN SELECT id FROM categories WHERE friendly_id IS NULL ORDER BY created_at LOOP
        UPDATE categories SET friendly_id = 'CAT-' || LPAD(nextval('seq_cat_code')::text, 2, '0') WHERE id = r.id;
    END LOOP;

    FOR r IN SELECT id FROM designs WHERE friendly_id IS NULL ORDER BY created_at LOOP
        UPDATE designs SET friendly_id = 'DSN-' || LPAD(nextval('seq_dsn_code')::text, 4, '0') WHERE id = r.id;
    END LOOP;

    FOR r IN SELECT id FROM products WHERE friendly_id IS NULL ORDER BY created_at LOOP
        UPDATE products SET friendly_id = 'PRD-' || LPAD(nextval('seq_prd_code')::text, 4, '0') WHERE id = r.id;
    END LOOP;
END $$;

-- 6. Recarga de esquema
NOTIFY pgrst, 'reload schema';
