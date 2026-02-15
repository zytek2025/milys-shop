-- Añadir columna is_customizable a la tabla de categorías
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT TRUE;

-- Recargar esquema para PostgREST
NOTIFY pgrst, 'reload schema';
