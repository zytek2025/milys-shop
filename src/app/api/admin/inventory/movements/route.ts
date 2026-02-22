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
                variant:product_variants(
                    size,
                    color,
                    product:products(name, control_id)
                ),
                direct_product:products(name, control_id)
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
        let {
            variant_id,
            product_id,
            quantity,
            type,
            reason,
            unit_cost = 0,
            utility_percentage = 0,
            unit_price = 0,
            exchange_rate: providedRate,
            update_price = false
        } = body;

        if ((!variant_id && !product_id) || typeof quantity !== 'number' || !type) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        const supabase = await createClient();

        // 0. Get current exchange rate if not provided
        let exchange_rate = providedRate;
        if (!exchange_rate) {
            const { data: settings } = await supabase.from('store_settings').select('exchange_rate').eq('id', 'global').single();
            exchange_rate = settings?.exchange_rate || 0;
        }

        // 1. Ensure variant existence (legacy handling)
        if (!variant_id && product_id) {
            const { data: existingVars } = await supabase
                .from('product_variants')
                .select('id')
                .eq('product_id', product_id)
                .limit(1);

            if (!existingVars || existingVars.length === 0) {
                const { data: newVar, error: vError } = await supabase
                    .from('product_variants')
                    .insert({
                        product_id,
                        size: 'Único',
                        color: 'Único',
                        color_hex: '#000000',
                        stock: 0
                    })
                    .select()
                    .single();

                if (vError) throw vError;
                variant_id = newVar.id;
            } else {
                variant_id = existingVars[0].id;
            }
        }

        // 2. Insert Movement with Financial Data
        const { data: movement, error: insertError } = await supabase
            .from('stock_movements')
            .insert([{
                variant_id,
                product_id,
                quantity,
                type,
                reason,
                unit_cost,
                utility_percentage,
                unit_price,
                exchange_rate,
                total_value: quantity * unit_cost,
                created_by: (await supabase.auth.getUser()).data.user?.id
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        // 3. Update Product/Variant Price & Cost if requested (usually for Entries)
        if (update_price && unit_price > 0) {
            const updatePayload: any = {
                price_override: unit_price,
                last_unit_cost: unit_cost,
                last_utility_percentage: utility_percentage
            };

            if (variant_id) {
                // Update variant override
                await supabase.from('product_variants').update(updatePayload).eq('id', variant_id);
            } else if (product_id) {
                // Update base product price and cost
                const productPayload = {
                    price: unit_price,
                    last_unit_cost: unit_cost,
                    last_utility_percentage: utility_percentage
                };
                await supabase.from('products').update(productPayload).eq('id', product_id);
            }
        }

        return NextResponse.json(movement);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
