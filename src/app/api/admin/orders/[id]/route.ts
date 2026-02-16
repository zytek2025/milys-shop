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

        // 2. If status is 'processing' (paid), trigger CRM webhook
        if (status === 'processing' || status === 'completed') {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de timeout

                // Fetch full order details for CRM
                const { data: orderDetails, error: detailsError } = await supabase
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
                    .maybeSingle();

                if (detailsError) {
                    console.error('Fetch order details error:', detailsError);
                }

                // Fetch webhook URL from settings
                const { data: webhookSetting } = await supabase
                    .from('store_settings')
                    .select('value')
                    .eq('key', 'crm_webhook_url')
                    .maybeSingle();

                if (webhookSetting?.value && webhookSetting.value.startsWith('http') && orderDetails) {
                    try {
                        console.log('Triggering CRM Webhook:', webhookSetting.value);
                        const webhookRes = await fetch(webhookSetting.value, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                event: 'order_payment_confirmed',
                                order: orderDetails
                            }),
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);

                        if (webhookRes.ok) {
                            // Mark as synced
                            await supabase.from('orders').update({ crm_synced: true }).eq('id', id);
                            return NextResponse.json({ ...updatedOrder, crm_synced: true });
                        } else {
                            console.error('CRM Webhook returned error:', webhookRes.status);
                        }
                    } catch (fetchErr: any) {
                        clearTimeout(timeoutId);
                        console.error('Fetch to CRM failed:', fetchErr.message);
                    }
                } else {
                    clearTimeout(timeoutId);
                    console.log('Skip CRM webhook: Setting not found or no details');
                }
            } catch (webhookError: any) {
                console.error('CRM Webhook process failed:', webhookError.message || webhookError);
                // No fallamos la petición principal, pero retornamos el estado actual
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
