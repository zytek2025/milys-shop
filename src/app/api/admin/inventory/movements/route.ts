import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                product_variants (
                    size,
                    color,
                    products (name)
                )
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        let { variant_id, product_id, quantity, type, reason } = body;

        if ((!variant_id && !product_id) || typeof quantity !== 'number' || !type) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        const supabase = await createClient();

        // If it's a legacy product movement (has product_id instead of variant_id)
        if (!variant_id && product_id) {
            // Ensure a default variant exists
            const { data: existingVars } = await supabase
                .from('product_variants')
                .select('id')
                .eq('product_id', product_id)
                .limit(1);

            if (!existingVars || existingVars.length === 0) {
                // Create default variant
                const { data: newVar, error: vError } = await supabase
                    .from('product_variants')
                    .insert({
                        product_id,
                        size: 'Único',
                        color: 'Único',
                        color_hex: '#000000',
                        stock: 0 // Will be updated by the trigger once movement is inserted
                    })
                    .select()
                    .single();

                if (vError) throw vError;
                variant_id = newVar.id;
            } else {
                variant_id = existingVars[0].id;
            }
        }

        const { data, error } = await supabase
            .from('stock_movements')
            .insert([{
                variant_id,
                quantity,
                type,
                reason,
                created_by: (await supabase.auth.getUser()).data.user?.id
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
