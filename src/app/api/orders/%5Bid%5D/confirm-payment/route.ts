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

    if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { reference, amount, screenshot_url } = body;

        if (!reference || !amount || !screenshot_url) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // 1. Verificar que el pedido existe y pertenece al usuario
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id')
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
        }

        // 2. Crear el registro de confirmación
        const { data: confirmation, error: confError } = await supabase
            .from('payment_confirmations')
            .insert({
                order_id: orderId,
                user_id: user.id,
                reference_number: reference,
                amount_paid: amount,
                screenshot_url,
                status: 'pending'
            })
            .select()
            .single();

        if (confError) throw confError;

        // 3. Opcional: Podríamos actualizar el estado del pedido a 'evaluating' o similar
        // Pero por ahora lo dejamos en pending hasta que el admin apruebe.

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

    if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('payment_confirmations')
            .select('*')
            .eq('order_id', orderId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
