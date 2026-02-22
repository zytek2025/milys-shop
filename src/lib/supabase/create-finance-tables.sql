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
INSERT INTO finance_categories (id, name, type, is_system)
VALUES (
        '8161186e-b80c-4ebd-99d2-90a15d3289b8',
        'Venta de Productos',
        'income',
        true
    ),
    (
        'a9762193-c350-4828-98e6-79cf02058428',
        'Pago de Pedido',
        'income',
        true
    ),
    (
        '3a7c647b-1185-4c07-886f-2b6389f4147c',
        'Inversión Inicial',
        'income',
        false
    ),
    (
        '5e9e0344-0c1a-472c-8f9d-8d9ad73ea169',
        'Compra de Mercancía',
        'expense',
        true
    ),
    (
        'b3700072-cb0a-4a0b-98a2-2394e5095d3a',
        'Publicidad & Marketing',
        'expense',
        false
    ),
    (
        'f2a67e54-52ae-4c7b-8b5e-14199c82c219',
        'Nomina & Sueldos',
        'expense',
        false
    ),
    (
        'd460879e-7164-4bf8-963d-4c3e8e19572b',
        'Servicios & Suscripciones',
        'expense',
        false
    ),
    (
        '71367ade-3928-4c9f-8b2c-9823e42c2f74',
        'Logística & Envío',
        'expense',
        false
    ),
    (
        'c0e82c3e-4829-4b2a-8c9e-123456789012',
        'Mantenimiento',
        'expense',
        false
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    is_system = EXCLUDED.is_system;
-- RLS Policies
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
-- Simple RLS (Only admins for now, using a policy that checks profiles.role)
DROP POLICY IF EXISTS "Admins can do everything on finance_accounts" ON finance_accounts;
CREATE POLICY "Admins can do everything on finance_accounts" ON finance_accounts TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
DROP POLICY IF EXISTS "Admins can do everything on finance_categories" ON finance_categories;
CREATE POLICY "Admins can do everything on finance_categories" ON finance_categories TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
DROP POLICY IF EXISTS "Admins can do everything on finance_transactions" ON finance_transactions;
CREATE POLICY "Admins can do everything on finance_transactions" ON finance_transactions TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);