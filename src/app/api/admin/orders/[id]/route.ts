import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { status } = body;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Update order status
        const { data: updatedOrder, error } = await supabase
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
            console.log('Update failed for ID:', id, 'User:', user?.id, 'Status:', status);
            return NextResponse.json({
                error: 'Pedido no encontrado o sin permisos',
                debug: { id, userId: user?.id, status }
            }, { status: 404 });
        }

        // 2. Trigger Webhook for status changes
        if (status === 'shipped' || status === 'completed') {
            const { sendWebhook } = await import('@/lib/webhook-dispatcher');

            // Fetch full details for the webhook
            const { data: orderDetails } = await supabase
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
