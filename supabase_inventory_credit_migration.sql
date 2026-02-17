-- Migration: Advanced Inventory & Store Credit

-- 1. Añadir saldo a favor a los perfiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS store_credit DECIMAL(12,2) DEFAULT 0.00;

-- 2. Crear tabla de historial de movimientos de saldo (Auditoría)
CREATE TABLE IF NOT EXISTS store_credit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL, -- Positivo para carga, negativo para uso
    type TEXT NOT NULL, -- 'return' (devolución), 'purchase' (gasto en compra), 'manual' (ajuste manual)
    reason TEXT,
    order_id UUID, -- Opcional, link a la orden original o de cambio
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES profiles(id) -- Quién realizó el ajuste (Admin)
);

-- 3. Habilitar RLS para seguridad
ALTER TABLE store_credit_history ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para historial de crédito
CREATE POLICY "Users can view their own credit history" 
ON store_credit_history FOR SELECT 
USING (auth.uid() = profile_id);

CREATE POLICY "Admins can manage all credit history" 
ON store_credit_history FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. Añadir columnas a órdenes para rastrear crédito
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS credit_applied DECIMAL(12,2) DEFAULT 0.00;

-- 6. Añadir comentarios para documentación
COMMENT ON COLUMN profiles.store_credit IS 'Saldo a favor del cliente para compras futuras (obtenido por devoluciones).';
COMMENT ON COLUMN orders.credit_applied IS 'Monto del saldo a favor aplicado a esta orden.';
COMMENT ON TABLE store_credit_history IS 'Registro de auditoría de cada carga o gasto de saldo a favor.';
