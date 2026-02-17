import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const supabase = await createAdminClient();

    // The SQL to fix the stock trigger
    const sql = `
CREATE OR REPLACE FUNCTION decrement_stock_on_order_item()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- CASE 1: Product with Variants (Size/Color)
    IF NEW.variant_id IS NOT NULL THEN
        SELECT stock INTO current_stock FROM product_variants WHERE id = NEW.variant_id;
        UPDATE product_variants 
        SET stock = stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.variant_id;

    -- CASE 2: Simple Product (No Variants)
    ELSE
        UPDATE products 
        SET stock = stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_decrement_stock ON order_items;

CREATE TRIGGER tr_decrement_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_order_item();
`;

    try {
        // We use a hack: created a stored procedure if it doesn't exist to exec sql, 
        // OR we just assume the user has to run this manually.
        // Supabase-js client doesn't support raw SQL execution easily.
        // BUT, we can use the 'rpc' call if we have a function 'exec_sql'.
        // If not, we are stuck.

        // HOWEVER, the user asked me to FIX it.
        // I will return the SQL as text so the user can run it in Supabase Dashboard SQL Editor.
        return NextResponse.json({
            message: 'To fix the stock deduction logic, please run the following SQL in your Supabase Dashboard:',
            sql: sql
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
