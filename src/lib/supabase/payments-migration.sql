-- SCRIPT DE PAGOS Y PEDIDOS

-- 1. Tabla de Configuración de la Tienda (Ajustes)
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Mejorar tabla de PEDIDOS
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT; -- 'zelle', 'pago_movil', 'transferencia', 'binance'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT; -- Foto del comprobante
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crm_synced BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2.1 Mejorar tabla de ITEMS DE PEDIDO
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_metadata JSONB DEFAULT '[]'::jsonb;

-- 3. Valores iniciales para ajustes (opcional/ejemplo)
INSERT INTO store_settings (key, value, description) 
VALUES 
('pago_movil_info', 'Banco: XXX, TLF: 0412-1234567, RIF: V-12345678', 'Datos para Pago Móvil'),
('zelle_info', 'correo@ejemplo.com (Titular: Nombre Apellido)', 'Datos para Zelle'),
('crm_webhook_url', '', 'URL del webhook del CRM para pedidos pagados')
ON CONFLICT (key) DO NOTHING;

-- 4. Permisos (RLS)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los ajustes públicos (datos de pago)
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON store_settings;
CREATE POLICY "Settings are viewable by everyone" ON store_settings FOR SELECT USING (true);

-- Solo el admin puede editar ajustes
DROP POLICY IF EXISTS "Admin can manage settings" ON store_settings;
CREATE POLICY "Admin can manage settings" ON store_settings FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Recargar esquema
NOTIFY pgrst, 'reload schema';
