import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { variant_id, adjustment, reason, type } = body;
        // type: 'add' | 'remove' | 'set' 
        // adjustment: number (positive)

        if (!variant_id || adjustment === undefined) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Get current stock
        const { data: currentVariant, error: fetchError } = await supabase
            .from('product_variants')
            .select('stock, product_id')
            .eq('id', variant_id)
            .single();

        if (fetchError || !currentVariant) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }

        let newStock = currentVariant.stock;
        let quantityChange = 0; // For history log

        if (type === 'add') {
            newStock += adjustment;
            quantityChange = adjustment;
        } else if (type === 'remove') {
            newStock -= adjustment;
            quantityChange = adjustment; // We log positive for 'OUT' type usually, or handled by logic
        } else if (type === 'set') {
            quantityChange = Math.abs(adjustment - newStock);
            newStock = adjustment;
        }

        if (newStock < 0) newStock = 0;

        // 2. Update Variant Stock
        const { error: updateError } = await supabase
            .from('product_variants')
            .update({ stock: newStock })
            .eq('id', variant_id);

        if (updateError) throw updateError;

        // 3. Log Movement
        // Determine movement type for log
        let movementType = 'adjustment';
        if (type === 'add') movementType = 'IN';
        if (type === 'remove') movementType = 'OUT';
        if (type === 'set') {
            movementType = newStock > currentVariant.stock ? 'IN' : 'OUT';
        }

        await supabase.from('stock_movements').insert({
            variant_id,
            product_id: currentVariant.product_id, // Redundant but good for quick access if schema allows
            quantity: quantityChange,
            type: movementType,
            reason: reason || 'Actualización Rápida',
            created_by: (await supabase.auth.getUser()).data.user?.id,
            control_id: undefined // Trigger will handle it, or we can generate if needed. Let trigger do it.
        });

        return NextResponse.json({ success: true, newStock });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
