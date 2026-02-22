-- Finance & ERP Schema Overhaul
-- 1. Financial Accounts (Cuentas)
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    -- Ej: Banesco Bs, Efectivo USD, Binance BTC
    type TEXT NOT NULL DEFAULT 'bank',
    -- bank, cash, crypto, wallet
    currency TEXT NOT NULL DEFAULT 'USD',
    -- USD, VES, BTC, ETH
    balance DECIMAL(15, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 2. Financial Categories (Categorías)
CREATE TABLE IF NOT EXISTS finance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    -- income, expense
    icon TEXT,
    is_system BOOLEAN DEFAULT false,
    -- Categorías base que no se pueden borrar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 3. Financial Transactions (Ledger)
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES finance_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES finance_categories(id) ON DELETE
    SET NULL,
        order_id UUID REFERENCES orders(id) ON DELETE
    SET NULL,
        -- Link opcional a pedidos
        type TEXT NOT NULL,
        -- income, expense, transfer
        amount DECIMAL(15, 2) NOT NULL,
        -- Monto en la moneda original de la cuenta
        currency TEXT NOT NULL,
        -- Moneda del movimiento (copia de account.currency habitualmente)
        exchange_rate DECIMAL(15, 6) DEFAULT 1.0,
        -- Tasa BCV al momento de la transacción
        amount_usd_equivalent DECIMAL(15, 2),
        -- Valor en USD para reportes consolidados
        description TEXT,
        transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 4. Automated Balance Management (Triggers)
CREATE OR REPLACE FUNCTION fn_update_account_balance() RETURNS TRIGGER AS $$ BEGIN IF (TG_OP = 'INSERT') THEN IF (NEW.type = 'income') THEN
UPDATE finance_accounts
SET balance = balance + NEW.amount
WHERE id = NEW.account_id;
ELSIF (NEW.type = 'expense') THEN
UPDATE finance_accounts
SET balance = balance - NEW.amount
WHERE id = NEW.account_id;
END IF;
ELSIF (TG_OP = 'DELETE') THEN IF (OLD.type = 'income') THEN
UPDATE finance_accounts
SET balance = balance - OLD.amount
WHERE id = OLD.account_id;
ELSIF (OLD.type = 'expense') THEN
UPDATE finance_accounts
SET balance = balance + OLD.amount
WHERE id = OLD.account_id;
END IF;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_update_account_balance ON finance_transactions;
CREATE TRIGGER tr_update_account_balance
AFTER
INSERT
    OR DELETE ON finance_transactions FOR EACH ROW EXECUTE FUNCTION fn_update_account_balance();
-- 5. Default Data
INSERT INTO finance_categories (name, type, is_system)
VALUES ('Venta de Productos', 'income', true),
    ('Pago de Pedido', 'income', true),
    ('Inversión Inicial', 'income', false),
    ('Compra de Mercancía', 'expense', true),
    ('Publicidad & Marketing', 'expense', false),
    ('Nomina & Sueldos', 'expense', false),
    ('Servicios & Suscripciones', 'expense', false),
    ('Logística & Envío', 'expense', false),
    ('Mantenimiento', 'expense', false) ON CONFLICT DO NOTHING;
-- RLS Policies
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
-- Simple RLS (Only admins for now, using a policy that checks profiles.role)
CREATE POLICY "Admins can do everything on finance_accounts" ON finance_accounts TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
CREATE POLICY "Admins can do everything on finance_categories" ON finance_categories TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
CREATE POLICY "Admins can do everything on finance_transactions" ON finance_transactions TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);