-- FIX: Stock Deduction Function & Trigger
-- This replaces the previous partial implementation to handle both Variants and Simple Products.

CREATE OR REPLACE FUNCTION decrement_stock_on_order_item()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- CASE 1: Product with Variants (Size/Color)
    IF NEW.variant_id IS NOT NULL THEN
        -- Check current stock
        SELECT stock INTO current_stock FROM product_variants WHERE id = NEW.variant_id;
        
        -- Deduct if stock exists (allowing negative for now or stopping at 0 depending on business logic)
        -- We'll allow it to go negative to track overselling, or stop at 0.
        -- Business Rule: Deduct regardless, let admin see negative stock.
        UPDATE product_variants 
        SET stock = stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.variant_id;

    -- CASE 2: Simple Product (No Variants)
    ELSE
        -- Deduct from main product table
        UPDATE products 
        SET stock = stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create Trigger
DROP TRIGGER IF EXISTS tr_decrement_stock ON order_items;

CREATE TRIGGER tr_decrement_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_order_item();

-- Notify to reload schema
NOTIFY pgrst, 'reload schema';
