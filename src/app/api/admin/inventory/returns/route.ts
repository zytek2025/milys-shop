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
            order_id
        } = body;

        if (!profile_id || !variant_id || !quantity || amount_to_credit === undefined) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user: adminUser } } = await supabase.auth.getUser();

        // 1. Iniciar el proceso de devolución
        // Nota: En un entorno real usaríamos una transacción RPC en Supabase
        // Aquí lo haremos secuencialmente por simplicidad del ejemplo, 
        // pero idealmente se movería a una función PL/pgSQL.

        // A. Aumentar stock del producto
        const { error: stockError } = await supabase.rpc('increment_stock', {
            row_id: variant_id,
            val: quantity
        });

        // Si rpc no existe, usamos update tradicional
        if (stockError) {
            const { data: currentVariant } = await supabase
                .from('product_variants')
                .select('stock')
                .eq('id', variant_id)
                .single();

            await supabase
                .from('product_variants')
                .update({ stock: (currentVariant?.stock || 0) + quantity })
                .eq('id', variant_id);
        }

        // B. Registrar movimiento de inventario
        await supabase.from('stock_movements').insert({
            variant_id,
            quantity: quantity,
            type: 'return',
            reason: `Devolución: ${reason || 'Sin motivo específico'}`,
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
        const { error: historyError } = await supabase
            .from('store_credit_history')
            .insert({
                profile_id,
                amount: amount_to_credit,
                type: 'return',
                reason: reason || 'Devolución de producto',
                order_id,
                created_by: adminUser?.id
            });

        if (historyError) throw historyError;

        return NextResponse.json({ success: true, new_balance: currentCredit + Number(amount_to_credit) });
    } catch (error: any) {
        console.error('Return processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
