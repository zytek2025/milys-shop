import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

// GET /api/admin/products - List all products (including low stock)
export async function GET() {
    try {
        const supabase = await createClient();
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('products')
            .select('*, product_variants(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/products - Create product
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, price, category, stock, image_url, variants } = body;

        const { data: product, error } = await supabase
            .from('products')
            .insert({ name, description, price, category, stock, image_url })
            .select()
            .single();

        if (error) throw error;

        // Bulk insert variants or create a default one
        const variantData = (variants && variants.length > 0)
            ? variants.map((v: any) => ({
                product_id: product.id,
                size: v.size,
                color: v.color_name || v.color,
                color_hex: v.color,
                stock: parseInt(v.stock || 0),
                price_override: v.price_override ? parseFloat(v.price_override) : null
            }))
            : [{
                product_id: product.id,
                size: 'Único',
                color: 'Único',
                color_hex: '#000000',
                stock: parseInt(stock || 0),
                price_override: null
            }];

        await supabase.from('product_variants').insert(variantData);

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
