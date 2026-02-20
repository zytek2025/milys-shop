import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { status, admin_notes } = body;

        const supabase = await createClient();
        const { data: { user: adminUser } } = await supabase.auth.getUser();

        // Fetch the return details
        const { data: returnReq, error: fetchError } = await supabase
            .from('returns')
            .select('*')
            .eq('id', params.id)
            .single();

        if (fetchError || !returnReq) throw new Error('Return not found');

        // If completing, process inventory and credit
        if (status === 'completed' && returnReq.status !== 'completed') {
            // Process return items
            const items = returnReq.items; // [{variant_id, quantity, price}]
            let totalToCredit = 0;

            for (const item of items) {
                // A. Increment stock
                await supabase.from('stock_movements').insert({
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    type: 'return',
                    reason: `Retorno Stock ID:${item.variant_id.slice(0, 8)} via RET:${returnReq.control_id}`,
                    created_by: adminUser?.id
                });
                // Stock trigger in DB will handle the manual increment

                totalToCredit += (item.price * item.quantity);
            }

            // B. Update customer store credit
            const { data: profile } = await supabase
                .from('profiles')
                .select('store_credit')
                .eq('id', returnReq.customer_id)
                .single();

            const currentCredit = Number(profile?.store_credit || 0);
            await supabase
                .from('profiles')
                .update({ store_credit: currentCredit + totalToCredit })
                .eq('id', returnReq.customer_id);

            // C. Log credit history
            await supabase.from('store_credit_history').insert({
                profile_id: returnReq.customer_id,
                amount: totalToCredit,
                type: 'return',
                reason: `Reembolso por devolución ${returnReq.control_id}`,
                order_id: returnReq.order_id,
                created_by: adminUser?.id
            });

            // Update amount_credited in the return record
            await supabase
                .from('returns')
                .update({ amount_credited: totalToCredit })
                .eq('id', params.id);

            // D. Dispatch Webhook
            const { sendWebhook } = await import('@/lib/webhook-dispatcher');
            if (profile) {
                // Fetch profile complete details for webhook
                const { data: fullProfile } = await supabase.from('profiles').select('full_name, email, whatsapp').eq('id', returnReq.customer_id).single();

                await sendWebhook('return_processed', {
                    return_id: returnReq.id,
                    control_id: returnReq.control_id,
                    order_id: returnReq.order_id,
                    amount_credited: totalToCredit,
                    items: items.map((i: any) => ({
                        variant_id: i.variant_id,
                        quantity: i.quantity,
                        price: i.price
                    }))
                }, {
                    name: fullProfile?.full_name || fullProfile?.email?.split('@')[0],
                    email: fullProfile?.email,
                    phone: fullProfile?.whatsapp || ''
                });
            }
        }

        // Update return status
        const { data: updatedReturn, error: updateError } = await supabase
            .from('returns')
            .update({ status, admin_notes, updated_at: new Date().toISOString() })
            .eq('id', params.id)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json(updatedReturn);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
