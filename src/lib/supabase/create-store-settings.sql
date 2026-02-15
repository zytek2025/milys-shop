-- 1. Borrar la tabla existente para evitar conflictos de tipo (UUID vs TEXT)
DROP TABLE IF EXISTS store_settings CASCADE;

-- 2. Crear la tabla con el formato correcto
CREATE TABLE store_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    personalization_price_small DECIMAL(10,2) DEFAULT 1.00,
    personalization_price_large DECIMAL(10,2) DEFAULT 3.00,
    design_price_small DECIMAL(10,2) DEFAULT 2.00,
    design_price_medium DECIMAL(10,2) DEFAULT 5.00,
    design_price_large DECIMAL(10,2) DEFAULT 10.00,
    pago_movil_info TEXT,
    zelle_info TEXT,
    crm_webhook_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insertar la configuración inicial
INSERT INTO store_settings (id, personalization_price_small, personalization_price_large, design_price_small, design_price_medium, design_price_large)
VALUES ('global', 1.00, 3.00, 2.00, 5.00, 10.00);

-- 4. Habilitar seguridad (RLS)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are viewable by everyone" 
ON store_settings FOR SELECT 
USING (true);

CREATE POLICY "Admins can update settings" 
ON store_settings FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 5. Refrescar esquema
NOTIFY pgrst, 'reload schema';
