-- FIX: Relación entre orders y profiles
-- Asegurar que la columna user_id en orders referencia a profiles.id
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_fkey'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Recargar el caché del esquema para que PostgREST reconozca la relación
NOTIFY pgrst, 'reload schema';
