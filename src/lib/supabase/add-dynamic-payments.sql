-- 1. Añadir columna JSONB para métodos de pago dinámicos
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb;

-- 2. Migrar datos existentes (Pago Móvil y Zelle) al formato dinámico si es necesario
-- Estructura esperada: [{ id, name, instructions, discount_percentage, is_discount_active, icon }]
UPDATE store_settings 
SET payment_methods = jsonb_build_array(
    jsonb_build_object(
        'id', 'pago-movil',
        'name', 'Pago Móvil',
        'instructions', pago_movil_info,
        'discount_percentage', 0,
        'is_discount_active', false,
        'icon', 'Smartphone'
    ),
    jsonb_build_object(
        'id', 'zelle',
        'name', 'Zelle',
        'instructions', zelle_info,
        'discount_percentage', 0,
        'is_discount_active', false,
        'icon', 'Landmark'
    )
)
WHERE id = 'global' AND (pago_movil_info IS NOT NULL OR zelle_info IS NOT NULL);

-- 3. Añadir tracking de pagos a la tabla de órdenes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_discount_amount DECIMAL(10,2) DEFAULT 0.00;

-- 4. Recargar esquema para PostgREST
NOTIFY pgrst, 'reload schema';
