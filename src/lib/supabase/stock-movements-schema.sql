-- Tabla para registrar movimientos de stock
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL, -- Positivo para ingreso, Negativo para egreso
    type TEXT NOT NULL, -- 'manual', 'order', 'exchange', 'return'
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) -- Opcional: tracking del admin
);

-- Habilitar RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Admins can do everything on stock_movements"
ON stock_movements
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Trigger para actualizar el stock en product_variants automáticamente
CREATE OR REPLACE FUNCTION update_stock_from_movement()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE product_variants
    SET stock = stock + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.variant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_stock_on_movement ON stock_movements;
CREATE TRIGGER tr_update_stock_on_movement
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_stock_from_movement();

-- Comentarios de tabla
COMMENT ON TABLE stock_movements IS 'Registro detallado de ingresos y egresos de inventario para trazabilidad.';

-- Notificar a PostgREST
NOTIFY pgrst, 'reload schema';
