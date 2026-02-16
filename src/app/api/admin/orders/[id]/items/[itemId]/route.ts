import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id, itemId } = await params;
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { quantity } = body;

        if (typeof quantity !== 'number' || quantity < 1) {
            return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Update item quantity
        const { error: updateError } = await supabase
            .from('order_items')
            .update({ quantity })
            .eq('id', itemId)
            .eq('order_id', id);

        if (updateError) throw updateError;

        // 2. Fetch all items to recalculate total
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('unit_price, quantity')
            .eq('order_id', id);

        if (itemsError) throw itemsError;

        const newTotal = items.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);

        // 3. Update order total
        const { error: orderError } = await supabase
            .from('orders')
            .update({ total: newTotal, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (orderError) throw orderError;

        return NextResponse.json({ success: true, newTotal });
    } catch (error: any) {
        console.error('API Error [PATCH order item]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id, itemId } = await params;
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();

        // 1. Delete item
        const { error: deleteError } = await supabase
            .from('order_items')
            .delete()
            .eq('id', itemId)
            .eq('order_id', id);

        if (deleteError) throw deleteError;

        // 2. Check if order is empty
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('unit_price, quantity')
            .eq('order_id', id);

        if (itemsError) throw itemsError;

        if (items.length === 0) {
            // Delete order if empty
            await supabase.from('orders').delete().eq('id', id);
            return NextResponse.json({ success: true, orderDeleted: true });
        }

        // 3. Recalculate total
        const newTotal = items.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);

        // 4. Update order total
        const { error: orderError } = await supabase
            .from('orders')
            .update({ total: newTotal, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (orderError) throw orderError;

        return NextResponse.json({ success: true, newTotal });
    } catch (error: any) {
        console.error('API Error [DELETE order item]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
