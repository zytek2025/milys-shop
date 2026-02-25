-- Add VIP configuration columns to store_settings
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS vip_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS vip_benefits_desc TEXT DEFAULT 'Únete a nuestro club selecto y recibe un 15% de descuento en tu primer pedido personalizado.';
-- Update the existing 'global' row with the default description if it was just added
UPDATE store_settings
SET vip_benefits_desc = 'Únete a nuestro club selecto y recibe un 15% de descuento en tu primer pedido personalizado.'
WHERE id = 'global'
    AND (
        vip_benefits_desc IS NULL
        OR vip_benefits_desc = ''
    );
-- Reload schema for PostgREST
NOTIFY pgrst,
'reload schema';