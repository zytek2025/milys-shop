-- Asegurar que el tipo de promoción soporte premios en saldo
DO $$ 
BEGIN 
    ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_type_check;
    ALTER TABLE promotions ADD CONSTRAINT promotions_type_check CHECK (type IN ('bogo', 'second_unit_50', 'percentage', 'fixed', 'gift', 'loyalty_reward'));
EXCEPTION
    WHEN undefined_object THEN
        -- Si no existe el constraint, lo creamos
        ALTER TABLE promotions ADD CONSTRAINT promotions_type_check CHECK (type IN ('bogo', 'second_unit_50', 'percentage', 'fixed', 'gift', 'loyalty_reward'));
END $$;

-- Función para procesar premios de fidelidad cuando un pedido se completa
CREATE OR REPLACE FUNCTION check_loyalty_rewards_on_order_completion()
RETURNS TRIGGER AS $$
DECLARE
    qualifying_orders_count INTEGER;
    reward_promo RECORD;
    already_rewarded BOOLEAN;
BEGIN
    -- Solo actuar cuando el pedido pasa a 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- 1. Buscamos promociones de tipo 'loyalty_reward' activas
        FOR reward_promo IN 
            SELECT * FROM promotions 
            WHERE type = 'loyalty_reward' 
            AND is_active = true 
            AND min_orders_required > 0
            AND (start_date <= NOW())
            AND (end_date IS NULL OR end_date >= NOW())
        LOOP
            -- 2. Contar pedidos completados del usuario que cumplen con el valor mínimo de ESTA promoción
            SELECT COUNT(*) INTO qualifying_orders_count
            FROM orders
            WHERE user_id = NEW.user_id 
            AND status = 'completed'
            AND total >= reward_promo.min_order_value_condition;

            -- 3. Si el conteo actual de pedidos calificados es un múltiplo exacto de la meta
            IF qualifying_orders_count > 0 AND (qualifying_orders_count % reward_promo.min_orders_required = 0) THEN
                
                -- 4. Verificar si ya le dimos este premio específico para este hito de pedidos calificados
                SELECT EXISTS (
                    SELECT 1 FROM store_credits 
                    WHERE profile_id = NEW.user_id 
                    AND order_id = NEW.id -- Evitar que el mismo pedido dispare el mismo premio varias veces
                    AND reason LIKE '%Hito de ' || qualifying_orders_count || ' compras calificadas%'
                ) INTO already_rewarded;

                IF NOT already_rewarded THEN
                    -- 5. Otorgar el premio (Saldo a Favor)
                    INSERT INTO store_credits (
                        profile_id,
                        amount,
                        order_id,
                        reason
                    ) VALUES (
                        NEW.user_id,
                        reward_promo.value,
                        NEW.id,
                        '🎁 Premio de Fidelidad: Alcanzaste ' || qualifying_orders_count || ' compras calificadas (mín. $' || reward_promo.min_order_value_condition || '). Promo: ' || reward_promo.name
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para la tabla orders
DROP TRIGGER IF EXISTS tr_check_loyalty_rewards ON orders;
CREATE TRIGGER tr_check_loyalty_rewards
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION check_loyalty_rewards_on_order_completion();

-- Comentarios
COMMENT ON FUNCTION check_loyalty_rewards_on_order_completion IS 'Otorga saldo a favor automáticamente cuando un cliente alcanza metas de pedidos completados.';
