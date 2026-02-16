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
        const { variant_id, quantity, type, reason } = body;

        if (!variant_id || typeof quantity !== 'number' || !type) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        const supabase = await createClient();
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
