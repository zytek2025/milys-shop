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
        const {
            status,
            finance_data,
            items,
            total,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address
        } = body;

        // Use Admin Client to bypass RLS for administrative updates
        const adminSupabase = await createAdminClient();

        // 1. Fetch current order to prevent double processing
        const { data: currentOrder } = await adminSupabase
            .from('orders')
            .select('status, total, credit_applied, user_id, items:order_items(*)')
            .eq('id', id)
            .single();

        if (!currentOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 2. Update order
        const updatePayload: any = { updated_at: new Date().toISOString() };
        if (status) updatePayload.status = status;
        if (total !== undefined) updatePayload.total = total;
        if (customer_name !== undefined) updatePayload.customer_name = customer_name;
        if (customer_email !== undefined) updatePayload.customer_email = customer_email;
        if (customer_phone !== undefined) updatePayload.customer_phone = customer_phone;
        if (shipping_address !== undefined) updatePayload.shipping_address = shipping_address;

        const { data: updatedOrder, error } = await adminSupabase
            .from('orders')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .maybeSingle();

        // 2.1 If items are provided and it's modifying a quote, replace items
        if (items && Array.isArray(items) && currentOrder.status === 'quote') {
            // Delete old items
            await adminSupabase.from('order_items').delete().eq('order_id', id);

            // Insert new items
            const newOrderItems = items.map((item: any) => ({
                order_id: id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                product_name: item.product_name,
                quantity: item.quantity,
                price: item.price,
                custom_metadata: item.custom_metadata || [],
                on_request: item.on_request || false
            }));

            const { error: itemsError } = await adminSupabase.from('order_items').insert(newOrderItems);
            if (itemsError) console.error('Error updating quote items:', itemsError);
        }

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

        // 2.5 Record Financial Transaction if status is confirmed/processing
        if (status === 'processing' && finance_data?.account_id) {
            // Check if transaction already exists for this order to avoid duplicates
            const { data: existingTx } = await adminSupabase
                .from('finance_transactions')
                .select('id')
                .eq('order_id', id)
                .maybeSingle();

            if (!existingTx) {
                // Fetch account currency to handle conversion
                const { data: account } = await adminSupabase
                    .from('finance_accounts')
                    .select('currency')
                    .eq('id', finance_data.account_id)
                    .single();

                if (account) {
                    // Resolve rate from global settings (BCV)
                    const { data: settings } = await adminSupabase.from('store_settings').select('exchange_rate').eq('id', 'global').single();
                    const rate = settings?.exchange_rate || 1;

                    const amountUsd = account.currency === 'VES'
                        ? Number(currentOrder.total) / Number(rate)
                        : Number(currentOrder.total);

                    const { error: txError } = await adminSupabase.from('finance_transactions').insert({
                        account_id: finance_data.account_id,
                        category_id: finance_data.category_id,
                        order_id: id,
                        type: 'income',
                        amount: Number(currentOrder.total),
                        currency: account.currency,
                        exchange_rate: Number(rate),
                        amount_usd_equivalent: Number(amountUsd),
                        description: finance_data.description || `Pago verificado: Pedido #${id.slice(0, 8)}`,
                        created_by: currentUser?.id
                    });

                    if (txError) {
                        console.error('Finance transaction error:', txError);
                    } else {
                        console.log('Finance transaction recorded successfully for order:', id);
                    }
                }
            }
        }

        // 2.7 Handle transition from 'quote' to 'pending' or 'processing' (Stock deduction)
        if (currentOrder.status === 'quote' && (status === 'pending' || status === 'processing')) {
            for (const item of currentOrder.items) {
                // If it was a quote, most items are typically 'on_request', but we should deduct stock now
                if (item.variant_id) {
                    await adminSupabase.from('stock_movements').insert({
                        variant_id: item.variant_id,
                        quantity: -item.quantity,
                        type: 'order',
                        reason: `Conversión de presupuesto #${id.slice(0, 8)}`,
                        created_by: currentUser?.id
                    });
                }
            }
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

        // 4. Trigger Webhook for status changes
        if (['processing', 'shipped', 'completed', 'cancelled'].includes(status)) {
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
                let eventName: any = null;
                switch (status) {
                    case 'pending':
                        if (currentOrder.status === 'quote') {
                            eventName = 'budget_finalized';
                        }
                        break;
                    case 'processing': eventName = 'payment_confirmed'; break;
                    case 'shipped': eventName = 'order_shipped'; break;
                    case 'completed': eventName = 'order_delivered'; break;
                    case 'cancelled': eventName = 'order_cancelled'; break;
                }

                if (eventName) {
                    await sendWebhook(eventName, {
                        order_id: orderDetails.id,
                        control_id: orderDetails.control_id,
                        total: orderDetails.total,
                        shipping_address: orderDetails.shipping_address,
                        items: orderDetails.items.map((i: any) => ({
                            name: i.product_name,
                            quantity: i.quantity,
                            price: i.price,
                            on_request: i.on_request
                        }))
                    }, {
                        name: orderDetails.profiles?.full_name || orderDetails.profiles?.email?.split('@')[0],
                        email: orderDetails.profiles?.email,
                        phone: orderDetails.profiles?.whatsapp || ''
                    });
                }
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const adminSupabase = await createAdminClient();

        // Ensure it's a quote before deleting to prevent accidental order deletion
        const { data: currentOrder } = await adminSupabase
            .from('orders')
            .select('status')
            .eq('id', id)
            .single();

        if (!currentOrder) {
            return NextResponse.json({ error: 'Order/Quote not found' }, { status: 404 });
        }

        if (currentOrder.status !== 'quote') {
            return NextResponse.json({ error: 'Solo se pueden eliminar presupuestos (status: quote)' }, { status: 400 });
        }

        // Delete order items first (though cascade might handle this, it's safer)
        await adminSupabase.from('order_items').delete().eq('order_id', id);

        // Delete the quote
        const { error } = await adminSupabase.from('orders').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Presupuesto eliminado correctamente' });
    } catch (error: any) {
        console.error('Delete quote error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
