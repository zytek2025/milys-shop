-- Reparación final de esquema: Añadir columnas de tiempo faltantes
ALTER TABLE design_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE designs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Asegurar descripción en diseños (por si no se ejecutó el anterior)
ALTER TABLE designs ADD COLUMN IF NOT EXISTS description TEXT;
