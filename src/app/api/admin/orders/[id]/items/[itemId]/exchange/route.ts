import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id, itemId } = await params;
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { newVariantId, newQuantity, reason } = body;

        if (!newVariantId || !newQuantity) {
            return NextResponse.json({ error: 'Datos de intercambio incompletos' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Obtener datos del ítem actual antes de cambiarlo
        const { data: oldItem, error: oldItemError } = await supabase
            .from('order_items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (oldItemError || !oldItem) throw new Error('No se encontró el ítem original');

        // 2. Obtener datos de la nueva variante (precio, etc)
        const { data: newVariant, error: variantError } = await supabase
            .from('product_variants')
            .select('*, products(name)')
            .eq('id', newVariantId)
            .single();

        if (variantError || !newVariant) throw new Error('No se encontró la nueva variante');

        // --- TRANSACCIÓN LOGICA ---

        // A. Registrar DEVOLUCIÓN del ítem viejo al stock
        if (oldItem.variant_id) {
            await supabase.from('stock_movements').insert([{
                variant_id: oldItem.variant_id,
                quantity: oldItem.quantity,
                type: 'exchange',
                reason: `Retorno por intercambio en pedido #${id.slice(0, 8)}: ${reason || 'Cambio de producto'}`
            }]);
        }

        // B. Registrar SALIDA del ítem nuevo del stock
        await supabase.from('stock_movements').insert([{
            variant_id: newVariantId,
            quantity: -newQuantity,
            type: 'exchange',
            reason: `Salida por intercambio en pedido #${id.slice(0, 8)}: ${reason || 'Cambio de producto'}`
        }]);

        // C. Calcular diferencia de precios
        const oldTotalItemValue = Number(oldItem.unit_price) * oldItem.quantity;
        const newTotalItemValue = Number(newVariant.price || 0) * newQuantity;
        const priceDifference = oldTotalItemValue - newTotalItemValue;

        // D. Actualizar el ítem del pedido
        // El unit_price del ítem en el pedido se ajusta al valor real del nuevo producto
        const { error: updateError } = await supabase
            .from('order_items')
            .update({
                variant_id: newVariantId,
                quantity: newQuantity,
                unit_price: Number(newVariant.price || 0),
                custom_metadata: {
                    ...oldItem.custom_metadata,
                    exchanged_from: oldItem.variant_id,
                    exchange_reason: reason,
                    original_price: oldItem.unit_price
                }
            })
            .eq('id', itemId);

        if (updateError) throw updateError;

        // E. Manejar Saldo a Favor si la diferencia es positiva (el nuevo es más barato)
        if (priceDifference > 0) {
            const { data: orderData } = await supabase.from('orders').select('user_id').eq('id', id).single();
            if (orderData?.user_id) {
                await supabase.from('store_credits').insert([{
                    profile_id: orderData.user_id,
                    amount: priceDifference,
                    order_id: id,
                    reason: `Saldo a favor por intercambio en pedido #${id.slice(0, 8)}. Cambio de ${oldItem.products?.name || 'producto'} por ${newVariant.products?.name}.`
                }]);
            }
        }

        // F. Recalcular total del pedido
        const { data: allItems } = await supabase
            .from('order_items')
            .select('unit_price, quantity')
            .eq('order_id', id);

        const newOrderTotal = (allItems || []).reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);

        await supabase
            .from('orders')
            .update({ total: newOrderTotal, updated_at: new Date().toISOString() })
            .eq('id', id);

        return NextResponse.json({
            success: true,
            newTotal: newOrderTotal,
            creditGenerated: priceDifference > 0 ? priceDifference : 0,
            message: priceDifference > 0
                ? `Intercambio procesado. Se generó un saldo a favor de $${priceDifference.toFixed(2)}`
                : 'Intercambio procesado correctamente'
        });

    } catch (error: any) {
        console.error('Exchange API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
