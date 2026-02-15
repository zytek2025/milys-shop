-- Añadir columnas para gestionar la matriz global de tallas y colores por categoría
ALTER TABLE categories ADD COLUMN IF NOT EXISTS available_sizes JSONB DEFAULT '[]';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS available_colors JSONB DEFAULT '[]';

-- Comentario explicativo
COMMENT ON COLUMN categories.available_sizes IS 'Lista de tallas estándar para esta categoría (ej: ["S", "M", "L"])';
COMMENT ON COLUMN categories.available_colors IS 'Lista de colores estándar para esta categoría (ej: [{"name": "Blanco", "hex": "#FFFFFF"}])';

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
