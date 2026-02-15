-- 1. Eliminar la restricción si ya existe (para evitar el error de "already exists")
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 2. Volver a crearla apuntando explícitamente a la tabla 'profiles'
ALTER TABLE orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 3. RECARGAR EL CACHÉ (Esto es lo más importante)
NOTIFY pgrst, 'reload schema';
