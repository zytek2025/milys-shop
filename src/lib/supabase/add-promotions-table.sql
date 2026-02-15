-- Tabla para gestionar promociones y ofertas
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('bogo', 'second_unit_50', 'percentage', 'fixed')), -- Buy One Get One, 50% 2nd, % Off, Fixed Off
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'category', 'product')),
    target_id TEXT, -- Puede ser ID de producto o nombre de categoría
    value DECIMAL(10,2) DEFAULT 0, -- Para percentage o fixed
    min_quantity INTEGER DEFAULT 1,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver promociones activas
CREATE POLICY "Anyone can view active promotions" 
ON promotions FOR SELECT 
USING (is_active = true AND (end_date IS NULL OR end_date > NOW()));

-- Política: Solo administradores pueden gestionar promociones
CREATE POLICY "Admins can manage promotions" 
ON promotions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Comentario explicativo
COMMENT ON TABLE promotions IS 'Reglas de negocio para ofertas y campañas estacionales.';

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
