-- 1. Crear tabla de confirmaciones de pago
CREATE TABLE IF NOT EXISTS payment_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reference_number TEXT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    screenshot_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_confirmations
CREATE POLICY "Users can view their own confirmations"
ON payment_confirmations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own confirmations"
ON payment_confirmations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all confirmations"
ON payment_confirmations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 3. Crear Bucket de Storage (Nota: Esto normalmente se hace vía API/Consola, pero dejamos las políticas)
-- Los buckets se gestionan en storage.buckets. 
-- El usuario debe crearlo manualmente llamado 'payment-proofs' o podemos intentar vía SQL si tiene permisos.

-- Políticas para el bucket 'payment-proofs'
CREATE POLICY "Public can view proofs if they have the link"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Users can upload their own proofs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'payment-proofs' AND 
    (auth.role() = 'authenticated')
);

CREATE POLICY "Admins can delete/manage proofs"
ON storage.objects FOR ALL
USING (
    bucket_id = 'payment-proofs' AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 4. Notificar recarga de esquema
NOTIFY pgrst, 'reload schema';
