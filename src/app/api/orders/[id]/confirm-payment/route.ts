import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const orderId = params.id;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    try {
        const body = await request.json();
        const { reference, amount, screenshot_url, account_id, currency } = body;

        if (!reference || !amount || !screenshot_url) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // 1. Verificar que el pedido existe
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, user_id')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
        }

        // Resolve currency: use provided value, or look up from account, or default to USD
        let resolvedCurrency = currency || 'USD';
        if (!currency && account_id) {
            try {
                const { data: account } = await supabase
                    .from('finance_accounts')
                    .select('currency')
                    .eq('id', account_id)
                    .single();
                if (account?.currency) {
                    resolvedCurrency = account.currency;
                }
            } catch (e) {
                // Keep default
            }
        }

        // 2. Crear el registro de confirmación
        const { data: confirmation, error: confError } = await supabase
            .from('payment_confirmations')
            .insert({
                order_id: orderId,
                user_id: user?.id || null, // Opcional para invitados
                reference_number: reference,
                amount_paid: amount,
                screenshot_url,
                status: 'pending',
                account_id: account_id || null
            })
            .select()
            .single();

        if (confError) throw confError;

        // 3. Trigger Webhook for Payment Proof Received
        try {
            const { sendWebhook } = await import('@/lib/webhook-dispatcher');
            const { data: profile } = user
                ? await supabase.from('profiles').select('full_name, whatsapp').eq('id', user.id).single()
                : { data: null };

            await sendWebhook('payment_proof_received', {
                order_id: orderId,
                reference_number: reference,
                amount_paid: amount,
                currency: resolvedCurrency,
                screenshot_url
            }, {
                name: profile?.full_name || user?.email?.split('@')[0] || 'Cliente',
                email: user?.email || '',
                phone: profile?.whatsapp || ''
            });
        } catch (webhookErr) {
            console.error('Failed to dispatch payment proof webhook:', webhookErr);
        }

        return NextResponse.json({ success: true, data: confirmation });
    } catch (error: any) {
        console.error('Error confirming payment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const orderId = params.id;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    try {
        let query = supabase
            .from('payment_confirmations')
            .select(`
                    *,
                    finance_accounts (
                        name,
                        currency
                    )
                `)
            .eq('order_id', orderId);

        if (user) {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
