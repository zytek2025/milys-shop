-- SCRIPT CONSOLIDADO: Crear Tabla y Configurar Permisos (Fase 39)

-- 1. Crear tabla de confirmaciones de pago (si no existe)
CREATE TABLE IF NOT EXISTS payment_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Opcional para invitados
    reference_number TEXT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    screenshot_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas antiguas
DROP POLICY IF EXISTS "Users can view their own confirmations" ON payment_confirmations;
DROP POLICY IF EXISTS "Users can create their own confirmations" ON payment_confirmations;
DROP POLICY IF EXISTS "Admins can manage all confirmations" ON payment_confirmations;
DROP POLICY IF EXISTS "Public can create confirmations for valid orders" ON payment_confirmations;
DROP POLICY IF EXISTS "Users and admins can view confirmations" ON payment_confirmations;
DROP POLICY IF EXISTS "Public can view confirmations" ON payment_confirmations;

-- 4. Crear políticas flexibles para payment_confirmations
CREATE POLICY "Public can create confirmations"
ON payment_confirmations FOR INSERT
WITH CHECK (true); 

CREATE POLICY "Public can view confirmations"
ON payment_confirmations FOR SELECT
USING (true);

-- 5. POLÍTICAS PARA LA TABLA 'orders' (Habilitar vista para invitados)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view orders by id" ON orders;
CREATE POLICY "Public can view orders by id"
ON orders FOR SELECT
USING (true);

-- 6. POLÍTICAS PARA LA TABLA 'order_items' (Habilitar vista para invitados)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view order_items by order_id" ON order_items;
CREATE POLICY "Public can view order_items by order_id"
ON order_items FOR SELECT
USING (true);

-- 7. Configurar Storage para el bucket 'payment-proofs'
-- Nota: Asegúrate de que el bucket 'payment-proofs' esté creado en el dashboard de Supabase y sea PÚBLICO.
DROP POLICY IF EXISTS "Public can view proofs if they have the link" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload proofs to payment-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view proofs" ON storage.objects;

CREATE POLICY "Anyone can upload proofs to payment-proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Public can view proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- 8. Recargar esquema
NOTIFY pgrst, 'reload schema';
