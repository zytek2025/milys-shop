import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin, createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        const body = await request.json();
        const { status } = body;

        // Use Admin Client to bypass RLS for administrative updates
        const adminSupabase = await createAdminClient();

        // 1. Fetch current order to prevent double processing
        const { data: currentOrder } = await adminSupabase
            .from('orders')
            .select('status, credit_applied, user_id, items:order_items(*)')
            .eq('id', id)
            .single();

        if (!currentOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 2. Update order status
        const { data: updatedOrder, error } = await adminSupabase
            .from('orders')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            console.error('Update order error:', error);
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        if (!updatedOrder) {
            console.log('Update failed for ID:', id, 'User:', currentUser?.id, 'Status:', status);
            return NextResponse.json({
                error: 'Pedido no encontrado o sin permisos',
                debug: { id, userId: currentUser?.id, status }
            }, { status: 404 });
        }

        // 3. Handle Cancellation (Stock restoration and Credit Refund)
        if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
            // Reponer stock
            for (const item of currentOrder.items) {
                if (item.variant_id) {
                    await adminSupabase.from('stock_movements').insert({
                        variant_id: item.variant_id,
                        quantity: item.quantity,
                        type: 'return',
                        reason: `Cancelación del pedido #${id.slice(0, 8)}`,
                        created_by: currentUser?.id
                    });
                }
            }

            // Reponer saldo a favor si se usó
            const creditToRefund = Number(currentOrder.credit_applied || 0);
            if (creditToRefund > 0 && currentOrder.user_id) {
                const { data: profile } = await adminSupabase
                    .from('profiles')
                    .select('store_credit')
                    .eq('id', currentOrder.user_id)
                    .single();

                await adminSupabase
                    .from('profiles')
                    .update({ store_credit: Number(profile?.store_credit || 0) + creditToRefund })
                    .eq('id', currentOrder.user_id);

                await adminSupabase.from('store_credit_history').insert({
                    profile_id: currentOrder.user_id,
                    amount: creditToRefund,
                    type: 'return',
                    reason: `Reembolso por cancelación del pedido #${id.slice(0, 8)}`,
                    order_id: id,
                    created_by: currentUser?.id
                });
            }
        }

        // 2. Trigger Webhook for status changes
        if (status === 'shipped' || status === 'completed') {
            const { sendWebhook } = await import('@/lib/webhook-dispatcher');

            // Fetch full details for the webhook using admin client
            const { data: orderDetails } = await adminSupabase
                .from('orders')
                .select(`
                    *,
                    profiles (email, full_name, whatsapp),
                    items:order_items (
                        *,
                        variant:product_variants (*)
                    )
                `)
                .eq('id', id)
                .single();

            if (orderDetails) {
                await sendWebhook('order_shipped', orderDetails);
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
