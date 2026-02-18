import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const {
            profile_id,
            variant_id,
            quantity,
            amount_to_credit,
            reason,
            order_id,
            order_item_id, // New field to mark specific item
            product_id
        } = body;

        if (!profile_id || !variant_id || !quantity || amount_to_credit === undefined) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user: adminUser } } = await supabase.auth.getUser();

        // Get product_id from variant if not provided
        let resolvedProductId = product_id;
        if (!resolvedProductId) {
            const { data: vData } = await supabase.from('product_variants').select('product_id').eq('id', variant_id).single();
            resolvedProductId = vData?.product_id;
        }

        // 1. Iniciar el proceso de devolución
        // A. Aumentar stock del producto
        const { data: currentVariant } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', variant_id)
            .single();

        await supabase
            .from('product_variants')
            .update({ stock: (currentVariant?.stock || 0) + quantity })
            .eq('id', variant_id);

        // B. Registrar movimiento de inventario (Con product_id para nueva relación)
        await supabase.from('stock_movements').insert({
            variant_id,
            product_id: resolvedProductId,
            quantity: quantity,
            type: 'return',
            reason: `Devolución (Pedido ${order_id ? '#' + order_id.slice(0, 8) : 'Manual'}): ${reason || 'Sin motivo específico'}`,
            created_by: adminUser?.id
        });

        // C. Actualizar Saldo a Favor del cliente
        const { data: profile } = await supabase
            .from('profiles')
            .select('store_credit')
            .eq('id', profile_id)
            .single();

        const currentCredit = Number(profile?.store_credit || 0);
        const { error: creditError } = await supabase
            .from('profiles')
            .update({ store_credit: currentCredit + Number(amount_to_credit) })
            .eq('id', profile_id);

        if (creditError) throw creditError;

        // D. Registrar en historial de crédito
        await supabase
            .from('store_credit_history')
            .insert({
                profile_id,
                amount: amount_to_credit,
                type: 'return',
                reason: reason || 'Devolución de producto',
                order_id,
                created_by: adminUser?.id
            });

        // E. Registrar en la tabla de devoluciones
        await supabase
            .from('returns')
            .insert({
                order_id,
                customer_id: profile_id,
                items: [{ variant_id, quantity, amount: amount_to_credit, order_item_id }],
                amount_credited: amount_to_credit,
                reason: reason || 'Devolución de producto',
                status: 'completed'
            });

        // F. Marcar el item de la orden como devuelto
        if (order_item_id) {
            const { data: itemData } = await supabase
                .from('order_items')
                .select('custom_metadata')
                .eq('id', order_item_id)
                .single();

            const currentMetadata = itemData?.custom_metadata || {};
            await supabase
                .from('order_items')
                .update({
                    custom_metadata: { ...currentMetadata, is_returned: true, return_reason: reason }
                })
                .eq('id', order_item_id);
        }

        return NextResponse.json({ success: true, new_balance: currentCredit + Number(amount_to_credit) });
    } catch (error: any) {
        console.error('Return processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
