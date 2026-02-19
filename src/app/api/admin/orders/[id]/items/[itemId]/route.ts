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
        const { quantity, unit_price, custom_metadata, product_name } = body;

        const supabase = await createClient();

        // 1. Update item
        const updateData: any = {};
        if (typeof quantity === 'number' && quantity >= 1) updateData.quantity = quantity;
        if (typeof unit_price === 'number') updateData.unit_price = unit_price;
        if (custom_metadata) updateData.custom_metadata = custom_metadata;
        if (product_name) updateData.product_name = product_name;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from('order_items')
            .update(updateData)
            .eq('id', itemId)
            .eq('order_id', id);

        if (updateError) throw updateError;

        // 2. Fetch order and all items to recalculate total
        const { data: order, error: orderFetchError } = await supabase
            .from('orders')
            .select('credit_applied, payment_discount_amount')
            .eq('id', id)
            .single();

        if (orderFetchError) throw orderFetchError;

        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('unit_price, quantity')
            .eq('order_id', id);

        if (itemsError) throw itemsError;

        const subtotal = items.reduce((sum, item) => sum + (Number(item.unit_price || 0) * item.quantity), 0);
        const newTotal = Math.max(0, subtotal - Number(order.credit_applied || 0) - Number(order.payment_discount_amount || 0));

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

        // 3. Fetch order data for recalculation
        const { data: order, error: orderFetchError } = await supabase
            .from('orders')
            .select('credit_applied, payment_discount_amount')
            .eq('id', id)
            .single();

        if (orderFetchError) throw orderFetchError;

        // 4. Recalculate total
        const subtotal = items.reduce((sum, item) => sum + (Number(item.unit_price || 0) * item.quantity), 0);
        const newTotal = Math.max(0, subtotal - Number(order.credit_applied || 0) - Number(order.payment_discount_amount || 0));

        // 5. Update order total
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
