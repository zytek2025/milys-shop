-- Tabla para registrar créditos de tienda (Saldo a favor)
CREATE TABLE IF NOT EXISTS store_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL, -- Positivo aumenta saldo, Negativo (uso) disminuye saldo
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Añadir columna de balance a profiles si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'balance') THEN
        ALTER TABLE profiles ADD COLUMN balance DECIMAL(12,2) DEFAULT 0.00;
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE store_credits ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para store_credits
CREATE POLICY "Admins can do everything on store_credits"
ON store_credits FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can view their own store_credits"
ON store_credits FOR SELECT TO authenticated
USING (profile_id = auth.uid());

-- Trigger para mantener el balance actualizado en profiles
CREATE OR REPLACE FUNCTION update_profile_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET balance = balance + NEW.amount
    WHERE id = NEW.profile_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_profile_balance ON store_credits;
CREATE TRIGGER tr_update_profile_balance
AFTER INSERT ON store_credits
FOR EACH ROW
EXECUTE FUNCTION update_profile_balance();

-- Comentarios
COMMENT ON TABLE store_credits IS 'Registro de saldos a favor de clientes por devoluciones o intercambios.';

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
