-- Tabla para solicitudes y gestión de devoluciones
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_id TEXT UNIQUE, -- ID amigable generado por trigger
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'requested', -- 'requested', 'approved', 'rejected', 'completed'
    items JSONB NOT NULL, -- [{variant_id, quantity, price}]
    reason TEXT,
    admin_notes TEXT,
    amount_credited DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can see their own returns"
ON returns FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "Users can create their own return requests"
ON returns FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can do everything on returns"
ON returns FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Trigger para control_id (ID amigable)
-- Reutilizamos la lógica de universal-tracking-ids.sql si existe el generador
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_control_id') THEN
        CREATE OR REPLACE FUNCTION tr_set_return_control_id()
        RETURNS TRIGGER AS $tr$
        BEGIN
            IF NEW.control_id IS NULL THEN
                NEW.control_id := public.generate_control_id('RET');
            END IF;
            RETURN NEW;
        END;
        $tr$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS tr_returns_control_id ON returns;
        CREATE TRIGGER tr_returns_control_id
        BEFORE INSERT ON returns
        FOR EACH ROW
        EXECUTE FUNCTION tr_set_return_control_id();
    END IF;
END $$;

-- Comentarios
COMMENT ON TABLE returns IS 'Gestión de solicitudes de devolución de productos y saldos a favor.';
