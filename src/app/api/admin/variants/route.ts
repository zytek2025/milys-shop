import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .order('created_at');

        if (error) throw error;

        // Map back to UI structure if needed
        const mapped = data.map((v: any) => ({
            id: v.id,
            model_type: v.model_type,
            color: v.color_hex,
            color_name: v.color,
            size: v.size,
            stock: v.stock,
            price_override: v.price_override
        }));

        return NextResponse.json(mapped);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
