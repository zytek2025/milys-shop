import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isAdmin } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createAdminClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        const body = await request.json();
        const { confirmation_id, status, account_id, category_id, description } = body;

        if (!confirmation_id || !status) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // 1. Fetch confirmation details
        const { data: confirmation, error: confError } = await supabase
            .from('payment_confirmations')
            .select('*')
            .eq('id', confirmation_id)
            .single();

        if (confError || !confirmation) {
            return NextResponse.json({ error: 'Confirmación no encontrada' }, { status: 404 });
        }

        // 2. Update confirmation status
        const { error: updateError } = await supabase
            .from('payment_confirmations')
            .update({ status })
            .eq('id', confirmation_id);

        if (updateError) throw updateError;

        // 3. If approved, create finance transaction
        if (status === 'approved' && account_id) {
            // Fetch order total and current rate
            const { data: order } = await supabase.from('orders').select('total').eq('id', orderId).single();
            const { data: settings } = await supabase.from('store_settings').select('exchange_rate').eq('id', 'global').single();
            const { data: account } = await supabase.from('finance_accounts').select('currency').eq('id', account_id).single();

            const rate = settings?.exchange_rate || 1;
            const amountUsd = account?.currency === 'VES'
                ? Number(confirmation.amount_paid) / Number(rate)
                : Number(confirmation.amount_paid);

            const { error: txError } = await supabase.from('finance_transactions').insert({
                account_id,
                category_id: category_id || '8161186e-b80c-4ebd-99d2-90a15d3289b8', // Default Vendategory
                order_id: orderId,
                type: 'income',
                amount: Number(confirmation.amount_paid),
                currency: account?.currency || 'USD',
                exchange_rate: Number(rate),
                amount_usd_equivalent: Number(amountUsd),
                description: description || `Pago verificado: Pedido #${orderId.slice(0, 8)} (Ref: ${confirmation.reference_number})`,
                created_by: currentUser?.id
            });

            if (txError) console.error('Error creating finance transaction:', txError);

            // Optional: Automatically update order status if this is the first payment and it puts it in processing
            // For now, we'll let the admin handle order status manually or maybe we can auto-update if order is 'pending'
            const { data: currentOrder } = await supabase.from('orders').select('status').eq('id', orderId).single();
            if (currentOrder?.status === 'pending') {
                await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Verify payment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
